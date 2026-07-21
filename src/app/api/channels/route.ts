import { NextRequest, NextResponse } from 'next/server';
import { getAllChannels } from '@/lib/youtube/api';

// GET: List all channels
export async function GET(request: NextRequest) {
  try {
    const channels = await getAllChannels();
    
    // Apply filters
    const searchParams = request.nextUrl.searchParams;
    const operator = searchParams.get('operator');
    const group = searchParams.get('group');
    const language = searchParams.get('language');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let filtered = channels;

    if (operator) {
      filtered = filtered.filter(ch => ch.operator === operator);
    }
    if (group) {
      filtered = filtered.filter(ch => ch.group === group);
    }
    if (language) {
      filtered = filtered.filter(ch => ch.language === language);
    }
    if (status) {
      filtered = filtered.filter(ch => ch.status === status);
    }
    if (tag) {
      filtered = filtered.filter(ch => ch.tags?.includes(tag));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(searchLower) ||
        ch.operator?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ channels: filtered });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ channels: [] });
  }
}
