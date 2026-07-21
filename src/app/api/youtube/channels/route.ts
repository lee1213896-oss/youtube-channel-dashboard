import { NextRequest, NextResponse } from 'next/server';

// GET: List all authorized YouTube channels
export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Supabase not configured, return empty data
      return NextResponse.json({ 
        channels: [],
        warning: 'Supabase 未配置，请先配置环境变量'
      });
    }
    
    // Import Supabase client only if configured
    const { createClient } = await import('@supabase/supabase-js');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
    const client = createClient(supabaseUrl, serviceRoleKey || supabaseKey, {
      db: { timeout: 60000 },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
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
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseKey, {
      db: { timeout: 60000 },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
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
