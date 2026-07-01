import { describe, expect, it } from "vitest";
import { buildDiffRows, formatFieldValue } from "../../src/core/valueDisplay";
import type { FormFields, RecordData } from "../../src/core/types";

describe("formatFieldValue", () => {
  it("shows (空) for empty values", () => {
    expect(formatFieldValue({ type: "SINGLE_LINE_TEXT", value: "" }, "Asia/Tokyo")).toBe("(空)");
    expect(formatFieldValue({ type: "CHECK_BOX", value: [] }, "Asia/Tokyo")).toBe("(空)");
  });

  it("joins multi-select values with a comma", () => {
    expect(formatFieldValue({ type: "CHECK_BOX", value: ["A", "B"] }, "Asia/Tokyo")).toBe("A、B");
  });

  it("uses names for user selections", () => {
    expect(
      formatFieldValue(
        { type: "USER_SELECT", value: [{ code: "sato", name: "佐藤" }] },
        "Asia/Tokyo",
      ),
    ).toBe("佐藤");
  });

  it("strips HTML from rich text", () => {
    expect(
      formatFieldValue({ type: "RICH_TEXT", value: "<p>hello <b>world</b></p>" }, "Asia/Tokyo"),
    ).toBe("hello world");
  });

  it("truncates long values to 100 chars plus an ellipsis", () => {
    const long = "x".repeat(150);
    const out = formatFieldValue({ type: "SINGLE_LINE_TEXT", value: long }, "Asia/Tokyo");
    expect(out).toHaveLength(101);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("buildDiffRows", () => {
  const form: FormFields = {
    title: { type: "SINGLE_LINE_TEXT", code: "title", label: "タイトル" },
    items: {
      type: "SUBTABLE",
      code: "items",
      label: "明細",
      fields: { name: { type: "SINGLE_LINE_TEXT", code: "name" } },
    },
  };

  it("lists only changed fields and summarizes subtable row counts", () => {
    const current: RecordData = {
      title: { type: "SINGLE_LINE_TEXT", value: "a" },
      items: {
        type: "SUBTABLE",
        value: [{ value: { name: { type: "SINGLE_LINE_TEXT", value: "x" } } }],
      },
    };
    const draft: RecordData = {
      title: { type: "SINGLE_LINE_TEXT", value: "a" },
      items: {
        type: "SUBTABLE",
        value: [
          { value: { name: { type: "SINGLE_LINE_TEXT", value: "x" } } },
          { value: { name: { type: "SINGLE_LINE_TEXT", value: "y" } } },
        ],
      },
    };
    const rows = buildDiffRows(current, draft, form, "Asia/Tokyo");
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("明細");
    expect(rows[0].current).toBe("1行");
    expect(rows[0].draft).toBe("2行（内容に変更があります）");
  });
});
