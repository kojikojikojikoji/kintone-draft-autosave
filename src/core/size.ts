// Draft size guard. Above the limit, auto-save stops for that screen (FR-5).

export const MAX_DRAFT_BYTES = 512_000;

/** Byte length of a string as UTF-8, matching a Blob's size. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * True when the serialized draft exceeds the limit. Exactly MAX_DRAFT_BYTES is
 * allowed; MAX_DRAFT_BYTES + 1 is over.
 */
export function isOverSizeLimit(serialized: string): boolean {
  return byteLength(serialized) > MAX_DRAFT_BYTES;
}
