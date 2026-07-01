import { describe, expect, it } from "vitest";
import { MAX_DRAFT_BYTES, byteLength, isOverSizeLimit } from "../../src/core/size";

describe("size guard", () => {
  it("TC-8: exactly 512000 bytes is allowed; +1 is over", () => {
    const exact = "a".repeat(MAX_DRAFT_BYTES);
    const over = "a".repeat(MAX_DRAFT_BYTES + 1);
    expect(byteLength(exact)).toBe(MAX_DRAFT_BYTES);
    expect(isOverSizeLimit(exact)).toBe(false);
    expect(isOverSizeLimit(over)).toBe(true);
  });

  it("counts UTF-8 bytes, not code units", () => {
    // A 3-byte character counts as 3.
    expect(byteLength("あ")).toBe(3);
  });
});
