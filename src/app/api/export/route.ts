import { NextRequest, NextResponse } from 'next/server';
import { getAllChannels } from '@/lib/youtube/api';
import * as XLSX from 'xlsx';

// GET: Export channel data to Excel
export async function GET(request: NextRequest) {
  try {
    const channels = await getAllChannels();
    
    // Prepare data for Excel
    const excelData = channels.map(ch => ({
      '频道 ID': ch.id,
      '频道名称': ch.name,
      '运营人员': ch.operator || '',
      '分组': ch.group || '',
      '语种': ch.language || '',
      '标签': ch.tags?.join(', ') || '',
      '状态': ch.status || '',
      '播放量': parseInt(ch.viewCount || '0'),
      '订阅数': parseInt(ch.subscriberCount || '0'),
      '视频数': parseInt(ch.videoCount || '0'),
      '国家': ch.country || '',
      '创建时间': ch.publishedAt || '',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, '频道数据');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=channel-data.xlsx',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
