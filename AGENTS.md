# AGENTS.md

## 项目概览
YouTube 频道数据看板 - 海外短剧运营部门频道数据监控与分析平台

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript 5
- shadcn/ui + Tailwind CSS 4
- Recharts (图表)
- XLSX (Excel 导出)
- Supabase (数据库 - YouTube 授权数据存储)

## 目录结构
```
src/
├── app/
│   ├── page.tsx              # 数据总览（频道列表）
│   ├── channels/[id]/page.tsx # 频道详情（趋势图+视频列表）
│   ├── analysis/page.tsx     # 对比分析（时间范围+环比同比）
│   ├── tags/page.tsx         # 标签聚合查询
│   ├── config/page.tsx       # 频道配置管理
│   ├── youtube-auth/page.tsx # YouTube 频道授权管理
│   └── api/
│       ├── channels/route.ts          # 频道列表 API（合并 Mock + YouTube 真实数据）
│       ├── channels/[id]/route.ts     # 频道详情/更新 API
│       ├── channels/[id]/videos/route.ts # 视频列表 API
│       ├── analysis/route.ts          # 对比分析 API
│       ├── tags/route.ts              # 标签聚合 API
│       ├── export/route.ts            # Excel 导出 API
│       └── youtube/
│           ├── credentials/route.ts   # OAuth 凭据管理
│           ├── auth/route.ts          # 生成授权 URL
│           ├── callback/route.ts      # OAuth 回调处理
│           ├── channels/route.ts      # 已授权频道列表
│           ├── channels/[id]/route.ts # 频道配置更新/删除
│           └── sync/route.ts          # YouTube API 数据同步
├── components/
│   ├── sidebar-nav.tsx       # 侧边导航
│   └── ui/                   # shadcn/ui 组件
├── lib/
│   ├── types.ts              # 类型定义
│   ├── mock-data.ts          # Mock 数据（66个频道）
│   ├── format.ts             # 数字格式化工具
│   └── youtube/
│       └── api.ts            # YouTube Data API 集成服务
└── storage/
    └── database/
        ├── supabase-client.ts # Supabase 客户端
        └── shared/schema.ts   # 数据库 Schema
```

## 开发命令
- 开发: `pnpm dev`
- 构建: `pnpm build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`

## 核心功能
1. **数据总览**: 66个频道核心指标列表，支持筛选/排序/分页/日期切换
2. **对比分析**: 自定义时间范围 + 环比/同比对比 + 趋势图表
3. **标签聚合**: 多选标签聚合查询 + 预置标签组合快捷入口
4. **频道配置**: 单个/批量编辑频道属性（运营人员/分组/语种/标签/状态）
5. **频道详情**: 趋势图表（播放量/收益/订阅）+ 视频列表 + 单视频趋势
6. **数据导出**: Excel 导出频道数据和配置
7. **YouTube 频道授权**: OAuth2 授权流程，通过 YouTube Data API 获取真实频道数据
   - 配置 Google OAuth 凭据（Client ID / Secret）
   - 授权 YouTube 频道（OAuth2 授权码流程）
   - 同步频道数据（播放量/收益/订阅等）
   - 自动 Token 刷新
   - 已授权频道数据与 Mock 数据合并展示

## 设计规范
- 暗色主题，YouTube 红 (#ff4444) 为强调色
- 数字使用 tabular-nums 对齐
- 详细设计规范见 DESIGN.md
