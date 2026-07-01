import {
  NON_SAVABLE_TYPES,
  collectLookupCopyTargets,
  collectLookupFields,
  formFieldTypes,
} from "./fields";
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
      const innerDefs = formFields[code]?.fields ?? {};
      const copyTargets = collectLookupCopyTargets(formFields);
      const skippedInner = new Set<string>();
      merged[code] = {
        type: "SUBTABLE",
        value: (draftField.value as SubtableRow[]).map((row) => {
          const rowValue: RecordData = {};
          for (const [innerCode, innerField] of Object.entries(row.value ?? {})) {
            const innerDef = innerDefs[innerCode];
            // Inner fields go through the same gate as top-level ones:
            // present on the form, same type, savable, not a lookup copy-target.
            if (!innerDef || innerDef.type !== innerField.type) {
              skippedInner.add(`${code}.${innerCode}`);
              continue;
            }
            if (NON_SAVABLE_TYPES.has(innerField.type) || copyTargets.has(innerCode)) {
              continue;
            }
            rowValue[innerCode] = innerField;
          }
          // No id: every restored row is a new row.
          return { value: rowValue };
        }),
      };
      skipped.push(...skippedInner);
    } else {
      merged[code] = { type: draftField.type, value: draftField.value };
    }
    if (lookupFields.has(code)) {
      restoredLookups.push(code);
    }
  }

  return { record: merged, skipped, restoredLookups };
}
