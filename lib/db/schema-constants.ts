/** Resource catalog categories (PRD §8.1, §9.2). */
export const RESOURCE_CATEGORIES = [
  "childcare",
  "financial",
  "housing",
  "food",
  "health_family",
  "community",
  "activities",
  "legal_info",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_COST_TYPES = [
  "free",
  "subsidized",
  "income_based",
  "paid",
] as const;

export type ResourceCostType = (typeof RESOURCE_COST_TYPES)[number];

/** Child age bands for preferences, intake, and matching (Kinora). */
export const CHILD_AGE_BANDS = [
  "ages_0_3",
  "ages_3_8",
  "ages_8_12",
  "ages_12_17",
  "ages_18_plus",
] as const;

export type ChildAgeBand = (typeof CHILD_AGE_BANDS)[number];

export const CHILD_AGE_BAND_LABELS: Record<ChildAgeBand, string> = {
  ages_0_3: "0–3",
  ages_3_8: "3–8",
  ages_8_12: "8–12",
  ages_12_17: "12–17",
  ages_18_plus: "18+",
};

/** Month ranges used by matching (inclusive start, exclusive-ish upper for scoring). */
export const CHILD_AGE_BAND_MONTHS: Record<ChildAgeBand, [number, number]> = {
  ages_0_3: [0, 36],
  ages_3_8: [36, 96],
  ages_8_12: [96, 144],
  ages_12_17: [144, 216],
  ages_18_plus: [216, 1200],
};

/** Interest tags stored on user_preferences for search seeding. */
export const INTEREST_TAGS = [
  "childcare",
  "financial",
  "housing",
  "food",
  "health_family",
  "activities",
  "parent_connection",
  "volunteering",
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

export const INTEREST_TAG_LABELS: Record<InterestTag, string> = {
  childcare: "Childcare",
  financial: "Money and benefits",
  housing: "Housing",
  food: "Food and groceries",
  health_family: "Health and family",
  activities: "Activities and programs",
  parent_connection: "Meeting similar parents",
  volunteering: "Volunteer groups",
};

export const BUDGET_BANDS = ["free", "low", "any"] as const;

export type BudgetBand = (typeof BUDGET_BANDS)[number];

/** Community board categories (FR-17). Distinct from resource categories. */
export const COMMUNITY_POST_CATEGORIES = [
  "childcare",
  "financial",
  "housing",
  "food",
  "health_family",
  "activities",
  "other",
] as const;

export type CommunityPostCategory = (typeof COMMUNITY_POST_CATEGORIES)[number];

export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PLAN_ACTION_STATUSES = ["todo", "done"] as const;

export type PlanActionStatus = (typeof PLAN_ACTION_STATUSES)[number];

export const USER_TASK_STATUSES = ["todo", "done"] as const;

export type UserTaskStatus = (typeof USER_TASK_STATUSES)[number];

export const COMMUNITY_CONTENT_STATUSES = [
  "pending",
  "published",
  "flagged",
  "removed",
] as const;

export type CommunityContentStatus = (typeof COMMUNITY_CONTENT_STATUSES)[number];

export const COMMUNITY_VOTE_TARGET_TYPES = ["post", "reply"] as const;

export type CommunityVoteTargetType = (typeof COMMUNITY_VOTE_TARGET_TYPES)[number];

export const COMMUNITY_REPORT_STATUSES = ["open", "actioned", "dismissed"] as const;

export type CommunityReportStatus = (typeof COMMUNITY_REPORT_STATUSES)[number];

export const COMMUNITY_REPORT_REASONS = [
  "personal_info",
  "harassment",
  "scam_or_promo",
  "unsafe_advice",
  "other",
] as const;

export type CommunityReportReason = (typeof COMMUNITY_REPORT_REASONS)[number];

export const RESOURCE_FEEDBACK_TYPES = [
  "outdated",
  "wrong_info",
  "closed",
  "other",
] as const;

export type ResourceFeedbackType = (typeof RESOURCE_FEEDBACK_TYPES)[number];

export const RESOURCE_FEEDBACK_STATUSES = ["open", "resolved", "dismissed"] as const;

export type ResourceFeedbackStatus = (typeof RESOURCE_FEEDBACK_STATUSES)[number];

/** Shape stored in support_plans.criteria (validated in lib/ai/schemas.ts). */
export type SupportPlanCriteria = {
  categories?: ResourceCategory[];
  child_age_bands?: ChildAgeBand[];
  child_count?: number | null;
  cost_preference?: "free" | "subsidized" | "any" | null;
  urgency?: "low" | "medium" | "high" | null;
  schedule_notes?:
    | "evenings"
    | "weekends"
    | "overnight"
    | "standard"
    | "unknown"
    | null;
  language?: string | null;
  neighbourhood_mentioned?: string | null;
  summary?: string;
  [key: string]: unknown;
};

/** Gemini moderation output stored in community_posts.moderation / community_replies.moderation. */
export type CommunityModerationMeta = {
  pii?: boolean;
  harassment?: boolean;
  scam_or_promo?: boolean;
  unsafe_advice?: boolean;
  crisis?: boolean;
  confidence?: number;
  model?: string;
  prompt_version?: string;
  [key: string]: unknown;
};
