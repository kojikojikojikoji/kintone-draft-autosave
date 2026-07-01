// All DOM-position dependencies live here so a kintone UI change has a single
// repair point. The plugin uses the official space-element getters, which are
// stable API, so there are no CSS selectors to maintain today.

export type Platform = "desktop" | "mobile";

/**
 * The element to insert the restore banner into (FR: section 6).
 * Desktop uses the header menu space; mobile uses the header space.
 * Returns null when kintone does not expose the element (EC-14).
 */
export function getBannerContainer(platform: Platform): HTMLElement | null {
  try {
    if (platform === "desktop") {
      return kintone.app.record.getHeaderMenuSpaceElement?.() ?? null;
    }
    return kintone.mobile.app.getHeaderSpaceElement?.() ?? null;
  } catch {
    return null;
  }
}
