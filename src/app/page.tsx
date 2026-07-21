'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/lib/types';
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
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { formatNumber, formatCurrency } from '@/lib/format';

interface ChannelWithTrend extends Channel {
  trend: { date: string; views: number; revenue: number }[];
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

export default function DashboardPage() {
  const [channels, setChannels] = useState<ChannelWithTrend[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>('dailyViews');
  const [sortDir, setSortDir] = useState<string>('desc');
  const [selectedDate, setSelectedDate] = useState('2026-07-20');
  const [keyword, setKeyword] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      date: selectedDate,
      sortKey,
      sortDir,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (keyword) params.set('keyword', keyword);
    if (filterOperator) params.set('operator', filterOperator);
    if (filterGroup) params.set('group', filterGroup);
    if (filterLanguage) params.set('language', filterLanguage);
    if (filterStatus) params.set('status', filterStatus);
    if (filterTag) params.set('tag', filterTag);

    const res = await fetch(`/api/channels?${params}`);
    const data = await res.json();
    setChannels(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [selectedDate, sortKey, sortDir, page, pageSize, keyword, filterOperator, filterGroup, filterLanguage, filterStatus, filterTag]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-primary" />
      : <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    window.open('/api/export?type=channels', '_blank');
  };

  // Summary stats
  const totalViews = channels.reduce((s, c) => s + c.dailyViews, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.dailyRevenue, 0);
  const totalSubChange = channels.reduce((s, c) => s + c.dailySubChange, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据总览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            66 个频道 | 11 个语种 | 数据日期: {selectedDate}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          导出 Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">当日总播放量</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{formatNumber(totalViews)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">当日总收益 (USD)</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-green-400">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">日订阅净增长</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${totalSubChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalSubChange >= 0 ? '+' : ''}{formatNumber(totalSubChange)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">展示频道数</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索频道名称/ID..."
                className="pl-8 w-56 bg-secondary border-border h-9"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 bg-secondary border-border h-9"
            />
            <Select value={filterOperator} onValueChange={(v) => { setFilterOperator(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-32 bg-secondary border-border h-9">
                <SelectValue placeholder="运营人员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部人员</SelectItem>
                <SelectItem value="荘华">荘华</SelectItem>
                <SelectItem value="金智慧">金智慧</SelectItem>
                <SelectItem value="王俊杰">王俊杰</SelectItem>
                <SelectItem value="方柯">方柯</SelectItem>
                <SelectItem value="袁宇婷">袁宇婷</SelectItem>
                <SelectItem value="周毓醒">周毓醒</SelectItem>
                <SelectItem value="关佳慧">关佳慧</SelectItem>
                <SelectItem value="莫春霞">莫春霞</SelectItem>
                <SelectItem value="代运营A组">代运营A组</SelectItem>
                <SelectItem value="代运营B组">代运营B组</SelectItem>
                <SelectItem value="代运营C组">代运营C组</SelectItem>
                <SelectItem value="代运营D组">代运营D组</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterGroup} onValueChange={(v) => { setFilterGroup(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-28 bg-secondary border-border h-9">
                <SelectValue placeholder="分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分组</SelectItem>
                <SelectItem value="正职组">正职组</SelectItem>
                <SelectItem value="实习生组">实习生组</SelectItem>
                <SelectItem value="代运营组">代运营组</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={(v) => { setFilterLanguage(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-28 bg-secondary border-border h-9">
                <SelectValue placeholder="语种" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部语种</SelectItem>
                {['英语', '西班牙语', '葡萄牙语', '印尼语', '日语', '韩语', '泰语', '越南语', '阿拉伯语', '法语', '中文'].map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-28 bg-secondary border-border h-9">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="normal">正常运营</SelectItem>
                <SelectItem value="cold_start">冷启中</SelectItem>
                <SelectItem value="paused">暂停</SelectItem>
                <SelectItem value="abandoned">废弃</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={(v) => { setFilterTag(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-28 bg-secondary border-border h-9">
                <SelectValue placeholder="标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                <SelectItem value="短剧">短剧</SelectItem>
                <SelectItem value="AI真人">AI真人</SelectItem>
                <SelectItem value="动态漫">动态漫</SelectItem>
                <SelectItem value="冷启中">冷启中</SelectItem>
                <SelectItem value="重点频道">重点频道</SelectItem>
                <SelectItem value="新频道">新频道</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground w-8">#</TableHead>
                    <TableHead className="text-muted-foreground">频道名称</TableHead>
                    <TableHead className="text-muted-foreground">运营人员</TableHead>
                    <TableHead className="text-muted-foreground">分组</TableHead>
                    <TableHead className="text-muted-foreground">语种</TableHead>
                    <TableHead className="text-muted-foreground">标签</TableHead>
                    <TableHead className="text-muted-foreground">状态</TableHead>
                    <TableHead className="text-muted-foreground text-right cursor-pointer" onClick={() => handleSort('dailyViews')}>
                      <span className="flex items-center justify-end">日播放量<SortIcon columnKey="dailyViews" /></span>
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right cursor-pointer" onClick={() => handleSort('dailyRevenue')}>
                      <span className="flex items-center justify-end">日收益<SortIcon columnKey="dailyRevenue" /></span>
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right cursor-pointer" onClick={() => handleSort('subscribers')}>
                      <span className="flex items-center justify-end">订阅量<SortIcon columnKey="subscribers" /></span>
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right cursor-pointer" onClick={() => handleSort('dailySubChange')}>
                      <span className="flex items-center justify-end">日订阅增长<SortIcon columnKey="dailySubChange" /></span>
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((ch, idx) => (
                    <TableRow key={ch.id} className="border-border hover:bg-accent/30">
                      <TableCell className="text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{ch.name}</p>
                          <p className="text-xs text-muted-foreground">{ch.channelId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{ch.operator}</TableCell>
                      <TableCell className="text-sm">{ch.group}</TableCell>
                      <TableCell className="text-sm">{ch.language}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ch.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 border-border text-muted-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[ch.status]}`}>
                          {statusLabels[ch.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {formatNumber(ch.dailyViews)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-green-400">
                        ${ch.dailyRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(ch.subscribers)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums text-sm ${ch.dailySubChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ch.dailySubChange >= 0 ? '+' : ''}{formatNumber(ch.dailySubChange)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/channels/${ch.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            详情
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  共 {total} 条 | 第 {page}/{totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="border-border"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
