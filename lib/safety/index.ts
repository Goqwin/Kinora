const CRISIS_PATTERNS: { category: string; patterns: RegExp[] }[] = [
  {
    category: "domestic_violence",
    patterns: [
      /\babus(e|ive)\b/i,
      /\bviolent partner\b/i,
      /\bleaving my partner\b/i,
      /\bunsafe at home\b/i,
    ],
  },
  {
    category: "child_safety",
    patterns: [/\bchild (is )?not safe\b/i, /\bneglect(ed)?\b/i],
  },
  {
    category: "self_harm",
    patterns: [
      /\bsuicid(e|al)\b/i,
      /\bkill myself\b/i,
      /\bhurt myself\b/i,
      /\bend my life\b/i,
    ],
  },
  {
    category: "no_food_tonight",
    patterns: [
      /\bno food\b/i,
      /\bnothing to eat tonight\b/i,
      /\bhungry kids tonight\b/i,
    ],
  },
  {
    category: "no_shelter",
    patterns: [
      /\bevict(ed|ion)\b/i,
      /\bno (place|where) to sleep\b/i,
      /\bhomeless tonight\b/i,
    ],
  },
  {
    category: "medical_emergency",
    patterns: [
      /\bcan(?:'|’)t breathe\b/i,
      /\bheart attack\b/i,
      /\bsevere bleeding\b/i,
      /\bmedical emergency\b/i,
    ],
  },
];

export function detectCrisis(text: string): {
  matched: boolean;
  categories: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) return { matched: false, categories: [] };

  const categories: string[] = [];
  for (const entry of CRISIS_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(trimmed))) {
      categories.push(entry.category);
    }
  }
  return { matched: categories.length > 0, categories };
}
