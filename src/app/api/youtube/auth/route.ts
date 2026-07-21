import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { generateAuthUrl } from '@/lib/youtube/api';

// GET: Start OAuth2 flow via query params (for browser redirect)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const credential_id = searchParams.get('credential_id');

  if (!credential_id) {
    return NextResponse.json({ error: 'credential_id is required' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data: credential, error: credError } = await client
    .from('youtube_credentials')
    .select('id, client_id, client_secret, redirect_uri')
    .eq('id', credential_id)
    .single();

  if (credError || !credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const state = JSON.stringify({ credential_id, ts: Date.now() });
  const authUrl = generateAuthUrl(
    {
      client_id: credential.client_id,
      client_secret: credential.client_secret,
      redirect_uri: credential.redirect_uri,
    },
    state
  );

  // Redirect directly to Google auth page
  return NextResponse.redirect(authUrl);
}

// POST: Start OAuth2 flow - returns authorization URL as JSON
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
