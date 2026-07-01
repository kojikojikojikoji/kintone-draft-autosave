import { collectLookupFields, formFieldTypes } from "./fields";
import type { FormFields, RecordData, SubtableRow } from "./types";

export interface MergeResult {
  /** The record to hand to record.set(). */
  record: RecordData;
  /** Draft field codes that could not be applied (removed or type-changed). */
  skipped: string[];
  /** Lookup field codes whose key value was restored (FR-14). */
  restoredLookups: string[];
}

/**
 * Merge draft field values onto the current record (FR-12).
 * A draft field is applied only when the current form still has that code with
 * the same type. Subtables are fully replaced with the draft rows, and row ids
 * are dropped so kintone treats every row as new (avoids save errors from stale
 * ids). Fields that are missing or type-changed are skipped and reported.
 */
export function mergeDraftIntoRecord(
  current: RecordData,
  draftFields: RecordData,
  formFields: FormFields,
): MergeResult {
  const types = formFieldTypes(formFields);
  const lookupFields = collectLookupFields(formFields);
  const merged: RecordData = { ...current };
  const skipped: string[] = [];
  const restoredLookups: string[] = [];

  for (const [code, draftField] of Object.entries(draftFields)) {
    const currentType = types[code];
    if (currentType === undefined || currentType !== draftField.type) {
      skipped.push(code);
      continue;
    }
    if (draftField.type === "SUBTABLE" && Array.isArray(draftField.value)) {
      merged[code] = {
        type: "SUBTABLE",
        value: (draftField.value as SubtableRow[]).map((row) => ({
          // No id: every restored row is a new row.
          value: row.value ?? {},
        })),
      };
    } else {
      merged[code] = { type: draftField.type, value: draftField.value };
    }
    if (lookupFields.has(code)) {
      restoredLookups.push(code);
    }
  }

  return { record: merged, skipped, restoredLookups };
}
