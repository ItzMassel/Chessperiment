import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('Untitled Project'),
  description: text('description').default(''),
  isStarred: boolean('is_starred').default(false),
  forkedFrom: jsonb('forked_from'),
  rows: integer('rows').default(8),
  cols: integer('cols').default(8),
  gridType: text('grid_type').default('square'),
  activeSquares: jsonb('active_squares').default([]),
  placedPieces: jsonb('placed_pieces').default({}),
  customPieces: jsonb('custom_pieces').default([]),
  squareLogic: jsonb('square_logic').default({}),
  history: jsonb('history').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const marketplaceItems = pgTable('marketplace_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default('No description provided.'),
  creatorHandle: text('creator_handle').notNull(),
  type: text('type').notNull(), // 'board' | 'pieces' | 'game'
  rating: doublePrecision('rating').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  starsTotal: integer('stars_total').default(0).notNull(),
  starsCount: integer('stars_count').default(0).notNull(),
  views: integer('views').default(0).notNull(),
  forkCount: integer('fork_count').default(0).notNull(),
  datePublished: timestamp('date_published', { withTimezone: true }).defaultNow().notNull(),
  configData: jsonb('config_data'),
  sourceType: text('source_type'), // 'project' | 'board' | 'pieceSet'
  sourceId: text('source_id'),
  forkedFrom: jsonb('forked_from'),
  isNew: boolean('is_new').default(true).notNull(),
  imageUrl: text('image_url').default('').notNull(),
  searchKeywords: jsonb('search_keywords').default([]),
  previewConfig: jsonb('preview_config'),
});

export const marketplaceReviews = pgTable('marketplace_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketplaceItemId: uuid('marketplace_item_id').notNull().references(() => marketplaceItems.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  creatorHandle: text('creator_handle'),
  displayName: text('display_name').notNull(),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const marketplaceReports = pgTable('marketplace_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketplaceId: text('marketplace_id').notNull(),
  itemTitle: text('item_title').default('Untitled'),
  creatorHandle: text('creator_handle').default(''),
  creatorUserId: text('creator_user_id').default(''),
  reporterUserId: text('reporter_user_id').notNull(),
  reporterHandle: text('reporter_handle').default(''),
  reporterEmail: text('reporter_email').default(''),
  reason: text('reason').notNull(),
  details: text('details').default(''),
  status: text('status').default('new').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const creatorProfiles = pgTable('creator_profiles', {
  userId: text('user_id').primaryKey(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  dateJoined: timestamp('date_joined', { withTimezone: true }).defaultNow().notNull(),
  rating: doublePrecision('rating').default(0).notNull(),
  followers: jsonb('followers').default([]).notNull(),
  following: jsonb('following').default([]).notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'new_review' | 'item_forked' | 'new_publish' | 'new_follower'
  message: text('message').notNull(),
  link: text('link'),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  actorHandle: text('actor_handle'),
  actorPhotoUrl: text('actor_photo_url'),
});

export const userStats = pgTable('user_stats', {
  userId: text('user_id').primaryKey(),
  gamesPlayed: integer('games_played').default(0).notNull(),
  wins: integer('wins').default(0).notNull(),
  losses: integer('losses').default(0).notNull(),
  draws: integer('draws').default(0).notNull(),
  rating: integer('rating').default(1500).notNull(),
});

export const gameHistory = pgTable('game_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  result: text('result').notNull(), // 'win' | 'loss' | 'draw'
  opponent: text('opponent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  roomId: text('room_id'),
});

export const communityFeedback = pgTable('community_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // 'bug' | 'feature' | 'general'
  message: text('message').notNull(),
  email: text('email').default(''),
  status: text('status').default('new').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  isStarred: boolean('is_starred').default(false).notNull(),
  projectId: text('project_id'),
  forkedFrom: jsonb('forked_from'),
  topologyType: text('topology_type'),
  topologyParams: jsonb('topology_params'),
  rows: integer('rows').notNull(),
  cols: integer('cols').notNull(),
  gridType: text('grid_type').default('square'),
  activeSquares: jsonb('active_squares').default([]),
  placedPieces: jsonb('placed_pieces').default({}),
  squareStates: jsonb('square_states'),
  version: integer('version'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pieceSets = pgTable('piece_sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  isStarred: boolean('is_starred').default(false).notNull(),
  projectId: text('project_id'),
  forkedFrom: jsonb('forked_from'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const customPieces = pgTable('custom_pieces', {
  id: uuid('id').defaultRandom().primaryKey(),
  setId: text('set_id'),
  projectId: text('project_id'),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  pixelsWhite: jsonb('pixels_white'),
  pixelsBlack: jsonb('pixels_black'),
  imageWhite: text('image_white'),
  imageBlack: text('image_black'),
  moves: jsonb('moves').default([]),
  logic: jsonb('logic'),
  variables: jsonb('variables'),
  shape: jsonb('shape'),
  color: text('color'),
  pixels: jsonb('pixels'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsSummary = pgTable('analytics_summary', {
  id: text('id').primaryKey(),
  totalUniqueVisitors: integer('total_unique_visitors').default(0),
  totalSessions: integer('total_sessions').default(0),
});

export const analyticsDailyStats = pgTable('analytics_daily_stats', {
  date: text('date').primaryKey(),
  uniqueCount: integer('unique_count').default(0),
  totalSessions: integer('total_sessions').default(0),
});

export const analyticsButtonClicks = pgTable('analytics_button_clicks', {
  event: text('event').primaryKey(),
  count: integer('count').default(0).notNull(),
});
