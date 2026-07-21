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
    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('error', `OAuth授权被拒绝: ${error}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('error', '缺少授权码，请重新授权');
    return NextResponse.redirect(redirectUrl);
  }

  let parsedState: { credential_id: string };
  try {
    parsedState = JSON.parse(state);
  } catch {
    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('error', '授权状态无效');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const client = getSupabaseClient();

    // Use credentials from environment variables
    const credential = {
      client_id: process.env.YOUTUBE_CLIENT_ID || '',
      client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI || '',
      name: 'YouTube 数据看板',
    };

    if (!credential.client_id || !credential.client_secret) {
      const redirectUrl = new URL('/youtube-auth', request.url);
      redirectUrl.searchParams.set('error', 'OAuth 凭据未配置');
      return NextResponse.redirect(redirectUrl);
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
      const redirectUrl = new URL('/youtube-auth', request.url);
      redirectUrl.searchParams.set('error', '未找到关联的YouTube频道');
      return NextResponse.redirect(redirectUrl);
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Save the authorized channel
    const { data: savedChannel, error: saveError } = await client
      .from('youtube_channels')
      .upsert({
        credential_id: 'env',
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
          credential_id: 'env',
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
      const redirectUrl = new URL('/youtube-auth', request.url);
      redirectUrl.searchParams.set('success', `频道 "${channelInfo.title}" 授权成功`);
      return NextResponse.redirect(redirectUrl);
    }

    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('success', `频道 "${channelInfo.title}" 授权成功`);
    return NextResponse.redirect(redirectUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误';
    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('error', `授权处理失败: ${message}`);
    return NextResponse.redirect(redirectUrl);
  }
}
