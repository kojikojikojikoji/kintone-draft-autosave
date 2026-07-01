import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { FormFields } from "../core";

// Fetch and cache the form field definitions per app. The definitions are used
// to find lookup copy-targets and the UPDATED_TIME field. Cached in memory so a
// screen transition does not refetch. rest-api-client builds the correct URL
// for guest spaces on its own.

const cache = new Map<number, FormFields>();

interface FieldProperties {
  [code: string]: {
    type: string;
    code: string;
    label?: string;
    lookup?: { fieldMappings?: Array<{ field: string; relatedField?: string }> };
    fields?: FieldProperties;
  };
}

export async function getFormFields(appId: number): Promise<FormFields> {
  const cached = cache.get(appId);
  if (cached) {
    return cached;
  }
  const client = new KintoneRestAPIClient();
  const resp = (await client.app.getFormFields({ app: appId })) as {
    properties: FieldProperties;
  };
  const fields = resp.properties as FormFields;
  cache.set(appId, fields);
  return fields;
}

/** Test hook: clear the cache. */
export function clearFormFieldsCache(): void {
  cache.clear();
}
