import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { channels } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'channels';

  let data: Record<string, unknown>[];
  let filename: string;

  if (type === 'channels') {
    filename = '频道数据.xlsx';
    data = channels.map(c => ({
      '频道名称': c.name,
      '频道ID': c.channelId,
      '运营人员': c.operator,
      '所属分组': c.group,
      '语种': c.language,
      '标签': c.tags.join(', '),
      '运营状态': c.status === 'normal' ? '正常运营' : c.status === 'cold_start' ? '冷启中' : c.status === 'paused' ? '暂停' : '废弃',
      '日播放量': c.dailyViews,
      '日收益(USD)': c.dailyRevenue,
      '累计播放时长(小时)': c.totalWatchHours,
      '订阅量': c.subscribers,
      '日订阅增长': c.dailySubChange,
    }));
  } else {
    filename = '频道配置.xlsx';
    data = channels.map(c => ({
      '频道名称': c.name,
      '频道ID': c.channelId,
      '运营人员': c.operator,
      '所属分组': c.group,
      '语种': c.language,
      '标签': c.tags.join(', '),
      '运营状态': c.status,
      '备注': c.remark,
    }));
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
