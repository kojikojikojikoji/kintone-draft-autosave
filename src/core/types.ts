// Plain, kintone-independent data shapes used across the core layer.

/** A single field value as returned by kintone's record.get(). */
export interface FieldValue {
  type: string;
  value: unknown;
}

/** A record is a map of field code to field value. */
export type RecordData = Record<string, FieldValue>;

/** One subtable row as it appears inside a SUBTABLE field value. */
export interface SubtableRow {
  id?: string;
  value: RecordData;
}

/** Field definition as returned by GET /k/v1/app/form/fields (subset). */
export interface FormFieldDef {
  type: string;
  code: string;
  label?: string;
  // Present on lookup fields. fieldMappings[].field lists copy-target codes.
  lookup?: {
    fieldMappings?: Array<{ field: string; relatedField?: string }>;
  };
  // Present on SUBTABLE fields: inner field definitions keyed by field code.
  fields?: Record<string, FormFieldDef>;
}

/** Map of field code to its form definition. */
export type FormFields = Record<string, FormFieldDef>;

/** Parsed plugin settings. */
export interface Settings {
  intervalSec: number;
  ttlHours: number;
}

/** The draft object stored in localStorage. */
export interface Draft {
  version: 1;
  savedAt: string;
  expiresAt: string;
  appId: string;
  recordId: string | null;
  userCode: string;
  recordUpdatedTime: string | null;
  fields: RecordData;
}
