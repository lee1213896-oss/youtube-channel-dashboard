'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface YouTubeChannel {
  id: string;
  credential_id: string;
  yt_channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  token_expires_at: string | null;
  operator: string | null;
  group_name: string | null;
  language: string | null;
  tags: string[] | null;
  status: string;
  remark: string | null;
  last_synced_at: string | null;
  sync_status: string;
  is_active: boolean;
  created_at: string;
}

export default function YouTubeAuthPage() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/youtube/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    setAuthorizing(true);
    window.location.href = '/api/youtube/auth';
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/youtube/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`同步完成：成功 ${data.success || 0} 个，失败 ${data.failed || 0} 个`);
        fetchChannels();
      } else {
        setSyncResult(`同步失败：${data.error || '未知错误'}`);
      }
    } catch (error) {
      setSyncResult(`同步失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
      active: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-green-500/20 text-green-400', text: '已授权' },
      expired: { icon: <XCircle className="h-3 w-3" />, color: 'bg-red-500/20 text-red-400', text: '已过期' },
      pending: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400', text: '待同步' },
    };
    const c = config[status] || config.pending;
    return (
      <Badge variant="secondary" className={`${c.color} border-0 gap-1`}>
        {c.icon}
        {c.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">YouTube 频道授权</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理 OAuth 凭据，授权 YouTube 频道，同步频道数据
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || channels.length === 0}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? '同步中...' : '全量同步'}
        </Button>
      </div>

      {syncResult && (
        <Card className={syncResult.includes('失败') ? 'border-red-500/50' : 'border-green-500/50'}>
          <CardContent className="pt-6">
            <p className={syncResult.includes('失败') ? 'text-red-400' : 'text-green-400'}>
              {syncResult}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleAuthorize}
          disabled={authorizing}
          className="gap-2 bg-[#ff4444] hover:bg-[#cc3333]"
        >
          <Link2 className="h-4 w-4" />
          {authorizing ? '授权中...' : '授权频道'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">
            已授权频道 ({channels.length})
          </h3>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">暂无授权频道</p>
              <p className="text-sm text-muted-foreground/70 mb-6">
                点击上方"授权频道"按钮，使用 Google 账号授权 YouTube 频道
              </p>
              <Button
                onClick={handleAuthorize}
                disabled={authorizing}
                className="gap-2 bg-[#ff4444] hover:bg-[#cc3333]"
              >
                <Link2 className="h-4 w-4" />
                {authorizing ? '授权中...' : '授权频道'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {channel.channel_thumbnail ? (
                      <img
                        src={channel.channel_thumbnail}
                        alt={channel.channel_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{channel.channel_name || '未命名频道'}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.yt_channel_id}
                        {channel.operator && ` · ${channel.operator}`}
                        {channel.group_name && ` · ${channel.group_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(channel.sync_status)}
                    {channel.last_synced_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(channel.last_synced_at).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">配置指南</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">1. Google Cloud Console 配置</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>打开 <span className="text-blue-400">console.cloud.google.com</span></li>
                <li>启用 YouTube Data API v3 和 YouTube Analytics API</li>
                <li>创建 OAuth 2.0 凭据（网页应用类型）</li>
                <li>添加已授权的重定向 URI：</li>
              </ul>
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/youtube/callback` : '/api/youtube/callback'}
              </code>
            </div>
            <div>
              <p className="font-medium mb-2">2. 环境变量配置</p>
              <p className="text-muted-foreground">
                已在代码中配置 OAuth 凭据，无需额外配置。
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">3. 授权流程</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                <li>点击"授权频道"按钮</li>
                <li>在 Google 授权页面登录并授权</li>
                <li>授权完成后自动跳转回此页面</li>
                <li>点击"全量同步"拉取频道数据</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
