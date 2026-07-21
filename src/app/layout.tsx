import type { Metadata } from 'next';
import './globals.css';
import { SidebarNav } from '@/components/sidebar-nav';

export const metadata: Metadata = {
  title: 'YouTube 频道数据看板',
  description: '海外短剧运营部门 YouTube 频道数据监控与分析平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
