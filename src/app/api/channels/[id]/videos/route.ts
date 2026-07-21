import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const { data: videos } = await client
      .from('youtube_videos')
      .select('*')
      .eq('channel_id', id)
      .order('view_count', { ascending: false });

    return NextResponse.json({
      videos: (videos || []).map((v: {
        id: string; yt_video_id: string; title: string; published_at: string;
        view_count: number; like_count: number; comment_count: number;
      }) => ({
        id: v.id,
        videoId: v.yt_video_id,
        title: v.title,
        publishedAt: v.published_at,
        dailyViews: v.view_count,
        dailyRevenue: 0,
        totalViews: v.view_count,
        totalRevenue: 0,
        likes: v.like_count,
        comments: v.comment_count,
        trend: [],
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
