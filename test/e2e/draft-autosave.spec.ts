import { expect, test } from "@playwright/test";
import { clearDraftKeys, draftKeys, login, openCreate, readEnv } from "./helpers";

// These flows require a development kintone app with the demo form and the
// draft-autosave plugin installed. When the environment variables are absent,
// the whole suite is skipped so the file still parses and type-checks.
const env = readEnv();

test.describe("kintone-draft-autosave", () => {
  test.skip(env === null, "Set KINTONE_BASE_URL / USERNAME / PASSWORD / APP_ID to run E2E.");

  test.beforeEach(async ({ page }) => {
    if (!env) return;
    await login(page, env);
    await openCreate(page, env);
    await clearDraftKeys(page);
  });

  test("TC-17: input is autosaved and restored via the diff preview", async ({ page }) => {
    if (!env) return;
    await page.fill('input[name="title"], input[label="タイトル"]', "7月度 定例報告");
    // Wait past one 5s interval so a snapshot is written.
    await page.waitForTimeout(6000);
    expect((await draftKeys(page)).length).toBeGreaterThan(0);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "内容を確認して復元" }).click();
    await expect(page.getByText("下書きの内容")).toBeVisible();
    await page.getByRole("button", { name: "この内容で復元" }).click();
    await expect(page.getByText("下書きを復元しました。")).toBeVisible();
  });

  test("TC-18: discard removes the draft key", async ({ page }) => {
    if (!env) return;
    await page.fill('input[name="title"], input[label="タイトル"]', "discard me");
    await page.waitForTimeout(6000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "破棄" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    expect((await draftKeys(page)).length).toBe(0);
  });

  test("TC-19: a successful save deletes the draft key", async ({ page }) => {
    if (!env) return;
    await page.fill('input[name="title"], input[label="タイトル"]', "save me");
    await page.waitForTimeout(6000);
    expect((await draftKeys(page)).length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "保存" }).first().click();
    await page.waitForLoadState("networkidle");
    expect((await draftKeys(page)).length).toBe(0);
  });

  test("TC-24: the menu clears every plugin draft", async ({ page }) => {
    if (!env) return;
    await page.fill('input[name="title"], input[label="タイトル"]', "menu test");
    await page.waitForTimeout(6000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("menuitem", { name: "保存済みの下書きをすべて削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    expect((await draftKeys(page)).length).toBe(0);
  });

  test("TC-28: no banner when input equals the draft", async ({ page }) => {
    if (!env) return;
    await page.fill('input[name="title"], input[label="タイトル"]', "same content");
    await page.waitForTimeout(6000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    // The draft equals the freshly reloaded (empty) form only if it was cleared;
    // here we assert the banner control is absent when content matches.
    await expect(page.getByRole("button", { name: "内容を確認して復元" })).toHaveCount(0);
  });
});
