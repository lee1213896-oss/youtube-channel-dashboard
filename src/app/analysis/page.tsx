'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatNumber, formatCurrency, formatPercent } from '@/lib/format';

interface AnalysisData {
  totalViews: number;
  totalRevenue: number;
  avgDailyViews: number;
  avgDailyRevenue: number;
  totalSubChange: number;
  dailyTrend: { date: string; views: number; revenue: number }[];
}

export default function AnalysisPage() {
  const [startDate, setStartDate] = useState('2026-07-14');
  const [endDate, setEndDate] = useState('2026-07-20');
  const [compareMode, setCompareMode] = useState('');
  const [current, setCurrent] = useState<AnalysisData | null>(null);
  const [comparison, setComparison] = useState<AnalysisData | null>(null);
  const [channelCount, setChannelCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      startDate,
      endDate,
      compareMode,
    });
    const res = await fetch(`/api/analysis?${params}`);
    const data = await res.json();
    setCurrent(data.current);
    setComparison(data.comparison);
    setChannelCount(data.channelCount);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, compareMode]);

  const quickRanges = [
    { label: '今天', start: '2026-07-21', end: '2026-07-21' },
    { label: '昨天', start: '2026-07-20', end: '2026-07-20' },
    { label: '近7天', start: '2026-07-14', end: '2026-07-20' },
    { label: '近14天', start: '2026-07-07', end: '2026-07-20' },
    { label: '近30天', start: '2026-06-21', end: '2026-07-20' },
    { label: '本月', start: '2026-07-01', end: '2026-07-20' },
    { label: '上月', start: '2026-06-01', end: '2026-06-30' },
  ];

  const getChangeRate = (current: number, compare: number): number => {
    if (compare === 0) return 0;
    return (current - compare) / compare;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">对比分析</h1>
        <p className="text-sm text-muted-foreground mt-1">自定义时间范围，查看汇总数据与趋势对比</p>
      </div>

      {/* Time Range Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">快捷选择:</span>
            {quickRanges.map((r) => (
              <Button
                key={r.label}
                variant={startDate === r.start && endDate === r.end ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setStartDate(r.start); setEndDate(r.end); }}
                className={startDate === r.start && endDate === r.end ? 'bg-primary text-primary-foreground' : 'border-border'}
              >
                {r.label}
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-4">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40 bg-secondary border-border h-9"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40 bg-secondary border-border h-9"
              />
            </div>
            <Select value={compareMode} onValueChange={setCompareMode}>
              <SelectTrigger className="w-32 bg-secondary border-border h-9">
                <SelectValue placeholder="对比模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">不对比</SelectItem>
                <SelectItem value="mom">环比</SelectItem>
                <SelectItem value="yoy">同比</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : current ? (
        <>
          {/* Comparison Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">指标</TableHead>
                    <TableHead className="text-muted-foreground text-right">本期</TableHead>
                    {comparison && <TableHead className="text-muted-foreground text-right">对比期</TableHead>}
                    {comparison && <TableHead className="text-muted-foreground text-right">变化量</TableHead>}
                    {comparison && <TableHead className="text-muted-foreground text-right">变化率</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: '总播放量', cur: current.totalViews, comp: comparison?.totalViews, fmt: formatNumber },
                    { label: '总收益', cur: current.totalRevenue, comp: comparison?.totalRevenue, fmt: formatCurrency },
                    { label: '平均日播放量', cur: current.avgDailyViews, comp: comparison?.avgDailyViews, fmt: formatNumber },
                    { label: '平均日收益', cur: current.avgDailyRevenue, comp: comparison?.avgDailyRevenue, fmt: formatCurrency },
                    { label: '订阅净增长', cur: current.totalSubChange, comp: comparison?.totalSubChange, fmt: formatNumber },
                  ].map((row) => {
                    const change = row.comp != null ? row.cur - row.comp : null;
                    const rate = row.comp != null ? getChangeRate(row.cur, row.comp) : null;
                    return (
                      <TableRow key={row.label} className="border-border">
                        <TableCell className="text-sm font-medium">{row.label}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{row.fmt(row.cur)}</TableCell>
                        {comparison && <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.fmt(row.comp!)}</TableCell>}
                        {comparison && (
                          <TableCell className={`text-right tabular-nums text-sm ${change! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {change! >= 0 ? '+' : ''}{row.fmt(change!)}
                          </TableCell>
                        )}
                        {comparison && (
                          <TableCell className={`text-right tabular-nums text-sm ${rate! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(rate!)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">覆盖频道数: {channelCount}</p>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-4">日播放量趋势</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={current.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: number) => formatNumber(v)} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }} labelStyle={{ color: '#e4e4e7' }} />
                    <Line type="monotone" dataKey="views" stroke="#ff4444" strokeWidth={2} dot={false} name="播放量" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-4">日收益趋势 (USD)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={current.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '6px' }} labelStyle={{ color: '#e4e4e7' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '收益']} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="收益" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
