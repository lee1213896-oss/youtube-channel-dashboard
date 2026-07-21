'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Film,
  Tag,
  Settings,
  Youtube,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '数据总览', icon: BarChart3 },
  { href: '/analysis', label: '对比分析', icon: Film },
  { href: '/tags', label: '标签聚合', icon: Tag },
  { href: '/config', label: '频道配置', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Youtube className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold tracking-tight">YT 数据看板</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          数据更新: 2026-07-21 08:00
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          数据延迟 T+1~T+2
        </p>
      </div>
    </aside>
  );
}
