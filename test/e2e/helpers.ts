import type { Page } from "@playwright/test";

// Shared helpers for the E2E flows. Every value that identifies an environment
// comes from process.env; there are no hard-coded hosts or credentials.

export interface Env {
  baseUrl: string;
  username: string;
  password: string;
  appId: string;
}

export function readEnv(): Env | null {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const username = process.env.KINTONE_USERNAME;
  const password = process.env.KINTONE_PASSWORD;
  const appId = process.env.KINTONE_APP_ID;
  if (!baseUrl || !username || !password || !appId) {
    return null;
  }
  return { baseUrl, username, password, appId };
}

export async function login(page: Page, env: Env): Promise<void> {
  await page.goto(`${env.baseUrl}/login`);
  await page.fill('input[name="username"]', env.username);
  await page.fill('input[name="password"]', env.password);
  await page.click('.login-button, button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

export async function openCreate(page: Page, env: Env): Promise<void> {
  await page.goto(`${env.baseUrl}/k/${env.appId}/edit`);
  await page.waitForLoadState("networkidle");
}

/** Read all draft-autosave keys from localStorage in the page context. */
export async function draftKeys(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("kp-das-")) {
        keys.push(key);
      }
    }
    return keys;
  });
}

export async function clearDraftKeys(page: Page): Promise<void> {
  await page.evaluate(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("kp-das-")) {
        keys.push(key);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  });
}
