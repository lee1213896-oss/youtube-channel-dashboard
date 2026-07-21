export interface Channel {
  id: string;
  name: string;
  channelId: string;
  operator: string;
  group: string;
  language: string;
  tags: string[];
  status: 'normal' | 'cold_start' | 'paused' | 'abandoned';
  remark: string;
  dailyViews: number;
  dailyRevenue: number;
  totalWatchHours: number;
  subscribers: number;
  dailySubChange: number;
}

export interface DailyData {
  date: string;
  views: number;
  revenue: number;
  subscribers: number;
  subChange: number;
  watchHours: number;
}

export interface Video {
  id: string;
  videoId: string;
  title: string;
  channelId: string;
  publishedAt: string;
  dailyViews: number;
  dailyRevenue: number;
  totalViews: number;
  totalRevenue: number;
}

export interface VideoDailyData {
  date: string;
  views: number;
  revenue: number;
}

export interface TagAggregate {
  tag: string;
  channelCount: number;
  totalDailyViews: number;
  totalDailyRevenue: number;
  avgDailyViews: number;
  avgDailyRevenue: number;
  totalSubscribers: number;
  dailySubChange: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof Channel;
  direction: SortDirection;
}

export interface FilterConfig {
  operator: string;
  group: string;
  language: string;
  tag: string;
  status: string;
  keyword: string;
}
