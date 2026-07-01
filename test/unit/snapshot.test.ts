import { describe, expect, it } from "vitest";
import { buildSnapshot, snapshotsEqual } from "../../src/core/snapshot";
import type { FormFields, RecordData } from "../../src/core/types";

const plainForm: FormFields = {
  title: { type: "SINGLE_LINE_TEXT", code: "title" },
  amount: { type: "NUMBER", code: "amount" },
  total: { type: "CALC", code: "total" },
  file: { type: "FILE", code: "file" },
};

function baseRecord(): RecordData {
  return {
    title: { type: "SINGLE_LINE_TEXT", value: "report" },
    amount: { type: "NUMBER", value: "100" },
    total: { type: "CALC", value: "100" },
    file: { type: "FILE", value: [] },
  };
}

describe("snapshot diff", () => {
  it("TC-3: identical records produce no diff", () => {
    const a = buildSnapshot(baseRecord(), plainForm);
    const b = buildSnapshot(baseRecord(), plainForm);
    expect(snapshotsEqual(a, b)).toBe(true);
  });

  it("TC-4: differing text produces a diff", () => {
    const r2 = baseRecord();
    r2.title.value = "changed";
    const a = buildSnapshot(baseRecord(), plainForm);
    const b = buildSnapshot(r2, plainForm);
    expect(snapshotsEqual(a, b)).toBe(false);
  });

  it("TC-5: non-savable fields (attachment, calc) are excluded from the diff", () => {
    const r2 = baseRecord();
    r2.total.value = "999";
    r2.file.value = [{ fileKey: "abc", name: "x.pdf" }];
    const a = buildSnapshot(baseRecord(), plainForm);
    const b = buildSnapshot(r2, plainForm);
    expect(a.total).toBeUndefined();
    expect(a.file).toBeUndefined();
    expect(snapshotsEqual(a, b)).toBe(true);
  });

  it("TC-6: lookup copy-target is excluded, lookup key field is kept", () => {
    const form: FormFields = {
      customer: {
        type: "SINGLE_LINE_TEXT",
        code: "customer",
        lookup: { fieldMappings: [{ field: "customer_addr", relatedField: "addr" }] },
      },
      customer_addr: { type: "SINGLE_LINE_TEXT", code: "customer_addr" },
      title: { type: "SINGLE_LINE_TEXT", code: "title" },
    };
    const record: RecordData = {
      customer: { type: "SINGLE_LINE_TEXT", value: "C-001" },
      customer_addr: { type: "SINGLE_LINE_TEXT", value: "Tokyo" },
      title: { type: "SINGLE_LINE_TEXT", value: "t" },
    };
    const snap = buildSnapshot(record, form);
    expect(snap.customer).toBeDefined();
    expect(snap.title).toBeDefined();
    expect(snap.customer_addr).toBeUndefined();
  });

  it("ignores subtable row id when comparing", () => {
    const form: FormFields = {
      items: {
        type: "SUBTABLE",
        code: "items",
        fields: { name: { type: "SINGLE_LINE_TEXT", code: "name" } },
      },
    };
    const withId: RecordData = {
      items: {
        type: "SUBTABLE",
        value: [{ id: "1", value: { name: { type: "SINGLE_LINE_TEXT", value: "a" } } }],
      },
    };
    const withoutId: RecordData = {
      items: {
        type: "SUBTABLE",
        value: [{ value: { name: { type: "SINGLE_LINE_TEXT", value: "a" } } }],
      },
    };
    expect(snapshotsEqual(buildSnapshot(withId, form), buildSnapshot(withoutId, form))).toBe(true);
  });
});
