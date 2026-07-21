import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { generateAuthUrl } from '@/lib/youtube/api';

// POST: Start OAuth2 flow - returns authorization URL
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const body = await request.json();
  const { credential_id } = body;

  if (!credential_id) {
    return NextResponse.json({ error: 'credential_id is required' }, { status: 400 });
  }

  // Get the credential
  const { data: credential, error: credError } = await client
    .from('youtube_credentials')
    .select('id, client_id, client_secret, redirect_uri')
    .eq('id', credential_id)
    .single();
  if (credError) throw new Error(`Query failed: ${credError.message}`);
  if (!credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  // Generate auth URL
  const state = JSON.stringify({ credential_id, ts: Date.now() });
  const authUrl = generateAuthUrl(
    {
      client_id: credential.client_id,
      client_secret: credential.client_secret,
      redirect_uri: credential.redirect_uri,
    },
    state
  );

  return NextResponse.json({ auth_url: authUrl });
}
