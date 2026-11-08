import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { getEnv, isAiEnabled } from "@/lib/env";

import { CRITERIA_SYSTEM_PROMPT } from "./prompts";
import { criteriaSchema, type AiCriteria } from "./schemas";

/** Server-only by convention: never import this module from a Client Component. */

export type GeminiResult =
  | { ok: true; data: AiCriteria; fallback: false }
  | { ok: false; fallback: true };

const TIMEOUT_MS = 6000;

const criteriaJsonSchema = (() => {
  const full = z.toJSONSchema(criteriaSchema) as Record<string, unknown>;
  const { $schema: _schema, ...schema } = full;
  void _schema;
  return schema;
})();

async function callOnce(sanitizedText: string): Promise<AiCriteria> {
  const env = getEnv();
  const credential = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL ?? "gemini-2.0-flash";
  if (!credential) {
    throw new Error("AI integration is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new GoogleGenAI({ apiKey: credential });
    const res = await client.models.generateContent({
      model,
      contents: JSON.stringify({ message: sanitizedText.slice(0, 1000) }),
      config: {
        systemInstruction: CRITERIA_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: criteriaJsonSchema,
        temperature: 0,
        abortSignal: controller.signal,
        store: false,
      },
    });

    const text = res.text?.trim() ?? "";
    if (!text) throw new Error("Empty Gemini response");
    const parsed: unknown = JSON.parse(text);
    return criteriaSchema.parse(parsed);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract structured search criteria. Timeout 6s, one retry, then fallback.
 * Callers must handle `fallback`. Never invents resources.
 */
export async function extractCriteriaFromText(
  sanitizedText: string,
): Promise<GeminiResult> {
  if (!isAiEnabled() || !sanitizedText.trim()) {
    return { ok: false, fallback: true };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await callOnce(sanitizedText);
      return { ok: true, data, fallback: false };
    } catch {
      /* retry once, then fallback */
    }
  }

  return { ok: false, fallback: true };
}
