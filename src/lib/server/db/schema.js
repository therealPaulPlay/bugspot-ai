import { mysqlTable, varchar, text, int, timestamp, boolean, json, index, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = mysqlTable('users', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	clerkId: varchar('clerk_id', { length: 100 }).unique().notNull(),
	username: varchar('username', { length: 100 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	avatar: varchar('avatar', { length: 500 }),
	stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
	subscriptionTier: int('subscription_tier').default(0), // 0: free, 1: pro, 2: enterprise
	reportLimit: int('report_limit').default(25),
	productsCount: int('products_count').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// Products table
export const products = mysqlTable('products', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull(),
	slug: varchar('slug', { length: 100 }).notNull().unique(),
	description: text('description'),
	ownerId: bigint('owner_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	customPrompt: text('custom_prompt'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
}, (table) => ({
	slugIdx: index('slug_idx').on(table.slug)
}));

// Bug reports table
export const bugReports = mysqlTable('bug_reports', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	productId: bigint('product_id', { unsigned: true }).references(() => products.id, { onDelete: 'cascade' }).notNull(),
	localId: int('local_id').notNull(), // ID within the product (starts from 0)
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description').notNull(),
	stepsToReproduce: text('steps_to_reproduce'),
	observedResult: text('observed_result'),
	expectedResult: text('expected_result'),
	systemInfo: json('system_info'), // Browser/system details
	priority: int('priority').default(2), // P0-P4, default P2
	status: varchar('status', { length: 20 }).default('open'), // open, closed, in_progress
	reporterId: bigint('reporter_id', { unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
	guestReporter: varchar('guest_reporter', { length: 100 }), // guest name/email
	tags: json('tags'), // Array of tag strings
	upvotes: int('upvotes').default(0),
	aiSuggestions: text('ai_suggestions'), // AI analysis/suggestions
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
}, (table) => ({
	statusIdx: index('status_idx').on(table.status),
	priorityIdx: index('priority_idx').on(table.priority),
	uniqueLocalId: index('unique_local_id').on(table.productId, table.localId)
}));

// Bug assignees table (many-to-many)
export const bugAssignees = mysqlTable('bug_assignees', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }).notNull(),
	userId: bigint('user_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	uniqueAssignment: index('unique_assignment').on(table.bugReportId, table.userId)
}));

// Comments table
export const comments = mysqlTable('comments', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }).notNull(),
	authorId: bigint('author_id', { unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
	guestAuthor: varchar('guest_author', { length: 100 }), // guest name/email
	content: text('content').notNull(),
	mentions: json('mentions'), // Array of mentioned user IDs
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// File uploads table
export const fileUploads = mysqlTable('file_uploads', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }),
	commentId: bigint('comment_id', { unsigned: true }).references(() => comments.id, { onDelete: 'cascade' }),
	filename: varchar('filename', { length: 255 }).notNull(),
	originalName: varchar('original_name', { length: 255 }).notNull(),
	mimeType: varchar('mime_type', { length: 100 }).notNull(),
	url: varchar('url', { length: 500 }).notNull(),
	uploaderId: bigint('uploader_id', { unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').defaultNow()
});

// Followers table (for issue following)
export const followers = mysqlTable('followers', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }).notNull(),
	userId: bigint('user_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	uniqueFollow: index('unique_follow').on(table.bugReportId, table.userId)
}));

// Upvotes table
export const upvotes = mysqlTable('upvotes', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }).notNull(),
	userId: bigint('user_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	uniqueUpvote: index('unique_upvote').on(table.bugReportId, table.userId)
}));

// Notifications table
export const notifications = mysqlTable('notifications', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	userId: bigint('user_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	type: varchar('type', { length: 50 }).notNull(), // comment, assignment, mention, etc.
	title: varchar('title', { length: 255 }).notNull(),
	content: text('content'),
	bugReportId: bigint('bug_report_id', { unsigned: true }).references(() => bugReports.id, { onDelete: 'cascade' }),
	isRead: boolean('is_read').default(false),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	readIdx: index('read_idx').on(table.isRead)
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	products: many(products),
	bugReports: many(bugReports),
	comments: many(comments),
	assignedBugs: many(bugAssignees),
	followers: many(followers),
	upvotes: many(upvotes),
	notifications: many(notifications)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
	owner: one(users, {
		fields: [products.ownerId],
		references: [users.id]
	}),
	bugReports: many(bugReports)
}));

export const bugReportsRelations = relations(bugReports, ({ one, many }) => ({
	product: one(products, {
		fields: [bugReports.productId],
		references: [products.id]
	}),
	reporter: one(users, {
		fields: [bugReports.reporterId],
		references: [users.id]
	}),
	assignees: many(bugAssignees),
	comments: many(comments),
	fileUploads: many(fileUploads),
	followers: many(followers),
	upvotes: many(upvotes)
}));

export const bugAssigneesRelations = relations(bugAssignees, ({ one }) => ({
	bugReport: one(bugReports, {
		fields: [bugAssignees.bugReportId],
		references: [bugReports.id]
	}),
	user: one(users, {
		fields: [bugAssignees.userId],
		references: [users.id]
	})
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
	bugReport: one(bugReports, {
		fields: [comments.bugReportId],
		references: [bugReports.id]
	}),
	author: one(users, {
		fields: [comments.authorId],
		references: [users.id]
	}),
	fileUploads: many(fileUploads)
}));

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
	bugReport: one(bugReports, {
		fields: [fileUploads.bugReportId],
		references: [bugReports.id]
	}),
	comment: one(comments, {
		fields: [fileUploads.commentId],
		references: [comments.id]
	}),
	uploader: one(users, {
		fields: [fileUploads.uploaderId],
		references: [users.id]
	})
}));