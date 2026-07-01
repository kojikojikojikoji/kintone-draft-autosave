import { z } from "zod";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = { intervalSec: 5, ttlHours: 24 };

export const INTERVAL_CHOICES = [3, 5, 10, 30] as const;
export const TTL_CHOICES = [1, 24, 72] as const;

const settingsSchema = z.object({
  intervalSec: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(30)]),
  ttlHours: z.union([z.literal(1), z.literal(24), z.literal(72)]),
});

const configSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
});

/**
 * Parse the stored config JSON into settings. Any failure (missing key, bad
 * version, out-of-range value, unparseable JSON) falls back to defaults so the
 * plugin keeps working (common spec section 4).
 */
export function parseConfig(configString: string | undefined | null): Settings {
  if (!configString) {
    return { ...DEFAULT_SETTINGS };
  }
  let data: unknown;
  try {
    data = JSON.parse(configString);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  const result = configSchema.safeParse(data);
  if (!result.success) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...result.data.settings };
}

/** Serialize settings to the JSON string stored under the single "config" key. */
export function serializeConfig(settings: Settings): string {
  return JSON.stringify({ version: 1, settings });
}
