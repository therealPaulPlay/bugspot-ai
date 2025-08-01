import { mysqlTable, varchar, text, int, timestamp, boolean, bigint, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = mysqlTable('users', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	githubId: varchar('github_id', { length: 100 }).unique().notNull(),
	username: varchar('username', { length: 100 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	avatar: varchar('avatar', { length: 500 }),
	stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
	subscriptionTier: int('subscription_tier').default(0), // 0: free, 1: pro, 2: enterprise
	reportAmount: int('report_amount').default(0), // Monthly used form submissions
	githubInstallationId: varchar('github_installation_id', { length: 100 }), // GitHub app installation ID
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	githubId: index('idx_users_github_id').on(table.githubId),
}));

// Forms table
export const forms = mysqlTable('forms', {
	id: varchar('id', { length: 36 }).primaryKey(), // UUID
	userId: bigint('user_id', { unsigned: true }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	githubRepo: varchar('github_repo', { length: 255 }), // e.g. "owner/repo"
	discordWebhook: varchar('discord_webhook', { length: 500 }), // Discord webhook URL
	showIssueLink: boolean('show_issue_link').default(true),
	customPrompt: text('custom_prompt'),
	colorScheme: varchar('color_scheme', { length: 255 }),
	requireEmail: boolean('require_email').default(true),
	requireSteps: boolean('require_steps').default(true),
	requireVideo: boolean('require_video').default(false),
	requireScreenshot: boolean('require_screenshot').default(true),
	requireExpectedResult: boolean('require_expected_result').default(true),
	requireObservedResult: boolean('require_observed_result').default(true),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	githubRepoIdx: index('idx_forms_github_repo').on(table.githubRepo),
}));

// Form domains table (whitelisted domains per form)
export const formDomains = mysqlTable('form_domains', {
	id: bigint('id', { unsigned: true }).primaryKey().autoincrement(),
	formId: varchar('form_id', { length: 36 }).references(() => forms.id, { onDelete: 'cascade' }).notNull(),
	domain: varchar('domain', { length: 255 }).notNull(), // e.g. "myapp.com"
	createdAt: timestamp('created_at').defaultNow()
});

export const submittedReports = mysqlTable('submitted_reports', {
	id: varchar('id', { length: 36 }).primaryKey(), // UUID
	formId: varchar('form_id', { length: 36 }).references(() => forms.id, { onDelete: 'cascade' }).notNull(),
	issueNumber: int('issue_number').notNull(),
	email: varchar('email', { length: 255 }), // Reporter's email
	screenshotKey: varchar('screenshot_key', { length: 500 }), // S3 key for screenshot
	videoKey: varchar('video_key', { length: 500 }), // S3 key for video
	reporterIp: varchar('reporter_ip', { length: 45 }),
	isClosed: boolean('is_closed').default(false),
	createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
	screenshotKeyIdx: index('idx_screenshot_key').on(table.screenshotKey),
	videoKeyIdx: index('idx_video_key').on(table.videoKey),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	forms: many(forms)
}));

export const submittedReportsRelations = relations(submittedReports, ({ one }) => ({
	form: one(forms, {
		fields: [submittedReports.formId],
		references: [forms.id]
	})
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
	user: one(users, {
		fields: [forms.userId],
		references: [users.id]
	}),
	domains: many(formDomains),
	reports: many(submittedReports)
}));

export const formDomainsRelations = relations(formDomains, ({ one }) => ({
	form: one(forms, {
		fields: [formDomains.formId],
		references: [forms.id]
	})
}));