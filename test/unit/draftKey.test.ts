import { describe, expect, it } from "vitest";
import { buildDraftKey, isDraftKey } from "../../src/core/draftKey";

describe("buildDraftKey", () => {
  it("TC-1: builds kp-das-<domain>-<appId>-<recordId>-<userCode>", () => {
    const key = buildDraftKey({
      domain: "example.cybozu.com",
      appId: "12",
      recordId: "345",
      userCode: "sato",
    });
    expect(key).toBe("kp-das-example.cybozu.com-12-345-sato");
  });

  it("uses 'create' when recordId is null", () => {
    const key = buildDraftKey({
      domain: "example.cybozu.com",
      appId: 12,
      recordId: null,
      userCode: "sato",
    });
    expect(key).toBe("kp-das-example.cybozu.com-12-create-sato");
  });

  it("TC-2: percent-encodes a userCode containing @", () => {
    const key = buildDraftKey({
      domain: "example.cybozu.com",
      appId: "12",
      recordId: "345",
      userCode: "sato@ex.com",
    });
    expect(key).toBe("kp-das-example.cybozu.com-12-345-sato%40ex.com");
  });

  it("recognizes its own keys", () => {
    expect(isDraftKey("kp-das-example.cybozu.com-1-create-a")).toBe(true);
    expect(isDraftKey("other-key")).toBe(false);
  });
});
