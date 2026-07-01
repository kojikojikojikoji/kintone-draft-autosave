// Selecting the oldest draft to evict when localStorage is full (FR-6).

export interface DraftAge {
  key: string;
  savedAt: string;
}

/**
 * Return the key of the draft with the smallest savedAt, excluding the key
 * currently being written. Returns null when there is nothing else to evict.
 */
export function selectOldestDraftKey(entries: DraftAge[], excludeKey: string): string | null {
  let oldest: DraftAge | null = null;
  for (const entry of entries) {
    if (entry.key === excludeKey) {
      continue;
    }
    if (oldest === null || new Date(entry.savedAt).getTime() < new Date(oldest.savedAt).getTime()) {
      oldest = entry;
    }
  }
  return oldest ? oldest.key : null;
}
