import { NextRequest, NextResponse } from 'next/server';
import { channels, allTags } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const date = searchParams.get('date') || '2026-07-20';

  if (selectedTags.length === 0) {
    // Return all tags with aggregate data
    const tagAggregates = allTags.map(tag => {
      const matched = channels.filter(c => c.tags.includes(tag));
      return {
        tag,
        channelCount: matched.length,
        totalDailyViews: matched.reduce((s, c) => s + c.dailyViews, 0),
        totalDailyRevenue: Math.round(matched.reduce((s, c) => s + c.dailyRevenue, 0) * 100) / 100,
        avgDailyViews: matched.length > 0 ? Math.round(matched.reduce((s, c) => s + c.dailyViews, 0) / matched.length) : 0,
        avgDailyRevenue: matched.length > 0 ? Math.round((matched.reduce((s, c) => s + c.dailyRevenue, 0) / matched.length) * 100) / 100 : 0,
        totalSubscribers: matched.reduce((s, c) => s + c.subscribers, 0),
        dailySubChange: matched.reduce((s, c) => s + c.dailySubChange, 0),
      };
    });

    return NextResponse.json({ tags: tagAggregates, allTags, date });
  }

  const matched = channels.filter(c =>
    selectedTags.some(t => c.tags.includes(t))
  );

  const aggregate = {
    tag: selectedTags.join(' + '),
    channelCount: matched.length,
    totalDailyViews: matched.reduce((s, c) => s + c.dailyViews, 0),
    totalDailyRevenue: Math.round(matched.reduce((s, c) => s + c.dailyRevenue, 0) * 100) / 100,
    avgDailyViews: matched.length > 0 ? Math.round(matched.reduce((s, c) => s + c.dailyViews, 0) / matched.length) : 0,
    avgDailyRevenue: matched.length > 0 ? Math.round((matched.reduce((s, c) => s + c.dailyRevenue, 0) / matched.length) * 100) / 100 : 0,
    totalSubscribers: matched.reduce((s, c) => s + c.subscribers, 0),
    dailySubChange: matched.reduce((s, c) => s + c.dailySubChange, 0),
    channels: matched.map(c => ({
      id: c.id,
      name: c.name,
      dailyViews: c.dailyViews,
      dailyRevenue: c.dailyRevenue,
      subscribers: c.subscribers,
    })),
  };

  return NextResponse.json({ aggregate, allTags, date });
}
