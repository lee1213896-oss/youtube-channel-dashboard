-- YouTube 频道数据看板数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. YouTube OAuth 凭据表
CREATE TABLE IF NOT EXISTS youtube_credentials (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  redirect_uri VARCHAR(500) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_credentials_is_active_idx ON youtube_credentials(is_active);

-- 2. 已授权 YouTube 频道表
CREATE TABLE IF NOT EXISTS youtube_channels (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id VARCHAR(36) NOT NULL REFERENCES youtube_credentials(id) ON DELETE CASCADE,
  yt_channel_id VARCHAR(100) NOT NULL,
  channel_name VARCHAR(255),
  channel_thumbnail TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope VARCHAR(500),
  operator VARCHAR(100),
  group_name VARCHAR(100),
  language VARCHAR(50),
  tags JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'normal',
  remark TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_channels_credential_id_idx ON youtube_channels(credential_id);
CREATE INDEX IF NOT EXISTS youtube_channels_yt_channel_id_idx ON youtube_channels(yt_channel_id);
CREATE INDEX IF NOT EXISTS youtube_channels_operator_idx ON youtube_channels(operator);
CREATE INDEX IF NOT EXISTS youtube_channels_status_idx ON youtube_channels(status);
CREATE INDEX IF NOT EXISTS youtube_channels_is_active_idx ON youtube_channels(is_active);

-- 3. 频道日维度统计表
CREATE TABLE IF NOT EXISTS youtube_channel_stats (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(36) NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
  yt_channel_id VARCHAR(100) NOT NULL,
  stat_date VARCHAR(10) NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  estimated_revenue VARCHAR(50) DEFAULT '0',
  subscribers_gained INTEGER NOT NULL DEFAULT 0,
  subscribers_lost INTEGER NOT NULL DEFAULT 0,
  watch_time_minutes VARCHAR(50) DEFAULT '0',
  average_view_duration VARCHAR(50) DEFAULT '0',
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_channel_stats_channel_id_idx ON youtube_channel_stats(channel_id);
CREATE INDEX IF NOT EXISTS youtube_channel_stats_yt_channel_id_idx ON youtube_channel_stats(yt_channel_id);
CREATE INDEX IF NOT EXISTS youtube_channel_stats_stat_date_idx ON youtube_channel_stats(stat_date);
CREATE INDEX IF NOT EXISTS youtube_channel_stats_channel_date_idx ON youtube_channel_stats(channel_id, stat_date);

-- 4. 视频数据表
CREATE TABLE IF NOT EXISTS youtube_videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(36) NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
  yt_video_id VARCHAR(50) NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration VARCHAR(20),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_videos_channel_id_idx ON youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS youtube_videos_yt_video_id_idx ON youtube_videos(yt_video_id);
CREATE INDEX IF NOT EXISTS youtube_videos_published_at_idx ON youtube_videos(published_at);

-- 5. 更新触发器（自动更新 updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER youtube_credentials_updated_at
  BEFORE UPDATE ON youtube_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER youtube_channels_updated_at
  BEFORE UPDATE ON youtube_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
