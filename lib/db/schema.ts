import { desc, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { geographyPoint } from "./geo-type";
import type {
  CommunityModerationMeta,
  SupportPlanCriteria,
} from "./schema-constants";
import { tsvector } from "./tsvector-type";

export * from "./schema-constants";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auth0Sub: text("auth0_sub").notNull().unique(),
    email: text("email"),
    displayName: text("display_name").unique(),
    role: text("role").notNull().default("user"),
    rulesAcceptedAt: timestamp("rules_accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check("users_role_check", sql`${table.role} IN ('user', 'admin')`),
  ],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    postalFsa: text("postal_fsa"),
    approxLocation: geographyPoint("approx_location"),
    childAgeBands: text("child_age_bands").array(),
    categories: text("categories").array(),
    interestTags: text("interest_tags").array(),
    childFirstNames: text("child_first_names").array(),
    openToMeetParents: boolean("open_to_meet_parents").notNull().default(false),
    budgetBand: text("budget_band"),
    language: text("language").notNull().default("en"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "user_preferences_postal_fsa_check",
      sql`${table.postalFsa} IS NULL OR char_length(${table.postalFsa}) = 3`,
    ),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    addressLine: text("address_line"),
    city: text("city").default("Calgary"),
    postalCode: text("postal_code"),
    location: geographyPoint("location").notNull(),
    costType: text("cost_type").notNull(),
    costNotes: text("cost_notes"),
    ageMinMonths: integer("age_min_months"),
    ageMaxMonths: integer("age_max_months"),
    eligibilitySummary: text("eligibility_summary"),
    eligibilityRequirements: text("eligibility_requirements").array(),
    languages: text("languages").array().default(["en"]),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    sourceUrl: text("source_url").notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {
      withTimezone: true,
    }).notNull(),
    verifiedBy: text("verified_by"),
    isActive: boolean("is_active").notNull().default(true),
    /** Generated in migration SQL; omitted from inserts. */
    searchTsv: tsvector("search_tsv"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("resources_location_idx").using("gist", table.location),
    index("resources_category_idx").on(table.category),
    index("resources_active_category_idx").on(table.isActive, table.category),
    index("resources_search_tsv_idx").using("gin", table.searchTsv),
    check(
      "resources_category_check",
      sql`${table.category} IN (
        'childcare', 'financial', 'housing', 'food',
        'health_family', 'community', 'activities', 'legal_info'
      )`,
    ),
    check(
      "resources_cost_type_check",
      sql`${table.costType} IN ('free', 'subsidized', 'income_based', 'paid')`,
    ),
    check(
      "resources_age_range_check",
      sql`${table.ageMinMonths} IS NULL OR ${table.ageMaxMonths} IS NULL OR ${table.ageMinMonths} <= ${table.ageMaxMonths}`,
    ),
  ],
);

export const savedResources = pgTable(
  "saved_resources",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.resourceId] }),
    index("saved_resources_user_idx").on(table.userId, table.createdAt),
  ],
);

export const supportPlans = pgTable(
  "support_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    criteria: jsonb("criteria").$type<SupportPlanCriteria>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("support_plans_user_created_idx").on(
      table.userId,
      desc(table.createdAt),
    ),
  ],
);

export const planActions = pgTable(
  "plan_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => supportPlans.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    reason: text("reason").notNull(),
    firstStep: text("first_step").notNull(),
    priority: integer("priority").notNull(),
    status: text("status").notNull().default("todo"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("plan_actions_plan_priority_idx").on(table.planId, table.priority),
    check(
      "plan_actions_status_check",
      sql`${table.status} IN ('todo', 'done')`,
    ),
    check("plan_actions_priority_check", sql`${table.priority} >= 0`),
  ],
);

export const userTasks = pgTable(
  "user_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    planActionId: uuid("plan_action_id").references(() => planActions.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: text("status").notNull().default("todo"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("user_tasks_user_status_idx").on(table.userId, table.status),
    check("user_tasks_status_check", sql`${table.status} IN ('todo', 'done')`),
  ],
);

