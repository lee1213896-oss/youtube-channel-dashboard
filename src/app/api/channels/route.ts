import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date(Date.now() - 86400000).toISOString().split('T')[0];
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

  let items: Array<{
    id: string;
    name: string;
    channelId: string;
    channelThumbnail?: string;
    operator: string;
    group: string;
    language: string;
    tags: string[];
    status: string;
    remark: string;
    dailyViews: number;
    dailyRevenue: number;
    totalWatchHours: number;
    subscribers: number;
    dailySubChange: number;
    syncStatus: string;
  }> = [];

  try {
    const client = getSupabaseClient();
    const { data: authChannels } = await client
      .from('youtube_channels')
      .select('id, yt_channel_id, channel_name, channel_thumbnail, operator, group_name, language, tags, status, remark, sync_status')
      .eq('is_active', true);

    if (authChannels && authChannels.length > 0) {
      const channelIds = authChannels.map((c: { id: string }) => c.id);
      const { data: stats } = await client
        .from('youtube_channel_stats')
        .select('channel_id, stat_date, views, estimated_revenue, subscribers_gained, subscribers_lost, watch_time_minutes')
        .in('channel_id', channelIds)
        .eq('stat_date', date);

      for (const ytCh of authChannels) {
        const chStats = (stats || []).filter((s: { channel_id: string }) => s.channel_id === ytCh.id);
        const dailyViews = chStats.reduce((sum: number, s: { views: number }) => sum + s.views, 0);
        const dailyRevenue = chStats.reduce((sum: number, s: { estimated_revenue: string }) => sum + Number(s.estimated_revenue), 0);
        const dailySubChange = chStats.reduce((sum: number, s: { subscribers_gained: number; subscribers_lost: number }) => sum + s.subscribers_gained - s.subscribers_lost, 0);
        const watchHours = chStats.reduce((sum: number, s: { watch_time_minutes: string }) => sum + Number(s.watch_time_minutes) / 60, 0);

        items.push({
          id: ytCh.id,
          name: ytCh.channel_name || 'Unknown',
          channelId: ytCh.yt_channel_id,
          channelThumbnail: ytCh.channel_thumbnail,
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
          syncStatus: ytCh.sync_status,
        });
      }
    }
  } catch {
    // DB error
  }

  // Apply filters
  if (operator) items = items.filter(c => c.operator === operator);
  if (group) items = items.filter(c => c.group === group);
  if (language) items = items.filter(c => c.language === language);
  if (tag) items = items.filter(c => c.tags.includes(tag));
  if (status) items = items.filter(c => c.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    items = items.filter(c =>
      c.name.toLowerCase().includes(kw) || c.channelId.toLowerCase().includes(kw)
    );
  }

  // Sort
  items.sort((a, b) => {
    const aVal = a[sortKey as keyof typeof a] ?? 0;
    const bVal = b[sortKey as keyof typeof b] ?? 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return NextResponse.json({
    items: pageItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
