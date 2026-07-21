import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const compareMode = searchParams.get('compareMode') || '';
  const channelId = searchParams.get('channelId');
  const tag = searchParams.get('tag');
  const group = searchParams.get('group');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  let targetChannelIds: string[] = [];
  let channelCount = 0;

  try {
    const client = getSupabaseClient();
    let query = client
      .from('youtube_channels')
      .select('id, tags, group_name')
      .eq('is_active', true);

    if (channelId) query = query.eq('id', channelId);
    if (tag) query = query.contains('tags', [tag]);
    if (group) query = query.eq('group_name', group);

    const { data: chList } = await query;
    targetChannelIds = (chList || []).map((c: { id: string }) => c.id);
    channelCount = targetChannelIds.length;
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  async function aggregateForPeriod(start: string, end: string) {
    if (targetChannelIds.length === 0) {
      return {
        totalViews: 0, totalRevenue: 0, avgDailyViews: 0,
        avgDailyRevenue: 0, totalSubChange: 0, dailyTrend: [],
      };
    }

    try {
      const client = getSupabaseClient();
      const { data: stats } = await client
        .from('youtube_channel_stats')
        .select('channel_id, stat_date, views, estimated_revenue, subscribers_gained, subscribers_lost')
        .in('channel_id', targetChannelIds)
        .gte('stat_date', start)
        .lte('stat_date', end);

      const dailyMap = new Map<string, { views: number; revenue: number; subChange: number }>();
      const startD = new Date(start);
      const endD = new Date(end);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        dailyMap.set(d.toISOString().split('T')[0], { views: 0, revenue: 0, subChange: 0 });
      }

      for (const s of stats || []) {
        const entry = dailyMap.get(s.stat_date);
        if (entry) {
          entry.views += s.views;
          entry.revenue += Number(s.estimated_revenue);
          entry.subChange += s.subscribers_gained - s.subscribers_lost;
        }
      }

      const dailyTrend = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, views: data.views, revenue: Math.round(data.revenue * 100) / 100 }));

      const totalViews = dailyTrend.reduce((s, d) => s + d.views, 0);
      const totalRevenue = dailyTrend.reduce((s, d) => s + d.revenue, 0);
      const totalSubChange = dailyTrend.reduce((s, d) => s + (dailyMap.get(d.date)?.subChange || 0), 0);
      const dayCount = dailyTrend.length;

      return {
        totalViews,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgDailyViews: dayCount > 0 ? Math.round(totalViews / dayCount) : 0,
        avgDailyRevenue: dayCount > 0 ? Math.round((totalRevenue / dayCount) * 100) / 100 : 0,
        totalSubChange,
        dailyTrend,
      };
    } catch {
      return {
        totalViews: 0, totalRevenue: 0, avgDailyViews: 0,
        avgDailyRevenue: 0, totalSubChange: 0, dailyTrend: [],
      };
    }
  }

  const current = await aggregateForPeriod(startDate, endDate);

  let comparison = null;
  if (compareMode === 'mom') {
    const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);
    comparison = await aggregateForPeriod(
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    );
  } else if (compareMode === 'yoy') {
    const prevStart = new Date(startDate);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    comparison = await aggregateForPeriod(
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    );
  }

  return NextResponse.json({ current, comparison, channelCount });
}
