// localStorage key layout: kp-das-<domain>-<appId>-<create|recordId>-<userCode>
// userCode is percent-encoded so codes containing @ . / etc. never collide.

export const KEY_PREFIX = "kp-das-";

export function buildDraftKey(params: {
  domain: string;
  appId: string | number;
  recordId: string | number | null;
  userCode: string;
}): string {
  const { domain, appId, recordId, userCode } = params;
  const recordPart = recordId === null || recordId === undefined ? "create" : String(recordId);
  return `${KEY_PREFIX}${domain}-${appId}-${recordPart}-${encodeURIComponent(userCode)}`;
}

/** True if a localStorage key belongs to this plugin. */
export function isDraftKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX);
}
