'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Channel, DailyData, Video, VideoDailyData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatNumber, formatCurrency } from '@/lib/format';

export default function ChannelDetailPage() {
  const params = useParams();
  const channelId = params.id as string;
  const [channel, setChannel] = useState<Channel | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [videos, setVideos] = useState<(Video & { trend: VideoDailyData[] })[]>([]);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [chRes, vidRes] = await Promise.all([
        fetch(`/api/channels/${channelId}`),
        fetch(`/api/channels/${channelId}/videos`),
      ]);
      const chData = await chRes.json();
      const vidData = await vidRes.json();
      setChannel(chData.channel);
      setDailyData(chData.dailyData);
      setVideos(vidData.videos);
      setLoading(false);
    }
    fetchData();
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!channel) {
    return <div className="p-6 text-center text-muted-foreground">频道不存在</div>;
  }

  const recentData = dailyData.slice(-30);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{channel.name}</h1>
          <p className="text-sm text-muted-foreground">{channel.channelId} | {channel.operator} | {channel.language}</p>
        </div>
        <div className="flex gap-2">
          {channel.tags.map(tag => (
            <Badge key={tag} variant="outline" className="border-border text-muted-foreground">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">日播放量</p>
            <p className="text-xl font-bold tabular-nums mt-1">{formatNumber(channel.dailyViews)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">日收益</p>
            <p className="text-xl font-bold tabular-nums mt-1 text-green-400">{formatCurrency(channel.dailyRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">订阅量</p>
            <p className="text-xl font-bold tabular-nums mt-1">{formatNumber(channel.subscribers)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">日订阅增长</p>
            <p className={`text-xl font-bold tabular-nums mt-1 ${channel.dailySubChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.dailySubChange >= 0 ? '+' : ''}{formatNumber(channel.dailySubChange)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">累计播放时长</p>
            <p className="text-xl font-bold tabular-nums mt-1">{formatNumber(channel.totalWatchHours)}h</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="trends">趋势图表</TabsTrigger>
          <TabsTrigger value="videos">视频列表</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Views Trend */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-4">近30天播放量趋势</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={recentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v: number) => formatNumber(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#ff4444" strokeWidth={2} dot={false} name="播放量" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-4">近30天收益趋势 (USD)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={recentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '收益']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="收益" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sub Change */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-4">近30天订阅增长</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Bar dataKey="subChange" fill="#3b82f6" name="订阅增长" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">视频ID</TableHead>
                    <TableHead className="text-muted-foreground">标题</TableHead>
                    <TableHead className="text-muted-foreground">发布时间</TableHead>
                    <TableHead className="text-muted-foreground text-right">日播放量</TableHead>
                    <TableHead className="text-muted-foreground text-right">日收益</TableHead>
                    <TableHead className="text-muted-foreground text-right">累计播放</TableHead>
                    <TableHead className="text-muted-foreground text-right">累计收益</TableHead>
                    <TableHead className="text-muted-foreground text-center">趋势</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <>
                      <TableRow key={video.id} className="border-border hover:bg-accent/30">
                        <TableCell className="text-sm font-mono">{video.videoId}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{video.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{video.publishedAt}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{formatNumber(video.dailyViews)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-green-400">${video.dailyRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{formatNumber(video.totalViews)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-green-400">${video.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedVideo === video.id && (
                        <TableRow className="border-border">
                          <TableCell colSpan={8} className="bg-muted/20 p-4">
                            <ResponsiveContainer width="100%" height={150}>
                              <LineChart data={video.trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: number) => formatNumber(v)} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }}
                                  labelStyle={{ color: '#e4e4e7' }}
                                />
                                <Line type="monotone" dataKey="views" stroke="#ff4444" strokeWidth={1.5} dot={false} name="播放量" />
                              </LineChart>
                            </ResponsiveContainer>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
