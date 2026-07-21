import { NextRequest, NextResponse } from 'next/server';
import { channels, channelDailyData } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '2026-07-20';
  const operator = searchParams.get('operator');
  const group = searchParams.get('group');
  const language = searchParams.get('language');
  const tag = searchParams.get('tag');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');
  const sortKey = searchParams.get('sortKey') || 'dailyViews';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  let filtered = [...channels];

  if (operator) filtered = filtered.filter(c => c.operator === operator);
  if (group) filtered = filtered.filter(c => c.group === group);
  if (language) filtered = filtered.filter(c => c.language === language);
  if (tag) filtered = filtered.filter(c => c.tags.includes(tag));
  if (status) filtered = filtered.filter(c => c.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) || c.channelId.toLowerCase().includes(kw)
    );
  }

  filtered.sort((a, b) => {
    const aVal = a[sortKey as keyof typeof a];
    const bVal = b[sortKey as keyof typeof b];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  // Attach daily trend data (last 7 days) for each channel
  const itemsWithTrend = items.map(ch => ({
    ...ch,
    trend: (channelDailyData[ch.id] || []).slice(-7),
  }));

  return NextResponse.json({
    items: itemsWithTrend,
    total,
    page,
    pageSize,
    updatedAt: '2026-07-21T08:00:00Z',
  });
}
