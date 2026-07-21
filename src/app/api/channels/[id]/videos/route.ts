import { NextRequest, NextResponse } from 'next/server';
import { channelVideos, videoDailyData } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const channelId = id;

  const videos = channelVideos[channelId] || [];

  const videosWithTrend = videos.map(v => ({
    ...v,
    trend: videoDailyData[v.id] || [],
  }));

  return NextResponse.json({ videos: videosWithTrend });
}
