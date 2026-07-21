import { NextRequest, NextResponse } from 'next/server';
import { getChannelDetail } from '@/lib/youtube/api';

// GET: Get channel detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channel = await getChannelDetail(params.id);
    
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}

// PUT: Update channel config (operator, group, language, tags, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // In simplified version, we don't persist changes to config file
  // This is a placeholder for future implementation
  return NextResponse.json({ success: true });
}
