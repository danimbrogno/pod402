import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * User table
 */
export const users = pgTable('users', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Episode table
 */
export const episodes = pgTable('episodes', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  prompt: text('prompt').notNull(),
  audio: text('audio').notNull(), // File path or storage reference
  url: text('url').notNull(), // URL to access the audio file
  contentType: text('content_type').notNull(), // MIME type (e.g., 'audio/wav')
  size: integer('size').notNull(), // File size in bytes
  userId: uuid('user_id').notNull().references(() => users.uuid, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
  user: one(users, {
    fields: [episodes.userId],
    references: [users.uuid],
  }),
}));

/**
 * Type exports
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;

/**
 * Database configuration
 */
export interface DatabaseConfig {
  connectionString: string;
}

/**
 * Get default database configuration
 * @param overrides - Optional configuration overrides
 * @returns Database configuration
 */
export function getDrizzleConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  const defaultConfig: DatabaseConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/app',
  };
  return { ...defaultConfig, ...overrides };
}

/**
 * Export schema for use in migrations
 */
export const schema = {
  users,
  episodes,
  usersRelations,
  episodesRelations,
};
