import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseConfig, serializeConfig } from "../../src/core/config";

describe("parseConfig", () => {
  it("returns defaults for empty/undefined config", () => {
    expect(parseConfig(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseConfig("")).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults for invalid JSON", () => {
    expect(parseConfig("{broken")).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults for out-of-range values", () => {
    expect(
      parseConfig(JSON.stringify({ version: 1, settings: { intervalSec: 7, ttlHours: 24 } })),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips valid settings", () => {
    const s = { intervalSec: 30 as const, ttlHours: 72 as const };
    expect(parseConfig(serializeConfig(s))).toEqual(s);
  });
});
