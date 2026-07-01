import {
  buildDraftKey,
  buildDiffRows,
  buildSnapshot,
  canonicalize,
  computeExpiresAt,
  fieldLabel,
  formatBannerTime,
  hasAttachmentField,
  isUpdatedByOthers,
  mergeDraftIntoRecord,
  parseConfig,
  serializeDraft,
  snapshotsEqual,
  updatedTimeFieldCode,
} from "../core";
import type { Draft, FormFields, RecordData, Settings } from "../core";
import { getBannerContainer, type Platform } from "./dom-map";
import { getFormFields } from "./formFields";
import { clearBanner, confirmDialog, openDiffModal, renderBanner, renderNotice } from "./ui";
import {
  isStorageWritable,
  purgeExpiredDrafts,
  readDraft,
  removeAllDrafts,
  removeDraft,
  writeDraft,
} from "./storage";

/** Abstracts the desktop vs mobile kintone record API surface. */
export interface KintoneAdapter {
  platform: Platform;
  getRecord(): RecordData | null;
  setRecord(record: RecordData): void;
  getAppId(): number | null;
  getRecordId(): string | null;
}

interface ScreenState {
  key: string;
  container: HTMLElement;
  formFields: FormFields;
  timer: number | null;
  prevCanonical: string | null;
  pendingSave: boolean;
  stopped: boolean;
}

const SIZE_STOP = "入力内容が500KBを超えたため、下書きの自動保存を停止しました。";
const QUOTA_STOP = "ブラウザの保存領域が足りないため、下書きの自動保存を停止しました。";
const UPDATED_WARN =
  "下書きの保存後にこのレコードは更新されています。復元すると他の人の変更を上書きするおそれがあります。";

export class DraftAutosaveController {
  private readonly settings: Settings;
  private readonly userCode: string;
  private readonly timeZone: string;
  private readonly domain: string;
  private state: ScreenState | null = null;

  constructor(private readonly adapter: KintoneAdapter) {
    const config = kintone.plugin.app.getConfig("kintone-draft-autosave");
    this.settings = parseConfig(config?.config);
    const user = kintone.getLoginUser();
    this.userCode = user.code;
    this.timeZone = user.timeZone;
    this.domain = location.hostname;
  }

  /** Handle a create/edit show event. Idempotent per common spec section 4. */
  async onShow(): Promise<void> {
    this.stopTimer();
    this.state = null;

    if (!isStorageWritable()) {
      // EC-1: private browsing etc. Disable silently.
      console.warn("[kintone-draft-autosave] localStorage is not writable; disabled.");
      return;
    }

    purgeExpiredDrafts(Date.now());

    const appId = this.adapter.getAppId();
    if (appId === null) {
      return;
    }

    const container = getBannerContainer(this.adapter.platform);
    if (!container) {
      // EC-14: give up banner and auto-save, but never block the form.
      console.warn(
        "[kintone-draft-autosave] banner container not found; disabled for this screen.",
      );
      return;
    }

    let formFields: FormFields;
    try {
      formFields = await getFormFields(appId);
    } catch (err) {
      // EC-15: without form info, copy-target exclusion cannot be guaranteed.
      console.warn("[kintone-draft-autosave] failed to load form fields; disabled.", err);
      return;
    }

    const recordId = this.adapter.getRecordId();
    const key = buildDraftKey({ domain: this.domain, appId, recordId, userCode: this.userCode });

    const state: ScreenState = {
      key,
      container,
      formFields,
      timer: null,
      prevCanonical: null,
      pendingSave: false,
      stopped: false,
    };
    this.state = state;

    const record = this.adapter.getRecord();
    if (record) {
      const currentSnapshot = buildSnapshot(record, formFields);
      state.prevCanonical = canonicalize(currentSnapshot);

      const draft = readDraft(key);
      if (draft && this.shouldOfferRestore(draft, currentSnapshot)) {
        state.pendingSave = true;
        this.showRestoreBanner(state, draft, record);
      }
    }

    this.startTimer(state);
  }

  // FR-19: multiple tabs on the same record are last-write-wins. The plugin
  // intentionally does not register a `storage` listener, because reacting to
  // another tab's save every interval would produce noise with no useful
  // action. Which tab's content survives is shown by the next restore banner.

  /** Remove the draft after a successful save (FR-16). */
  onSubmitSuccess(): void {
    if (this.state) {
      removeDraft(this.state.key);
    }
    this.stopTimer();
  }

  private shouldOfferRestore(draft: Draft, currentSnapshot: RecordData): boolean {
    // FR-8: skip when the draft equals the current input (EC-11). The draft is
    // kept in that case; TTL handles cleanup.
    return !snapshotsEqual(draft.fields, currentSnapshot);
  }

  private currentUpdatedTime(record: RecordData, formFields: FormFields): string | null {
    const code = updatedTimeFieldCode(formFields);
    if (!code) {
      return null;
    }
    const value = record[code]?.value;
    return typeof value === "string" ? value : null;
  }

