import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: List all authorized YouTube channels
export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('youtube_channels')
    .select('id, credential_id, yt_channel_id, channel_name, channel_thumbnail, token_expires_at, scope, operator, group_name, language, tags, status, remark, last_synced_at, sync_status, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Query failed: ${error.message}`);
  return NextResponse.json({ channels: data || [] });
}
