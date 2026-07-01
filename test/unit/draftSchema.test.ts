import { describe, expect, it } from "vitest";
import { parseDraft, serializeDraft } from "../../src/core/draftSchema";
import type { Draft } from "../../src/core/types";

const validDraft: Draft = {
  version: 1,
  savedAt: "2026-07-01T09:12:34.567Z",
  expiresAt: "2026-07-02T09:12:34.567Z",
  appId: "12",
  recordId: "345",
  userCode: "sato",
  recordUpdatedTime: "2026-07-01T09:00:00Z",
  fields: {
    title: { type: "SINGLE_LINE_TEXT", value: "report" },
  },
};

describe("parseDraft", () => {
  it("round-trips a valid draft", () => {
    const result = parseDraft(serializeDraft(validDraft));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.appId).toBe("12");
    }
  });

  it("TC-10: rejects a draft with version 2", () => {
    const bad = { ...validDraft, version: 2 };
    const result = parseDraft(JSON.stringify(bad));
    expect(result).toEqual({ ok: false, reason: "schema" });
  });

  it("TC-11: rejects broken JSON without throwing", () => {
    const result = parseDraft("{not json");
    expect(result).toEqual({ ok: false, reason: "json" });
  });

  it("treats null input as invalid", () => {
    expect(parseDraft(null).ok).toBe(false);
  });
});
