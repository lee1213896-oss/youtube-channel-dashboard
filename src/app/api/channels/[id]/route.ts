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
    const { data: channel } = await client
      .from('youtube_channels')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const { data: dailyData } = await client
      .from('youtube_channel_stats')
      .select('stat_date, views, estimated_revenue, subscribers_gained, subscribers_lost, watch_time_minutes')
      .eq('channel_id', id)
      .order('stat_date', { ascending: true });

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.channel_name,
        channelId: channel.yt_channel_id,
        channelThumbnail: channel.channel_thumbnail,
        operator: channel.operator || '',
        group: channel.group_name || '',
        language: channel.language || '',
        tags: channel.tags || [],
        status: channel.status,
        remark: channel.remark || '',
        syncStatus: channel.sync_status,
      },
      dailyData: (dailyData || []).map((d: { stat_date: string; views: number; estimated_revenue: string; subscribers_gained: number; subscribers_lost: number; watch_time_minutes: string }) => ({
        date: d.stat_date,
        views: d.views,
        revenue: Number(d.estimated_revenue),
        subscribers: 0,
        subChange: d.subscribers_gained - d.subscribers_lost,
        watchHours: Math.round(Number(d.watch_time_minutes) / 60),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const updateData: Record<string, unknown> = {};
    if (body.operator !== undefined) updateData.operator = body.operator;
    if (body.group !== undefined) updateData.group_name = body.group;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('youtube_channels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, channel: data });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
