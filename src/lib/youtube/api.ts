// YouTube OAuth2 & Data API integration service

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

export interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  publishedAt: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

export interface YouTubeAnalyticsRow {
  date: string;
  views: number;
  estimatedRevenue: number;
  subscribersGained: number;
  subscribersLost: number;
  watchTimeMinutes: number;
  averageViewDuration: number;
  likes: number;
  comments: number;
  shares: number;
}

// Generate the OAuth2 authorization URL
export function generateAuthUrl(credentials: OAuthCredentials, state?: string): string {
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    redirect_uri: credentials.redirect_uri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  if (state) params.set('state', state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  credentials: OAuthCredentials
): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: credentials.redirect_uri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Refresh an expired access token
export async function refreshAccessToken(
  refreshToken: string,
  credentials: OAuthCredentials
): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  // Refresh response doesn't include a new refresh_token
  return { ...data, refresh_token: refreshToken };
}

// Get channel info from YouTube Data API
export async function getChannelInfo(
  accessToken: string,
  channelId?: string,
  mine: boolean = false
): Promise<YouTubeChannelInfo[]> {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
  });
  if (mine) {
    params.set('mine', 'true');
  } else if (channelId) {
    params.set('id', channelId);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.items || []).map((item: any) => ({
    id: item.id as string,
    title: item.snippet?.title || '',
    thumbnail: item.snippet?.thumbnails?.default?.url || '',
    subscriberCount: parseInt(item.statistics?.subscriberCount || '0'),
    viewCount: parseInt(item.statistics?.viewCount || '0'),
    videoCount: parseInt(item.statistics?.videoCount || '0'),
    publishedAt: item.snippet?.publishedAt || '',
  }));
}

// Get videos from a channel
export async function getChannelVideos(
  accessToken: string,
  channelId: string,
  maxResults: number = 50,
  pageToken?: string
): Promise<{ videos: YouTubeVideoInfo[]; nextPageToken?: string }> {
  // First get the uploads playlist ID
  const chParams = new URLSearchParams({
    part: 'contentDetails',
    id: channelId,
  });
  const chResponse = await fetch(`${YOUTUBE_API_BASE}/channels?${chParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!chResponse.ok) {
    throw new Error(`Failed to get channel: ${chResponse.statusText}`);
  }
  const chData = await chResponse.json();
  const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    return { videos: [] };
  }

  // Then get videos from the uploads playlist
  const plParams = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  });
  if (pageToken) plParams.set('pageToken', pageToken);

  const plResponse = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${plParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!plResponse.ok) {
    throw new Error(`Failed to get videos: ${plResponse.statusText}`);
  }
  const plData = await plResponse.json();

  const videoIds = (plData.items || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean)
    .join(',');

  if (!videoIds) return { videos: [], nextPageToken: plData.nextPageToken };

  // Get video statistics
  const vidParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds,
  });
  const vidResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${vidParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!vidResponse.ok) {
    throw new Error(`Failed to get video stats: ${vidResponse.statusText}`);
  }
  const vidData = await vidResponse.json();

  const videos: YouTubeVideoInfo[] = (vidData.items || []).map((item: any) => ({
    id: item.id as string,
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
    viewCount: parseInt(item.statistics?.viewCount || '0'),
    likeCount: parseInt(item.statistics?.likeCount || '0'),
    commentCount: parseInt(item.statistics?.commentCount || '0'),
    duration: item.contentDetails?.duration || '',
  }));

  return { videos, nextPageToken: plData.nextPageToken };
}

// Get analytics data for a channel
export async function getChannelAnalytics(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
): Promise<YouTubeAnalyticsRow[]> {
  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: 'views,estimatedRevenue,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration,likes,comments,shares',
    dimensions: 'day',
    sort: 'day',
  });

  const response = await fetch(`${YOUTUBE_ANALYTICS_BASE}/reports?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube Analytics API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const rows = data.rows || [];

  return rows.map((row: (string | number)[]) => ({
    date: row[0] as string,
    views: Number(row[1]),
    estimatedRevenue: Number(row[2]),
    subscribersGained: Number(row[3]),
    subscribersLost: Number(row[4]),
    watchTimeMinutes: Number(row[5]),
    averageViewDuration: Number(row[6]),
    likes: Number(row[7]),
    comments: Number(row[8]),
    shares: Number(row[9]),
  }));
}

// Validate credentials by testing a simple API call
export async function validateCredentials(
  client_id: string,
  client_secret: string
): Promise<boolean> {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: 'client_credentials',
      }),
    });
    // client_credentials grant type may fail but we just check if the credentials are recognized
    const text = await response.text();
    // If we get "invalid_client" it means credentials are wrong
    return !text.includes('invalid_client');
  } catch {
    return false;
  }
}
