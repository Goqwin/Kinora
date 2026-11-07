import { z } from "zod";

import { extractCriteriaFromText } from "@/lib/ai/gemini";
import { sanitizeUserText } from "@/lib/ai/sanitize";
import {
  CHILD_AGE_BANDS,
  type ChildAgeBand,
} from "@/lib/db/schema-constants";
import type { SearchCriteria } from "@/lib/matching/score";
import { approximateFromPostal } from "@/lib/geo";
import { detectCrisis } from "@/lib/safety";

const searchRequestSchema = z.object({
  text: z.string().max(1000).optional(),
  postal: z.string().max(12).optional(),
  radiusKm: z.coerce.number().min(1).max(50).default(15),
  categories: z.array(z.string()).max(4).optional(),
  childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5).optional(),
  childAgeYears: z.coerce.number().min(0).max(25).nullable().optional(),
  costPreference: z.enum(["free", "subsidized", "any"]).nullable().optional(),
  language: z.string().max(10).nullable().optional(),
  openToMeetParents: z.coerce.boolean().optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

const KEYWORD_CATEGORIES: { pattern: RegExp; category: string }[] = [
  { pattern: /\b(child\s*care|daycare|after[- ]school)\b/i, category: "childcare" },
  { pattern: /\b(financ|money|benefit|subsidy|income)\b/i, category: "financial" },
  { pattern: /\b(food|grocer|hungry|meal)\b/i, category: "food" },
  { pattern: /\b(hous|rent|shelter|evict)\b/i, category: "housing" },
  { pattern: /\b(counsell|mental|health|isolat)\b/i, category: "health_family" },
  {
    pattern:
      /\b(activit|summer camp|recreation|coding|stem|robotic|volunteer|chore|other parents|meet parents)\b/i,
    category: "activities",
  },
];

function inferCategoriesFromText(text: string): string[] {
  const found = new Set<string>();
  for (const entry of KEYWORD_CATEGORIES) {
    if (entry.pattern.test(text)) found.add(entry.category);
  }
  return [...found];
}

function inferAgeBandsFromText(text: string): ChildAgeBand[] {
  const bands = new Set<ChildAgeBand>();
  if (/\b(infant|toddler|baby|0[-– ]?3|under\s*3)\b/i.test(text)) {
    bands.add("ages_0_3");
  }
  if (/\b(preschool|3[-– ]?8|young\s*kid)\b/i.test(text)) {
    bands.add("ages_3_8");
  }
  if (/\b(8[-– ]?12|tween|elementary)\b/i.test(text)) {
    bands.add("ages_8_12");
  }
  if (/\b(12[-– ]?17|teen|teenager)\b/i.test(text)) {
    bands.add("ages_12_17");
  }
  if (/\b(18\+|adult\s*child|young\s*adult)\b/i.test(text)) {
    bands.add("ages_18_plus");
  }
  return [...bands];
}

function inferUrgency(text: string): SearchCriteria["urgency"] {
  if (/\b(tonight|urgent|asap|right now)\b/i.test(text)) return "high";
  if (/\b(soon|this week)\b/i.test(text)) return "medium";
  return "low";
}

function inferMeetParents(text: string): boolean {
  return /\b(other parents|meet parents|isolation|lonely|chore\s*share|parent\s*group)\b/i.test(
    text,
  );
}

export async function buildSearchCriteria(
  input: SearchRequest,
): Promise<{
  criteria: SearchCriteria;
  crisis: ReturnType<typeof detectCrisis>;
  aiFallback: boolean;
  summary: string;
}> {
  const parsed = searchRequestSchema.parse(input);
  const rawText = parsed.text?.trim() ?? "";
  const crisis = detectCrisis(rawText);

  let categories = parsed.categories ?? [];
  let childAgeBands: ChildAgeBand[] = parsed.childAgeBands ?? [];
  let costPreference = parsed.costPreference ?? null;
  let summary = "Here are starting points based on your filters.";
  let aiFallback = true;
  let openToMeetParents = parsed.openToMeetParents ?? false;

  if (rawText) {
    const sanitized = sanitizeUserText(rawText);
    const ai = await extractCriteriaFromText(sanitized);
    if (ai.ok && !ai.fallback) {
      categories = ai.data.categories;
      costPreference = ai.data.cost_preference;
      summary = ai.data.summary;
      aiFallback = false;
      if (ai.data.child_age_bands.length > 0) {
        childAgeBands = ai.data.child_age_bands;
      }
    } else {
      const inferred = inferCategoriesFromText(sanitized);
      if (inferred.length > 0) categories = inferred;
      const inferredAges = inferAgeBandsFromText(sanitized);
      if (inferredAges.length > 0 && childAgeBands.length === 0) {
        childAgeBands = inferredAges;
      }
      summary =
        inferred.length > 0
          ? `We picked ${inferred.join(", ")} from your message. Add filters if you want to narrow it.`
          : "We could not parse everything. Try filters or shorter phrases.";
    }
    if (!openToMeetParents) {
      openToMeetParents = inferMeetParents(sanitized);
    }
  }

  const geo = approximateFromPostal(parsed.postal ?? null);
  const childAgeMonths =
    parsed.childAgeYears !== undefined && parsed.childAgeYears !== null
      ? parsed.childAgeYears * 12
      : null;

  const criteria: SearchCriteria = {
    categories,
    childAgeBands,
    childAgeMonths,
    costPreference,
    urgency: rawText ? inferUrgency(rawText) : "low",
    language: parsed.language ?? null,
    radiusKm: parsed.radiusKm,
    userLat: geo.lat,
    userLon: geo.lon,
    openToMeetParents,
  };

  return { criteria, crisis, aiFallback, summary };
}
