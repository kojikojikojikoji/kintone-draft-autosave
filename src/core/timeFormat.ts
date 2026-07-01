// Time formatting for banner and value display, in the login user's timezone.

function partsInZone(
  iso: string,
  timeZone: string,
): { month: string; day: string; hour: string; minute: string; year: string } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  // hour can come back as "24" at midnight in some engines; normalize to "00".
  let hour = get("hour");
  if (hour === "24") {
    hour = "00";
  }
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

/** "MM月DD日 HH:mm" in the given timezone (FR-9). Falls back to the raw ISO. */
export function formatBannerTime(iso: string, timeZone: string): string {
  const p = partsInZone(iso, timeZone);
  if (!p) {
    return iso;
  }
  return `${p.month}月${p.day}日 ${p.hour}:${p.minute}`;
}

/** "YYYY-MM-DD HH:mm" in the given timezone, for datetime field display. */
export function formatDateTime(iso: string, timeZone: string): string {
  const p = partsInZone(iso, timeZone);
  if (!p) {
    return iso;
  }
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
