// TTL / expiry helpers. All times are UTC ISO 8601 strings.

/** expiresAt = savedAt + ttlHours. */
export function computeExpiresAt(savedAtIso: string, ttlHours: number): string {
  const savedAt = new Date(savedAtIso).getTime();
  return new Date(savedAt + ttlHours * 60 * 60 * 1000).toISOString();
}

/**
 * A draft is expired when now is at or after expiresAt. The boundary is
 * inclusive: now === expiresAt counts as expired.
 */
export function isExpired(expiresAtIso: string, nowMs: number): boolean {
  return nowMs >= new Date(expiresAtIso).getTime();
}