  private showRestoreBanner(state: ScreenState, draft: Draft, record: RecordData): void {
    const warn = isUpdatedByOthers(
      draft.recordUpdatedTime,
      this.currentUpdatedTime(record, state.formFields),
    );
    const base = `${formatBannerTime(draft.savedAt, this.timeZone)} の下書きがあります。`;
    const message = warn ? `${base}\n${UPDATED_WARN}` : base;

    renderBanner(state.container, {
      message,
      warn,
      onRestore: () => {
        void this.onRestore(state, draft);
      },
      onDiscard: () => {
        void this.onDiscard(state);
      },
      onDeleteAll: () => {
        void this.onDeleteAll(state);
      },
    });
  }

  private async onRestore(state: ScreenState, draft: Draft): Promise<void> {
    const current = this.adapter.getRecord();
    if (!current) {
      return;
    }
    const rows = buildDiffRows(current, draft.fields, state.formFields, this.timeZone);
    const confirmed = await openDiffModal({
      rows,
      showAttachmentNote: hasAttachmentField(state.formFields),
    });
    if (!confirmed) {
      // Cancel: leave the form untouched; keep the banner and hold saving.
      return;
    }
    this.applyRestore(state, draft);
  }

  private applyRestore(state: ScreenState, draft: Draft): void {
    const current = this.adapter.getRecord();
    if (!current) {
      return;
    }
    const merge = mergeDraftIntoRecord(current, draft.fields, state.formFields);
    this.adapter.setRecord(merge.record);

    const lines = ["下書きを復元しました。"];
    if (merge.skipped.length > 0) {
      lines.push(
        `次の項目は復元できませんでした: ${merge.skipped.join("、")}（フォームから削除または型変更されたため）`,
      );
    }
    for (const code of merge.restoredLookups) {
      lines.push(
        `ルックアップ「${fieldLabel(state.formFields, code)}」は値のみ復元しました。取得を実行して関連フィールドを更新してください。`,
      );
    }
    renderNotice(state.container, "success", lines);

    // Resume auto-save; the restored content becomes the next saved draft.
    state.pendingSave = false;
    const applied = this.adapter.getRecord();
    state.prevCanonical = applied ? canonicalize(buildSnapshot(applied, state.formFields)) : null;
  }

  private async onDiscard(state: ScreenState): Promise<void> {
    const confirmed = await confirmDialog({
      message: "下書きを削除します。この操作は取り消せません。",
      confirmLabel: "削除する",
    });
    if (!confirmed) {
      return;
    }
    removeDraft(state.key);
    clearBanner(state.container);
    state.pendingSave = false;
  }

  private async onDeleteAll(state: ScreenState): Promise<void> {
    const confirmed = await confirmDialog({
      message: "このブラウザに保存されている下書きをすべて削除します。よろしいですか？",
      confirmLabel: "削除する",
    });
    if (!confirmed) {
      return;
    }
    removeAllDrafts();
    clearBanner(state.container);
    state.pendingSave = false;
  }

  private startTimer(state: ScreenState): void {
    state.timer = window.setInterval(() => {
      this.tick(state);
    }, this.settings.intervalSec * 1000);
  }

  private stopTimer(): void {
    if (this.state?.timer !== null && this.state?.timer !== undefined) {
      window.clearInterval(this.state.timer);
      this.state.timer = null;
    }
  }

  private tick(state: ScreenState): void {
    const record = this.adapter.getRecord();
    if (!record) {
      // FR-7: screen navigated away.
      this.stopTimer();
      return;
    }
    if (state.stopped || state.pendingSave) {
      return;
    }

    const snapshot = buildSnapshot(record, state.formFields);
    const canonical = canonicalize(snapshot);
    if (canonical === state.prevCanonical) {
      return;
    }

    const appId = this.adapter.getAppId();
    const recordId = this.adapter.getRecordId();
    const savedAt = new Date().toISOString();
    const draft: Draft = {
      version: 1,
      savedAt,
      expiresAt: computeExpiresAt(savedAt, this.settings.ttlHours),
      appId: String(appId ?? ""),
      recordId,
      userCode: this.userCode,
      recordUpdatedTime: this.currentUpdatedTime(record, state.formFields),
      fields: snapshot,
    };

    const serialized = serializeDraft(draft);
    // FR-5: size guard using the serialized draft (UTF-8 bytes).
    if (new TextEncoder().encode(serialized).length > 512_000) {
      this.stopAutoSave(state, SIZE_STOP);
      return;
    }

    const result = writeDraft(state.key, draft);
    if (result === "quota") {
      this.stopAutoSave(state, QUOTA_STOP);
      return;
    }
    state.prevCanonical = canonical;
  }

  private stopAutoSave(state: ScreenState, message: string): void {
    state.stopped = true;
    this.stopTimer();
    renderNotice(state.container, "stop", [message]);
  }
}
