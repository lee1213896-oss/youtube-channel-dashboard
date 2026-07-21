'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  thumbnail: string;
  operator: string;
  group: string;
  language: string;
  tags: string[];
  status: string;
  viewCount: string;
  subscriberCount: string;
  videoCount: string;
  publishedAt: string;
  country: string;
}

const statusLabels: Record<string, string> = {
  normal: '正常运营',
  cold_start: '冷启中',
  paused: '暂停',
  abandoned: '废弃',
};

const statusColors: Record<string, string> = {
  normal: 'bg-green-500/10 text-green-400 border-green-500/20',
  cold_start: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paused: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  abandoned: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseInt(num) || 0 : num;
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

export default function DashboardPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('search', keyword);
      if (filterGroup) params.set('group', filterGroup);
      if (filterLanguage) params.set('language', filterLanguage);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/channels?${params}`);
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, filterGroup, filterLanguage, filterStatus]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const totalViews = channels.reduce((sum, ch) => sum + (parseInt(ch.viewCount) || 0), 0);
  const totalSubscribers = channels.reduce((sum, ch) => sum + (parseInt(ch.subscriberCount) || 0), 0);
  const totalVideos = channels.reduce((sum, ch) => sum + (parseInt(ch.videoCount) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据总览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            YouTube 频道数据监控与分析
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={() => window.open('/api/export', '_blank')}
        >
          <Download className="h-4 w-4 mr-2" />
          导出 Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">频道总数</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{channels.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">总播放量</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{formatNumber(totalViews)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">总订阅数</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{formatNumber(totalSubscribers)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">总视频数</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{formatNumber(totalVideos)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索频道名称或运营人员..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部分组</SelectItem>
                <SelectItem value="自营">自营</SelectItem>
                <SelectItem value="代理">代理</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="语种" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部语种</SelectItem>
                <SelectItem value="英语">英语</SelectItem>
                <SelectItem value="西班牙语">西班牙语</SelectItem>
                <SelectItem value="葡萄牙语">葡萄牙语</SelectItem>
                <SelectItem value="阿拉伯语">阿拉伯语</SelectItem>
                <SelectItem value="印尼语">印尼语</SelectItem>
                <SelectItem value="泰语">泰语</SelectItem>
                <SelectItem value="越南语">越南语</SelectItem>
                <SelectItem value="日语">日语</SelectItem>
                <SelectItem value="韩语">韩语</SelectItem>
                <SelectItem value="法语">法语</SelectItem>
                <SelectItem value="德语">德语</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                <SelectItem value="normal">正常运营</SelectItem>
                <SelectItem value="cold_start">冷启中</SelectItem>
                <SelectItem value="paused">暂停</SelectItem>
                <SelectItem value="abandoned">废弃</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Channel Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Eye className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">暂无频道数据</p>
              <p className="text-xs mt-1">请配置 YOUTUBE_API_KEY 环境变量并添加频道到 channel-config.json</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[300px]">频道</TableHead>
                  <TableHead>运营人员</TableHead>
                  <TableHead>分组</TableHead>
                  <TableHead>语种</TableHead>
                  <TableHead className="text-right">播放量</TableHead>
                  <TableHead className="text-right">订阅数</TableHead>
                  <TableHead className="text-right">视频数</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow
                    key={channel.id}
                    className="border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => window.location.href = `/channels/${channel.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {channel.thumbnail && (
                          <img
                            src={channel.thumbnail}
                            alt={channel.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{channel.name}</div>
                          <div className="text-xs text-muted-foreground">{channel.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{channel.operator || '-'}</TableCell>
                    <TableCell>
                      {channel.group && (
                        <Badge variant="outline" className="border-border">
                          {channel.group}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{channel.language || '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(channel.viewCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(channel.subscriberCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(channel.videoCount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[channel.status] || statusColors.normal}
                      >
                        {statusLabels[channel.status] || channel.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
