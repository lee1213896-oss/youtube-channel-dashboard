import { NextRequest, NextResponse } from 'next/server';

// GET: Analysis data
// In simplified version, we return empty data as we don't have historical stats
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      data: [],
      message: 'Historical data not available in simplified mode. Use YouTube API Key to fetch current channel stats.'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ data: [] });
  }
}
