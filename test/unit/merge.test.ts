import { describe, expect, it } from "vitest";
import { mergeDraftIntoRecord } from "../../src/core/merge";
import type { FormFields, RecordData, SubtableRow } from "../../src/core/types";

describe("mergeDraftIntoRecord", () => {
  it("TC-12: skips a draft field missing from the form, applies the rest", () => {
    const form: FormFields = {
      title: { type: "SINGLE_LINE_TEXT", code: "title" },
    };
    const current: RecordData = { title: { type: "SINGLE_LINE_TEXT", value: "old" } };
    const draft: RecordData = {
      title: { type: "SINGLE_LINE_TEXT", value: "new" },
      removed: { type: "SINGLE_LINE_TEXT", value: "x" },
    };
    const result = mergeDraftIntoRecord(current, draft, form);
    expect(result.record.title.value).toBe("new");
    expect(result.skipped).toEqual(["removed"]);
  });

  it("TC-13: skips a field whose type changed", () => {
    const form: FormFields = {
      f: { type: "NUMBER", code: "f" },
    };
    const current: RecordData = { f: { type: "NUMBER", value: "1" } };
    const draft: RecordData = { f: { type: "SINGLE_LINE_TEXT", value: "text" } };
    const result = mergeDraftIntoRecord(current, draft, form);
    expect(result.skipped).toEqual(["f"]);
    expect(result.record.f.value).toBe("1");
  });

  it("TC-14: replaces subtable with draft rows and drops ids", () => {
    const form: FormFields = {
      items: {
        type: "SUBTABLE",
        code: "items",
        fields: { name: { type: "SINGLE_LINE_TEXT", code: "name" } },
      },
    };
    const row = (id: string, name: string): SubtableRow => ({
      id,
      value: { name: { type: "SINGLE_LINE_TEXT", value: name } },
    });
    const current: RecordData = {
      items: {
        type: "SUBTABLE",
        value: [row("11", "a"), row("12", "b"), row("13", "c"), row("14", "d"), row("15", "e")],
      },
    };
    const draft: RecordData = {
      items: { type: "SUBTABLE", value: [row("1", "a"), row("2", "b"), row("3", "c")] },
    };
    const result = mergeDraftIntoRecord(current, draft, form);
    const rows = result.record.items.value as SubtableRow[];
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.id).toBeUndefined();
    }
  });

  it("reports restored lookup fields", () => {
    const form: FormFields = {
      customer: {
        type: "SINGLE_LINE_TEXT",
        code: "customer",
        label: "顧客名",
        lookup: { fieldMappings: [{ field: "addr" }] },
      },
    };
    const current: RecordData = { customer: { type: "SINGLE_LINE_TEXT", value: "" } };
    const draft: RecordData = { customer: { type: "SINGLE_LINE_TEXT", value: "C-1" } };
    const result = mergeDraftIntoRecord(current, draft, form);
    expect(result.restoredLookups).toEqual(["customer"]);
  });
});
