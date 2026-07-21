import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { refreshAccessToken, getChannelAnalytics, getChannelInfo } from '@/lib/youtube/api';

// POST: Sync data from YouTube API for a specific channel or all channels
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const body = await request.json();
  const { channel_id, start_date, end_date } = body;

  // Get channels to sync
  let query = client.from('youtube_channels').select('*').eq('is_active', true);
  if (channel_id) {
    query = query.eq('id', channel_id);
  }
  const { data: channels, error: chError } = await query;
  if (chError) throw new Error(`Query failed: ${chError.message}`);
  if (!channels || channels.length === 0) {
    return NextResponse.json({ error: 'No active channels found' }, { status: 404 });
  }

  const results: { channel_id: string; channel_name: string; status: string; records_synced: number; error?: string }[] = [];

  for (const channel of channels) {
    try {
      // Check if token needs refresh
      let accessToken = channel.access_token;
      const expiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null;
      if (expiresAt && expiresAt.getTime() < Date.now() + 300000) { // 5 min buffer
        // Get credential
        const { data: credential } = await client
          .from('youtube_credentials')
          .select('client_id, client_secret, redirect_uri')
          .eq('id', channel.credential_id)
          .single();
        if (credential && channel.refresh_token) {
          const tokens = await refreshAccessToken(channel.refresh_token, {
            client_id: credential.client_id,
            client_secret: credential.client_secret,
            redirect_uri: credential.redirect_uri,
          });
          accessToken = tokens.access_token;
          // Update tokens in DB
          const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
          await client
            .from('youtube_channels')
            .update({
              access_token: tokens.access_token,
              token_expires_at: newExpiresAt.toISOString(),
            })
            .eq('id', channel.id);
        }
      }

      // Sync channel info
      const channelInfos = await getChannelInfo(accessToken, channel.yt_channel_id);
      if (channelInfos.length > 0) {
        await client
          .from('youtube_channels')
          .update({
            channel_name: channelInfos[0].title,
            channel_thumbnail: channelInfos[0].thumbnail,
          })
          .eq('id', channel.id);
      }

      // Sync analytics data (default from 2026-07-01)
      const endDate = end_date || new Date().toISOString().split('T')[0];
      const startDate = start_date || '2026-07-01';
      const analytics = await getChannelAnalytics(accessToken, channel.yt_channel_id, startDate, endDate);

      // Upsert analytics data
      let recordsSynced = 0;
      for (const row of analytics) {
        const { error: upsertError } = await client
          .from('youtube_channel_stats')
          .upsert({
            channel_id: channel.id,
            yt_channel_id: channel.yt_channel_id,
            stat_date: row.date,
            views: row.views,
            estimated_revenue: String(row.estimatedRevenue),
            subscribers_gained: row.subscribersGained,
            subscribers_lost: row.subscribersLost,
            watch_time_minutes: String(row.watchTimeMinutes),
            average_view_duration: String(row.averageViewDuration),
            likes: row.likes,
            comments: row.comments,
            shares: row.shares,
          }, {
            onConflict: 'channel_id,stat_date',
          });
        if (!upsertError) recordsSynced++;
      }

      // Update sync status
      await client
        .from('youtube_channels')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
        })
        .eq('id', channel.id);

      results.push({
        channel_id: channel.id,
        channel_name: channel.channel_name || channel.yt_channel_id,
        status: 'success',
        records_synced: recordsSynced,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Update sync status to failed
      await client
        .from('youtube_channels')
        .update({
          sync_status: 'failed',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', channel.id);

      results.push({
        channel_id: channel.id,
        channel_name: channel.channel_name || channel.yt_channel_id,
        status: 'error',
        records_synced: 0,
        error: errorMessage,
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
    synced_at: new Date().toISOString(),
  });
}
