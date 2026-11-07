import { sanitizeUserText } from "@/lib/ai/sanitize";
import { detectCrisis } from "@/lib/safety";

import { containsBlockedPii } from "./regex-pii";

export type ModerationDecision = {
  status: "published" | "pending";
  moderation: Record<string, unknown>;
  showCrisisToAuthor: boolean;
  blockedReason?: string;
};

export async function moderateCommunityContent(input: {
  title?: string;
  body: string;
}): Promise<ModerationDecision> {
  const combined = `${input.title ?? ""}\n${input.body}`.trim();
  if (containsBlockedPii(combined)) {
    return {
      status: "pending",
      moderation: { blocked: "pii_regex" },
      showCrisisToAuthor: false,
      blockedReason:
        "Please remove emails, phone numbers, or street addresses before posting.",
    };
  }

  const crisis = detectCrisis(sanitizeUserText(combined));

  // AI moderation pass fails closed → pending
  return {
    status: "pending",
    moderation: {
      ai: "skipped",
      crisis: crisis.matched,
      crisisCategories: crisis.categories,
    },
    showCrisisToAuthor: crisis.matched,
  };
}
