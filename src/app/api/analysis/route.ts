import { NextRequest, NextResponse } from 'next/server';
import { channels, channelDailyData } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '2026-07-14';
  const endDate = searchParams.get('endDate') || '2026-07-20';
  const compareMode = searchParams.get('compareMode') || ''; // 'mom' | 'yoy' | ''
  const channelId = searchParams.get('channelId');
  const tag = searchParams.get('tag');
  const group = searchParams.get('group');

  let targetChannels = [...channels];
  if (channelId) targetChannels = targetChannels.filter(c => c.id === channelId);
  if (tag) targetChannels = targetChannels.filter(c => c.tags.includes(tag));
  if (group) targetChannels = targetChannels.filter(c => c.group === group);

  function aggregateForPeriod(start: string, end: string) {
    let totalViews = 0;
    let totalRevenue = 0;
    let totalSubChange = 0;
    let dayCount = 0;
    const dailyViews: { date: string; views: number; revenue: number }[] = [];

    const startD = new Date(start);
    const endD = new Date(end);

    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let dayViews = 0;
      let dayRevenue = 0;
      let daySubChange = 0;

      targetChannels.forEach(ch => {
        const data = channelDailyData[ch.id];
        if (data) {
          const dayData = data.find(dd => dd.date === dateStr);
          if (dayData) {
            dayViews += dayData.views;
            dayRevenue += dayData.revenue;
            daySubChange += dayData.subChange;
          }
        }
      });

      totalViews += dayViews;
      totalRevenue += dayRevenue;
      totalSubChange += daySubChange;
      dayCount++;
      dailyViews.push({ date: dateStr, views: dayViews, revenue: Math.round(dayRevenue * 100) / 100 });
    }

    return {
      totalViews,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDailyViews: dayCount > 0 ? Math.round(totalViews / dayCount) : 0,
      avgDailyRevenue: dayCount > 0 ? Math.round((totalRevenue / dayCount) * 100) / 100 : 0,
      totalSubChange,
      dailyTrend: dailyViews,
    };
  }

  const current = aggregateForPeriod(startDate, endDate);

  let comparison = null;
  if (compareMode === 'mom') {
    const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);
    comparison = aggregateForPeriod(
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    );
  } else if (compareMode === 'yoy') {
    const prevStart = new Date(startDate);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    comparison = aggregateForPeriod(
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    );
  }

  return NextResponse.json({
    current,
    comparison,
    channelCount: targetChannels.length,
  });
}
