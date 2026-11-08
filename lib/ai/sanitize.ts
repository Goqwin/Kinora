const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE =
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g;
const POSTAL = /\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/gi;
const STREET =
  /\b\d+\s+[A-Za-z0-9.'-]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Way|Court|Ct|Lane|Ln)\b/gi;
const NAME_INTRO = /\bmy name is\s+[A-Za-z][A-Za-z'-]{1,40}\b/gi;

export function sanitizeUserText(input: string): string {
  return input
    .replace(EMAIL, "[redacted email]")
    .replace(PHONE, "[redacted phone]")
    .replace(POSTAL, "[redacted postal]")
    .replace(STREET, "[redacted address]")
    .replace(NAME_INTRO, "my name is [redacted]");
}
