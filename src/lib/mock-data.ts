import { Channel, DailyData, Video, VideoDailyData } from './types';

const operators = {
  fulltime: ['荘华', '金智慧', '王俊杰', '方柯'],
  intern: ['袁宇婷', '周毓醒', '关佳慧', '莫春霞', '李明', '张雪'],
  agency: ['代运营A组', '代运营B组', '代运营C组', '代运营D组'],
};

const languages = [
  '英语', '西班牙语', '葡萄牙语', '印尼语', '日语',
  '韩语', '泰语', '越南语', '阿拉伯语', '法语', '中文',
];

const groups = ['正职组', '实习生组', '代运营组'];

const statuses: Channel['status'][] = ['normal', 'cold_start', 'paused', 'abandoned'];

const tagPool = [
  '短剧', 'AI真人', '动态漫', '冷启中', '重点频道', '新频道', '废弃回捞',
  '高收益', '增长快', '稳定运营',
];

const channelNames = [
  'DramaFlix', 'ShortDrama TV', 'MiniSeries Hub', 'Drama Pulse', 'Reel Stories',
  'ClipMaster', 'StoryByte', 'MicroDrama', 'QuickTales', 'SnapSeries',
  'DramaWave', 'PlotTwist', 'SceneStealer', 'BingeClips', 'EpisodeX',
  'DramaNest', 'SeriesSpot', 'ClipVerse', 'StoryArc', 'MiniPlot',
  'ReelDrama', 'ShortFlix Pro', 'DramaLoop', 'ClipSaga', 'TaleReel',
  'SeriesPulse', 'PlotPoint', 'DramaByte', 'QuickSeries', 'MicroTales',
  'BingeWorthy', 'EpisodeHub', 'ClipDrama', 'StoryReel', 'SceneClip',
  'DramaShort', 'MiniSeries Plus', 'PlotReel', 'SnapDrama', 'QuickFlix',
  'TaleSpot', 'ReelSeries', 'ShortSaga', 'ClipTales', 'StorySnap',
  'DramaQuick', 'SeriesByte', 'MiniReel', 'PlotSnap', 'EpisodeShort',
  'BingeDrama', 'ClipSeries', 'TaleByte', 'ReelShort', 'StoryQuick',
  'DramaClip', 'ShortEpisode', 'MiniByte', 'PlotQuick', 'SnapTales',
  'SeriesSnap', 'ReelPlot', 'QuickByte', 'TaleShort', 'ByteDrama',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickTags(): string[] {
  const count = randInt(1, 3);
  const tags: string[] = [];
  for (let i = 0; i < count; i++) {
    const tag = pickRandom(tagPool);
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function generateChannels(): Channel[] {
  const channels: Channel[] = [];

  for (let i = 0; i < 66; i++) {
    let operator: string;
    let group: string;
    let status: Channel['status'];

    if (i < 28) {
      operator = operators.fulltime[i % operators.fulltime.length];
      group = '正职组';
      status = 'normal';
    } else if (i < 34) {
      operator = operators.fulltime[i % operators.fulltime.length];
      group = '正职组';
      status = 'cold_start';
    } else if (i < 42) {
      operator = operators.intern[i % operators.intern.length];
      group = '实习生组';
      status = i < 38 ? 'normal' : 'cold_start';
    } else {
      operator = operators.agency[i % operators.agency.length];
      group = '代运营组';
      status = i < 70 ? 'normal' : pickRandom(statuses);
    }

    const isDrama = i < 55;
    const isAI = i >= 55 && i < 62;
    const typeTag = isDrama ? '短剧' : isAI ? 'AI真人' : '动态漫';

    const tags = [typeTag, ...pickTags().filter(t => t !== typeTag)];

    const baseViews = randInt(5000, 500000);
    const baseRevenue = baseViews * (rand() * 0.005 + 0.001);

    channels.push({
      id: `ch_${i + 1}`,
      name: channelNames[i] || `Channel ${i + 1}`,
      channelId: `UC${String(i).padStart(4, '0')}XXXXXXXXXXXXXX`.slice(0, 24),
      operator,
      group,
      language: languages[i % languages.length],
      tags,
      status,
      remark: '',
      dailyViews: baseViews,
      dailyRevenue: Math.round(baseRevenue * 100) / 100,
      totalWatchHours: randInt(100000, 50000000),
      subscribers: randInt(10000, 2000000),
      dailySubChange: randInt(-500, 5000),
    });
  }

  return channels;
}

function generateDailyData(baseViews: number, days: number): DailyData[] {
  const data: DailyData[] = [];
  const now = new Date('2026-07-21');

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variation = 0.7 + rand() * 0.6;
    const views = Math.round(baseViews * variation);
    const revenue = Math.round(views * (rand() * 0.005 + 0.001) * 100) / 100;

    data.push({
      date: date.toISOString().split('T')[0],
      views,
      revenue,
      subscribers: randInt(10000, 2000000),
      subChange: randInt(-500, 5000),
      watchHours: Math.round(views * (rand() * 0.5 + 0.3) * 0.01),
    });
  }

  return data;
}

function generateVideos(channelId: string, count: number): Video[] {
  const videos: Video[] = [];
  const now = new Date('2026-07-21');

  for (let i = 0; i < count; i++) {
    const pubDate = new Date(now);
    pubDate.setDate(pubDate.getDate() - randInt(1, 365));
    const totalViews = randInt(1000, 5000000);
    const totalRevenue = Math.round(totalViews * (rand() * 0.005 + 0.001) * 100) / 100;

    videos.push({
      id: `vid_${channelId}_${i}`,
      videoId: `${String.fromCharCode(65 + (i % 26))}${randInt(100000, 999999)}`,
      title: `${pickRandom(['Episode', 'Ep', '第', 'Part '])}${randInt(1, 200)} - ${pickRandom(['The Beginning', 'New Life', 'Revenge', 'Love Story', 'Betrayal', 'Secret', 'Destiny', 'Return', 'Fight Back', 'Final Chapter'])}`,
      channelId,
      publishedAt: pubDate.toISOString().split('T')[0],
      dailyViews: randInt(100, 100000),
      dailyRevenue: Math.round(rand() * 500 * 100) / 100,
      totalViews,
      totalRevenue,
    });
  }

  return videos;
}

function generateVideoDailyData(baseViews: number, days: number): VideoDailyData[] {
  const data: VideoDailyData[] = [];
  const now = new Date('2026-07-21');

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const decay = Math.max(0.1, 1 - i * 0.02);
    const variation = 0.8 + rand() * 0.4;
    const views = Math.round(baseViews * decay * variation);
    const revenue = Math.round(views * (rand() * 0.004 + 0.001) * 100) / 100;

    data.push({
      date: date.toISOString().split('T')[0],
      views,
      revenue,
    });
  }

  return data;
}

export const channels = generateChannels();

export const channelDailyData: Record<string, DailyData[]> = {};
channels.forEach(ch => {
  channelDailyData[ch.id] = generateDailyData(ch.dailyViews, 90);
});

export const channelVideos: Record<string, Video[]> = {};
channels.forEach(ch => {
  const videoCount = randInt(5, 30);
  channelVideos[ch.id] = generateVideos(ch.id, videoCount);
});

export const videoDailyData: Record<string, VideoDailyData[]> = {};
Object.values(channelVideos).flat().forEach(v => {
  videoDailyData[v.id] = generateVideoDailyData(v.dailyViews, 30);
});

export const allTags = [...new Set(channels.flatMap(ch => ch.tags))].sort();

export const allOperators = [
  ...operators.fulltime,
  ...operators.intern,
  ...operators.agency,
];
