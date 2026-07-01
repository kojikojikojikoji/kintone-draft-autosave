import { describe, expect, it } from "vitest";
import { formatBannerTime, formatDateTime } from "../../src/core/timeFormat";

describe("timeFormat", () => {
  it("TC-16: formats UTC as MM月DD日 HH:mm in Asia/Tokyo", () => {
    // 2026-06-30T09:24Z is 2026-06-30 18:24 JST.
    expect(formatBannerTime("2026-06-30T09:24:00.000Z", "Asia/Tokyo")).toBe("06月30日 18:24");
  });

  it("crosses the date boundary correctly for Asia/Tokyo", () => {
    // 2026-06-30T15:30Z is 2026-07-01 00:30 JST.
    expect(formatBannerTime("2026-06-30T15:30:00.000Z", "Asia/Tokyo")).toBe("07月01日 00:30");
  });

  it("formatDateTime returns YYYY-MM-DD HH:mm in the given zone", () => {
    expect(formatDateTime("2026-06-30T09:24:00.000Z", "Asia/Tokyo")).toBe("2026-06-30 18:24");
  });

  it("falls back to the raw value on an invalid date", () => {
    expect(formatBannerTime("not-a-date", "Asia/Tokyo")).toBe("not-a-date");
  });
});
