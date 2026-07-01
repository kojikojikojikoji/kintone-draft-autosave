import type { FormFields } from "./types";

// Field types that are never saved: they are read-only or cannot be
// represented in localStorage. See requirement doc section 3.
export const NON_SAVABLE_TYPES = new Set<string>([
  "FILE", // attachment
  "CALC",
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CATEGORY",
  "__ID__",
  "__REVISION__",
]);

/**
 * Collect field codes that are lookup copy-targets. A lookup field lists the
 * fields it copies into via lookup.fieldMappings[].field. Those targets are
 * excluded from the snapshot so a restore never desyncs them from the lookup
 * source. The lookup field itself (the key holder) is kept.
 * Includes copy-targets declared inside subtables.
 */
export function collectLookupCopyTargets(formFields: FormFields): Set<string> {
  const targets = new Set<string>();
  const scan = (defs: FormFields): void => {
    for (const def of Object.values(defs)) {
      if (def.lookup?.fieldMappings) {
        for (const mapping of def.lookup.fieldMappings) {
          if (mapping.field) {
            targets.add(mapping.field);
          }
        }
      }
      if (def.fields) {
        scan(def.fields);
      }
    }
  };
  scan(formFields);
  return targets;
}

/**
 * Field codes that carry a lookup configuration (the lookup itself, not the
 * copy-targets). Used to build the "re-run the lookup" notice after a restore.
 */
export function collectLookupFields(formFields: FormFields): Set<string> {
  const lookups = new Set<string>();
  for (const [code, def] of Object.entries(formFields)) {
    if (def.lookup) {
      lookups.add(code);
    }
  }
  return lookups;
}

/** Map of field code to its declared type at the top level of the form. */
export function formFieldTypes(formFields: FormFields): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [code, def] of Object.entries(formFields)) {
    map[code] = def.type;
  }
  return map;
}

/** Human-facing label for a field code, falling back to the code itself. */
export function fieldLabel(formFields: FormFields, code: string): string {
  return formFields[code]?.label ?? code;
}

/** True if the form declares at least one attachment field. */
export function hasAttachmentField(formFields: FormFields): boolean {
  const scan = (defs: FormFields): boolean => {
    for (const def of Object.values(defs)) {
      if (def.type === "FILE") {
        return true;
      }
      if (def.fields && scan(def.fields)) {
        return true;
      }
    }
    return false;
  };
  return scan(formFields);
}

/** The field code of the UPDATED_TIME field, if the form has one. */
export function updatedTimeFieldCode(formFields: FormFields): string | null {
  for (const [code, def] of Object.entries(formFields)) {
    if (def.type === "UPDATED_TIME") {
      return code;
    }
  }
  return null;
}
