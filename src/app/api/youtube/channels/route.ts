import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: List all authorized YouTube channels
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('youtube_channels')
      .select('id, credential_id, yt_channel_id, channel_name, channel_thumbnail, token_expires_at, scope, operator, group_name, language, tags, status, remark, last_synced_at, sync_status, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch channels:', error);
      return NextResponse.json({ channels: [] });
    }
    return NextResponse.json({ channels: data || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ channels: [] });
  }
}

// DELETE: Remove a channel
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('id');
    
    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    const { error } = await client
      .from('youtube_channels')
      .update({ is_active: false })
      .eq('id', channelId);
    
    if (error) {
      console.error('Failed to delete channel:', error);
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
