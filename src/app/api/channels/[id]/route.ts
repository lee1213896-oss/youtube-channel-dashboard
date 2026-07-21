import { NextRequest, NextResponse } from 'next/server';
import { channels, channelDailyData } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const channel = channels.find(c => c.id === id);
  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  const dailyData = channelDailyData[id] || [];

  return NextResponse.json({
    channel,
    dailyData,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const channel = channels.find(c => c.id === id);
  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  Object.assign(channel, body);
  return NextResponse.json({ success: true, channel });
}
