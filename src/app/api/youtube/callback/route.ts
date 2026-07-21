import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { exchangeCodeForTokens, getChannelInfo } from '@/lib/youtube/api';

// GET: OAuth2 callback handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  let parsedState: { credential_id: string };
  try {
    parsedState = JSON.parse(state);
  } catch {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // Get the credential
  const { data: credential, error: credError } = await client
    .from('youtube_credentials')
    .select('id, client_id, client_secret, redirect_uri')
    .eq('id', parsedState.credential_id)
    .single();
  if (credError) throw new Error(`Query failed: ${credError.message}`);
  if (!credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, {
    client_id: credential.client_id,
    client_secret: credential.client_secret,
    redirect_uri: credential.redirect_uri,
  });

  // Get channel info
  const channelInfos = await getChannelInfo(tokens.access_token, undefined, true);
  const channelInfo = channelInfos[0];

  if (!channelInfo) {
    return NextResponse.json({ error: 'No channel found for this account' }, { status: 400 });
  }

  // Calculate token expiry
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Save the authorized channel
  const { data: savedChannel, error: saveError } = await client
    .from('youtube_channels')
    .upsert({
      credential_id: credential.id,
      yt_channel_id: channelInfo.id,
      channel_name: channelInfo.title,
      channel_thumbnail: channelInfo.thumbnail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      token_expires_at: expiresAt.toISOString(),
      scope: tokens.scope,
      is_active: true,
      status: 'normal',
      last_synced_at: new Date().toISOString(),
      sync_status: 'authorized',
    }, {
      onConflict: 'credential_id,yt_channel_id',
    })
    .select()
    .single();
  if (saveError) {
    // If unique constraint doesn't exist, try insert
    const { data: insertData, error: insertError } = await client
      .from('youtube_channels')
      .insert({
        credential_id: credential.id,
        yt_channel_id: channelInfo.id,
        channel_name: channelInfo.title,
        channel_thumbnail: channelInfo.thumbnail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        token_expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        is_active: true,
        status: 'normal',
        last_synced_at: new Date().toISOString(),
        sync_status: 'authorized',
      })
      .select()
      .single();
    if (insertError) throw new Error(`Save failed: ${insertError.message}`);
    return NextResponse.json({
      success: true,
      channel: insertData,
      message: `Channel "${channelInfo.title}" authorized successfully`,
    });
  }

  return NextResponse.json({
    success: true,
    channel: savedChannel,
    message: `Channel "${channelInfo.title}" authorized successfully`,
  });
}
