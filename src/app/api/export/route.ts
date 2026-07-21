import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'channels';
  const date = searchParams.get('date') || new Date(Date.now() - 86400000).toISOString().split('T')[0];

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const { data: authChannels } = await client
      .from('youtube_channels')
      .select('id, yt_channel_id, channel_name, operator, group_name, language, tags, status, remark')
      .eq('is_active', true);

    const channelList = authChannels || [];
    const channelIds = channelList.map((c: { id: string }) => c.id);

    const { data: stats } = await client
      .from('youtube_channel_stats')
      .select('channel_id, views, estimated_revenue, subscribers_gained, subscribers_lost, watch_time_minutes')
      .in('channel_id', channelIds)
      .eq('stat_date', date);

    const statsMap = new Map<string, { views: number; revenue: number; subChange: number; watchHours: number }>();
    for (const s of stats || []) {
      statsMap.set(s.channel_id, {
        views: s.views,
        revenue: Number(s.estimated_revenue),
        subChange: s.subscribers_gained - s.subscribers_lost,
        watchHours: Math.round(Number(s.watch_time_minutes) / 60),
      });
    }

    let data: Record<string, unknown>[];
    let filename: string;

    if (type === 'channels') {
      filename = '频道数据.xlsx';
      data = channelList.map(c => {
        const s = statsMap.get(c.id);
        return {
          '频道名称': c.channel_name,
          '频道ID': c.yt_channel_id,
          '运营人员': c.operator || '',
          '所属分组': c.group_name || '',
          '语种': c.language || '',
          '标签': (c.tags || []).join(', '),
          '运营状态': c.status === 'normal' ? '正常运营' : c.status === 'cold_start' ? '冷启中' : c.status === 'paused' ? '暂停' : '废弃',
          '日播放量': s?.views || 0,
          '日收益(USD)': s?.revenue || 0,
          '累计播放时长(小时)': s?.watchHours || 0,
          '日订阅增长': s?.subChange || 0,
        };
      });
    } else {
      filename = '频道配置.xlsx';
      data = channelList.map(c => ({
        '频道名称': c.channel_name,
        '频道ID': c.yt_channel_id,
        '运营人员': c.operator || '',
        '所属分组': c.group_name || '',
        '语种': c.language || '',
        '标签': (c.tags || []).join(', '),
        '运营状态': c.status,
        '备注': c.remark || '',
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
