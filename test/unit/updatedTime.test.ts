import { describe, expect, it } from "vitest";
import { isUpdatedByOthers } from "../../src/core/updatedTime";

describe("isUpdatedByOthers", () => {
  it("TC-15: true when current time is newer than the draft time", () => {
    expect(isUpdatedByOthers("2026-07-01T09:00:00Z", "2026-07-01T10:00:00Z")).toBe(true);
  });

  it("TC-15: false when the times are equal", () => {
    expect(isUpdatedByOthers("2026-07-01T09:00:00Z", "2026-07-01T09:00:00Z")).toBe(false);
  });

  it("false on the create screen (null draft time)", () => {
    expect(isUpdatedByOthers(null, "2026-07-01T10:00:00Z")).toBe(false);
  });
});
