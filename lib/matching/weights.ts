export const MATCH_WEIGHTS = {
  category: 30,
  age: 20,
  proximity: 20,
  cost: 20,
  other: 10,
} as const;

export const MATCH_OTHER = {
  language: 4,
  verified: 3,
  urgency: 3,
  /** Extra when the parent wants hangouts / peer company. */
  parentHangout: 5,
} as const;
