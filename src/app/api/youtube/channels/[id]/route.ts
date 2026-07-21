import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: Get a single authorized channel
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('youtube_channels')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Query failed: ${error.message}`);
  if (!data) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }
  return NextResponse.json({ channel: data });
}

// PUT: Update channel config (operator, group, language, tags, status, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const client = getSupabaseClient();

  // Only allow updating config fields, not tokens
  const allowedFields = ['operator', 'group_name', 'language', 'tags', 'status', 'remark', 'is_active'];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await client
    .from('youtube_channels')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Update failed: ${error.message}`);
  return NextResponse.json({ channel: data });
}

// DELETE: Remove channel authorization
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();
  const { error } = await client
    .from('youtube_channels')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  return NextResponse.json({ success: true });
}
