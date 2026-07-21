import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: List all credentials
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('youtube_credentials')
      .select('id, client_id, redirect_uri, name, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch credentials:', error);
      return NextResponse.json({ credentials: [] });
    }
    return NextResponse.json({ credentials: data || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ credentials: [] });
  }
}

// POST: Create new credentials
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const body = await request.json();
  const { client_id, client_secret, redirect_uri, name } = body;

  if (!client_id || !client_secret || !redirect_uri) {
    return NextResponse.json({ error: 'Missing required fields: client_id, client_secret, redirect_uri' }, { status: 400 });
  }

  const { data, error } = await client
    .from('youtube_credentials')
    .insert({
      client_id,
      client_secret,
      redirect_uri,
      name: name || 'Default',
      is_active: true,
    })
    .select()
    .single();
  if (error) throw new Error(`Insert failed: ${error.message}`);
  return NextResponse.json({ credential: data });
}
