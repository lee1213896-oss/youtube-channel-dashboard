'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Filter } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/format';
import Link from 'next/link';

interface TagAggregate {
  tag: string;
  channelCount: number;
  totalDailyViews: number;
  totalDailyRevenue: number;
  avgDailyViews: number;
  avgDailyRevenue: number;
  totalSubscribers: number;
  dailySubChange: number;
  channels?: { id: string; name: string; dailyViews: number; dailyRevenue: number; subscribers: number }[];
}

const presetCombinations = [
  { label: '短剧频道', tags: ['短剧'] },
  { label: 'AI真人频道', tags: ['AI真人'] },
  { label: '动态漫频道', tags: ['动态漫'] },
  { label: '正常运营', tags: ['稳定运营'] },
  { label: '冷启中', tags: ['冷启中'] },
  { label: '正职运营频道', tags: ['重点频道'] },
  { label: '高收益频道', tags: ['高收益'] },
];

export default function TagsPage() {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagAggregates, setTagAggregates] = useState<TagAggregate[]>([]);
  const [selectedAggregate, setSelectedAggregate] = useState<TagAggregate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (selectedTags.length > 0) {
      fetchAggregate();
    } else {
      setSelectedAggregate(null);
    }
  }, [selectedTags]);

  const fetchTags = async () => {
    const res = await fetch('/api/tags');
    const data = await res.json();
    setAllTags(data.allTags);
    setTagAggregates(data.tags);
    setLoading(false);
  };

  const fetchAggregate = async () => {
    const res = await fetch(`/api/tags?tags=${selectedTags.join(',')}`);
    const data = await res.json();
    setSelectedAggregate(data.aggregate);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handlePreset = (tags: string[]) => {
    setSelectedTags(tags);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">标签聚合</h1>
        <p className="text-sm text-muted-foreground mt-1">基于标签维度查看聚合数据，满足灵活分析需求</p>
      </div>

      {/* Preset Combinations */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" /> 预置标签组合
          </p>
          <div className="flex flex-wrap gap-2">
            {presetCombinations.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  selectedTags.length === preset.tags.length &&
                  preset.tags.every(t => selectedTags.includes(t))
                    ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handlePreset(preset.tags)}
                className={
                  selectedTags.length === preset.tags.length &&
                  preset.tags.every(t => selectedTags.includes(t))
                    ? 'bg-primary text-primary-foreground' : 'border-border'
                }
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTags([])}
              className="text-muted-foreground"
            >
              清除选择
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">自定义标签选择（可多选）</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Aggregate */}
      {selectedAggregate && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">
                聚合结果: <span className="text-primary">{selectedAggregate.tag}</span>
              </h3>
              <Button variant="outline" size="sm" className="border-border" onClick={() => window.open('/api/export?type=channels', '_blank')}>
                <Download className="mr-2 h-4 w-4" /> 导出
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">匹配频道数</p>
                <p className="text-xl font-bold tabular-nums mt-1">{selectedAggregate.channelCount}</p>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">总日播放量</p>
                <p className="text-xl font-bold tabular-nums mt-1">{formatNumber(selectedAggregate.totalDailyViews)}</p>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">总日收益</p>
                <p className="text-xl font-bold tabular-nums mt-1 text-green-400">{formatCurrency(selectedAggregate.totalDailyRevenue)}</p>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">日订阅增长</p>
                <p className={`text-xl font-bold tabular-nums mt-1 ${selectedAggregate.dailySubChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedAggregate.dailySubChange >= 0 ? '+' : ''}{formatNumber(selectedAggregate.dailySubChange)}
                </p>
              </div>
            </div>
            {selectedAggregate.channels && selectedAggregate.channels.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">频道名称</TableHead>
                    <TableHead className="text-muted-foreground text-right">日播放量</TableHead>
                    <TableHead className="text-muted-foreground text-right">日收益</TableHead>
                    <TableHead className="text-muted-foreground text-right">订阅量</TableHead>
                    <TableHead className="text-muted-foreground text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAggregate.channels.map(ch => (
                    <TableRow key={ch.id} className="border-border hover:bg-accent/30">
                      <TableCell className="text-sm font-medium">{ch.name}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatNumber(ch.dailyViews)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-green-400">{formatCurrency(ch.dailyRevenue)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatNumber(ch.subscribers)}</TableCell>
                      <TableCell className="text-center">
                        <Link href={`/channels/${ch.id}`}>
                          <Button variant="ghost" size="sm" className="h-7">查看</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Tags Overview */}
      {!selectedAggregate && (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">标签</TableHead>
                  <TableHead className="text-muted-foreground text-right">频道数</TableHead>
                  <TableHead className="text-muted-foreground text-right">总日播放量</TableHead>
                  <TableHead className="text-muted-foreground text-right">总日收益</TableHead>
                  <TableHead className="text-muted-foreground text-right">平均日播放量</TableHead>
                  <TableHead className="text-muted-foreground text-right">平均日收益</TableHead>
                  <TableHead className="text-muted-foreground text-right">总订阅量</TableHead>
                  <TableHead className="text-muted-foreground text-right">日订阅增长</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagAggregates.map(tag => (
                  <TableRow
                    key={tag.tag}
                    className="border-border hover:bg-accent/30 cursor-pointer"
                    onClick={() => setSelectedTags([tag.tag])}
                  >
                    <TableCell>
                      <Badge variant="outline" className="border-border">{tag.tag}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{tag.channelCount}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatNumber(tag.totalDailyViews)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-green-400">{formatCurrency(tag.totalDailyRevenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatNumber(tag.avgDailyViews)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-green-400">{formatCurrency(tag.avgDailyRevenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatNumber(tag.totalSubscribers)}</TableCell>
                    <TableCell className={`text-right tabular-nums text-sm ${tag.dailySubChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tag.dailySubChange >= 0 ? '+' : ''}{formatNumber(tag.dailySubChange)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
