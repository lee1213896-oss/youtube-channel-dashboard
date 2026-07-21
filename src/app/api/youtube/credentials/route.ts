import { NextRequest, NextResponse } from 'next/server';

// Get OAuth credentials from environment variables
function getCredentials() {
  return {
    client_id: process.env.YOUTUBE_CLIENT_ID || '',
    client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'https://youtube-channel-dashboard-2w725lsr6-lee121380.vercel.app/api/youtube/callback',
    name: 'YouTube 数据看板',
  };
}

// GET: Return environment-based credential info
export async function GET() {
  const envCred = getCredentials();
  
  if (!envCred.client_id) {
    return NextResponse.json({ 
      credentials: [],
      warning: 'YOUTUBE_CLIENT_ID 环境变量未配置'
    });
  }
  
  return NextResponse.json({ 
    credentials: [{
      id: 'env',
      client_id: envCred.client_id,
      redirect_uri: envCred.redirect_uri,
      name: envCred.name,
      is_active: true,
      created_at: new Date().toISOString(),
    }]
  });
}
