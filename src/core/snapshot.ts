import { NON_SAVABLE_TYPES, collectLookupCopyTargets } from "./fields";
import type { FormFields, RecordData, SubtableRow } from "./types";

/**
 * Build the savable snapshot from a record and its form definition.
 * Drops non-savable field types and lookup copy-targets. Keeps the raw
 * record.get() value shape (including subtable row ids, which are stored but
 * not used on restore). The result is what gets written to localStorage.
 */
export function buildSnapshot(record: RecordData, formFields: FormFields): RecordData {
  const copyTargets = collectLookupCopyTargets(formFields);
  const snapshot: RecordData = {};
  for (const [code, field] of Object.entries(record)) {
    if (!field || typeof field !== "object") {
      continue;
    }
    if (NON_SAVABLE_TYPES.has(field.type)) {
      continue;
    }
    if (copyTargets.has(code)) {
      continue;
    }
    snapshot[code] = field;
  }
  return snapshot;
}

/**
 * Canonical JSON of a snapshot for equality checks. Keys are sorted and
 * subtable row ids are dropped, so equality reflects user-visible content only.
 */
export function canonicalize(snapshot: RecordData): string {
  return JSON.stringify(canonicalValue(snapshot));
}

function canonicalValue(record: RecordData): unknown {
  const codes = Object.keys(record).sort();
  const out: Record<string, unknown> = {};
  for (const code of codes) {
    const field = record[code];
    if (field.type === "SUBTABLE" && Array.isArray(field.value)) {
      out[code] = {
        type: "SUBTABLE",
        value: (field.value as SubtableRow[]).map((row) => ({
          // Drop id: it changes independently of visible content.
          value: canonicalValue(row.value ?? {}),
        })),
      };
    } else {
      out[code] = { type: field.type, value: field.value };
    }
  }
  return out;
}

/** True when two snapshots hold the same user-visible content. */
export function snapshotsEqual(a: RecordData, b: RecordData): boolean {
  return canonicalize(a) === canonicalize(b);
}
