import channelConfig from '@/channel-config.json';

// YouTube Data API v3 configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeAPIResponse {
  items: any[];
  nextPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface ChannelData {
  id: string;
  name: string;
  thumbnail: string;
  customUrl: string;
  description: string;
  publishedAt: string;
  country: string;
  stats: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
}

interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  stats: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

// Fetch channel data from YouTube API
async function fetchChannelData(channelId: string): Promise<ChannelData | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API Key not configured');
    return null;
  }

  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      return null;
    }

    const data: YouTubeAPIResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      name: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      customUrl: item.snippet.customUrl || '',
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt,
      country: item.snippet.country || '',
      stats: {
        viewCount: item.statistics.viewCount || '0',
        subscriberCount: item.statistics.subscriberCount || '0',
        videoCount: item.statistics.videoCount || '0',
      },
    };
  } catch (error) {
    console.error('Failed to fetch channel data:', error);
    return null;
  }
}

// Fetch multiple channels data
async function fetchChannelsData(channelIds: string[]): Promise<ChannelData[]> {
  const results: ChannelData[] = [];
  
  // YouTube API allows max 50 IDs per request
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const ids = batch.join(',');
    
    try {
      const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`YouTube API error: ${response.status}`);
        continue;
      }

      const data: YouTubeAPIResponse = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          results.push({
            id: item.id,
            name: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            customUrl: item.snippet.customUrl || '',
            description: item.snippet.description || '',
            publishedAt: item.snippet.publishedAt,
            country: item.snippet.country || '',
            stats: {
              viewCount: item.statistics.viewCount || '0',
              subscriberCount: item.statistics.subscriberCount || '0',
              videoCount: item.statistics.videoCount || '0',
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch batch channels:', error);
    }
  }
  
  return results;
}

// Fetch video list for a channel
async function fetchChannelVideos(channelId: string, maxResults: number = 50): Promise<VideoData[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  try {
    // First get uploads playlist ID
    const channelUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelResponse = await fetch(channelUrl);
    
    if (!channelResponse.ok) {
      return [];
    }

    const channelData: YouTubeAPIResponse = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      return [];
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Then fetch videos from uploads playlist
    const videosUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    
    if (!videosResponse.ok) {
      return [];
    }

    const videosData: YouTubeAPIResponse = await videosResponse.json();
    
    if (!videosData.items || videosData.items.length === 0) {
      return [];
    }

    // Get video IDs for statistics
    const videoIds = videosData.items.map(item => item.contentDetails.videoId).join(',');
    const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const statsResponse = await fetch(statsUrl);
    
    const statsData: YouTubeAPIResponse = await statsResponse.json();
    const statsMap = new Map<string, any>();
    
    if (statsData.items) {
      for (const item of statsData.items) {
        statsMap.set(item.id, item.statistics);
      }
    }

    return videosData.items.map(item => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      duration: '', // Duration requires separate API call
      stats: {
        viewCount: statsMap.get(item.contentDetails.videoId)?.viewCount || '0',
        likeCount: statsMap.get(item.contentDetails.videoId)?.likeCount || '0',
        commentCount: statsMap.get(item.contentDetails.videoId)?.commentCount || '0',
      },
    }));
  } catch (error) {
    console.error('Failed to fetch channel videos:', error);
    return [];
  }
}

// Get all configured channels with their data
export async function getAllChannels(): Promise<any[]> {
  const channelIds = channelConfig.channels.map(ch => ch.id);
  const youtubeData = await fetchChannelsData(channelIds);
  
  // Merge with config data
  return channelConfig.channels.map(config => {
    const ytData = youtubeData.find(yt => yt.id === config.id);
    return {
      id: config.id,
      name: ytData?.name || config.name,
      thumbnail: ytData?.thumbnail || '',
      operator: config.operator,
      group: config.group,
      language: config.language,
      tags: config.tags,
      status: config.status,
      viewCount: ytData?.stats.viewCount || '0',
      subscriberCount: ytData?.stats.subscriberCount || '0',
      videoCount: ytData?.stats.videoCount || '0',
      publishedAt: ytData?.publishedAt || '',
      country: ytData?.country || '',
    };
  });
}

// Get single channel detail
export async function getChannelDetail(channelId: string): Promise<any> {
  const config = channelConfig.channels.find(ch => ch.id === channelId);
  const ytData = await fetchChannelData(channelId);
  
  if (!ytData) {
    return null;
  }

  return {
    id: channelId,
    name: ytData.name,
    thumbnail: ytData.thumbnail,
    customUrl: ytData.customUrl,
    description: ytData.description,
    publishedAt: ytData.publishedAt,
    country: ytData.country,
    operator: config?.operator || '',
    group: config?.group || '',
    language: config?.language || '',
    tags: config?.tags || [],
    status: config?.status || 'normal',
    viewCount: ytData.stats.viewCount,
    subscriberCount: ytData.stats.subscriberCount,
    videoCount: ytData.stats.videoCount,
  };
}

// Get channel videos
export async function getChannelVideos(channelId: string): Promise<any[]> {
  return await fetchChannelVideos(channelId);
}

export { channelConfig };
