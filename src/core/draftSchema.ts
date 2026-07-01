import { z } from "zod";
import type { Draft } from "./types";

// zod schema for the localStorage draft value. Anything that fails validation
// is treated as corrupt and deleted; the UI never breaks on a bad draft.

const fieldValueSchema = z.object({
  type: z.string(),
  value: z.unknown(),
});

const draftSchema = z.object({
  version: z.literal(1),
  savedAt: z.string(),
  expiresAt: z.string(),
  appId: z.string(),
  recordId: z.string().nullable(),
  userCode: z.string(),
  recordUpdatedTime: z.string().nullable(),
  fields: z.record(fieldValueSchema),
});

export type ParseResult = { ok: true; draft: Draft } | { ok: false; reason: "json" | "schema" };

/**
 * Parse a raw localStorage string into a Draft. Never throws: malformed JSON
 * and schema mismatches (including a version other than 1) return ok:false.
 */
export function parseDraft(raw: string | null): ParseResult {
  if (raw === null) {
    return { ok: false, reason: "json" };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "json" };
  }
  const result = draftSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, reason: "schema" };
  }
  return { ok: true, draft: result.data as Draft };
}

export function serializeDraft(draft: Draft): string {
  return JSON.stringify(draft);
}
