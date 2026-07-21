import { NextRequest, NextResponse } from 'next/server';
import { channels, channelDailyData } from '@/lib/mock-data';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '2026-07-20';
  const operator = searchParams.get('operator');
  const group = searchParams.get('group');
  const language = searchParams.get('language');
  const tag = searchParams.get('tag');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');
  const sortKey = searchParams.get('sortKey') || 'dailyViews';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  // Try to get authorized YouTube channels from DB
  let ytChannels: Array<{
    id: string;
    yt_channel_id: string;
    channel_name: string;
    channel_thumbnail: string;
    operator: string | null;
    group_name: string | null;
    language: string | null;
    tags: string[] | null;
    status: string;
    remark: string | null;
    sync_status: string;
  }> = [];
  let ytStats: Array<{
    channel_id: string;
    stat_date: string;
    views: number;
    estimated_revenue: number;
    subscribers_gained: number;
    subscribers_lost: number;
    watch_time_minutes: number;
  }> = [];

  try {
    const client = getSupabaseClient();
    const { data: authChannels } = await client
      .from('youtube_channels')
      .select('id, yt_channel_id, channel_name, channel_thumbnail, operator, group_name, language, tags, status, remark, sync_status')
      .eq('is_active', true);
    
    if (authChannels && authChannels.length > 0) {
      ytChannels = authChannels;
      
      // Get latest stats for these channels
      const channelIds = authChannels.map(c => c.id);
      const { data: stats } = await client
        .from('youtube_channel_stats')
        .select('channel_id, stat_date, views, estimated_revenue, subscribers_gained, subscribers_lost, watch_time_minutes')
        .in('channel_id', channelIds)
        .eq('stat_date', date);
      
      if (stats) {
        ytStats = stats;
      }
    }
  } catch {
    // DB not available, use mock data only
  }

  // Build merged channel list: mock channels + YouTube authorized channels
  let filtered = [...channels];

  // Add YouTube authorized channels that aren't already in mock data
  for (const ytCh of ytChannels) {
    const exists = filtered.some(c => c.channelId === ytCh.yt_channel_id);
    if (!exists) {
      const stats = ytStats.filter(s => s.channel_id === ytCh.id);
      const dailyViews = stats.reduce((sum, s) => sum + s.views, 0);
      const dailyRevenue = stats.reduce((sum, s) => sum + Number(s.estimated_revenue), 0);
      const dailySubChange = stats.reduce((sum, s) => sum + s.subscribers_gained - s.subscribers_lost, 0);
      const watchHours = stats.reduce((sum, s) => sum + Number(s.watch_time_minutes) / 60, 0);
      
      filtered.push({
        id: `yt_${ytCh.id}`,
        name: ytCh.channel_name,
        channelId: ytCh.yt_channel_id,
        operator: ytCh.operator || '',
        group: ytCh.group_name || '',
        language: ytCh.language || '',
        tags: ytCh.tags || [],
        status: ytCh.status === 'cold_start' ? 'cold_start' : ytCh.status === 'paused' ? 'paused' : ytCh.status === 'abandoned' ? 'abandoned' : 'normal',
        remark: ytCh.remark || '',
        dailyViews,
        dailyRevenue,
        totalWatchHours: Math.round(watchHours),
        subscribers: 0,
        dailySubChange,
      });
    }
  }

  if (operator) filtered = filtered.filter(c => c.operator === operator);
  if (group) filtered = filtered.filter(c => c.group === group);
  if (language) filtered = filtered.filter(c => c.language === language);
  if (tag) filtered = filtered.filter(c => c.tags.includes(tag));
  if (status) filtered = filtered.filter(c => c.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) || c.channelId.toLowerCase().includes(kw)
    );
  }

  filtered.sort((a, b) => {
    const aVal = a[sortKey as keyof typeof a] ?? 0;
    const bVal = b[sortKey as keyof typeof b] ?? 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasYouTubeAuth: ytChannels.length > 0,
    youtubeChannelCount: ytChannels.length,
  });
}
