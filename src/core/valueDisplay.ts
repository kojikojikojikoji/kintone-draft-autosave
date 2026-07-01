import { fieldLabel } from "./fields";
import { canonicalize } from "./snapshot";
import { formatDateTime } from "./timeFormat";
import type { FieldValue, FormFields, RecordData, SubtableRow } from "./types";

const MAX_LEN = 100;

function truncate(text: string): string {
  return text.length > MAX_LEN ? `${text.slice(0, MAX_LEN)}…` : text;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Render a single field value to a display string for the diff preview.
 * Follows the value rules in requirement doc section 6. Subtables are handled
 * separately (row counts), not here.
 */
export function formatFieldValue(field: FieldValue | undefined, timeZone: string): string {
  if (!field || isEmpty(field.value)) {
    return "(空)";
  }
  switch (field.type) {
    case "USER_SELECT":
    case "ORGANIZATION_SELECT":
    case "GROUP_SELECT": {
      const entries = field.value as Array<{ name?: string; code?: string }>;
      return truncate(entries.map((e) => e.name ?? e.code ?? "").join("、"));
    }
    case "CHECK_BOX":
    case "MULTI_SELECT": {
      const values = field.value as string[];
      return truncate(values.join("、"));
    }
    case "DATETIME":
      return formatDateTime(String(field.value), timeZone);
    case "RICH_TEXT":
      return truncate(stripHtml(String(field.value)));
    default:
      return truncate(String(field.value));
  }
}

export interface DiffRow {
  label: string;
  current: string;
  draft: string;
}

function fieldsDiffer(a: FieldValue | undefined, b: FieldValue | undefined): boolean {
  const norm = (f: FieldValue | undefined): string =>
    f ? canonicalize({ __f: f } as RecordData) : "";
  return norm(a) !== norm(b);
}

function rowCount(field: FieldValue | undefined): number {
  return field && Array.isArray(field.value) ? (field.value as SubtableRow[]).length : 0;
}

/**
 * Build the rows for the diff preview: only fields whose current value differs
 * from the draft value. Subtable rows show a count summary rather than a
 * cell-level diff (requirement doc section 6).
 */
export function buildDiffRows(
  current: RecordData,
  draftFields: RecordData,
  formFields: FormFields,
  timeZone: string,
): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const [code, draftField] of Object.entries(draftFields)) {
    const currentField = current[code];
    if (!fieldsDiffer(currentField, draftField)) {
      continue;
    }
    const label = fieldLabel(formFields, code);
    if (draftField.type === "SUBTABLE") {
      rows.push({
        label,
        current: `${rowCount(currentField)}行`,
        draft: `${rowCount(draftField)}行（内容に変更があります）`,
      });
    } else {
      rows.push({
        label,
        current: formatFieldValue(currentField, timeZone),
        draft: formatFieldValue(draftField, timeZone),
      });
    }
  }
  return rows;
}
