import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
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

    // Get stats for the date
    const { data: stats } = await client
      .from('youtube_channel_stats')
      .select('channel_id, views, estimated_revenue, subscribers_gained, subscribers_lost')
      .in('channel_id', channelIds)
      .eq('stat_date', date);

    const statsMap = new Map<string, { views: number; revenue: number; subChange: number }>();
    for (const s of stats || []) {
      statsMap.set(s.channel_id, {
        views: s.views,
        revenue: Number(s.estimated_revenue),
        subChange: s.subscribers_gained - s.subscribers_lost,
      });
    }

    // Collect all unique tags
    const tagSet = new Set<string>();
    for (const ch of channelList) {
      for (const t of (ch.tags || [])) {
        tagSet.add(t);
      }
    }
    const allTags = Array.from(tagSet).sort();

    if (selectedTags.length === 0) {
      const tagAggregates = allTags.map(tag => {
        const matched = channelList.filter((c: { tags: string[] }) => c.tags.includes(tag));
        const matchedIds = matched.map((c: { id: string }) => c.id);
        return {
          tag,
          channelCount: matched.length,
          totalDailyViews: matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.views || 0), 0),
          totalDailyRevenue: Math.round(matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.revenue || 0), 0) * 100) / 100,
          avgDailyViews: matched.length > 0 ? Math.round(matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.views || 0), 0) / matched.length) : 0,
          avgDailyRevenue: matched.length > 0 ? Math.round((matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.revenue || 0), 0) / matched.length) * 100) / 100 : 0,
          totalSubscribers: 0,
          dailySubChange: matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.subChange || 0), 0),
        };
      });

      return NextResponse.json({ tags: tagAggregates, allTags, date });
    }

    const matched = channelList.filter((c: { tags: string[] }) =>
      selectedTags.some(t => c.tags.includes(t))
    );
    const matchedIds = matched.map((c: { id: string }) => c.id);

    const aggregate = {
      tag: selectedTags.join(' + '),
      channelCount: matched.length,
      totalDailyViews: matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.views || 0), 0),
      totalDailyRevenue: Math.round(matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.revenue || 0), 0) * 100) / 100,
      avgDailyViews: matched.length > 0 ? Math.round(matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.views || 0), 0) / matched.length) : 0,
      avgDailyRevenue: matched.length > 0 ? Math.round((matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.revenue || 0), 0) / matched.length) * 100) / 100 : 0,
      totalSubscribers: 0,
      dailySubChange: matchedIds.reduce((s: number, id: string) => s + (statsMap.get(id)?.subChange || 0), 0),
      channels: matched.map((c: { id: string; channel_name: string }) => ({
        id: c.id,
        name: c.channel_name,
        dailyViews: statsMap.get(c.id)?.views || 0,
        dailyRevenue: statsMap.get(c.id)?.revenue || 0,
        subscribers: 0,
      })),
    };

    return NextResponse.json({ aggregate, allTags, date });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
