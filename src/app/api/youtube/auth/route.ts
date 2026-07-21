import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/youtube/api';
import { getCredentials } from '../credentials/route';

// GET: Start OAuth2 flow via query params (for browser redirect)
export async function GET(request: NextRequest) {
  const credential = getCredentials();

  if (!credential.client_id || !credential.client_secret) {
    const redirectUrl = new URL('/youtube-auth', request.url);
    redirectUrl.searchParams.set('error', 'OAuth 凭据未配置，请联系管理员');
    return NextResponse.redirect(redirectUrl);
  }

  const state = JSON.stringify({ credential_id: 'env', ts: Date.now() });
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
  const credential = getCredentials();

  if (!credential.client_id || !credential.client_secret) {
    return NextResponse.json({ error: 'OAuth 凭据未配置' }, { status: 500 });
  }

  // Generate auth URL
  const state = JSON.stringify({ credential_id: 'env', ts: Date.now() });
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
