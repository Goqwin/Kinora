const BLOCK_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/,
  /\b\d+\s+[A-Za-z0-9.'-]+\s+(?:Street|St|Avenue|Ave|Road|Rd)\b/i,
];

export function containsBlockedPii(text: string): boolean {
  return BLOCK_PATTERNS.some((pattern) => pattern.test(text));
}
