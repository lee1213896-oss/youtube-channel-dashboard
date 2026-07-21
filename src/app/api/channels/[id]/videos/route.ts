import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube/api';

// GET: Get channel videos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videos = await getChannelVideos(params.id);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ videos: [] });
  }
}
