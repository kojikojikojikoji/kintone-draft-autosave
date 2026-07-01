import { describe, expect, it } from "vitest";
import { computeExpiresAt, isExpired } from "../../src/core/ttl";

describe("ttl", () => {
  it("TC-7: now === expiresAt counts as expired (inclusive)", () => {
    const expiresAt = "2026-07-01T09:00:00.000Z";
    const nowMs = new Date(expiresAt).getTime();
    expect(isExpired(expiresAt, nowMs)).toBe(true);
    expect(isExpired(expiresAt, nowMs - 1)).toBe(false);
  });

  it("computeExpiresAt adds ttlHours", () => {
    expect(computeExpiresAt("2026-07-01T00:00:00.000Z", 24)).toBe("2026-07-02T00:00:00.000Z");
    expect(computeExpiresAt("2026-07-01T00:00:00.000Z", 1)).toBe("2026-07-01T01:00:00.000Z");
  });
});
