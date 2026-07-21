import { pgTable, serial, timestamp, varchar, text, integer, bigint, boolean, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// YouTube OAuth credentials (Google Cloud Console)
export const youtubeCredentials = pgTable(
  "youtube_credentials",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    client_id: varchar("client_id", { length: 255 }).notNull(),
    client_secret: varchar("client_secret", { length: 255 }).notNull(),
    redirect_uri: varchar("redirect_uri", { length: 500 }).notNull(),
    name: varchar("name", { length: 100 }).notNull().default("Default"),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_credentials_is_active_idx").on(table.is_active),
  ]
);

// Authorized YouTube channels with OAuth tokens
export const youtubeChannels = pgTable(
  "youtube_channels",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    credential_id: varchar("credential_id", { length: 36 }).notNull().references(() => youtubeCredentials.id, { onDelete: "cascade" }),
    yt_channel_id: varchar("yt_channel_id", { length: 100 }).notNull(),
    channel_name: varchar("channel_name", { length: 255 }),
    channel_thumbnail: text("channel_thumbnail"),
    access_token: text("access_token").notNull(),
    refresh_token: text("refresh_token").notNull(),
    token_expires_at: timestamp("token_expires_at", { withTimezone: true }),
    scope: varchar("scope", { length: 500 }),
    // Business config fields
    operator: varchar("operator", { length: 100 }),
    group_name: varchar("group_name", { length: 100 }),
    language: varchar("language", { length: 50 }),
    tags: jsonb("tags"),
    status: varchar("status", { length: 20 }).default("normal").notNull(),
    remark: text("remark"),
    // Sync status
    last_synced_at: timestamp("last_synced_at", { withTimezone: true }),
    sync_status: varchar("sync_status", { length: 20 }).default("pending"),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_channels_credential_id_idx").on(table.credential_id),
    index("youtube_channels_yt_channel_id_idx").on(table.yt_channel_id),
    index("youtube_channels_operator_idx").on(table.operator),
    index("youtube_channels_status_idx").on(table.status),
    index("youtube_channels_is_active_idx").on(table.is_active),
  ]
);

// Daily channel stats fetched from YouTube Analytics API
export const youtubeChannelStats = pgTable(
  "youtube_channel_stats",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    channel_id: varchar("channel_id", { length: 36 }).notNull().references(() => youtubeChannels.id, { onDelete: "cascade" }),
    yt_channel_id: varchar("yt_channel_id", { length: 100 }).notNull(),
    stat_date: varchar("stat_date", { length: 10 }).notNull(),
    views: integer("views").default(0).notNull(),
    estimated_revenue: varchar("estimated_revenue", { length: 50 }).default("0"),
    subscribers_gained: integer("subscribers_gained").default(0).notNull(),
    subscribers_lost: integer("subscribers_lost").default(0).notNull(),
    watch_time_minutes: varchar("watch_time_minutes", { length: 50 }).default("0"),
    average_view_duration: varchar("average_view_duration", { length: 50 }).default("0"),
    likes: integer("likes").default(0).notNull(),
    dislikes: integer("dislikes").default(0).notNull(),
    comments: integer("comments").default(0).notNull(),
    shares: integer("shares").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_channel_stats_channel_id_idx").on(table.channel_id),
    index("youtube_channel_stats_yt_channel_id_idx").on(table.yt_channel_id),
    index("youtube_channel_stats_stat_date_idx").on(table.stat_date),
    index("youtube_channel_stats_channel_date_idx").on(table.channel_id, table.stat_date),
  ]
);

// Video data fetched from YouTube API
export const youtubeVideos = pgTable(
  "youtube_videos",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    channel_id: varchar("channel_id", { length: 36 }).notNull().references(() => youtubeChannels.id, { onDelete: "cascade" }),
    yt_video_id: varchar("yt_video_id", { length: 50 }).notNull(),
    title: text("title"),
    description: text("description"),
    published_at: timestamp("published_at", { withTimezone: true }),
    thumbnail_url: text("thumbnail_url"),
    view_count: integer("view_count").default(0).notNull(),
    like_count: integer("like_count").default(0).notNull(),
    comment_count: integer("comment_count").default(0).notNull(),
    duration: varchar("duration", { length: 20 }),
    last_synced_at: timestamp("last_synced_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_videos_channel_id_idx").on(table.channel_id),
    index("youtube_videos_yt_video_id_idx").on(table.yt_video_id),
    index("youtube_videos_published_at_idx").on(table.published_at),
  ]
);
