import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Get OAuth credentials from environment variables
function getCredentials() {
  return {
    client_id: process.env.YOUTUBE_CLIENT_ID || '',
    client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'https://youtube-channel-dashboard-2w725lsr6-lee121380.vercel.app/api/youtube/callback',
    name: 'YouTube 数据看板',
  };
}

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
    }
    
    const credentials = data || [];
    
    // Also return environment-based credential info (without secret)
    const envCred = getCredentials();
    if (envCred.client_id) {
      const hasEnv = credentials.some(c => c.client_id === envCred.client_id);
      if (!hasEnv) {
        credentials.push({
          id: 'env',
          client_id: envCred.client_id,
          redirect_uri: envCred.redirect_uri,
          name: envCred.name,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }
    
    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ credentials: [] });
  }
}

// POST: Create new credentials (disabled, use environment variables)
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: '请使用环境变量配置凭据：YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI',
  }, { status: 400 });
}

export { getCredentials };
