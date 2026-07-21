'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Edit, Search, Save, Upload } from 'lucide-react';

interface ChannelConfig {
  id: string;
  name: string;
  channelId: string;
  operator: string;
  group: string;
  language: string;
  tags: string[];
  status: string;
  remark: string;
}

const statusLabels: Record<string, string> = {
  normal: '正常运营',
  cold_start: '冷启中',
  paused: '暂停',
  abandoned: '废弃',
};

export default function ConfigPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChannelConfig>>({});
  const [batchField, setBatchField] = useState('');
  const [batchValue, setBatchValue] = useState('');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const res = await fetch('/api/channels?pageSize=100');
    const data = await res.json();
    setChannels(data.items.map((c: ChannelConfig & { trend?: unknown }) => ({
      id: c.id,
      name: c.name,
      channelId: c.channelId,
      operator: c.operator,
      group: c.group,
      language: c.language,
      tags: c.tags,
      status: c.status,
      remark: c.remark,
    })));
    setLoading(false);
  };

  const filtered = channels.filter(c => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return c.name.toLowerCase().includes(kw) || c.channelId.toLowerCase().includes(kw);
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const openEdit = (channel: ChannelConfig) => {
    setEditingChannel(channel);
    setEditForm({ ...channel });
  };

  const saveEdit = async () => {
    if (!editingChannel) return;
    await fetch(`/api/channels/${editingChannel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingChannel(null);
    fetchChannels();
  };

  const batchUpdate = async () => {
    if (selectedIds.size === 0 || !batchField || !batchValue) return;
    const updates: Record<string, unknown> = {};
    if (batchField === 'tags') {
      updates.tags = batchValue.split(',').map(t => t.trim());
    } else {
      updates[batchField] = batchValue;
    }

    await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch(`/api/channels/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )
    );
    setSelectedIds(new Set());
    setBatchField('');
    setBatchValue('');
    fetchChannels();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">频道配置</h1>
          <p className="text-sm text-muted-foreground mt-1">管理频道运营属性、批量编辑配置</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border" onClick={() => window.open('/api/export?type=config', '_blank')}>
            <Download className="mr-2 h-4 w-4" /> 导出配置
          </Button>
        </div>
      </div>

      {/* Batch Operations */}
      {selectedIds.size > 0 && (
        <Card className="bg-card border-border border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 个频道，批量设置:</span>
              <Select value={batchField} onValueChange={setBatchField}>
                <SelectTrigger className="w-32 bg-secondary border-border h-9">
                  <SelectValue placeholder="选择字段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">运营人员</SelectItem>
                  <SelectItem value="group">分组</SelectItem>
                  <SelectItem value="language">语种</SelectItem>
                  <SelectItem value="status">状态</SelectItem>
                  <SelectItem value="tags">标签</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={batchField === 'tags' ? '逗号分隔多个标签' : '输入值'}
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                className="w-48 bg-secondary border-border h-9"
              />
              <Button size="sm" onClick={batchUpdate} disabled={!batchField || !batchValue}>
                <Save className="mr-1 h-4 w-4" /> 应用
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                取消选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索频道名称/ID..."
              className="pl-8 w-64 bg-secondary border-border h-9"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
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
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">频道名称</TableHead>
                  <TableHead className="text-muted-foreground">频道ID</TableHead>
                  <TableHead className="text-muted-foreground">运营人员</TableHead>
                  <TableHead className="text-muted-foreground">分组</TableHead>
                  <TableHead className="text-muted-foreground">语种</TableHead>
                  <TableHead className="text-muted-foreground">标签</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">备注</TableHead>
                  <TableHead className="text-muted-foreground text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ch => (
                  <TableRow key={ch.id} className="border-border hover:bg-accent/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(ch.id)}
                        onCheckedChange={() => toggleSelect(ch.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{ch.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{ch.channelId}</TableCell>
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
                      <Badge className={`text-xs ${
                        ch.status === 'normal' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        ch.status === 'cold_start' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {statusLabels[ch.status] || ch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{ch.remark || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(ch)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingChannel} onOpenChange={(open) => !open && setEditingChannel(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>编辑频道配置 - {editingChannel?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground">运营人员</label>
              <Select
                value={editForm.operator || ''}
                onValueChange={(v) => setEditForm({ ...editForm, operator: v })}
              >
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['荘华', '金智慧', '王俊杰', '方柯', '袁宇婷', '周毓醒', '关佳慧', '莫春霞', '代运营A组', '代运营B组', '代运营C组', '代运营D组'].map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">分组</label>
              <Select
                value={editForm.group || ''}
                onValueChange={(v) => setEditForm({ ...editForm, group: v })}
              >
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="正职组">正职组</SelectItem>
                  <SelectItem value="实习生组">实习生组</SelectItem>
                  <SelectItem value="代运营组">代运营组</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">语种</label>
              <Select
                value={editForm.language || ''}
                onValueChange={(v) => setEditForm({ ...editForm, language: v })}
              >
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['英语', '西班牙语', '葡萄牙语', '印尼语', '日语', '韩语', '泰语', '越南语', '阿拉伯语', '法语', '中文'].map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">运营状态</label>
              <Select
                value={editForm.status || ''}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常运营</SelectItem>
                  <SelectItem value="cold_start">冷启中</SelectItem>
                  <SelectItem value="paused">暂停</SelectItem>
                  <SelectItem value="abandoned">废弃</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">备注</label>
              <Input
                value={editForm.remark || ''}
                onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                className="bg-secondary border-border mt-1"
                placeholder="输入备注..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingChannel(null)} className="border-border">取消</Button>
              <Button onClick={saveEdit}>
                <Save className="mr-1 h-4 w-4" /> 保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
