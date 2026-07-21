import { NextRequest, NextResponse } from 'next/server';

// GET: Return credentials from environment variables
export async function GET() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ 
      credentials: [],
      warning: 'YouTube OAuth 凭据未配置，请在 Vercel 环境变量中添加 YOUTUBE_CLIENT_ID、YOUTUBE_CLIENT_SECRET、YOUTUBE_REDIRECT_URI'
    });
  }

  return NextResponse.json({
    credentials: [
      {
        id: 'env',
        name: 'YouTube 数据看板',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ],
  });
}

// POST: Save credentials (deprecated - now using environment variables)
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: '凭据已改为环境变量配置，请在 Vercel 项目设置中添加 YOUTUBE_CLIENT_ID、YOUTUBE_CLIENT_SECRET、YOUTUBE_REDIRECT_URI' 
  });
}