export const resourceFeedback = pgTable(
  "resource_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    note: text("note"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("resource_feedback_status_idx").on(table.status, table.createdAt),
    index("resource_feedback_resource_idx").on(table.resourceId),
    check(
      "resource_feedback_type_check",
      sql`${table.type} IN ('outdated', 'wrong_info', 'closed', 'other')`,
    ),
    check(
      "resource_feedback_status_check",
      sql`${table.status} IN ('open', 'resolved', 'dismissed')`,
    ),
    check(
      "resource_feedback_note_len_check",
      sql`${table.note} IS NULL OR char_length(${table.note}) <= 500`,
    ),
  ],
);

export const communityPosts = pgTable(
  "community_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    moderation: jsonb("moderation").$type<CommunityModerationMeta>(),
    helpfulCount: integer("helpful_count").notNull().default(0),
    searchTsv: tsvector("search_tsv"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("community_posts_status_category_idx").on(
      table.status,
      table.category,
      desc(table.createdAt),
    ),
    index("community_posts_author_created_idx").on(
      table.authorId,
      table.createdAt,
    ),
    index("community_posts_resource_idx").on(table.resourceId, table.status),
    index("community_posts_search_tsv_idx").using("gin", table.searchTsv),
    check(
      "community_posts_category_check",
      sql`${table.category} IN (
        'childcare', 'financial', 'housing', 'food',
        'health_family', 'activities', 'other'
      )`,
    ),
    check(
      "community_posts_status_check",
      sql`${table.status} IN ('pending', 'published', 'flagged', 'removed')`,
    ),
    check(
      "community_posts_title_len_check",
      sql`char_length(${table.title}) <= 120`,
    ),
    check(
      "community_posts_body_len_check",
      sql`char_length(${table.body}) <= 2000`,
    ),
    check(
      "community_posts_helpful_count_check",
      sql`${table.helpfulCount} >= 0`,
    ),
  ],
);

export const communityReplies = pgTable(
  "community_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    moderation: jsonb("moderation").$type<CommunityModerationMeta>(),
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("community_replies_post_idx").on(table.postId, table.status),
    index("community_replies_author_created_idx").on(
      table.authorId,
      table.createdAt,
    ),
    check(
      "community_replies_status_check",
      sql`${table.status} IN ('pending', 'published', 'flagged', 'removed')`,
    ),
    check(
      "community_replies_body_len_check",
      sql`char_length(${table.body}) <= 1000`,
    ),
    check(
      "community_replies_helpful_count_check",
      sql`${table.helpfulCount} >= 0`,
    ),
  ],
);

export const communityVotes = pgTable(
  "community_votes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.targetType, table.targetId],
    }),
    index("community_votes_target_idx").on(table.targetType, table.targetId),
    check(
      "community_votes_target_type_check",
      sql`${table.targetType} IN ('post', 'reply')`,
    ),
  ],
);

export const communityReports = pgTable(
  "community_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    status: text("status").notNull().default("open"),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("community_reports_reporter_created_idx").on(
      table.reporterId,
      table.createdAt,
    ),
    index("community_reports_target_status_idx").on(
      table.targetType,
      table.targetId,
      table.status,
    ),
    check(
      "community_reports_target_type_check",
      sql`${table.targetType} IN ('post', 'reply')`,
    ),
    check(
      "community_reports_status_check",
      sql`${table.status} IN ('open', 'actioned', 'dismissed')`,
    ),
    check(
      "community_reports_reason_check",
      sql`${table.reason} IN (
        'personal_info', 'harassment', 'scam_or_promo', 'unsafe_advice', 'other'
      )`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type SavedResource = typeof savedResources.$inferSelect;
export type SupportPlan = typeof supportPlans.$inferSelect;
export type PlanAction = typeof planActions.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type ResourceFeedbackRow = typeof resourceFeedback.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityReply = typeof communityReplies.$inferSelect;
export type CommunityVote = typeof communityVotes.$inferSelect;
export type CommunityReport = typeof communityReports.$inferSelect;

export const rlsStatements = sql`
  alter table users enable row level security;
  alter table user_preferences enable row level security;
  alter table resources enable row level security;
  alter table saved_resources enable row level security;
  alter table support_plans enable row level security;
  alter table plan_actions enable row level security;
  alter table user_tasks enable row level security;
  alter table resource_feedback enable row level security;
  alter table community_posts enable row level security;
  alter table community_replies enable row level security;
  alter table community_votes enable row level security;
  alter table community_reports enable row level security;
`;
