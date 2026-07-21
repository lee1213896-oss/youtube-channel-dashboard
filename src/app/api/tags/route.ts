import { NextRequest, NextResponse } from 'next/server';
import { getAllChannels, channelConfig } from '@/lib/youtube/api';

// GET: Tag aggregation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tags = searchParams.get('tags')?.split(',') || [];

    const channels = await getAllChannels();
    
    let filtered = channels;
    if (tags.length > 0) {
      filtered = channels.filter(ch => 
        tags.some(tag => ch.tags?.includes(tag))
      );
    }

    // Aggregate stats
    const aggregated = {
      totalChannels: filtered.length,
      totalViews: filtered.reduce((sum, ch) => sum + parseInt(ch.viewCount || '0'), 0),
      totalSubscribers: filtered.reduce((sum, ch) => sum + parseInt(ch.subscriberCount || '0'), 0),
      totalVideos: filtered.reduce((sum, ch) => sum + parseInt(ch.videoCount || '0'), 0),
      channels: filtered,
    };

    return NextResponse.json(aggregated);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ totalChannels: 0, totalViews: 0, totalSubscribers: 0, totalVideos: 0, channels: [] });
  }
}

// GET: Get all available tags
export async function GET_TAGS() {
  const allTags = new Set<string>();
  channelConfig.channels.forEach(ch => {
    ch.tags?.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags);
}
