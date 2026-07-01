import { describe, expect, it } from "vitest";
import { selectOldestDraftKey } from "../../src/core/oldest";

describe("selectOldestDraftKey", () => {
  const entries = [
    { key: "a", savedAt: "2026-07-01T10:00:00.000Z" },
    { key: "b", savedAt: "2026-07-01T08:00:00.000Z" },
    { key: "c", savedAt: "2026-07-01T09:00:00.000Z" },
  ];

  it("TC-9: returns the smallest savedAt", () => {
    expect(selectOldestDraftKey(entries, "self")).toBe("b");
  });

  it("TC-9: excludes the key being written", () => {
    expect(selectOldestDraftKey(entries, "b")).toBe("c");
  });

  it("returns null when nothing else remains", () => {
    expect(selectOldestDraftKey([{ key: "self", savedAt: "2026-07-01T00:00:00Z" }], "self")).toBe(
      null,
    );
  });
});
