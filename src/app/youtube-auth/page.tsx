'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Key,
  Link2,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';

interface Credential {
  id: string;
  client_id: string;
  redirect_uri: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface YouTubeChannel {
  id: string;
  credential_id: string;
  yt_channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  token_expires_at: string | null;
  operator: string | null;
  group_name: string | null;
  language: string | null;
  tags: string[] | null;
  status: string;
  remark: string | null;
  last_synced_at: string | null;
  sync_status: string;
  is_active: boolean;
  created_at: string;
}

export default function YouTubeAuthPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [showEditChannel, setShowEditChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState<YouTubeChannel | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New credential form
  const [newCredName, setNewCredName] = useState('');
  const [newCredClientId, setNewCredClientId] = useState('');
  const [newCredClientSecret, setNewCredClientSecret] = useState('');
  const [newCredRedirectUri, setNewCredRedirectUri] = useState('');

  // Edit channel form
  const [editOperator, setEditOperator] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    fetchData();
    // Check for success/error from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      setMessage({ type: 'success', text: success });
    } else if (error) {
      setMessage({ type: 'error', text: error });
    }
    // Clean up URL params
    if (success || error) {
      window.history.replaceState({}, '', '/youtube-auth');
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [credRes, chRes] = await Promise.all([
        fetch('/api/youtube/credentials'),
        fetch('/api/youtube/channels'),
      ]);
      const credData = await credRes.json();
      const chData = await chRes.json();
      setCredentials(credData.credentials || []);
      setChannels(chData.channels || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: '加载数据失败，请刷新页面重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    // Redirect to Google auth page using environment credentials
    window.location.href = '/api/youtube/auth?credential_id=env';
  };

  const addCredential = async () => {
    if (!newCredClientId || !newCredClientSecret || !newCredRedirectUri) return;
    const res = await fetch('/api/youtube/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: newCredClientId,
        client_secret: newCredClientSecret,
        redirect_uri: newCredRedirectUri,
        name: newCredName || 'Default',
      }),
    });
    if (res.ok) {
      setShowAddCredential(false);
      setNewCredName('');
      setNewCredClientId('');
      setNewCredClientSecret('');
      setNewCredRedirectUri('');
      fetchData();
    }
  };

  const startAuth = async (credentialId: string) => {
    const res = await fetch('/api/youtube/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential_id: credentialId }),
    });
    const data = await res.json();
    if (data.auth_url) {
      window.open(data.auth_url, '_blank', 'width=600,height=700');
    }
  };

  const syncChannel = async (channelId?: string) => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch('/api/youtube/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, start_date: '2026-07-01' }),
    });
    const data = await res.json();
    if (data.success) {
      const successCount = data.results.filter((r: { status: string }) => r.status === 'success').length;
      const failCount = data.results.filter((r: { status: string }) => r.status === 'error').length;
      setSyncResult(`Sync completed: ${successCount} success, ${failCount} failed`);
    } else {
      setSyncResult(`Sync failed: ${data.error}`);
    }
    setSyncing(false);
    fetchData();
  };

  const removeChannel = async (channelId: string) => {
    await fetch(`/api/youtube/channels/${channelId}`, { method: 'DELETE' });
    fetchData();
  };

  const openEditChannel = (channel: YouTubeChannel) => {
    setEditingChannel(channel);
    setEditOperator(channel.operator || '');
    setEditGroup(channel.group_name || '');
    setEditLanguage(channel.language || '');
    setEditStatus(channel.status || 'normal');
    setEditRemark(channel.remark || '');
    setShowEditChannel(true);
  };

  const saveChannelEdit = async () => {
    if (!editingChannel) return;
    await fetch(`/api/youtube/channels/${editingChannel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator: editOperator || null,
        group_name: editGroup || null,
        language: editLanguage || null,
        status: editStatus,
        remark: editRemark || null,
      }),
    });
    setShowEditChannel(false);
    setEditingChannel(null);
    fetchData();
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'authorized': return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">YouTube 频道授权</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理 OAuth 凭据，授权 YouTube 频道，同步频道数据
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => syncChannel()}
            disabled={syncing || channels.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '全量同步'}
          </Button>
        </div>
      </div>

      {message && (
        <Card className={`border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="p-3 flex items-center justify-between">
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
            <button onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {syncResult && (
        <Card className="bg-card border-border border-green-500/30">
          <CardContent className="p-3">
            <p className="text-sm text-green-400">{syncResult}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="channels">
            <Link2 className="h-4 w-4 mr-2" /> 已授权频道 ({channels.length})
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Key className="h-4 w-4 mr-2" /> OAuth 凭据 ({credentials.length})
          </TabsTrigger>
          <TabsTrigger value="guide">
            配置指南
          </TabsTrigger>
        </TabsList>

        {/* Authorized Channels Tab */}
        <TabsContent value="channels">
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleAuthorize}
              disabled={credentials.length === 0 || authorizing}
              className="bg-[#ff4444] hover:bg-[#ff5555] text-white"
            >
              {authorizing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  跳转授权中...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  授权频道
                </>
              )}
            </Button>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Link2 className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm mb-1">暂无授权频道</p>
                  <p className="text-xs mb-4">点击下方按钮授权 YouTube 频道</p>
                  <Button
                    onClick={handleAuthorize}
                    disabled={authorizing}
                    className="bg-[#ff4444] hover:bg-[#ff5555] text-white"
                  >
                    {authorizing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        跳转授权中...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        授权频道
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">频道</TableHead>
                      <TableHead className="text-muted-foreground">频道 ID</TableHead>
                      <TableHead className="text-muted-foreground">运营人员</TableHead>
                      <TableHead className="text-muted-foreground">分组</TableHead>
                      <TableHead className="text-muted-foreground">语种</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">同步状态</TableHead>
                      <TableHead className="text-muted-foreground">Token</TableHead>
                      <TableHead className="text-muted-foreground text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map(ch => (
                      <TableRow key={ch.id} className="border-border hover:bg-accent/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ch.channel_thumbnail && (
                              <img src={ch.channel_thumbnail} alt="" className="h-6 w-6 rounded-full" />
                            )}
                            <span className="text-sm font-medium">{ch.channel_name || ch.yt_channel_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{ch.yt_channel_id}</TableCell>
                        <TableCell className="text-sm">{ch.operator || '-'}</TableCell>
                        <TableCell className="text-sm">{ch.group_name || '-'}</TableCell>
                        <TableCell className="text-sm">{ch.language || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${
                            ch.status === 'normal' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            ch.status === 'cold_start' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {ch.status === 'normal' ? '正常' : ch.status === 'cold_start' ? '冷启中' : ch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getSyncStatusIcon(ch.sync_status)}
                            <span className="text-xs text-muted-foreground">
                              {ch.last_synced_at
                                ? new Date(ch.last_synced_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : '未同步'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isTokenExpired(ch.token_expires_at) ? (
                            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">已过期</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">有效</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => syncChannel(ch.id)} disabled={syncing}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditChannel(ch)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-red-400" onClick={() => removeChannel(ch.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials">
          <div className="flex justify-end mb-4">
            <Dialog open={showAddCredential} onOpenChange={setShowAddCredential}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> 添加凭据
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle>添加 Google OAuth 凭据</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    在 Google Cloud Console 创建 OAuth 2.0 客户端 ID，获取凭据信息
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-muted-foreground">凭据名称</label>
                    <Input
                      value={newCredName}
                      onChange={(e) => setNewCredName(e.target.value)}
                      placeholder="如: YouTube 数据看板"
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Client ID</label>
                    <Input
                      value={newCredClientId}
                      onChange={(e) => setNewCredClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="bg-secondary border-border mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Client Secret</label>
                    <Input
                      type="password"
                      value={newCredClientSecret}
                      onChange={(e) => setNewCredClientSecret(e.target.value)}
                      placeholder="GOCSPX-xxxx"
                      className="bg-secondary border-border mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Redirect URI</label>
                    <Input
                      value={newCredRedirectUri}
                      onChange={(e) => setNewCredRedirectUri(e.target.value)}
                      placeholder="https://your-domain.com/api/youtube/callback"
                      className="bg-secondary border-border mt-1 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      请确保此 URI 已在 Google Cloud Console 中配置
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowAddCredential(false)} className="border-border">取消</Button>
                    <Button onClick={addCredential} disabled={!newCredClientId || !newCredClientSecret || !newCredRedirectUri}>
                      保存凭据
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Key className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">暂无 OAuth 凭据</p>
                  <p className="text-xs mt-1">请先添加 Google OAuth 2.0 客户端凭据</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">名称</TableHead>
                      <TableHead className="text-muted-foreground">Client ID</TableHead>
                      <TableHead className="text-muted-foreground">Redirect URI</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">创建时间</TableHead>
                      <TableHead className="text-muted-foreground text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map(cred => (
                      <TableRow key={cred.id} className="border-border hover:bg-accent/30">
                        <TableCell className="text-sm font-medium">{cred.name}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {cred.client_id.slice(0, 20)}...
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {cred.redirect_uri}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${cred.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {cred.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(cred.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => startAuth(cred.id)}>
                            <Link2 className="h-3.5 w-3.5 mr-1" /> 授权频道
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">YouTube Data API 配置指南</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">1</span>
                      创建 Google Cloud 项目
                    </h4>
                    <p>前往 <span className="text-foreground">Google Cloud Console</span>，创建新项目或选择已有项目。</p>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">2</span>
                      启用 YouTube Data API v3
                    </h4>
                    <p>在「API 和服务」&gt;「库」中搜索并启用以下 API：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>YouTube Data API v3</li>
                      <li>YouTube Analytics API</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">3</span>
                      配置 OAuth 同意屏幕
                    </h4>
                    <p>在「API 和服务」&gt;「OAuth 同意屏幕」中配置应用信息。选择「外部」用户类型，添加测试用户（即需要授权的 YouTube 频道所有者账号）。</p>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">4</span>
                      创建 OAuth 2.0 客户端 ID
                    </h4>
                    <p>在「API 和服务」&gt;「凭据」中创建 OAuth 客户端 ID：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>应用类型选择「Web 应用」</li>
                      <li>添加授权重定向 URI（本应用的回调地址）</li>
                      <li>记录 Client ID 和 Client Secret</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">5</span>
                      在本系统中添加凭据
                    </h4>
                    <p>将 Client ID、Client Secret 和 Redirect URI 填入「OAuth 凭据」标签页中，然后点击「授权频道」开始 OAuth 授权流程。</p>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-4 space-y-2">
                    <h4 className="text-foreground font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">6</span>
                      授权频道并同步数据
                    </h4>
                    <p>每个 YouTube 频道需要单独授权。授权后，点击「同步」按钮拉取频道数据（默认从 2026-07-01 开始）。YouTube 数据存在 T+1~T+2 延迟，收益数据通常 T+2。</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  注意事项
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>YouTube API 有每日配额限制（默认 10,000 units），同步操作会消耗配额</li>
                  <li>Access Token 有效期约 1 小时，系统会自动使用 Refresh Token 刷新</li>
                  <li>如果 Refresh Token 失效，需要重新授权频道</li>
                  <li>建议定期同步数据（每日 1-2 次），避免超出 API 配额</li>
                  <li>OAuth 同意屏幕处于「测试」模式时，Token 有效期为 7 天，需定期刷新</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Channel Dialog */}
      <Dialog open={showEditChannel} onOpenChange={setShowEditChannel}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>编辑频道配置 - {editingChannel?.channel_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground">运营人员</label>
              <Input
                value={editOperator}
                onChange={(e) => setEditOperator(e.target.value)}
                className="bg-secondary border-border mt-1"
                placeholder="输入运营人员名称"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">分组</label>
              <Select value={editGroup} onValueChange={setEditGroup}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="选择分组" />
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
              <Select value={editLanguage} onValueChange={setEditLanguage}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="选择语种" />
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
              <Select value={editStatus} onValueChange={setEditStatus}>
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
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                className="bg-secondary border-border mt-1"
                placeholder="输入备注..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditChannel(false)} className="border-border">取消</Button>
              <Button onClick={saveChannelEdit}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
