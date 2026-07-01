import {
  KEY_PREFIX,
  isDraftKey,
  isExpired,
  parseDraft,
  selectOldestDraftKey,
  serializeDraft,
} from "../core";
import type { Draft, DraftAge } from "../core";

// Thin wrapper over localStorage scoped to this plugin's key prefix. All parsing
// goes through the zod schema; corrupt entries are removed on read.

export type QuotaResult = "ok" | "quota";

/** True when localStorage can be written. Tested once per screen (EC-1). */
export function isStorageWritable(): boolean {
  try {
    const probe = `${KEY_PREFIX}__probe__`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** All plugin keys currently in localStorage. */
export function listDraftKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && isDraftKey(key)) {
      keys.push(key);
    }
  }
  return keys;
}

export function readDraft(key: string): Draft | null {
  const raw = localStorage.getItem(key);
  const result = parseDraft(raw);
  if (!result.ok) {
    if (raw !== null) {
      // Remove unparseable / schema-invalid drafts (EC-5).
      localStorage.removeItem(key);
    }
    return null;
  }
  return result.draft;
}

export function removeDraft(key: string): void {
  localStorage.removeItem(key);
}

/** savedAt of every valid plugin draft, for oldest-first eviction. */
function draftAges(): DraftAge[] {
  const ages: DraftAge[] = [];
  for (const key of listDraftKeys()) {
    const raw = localStorage.getItem(key);
    const result = parseDraft(raw);
    if (result.ok) {
      ages.push({ key, savedAt: result.draft.savedAt });
    }
  }
  return ages;
}

/**
 * Write a draft. On QuotaExceededError, evict the oldest other plugin draft and
 * retry, repeating until it fits or nothing is left to evict (FR-6). Returns
 * "quota" when the write ultimately cannot succeed.
 */
export function writeDraft(key: string, draft: Draft): QuotaResult {
  const serialized = serializeDraft(draft);
  for (;;) {
    try {
      localStorage.setItem(key, serialized);
      return "ok";
    } catch (err) {
      if (!isQuotaError(err)) {
        throw err;
      }
      const victim = selectOldestDraftKey(draftAges(), key);
      if (victim === null) {
        return "quota";
      }
      localStorage.removeItem(victim);
    }
  }
}

/** Delete expired and invalid plugin drafts (FR-17). Returns removed count. */
export function purgeExpiredDrafts(nowMs: number): number {
  let removed = 0;
  for (const key of listDraftKeys()) {
    const raw = localStorage.getItem(key);
    const result = parseDraft(raw);
    if (!result.ok) {
      localStorage.removeItem(key);
      removed += 1;
      continue;
    }
    if (isExpired(result.draft.expiresAt, nowMs)) {
      localStorage.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

/** Delete every plugin draft on this domain regardless of user (FR-20). */
export function removeAllDrafts(): number {
  const keys = listDraftKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  return keys.length;
}

function isQuotaError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22 ||
      err.code === 1014
    );
  }
  return false;
}
