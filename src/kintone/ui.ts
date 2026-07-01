import type { DiffRow } from "../core";

// Record-screen UI built with createElement only (no innerHTML), all class and
// id names prefixed with kp-das- to avoid clashing with kintone or sibling
// plugins. Text is Japanese per the requirement doc.

const STYLE_ID = "kp-das-style";

const CSS = `
:root {
  --kp-text: #1f2933;
  --kp-text-sub: #5f6b7a;
  --kp-bg: #ffffff;
  --kp-border: #d5dbe1;
  --kp-primary: #0f6db3;
  --kp-primary-hover: #0b578f;
  --kp-danger: #b3261e;
  --kp-radius: 6px;
}
.kp-das-banner {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  margin: 8px 0;
  padding: 12px 16px;
  background: var(--kp-bg);
  border: 1px solid var(--kp-border);
  border-left: 4px solid var(--kp-primary);
  border-radius: var(--kp-radius);
  color: var(--kp-text);
  font-size: 13px;
  line-height: 1.5;
}
.kp-das-banner--warn { border-left-color: var(--kp-danger); }
.kp-das-banner__msg { flex: 1 1 auto; white-space: pre-line; }
.kp-das-banner__actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.kp-das-btn {
  font: inherit;
  cursor: pointer;
  border-radius: var(--kp-radius);
  padding: 6px 12px;
  border: 1px solid var(--kp-border);
  background: var(--kp-bg);
  color: var(--kp-text);
}
.kp-das-btn:focus-visible { outline: 2px solid var(--kp-primary); outline-offset: 2px; }
.kp-das-btn--primary { background: var(--kp-primary); border-color: var(--kp-primary); color: #fff; }
.kp-das-btn--primary:hover { background: var(--kp-primary-hover); }
.kp-das-btn--danger { border-color: var(--kp-danger); color: var(--kp-danger); background: var(--kp-bg); }
.kp-das-btn--text { border-color: transparent; background: transparent; color: var(--kp-primary); }
.kp-das-menu { position: relative; }
.kp-das-menu__list {
  position: absolute; right: 0; top: calc(100% + 4px); z-index: 10001;
  background: var(--kp-bg); border: 1px solid var(--kp-border); border-radius: var(--kp-radius);
  box-shadow: 0 2px 8px rgba(0,0,0,.15); min-width: 220px; padding: 4px;
}
.kp-das-menu__item {
  display: block; width: 100%; text-align: left; padding: 8px 12px; font: inherit;
  background: transparent; border: none; cursor: pointer; color: var(--kp-text); border-radius: 4px;
}
.kp-das-menu__item:hover { background: #f0f4f8; }
.kp-das-overlay {
  position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.kp-das-modal {
  background: var(--kp-bg); border-radius: var(--kp-radius); max-width: 720px; width: 100%;
  max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,.15);
}
.kp-das-modal__title { font-size: 15px; font-weight: 600; padding: 16px; border-bottom: 1px solid var(--kp-border); }
.kp-das-modal__body { padding: 16px; overflow: auto; }
.kp-das-modal__footer { padding: 12px 16px; border-top: 1px solid var(--kp-border); display: flex; justify-content: flex-end; gap: 8px; }
.kp-das-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.kp-das-table th, .kp-das-table td { border: 1px solid var(--kp-border); padding: 6px 10px; text-align: left; vertical-align: top; word-break: break-all; }
.kp-das-table th { background: #f7f8fa; font-weight: 600; }
.kp-das-note { margin-top: 12px; font-size: 12px; color: var(--kp-text-sub); }
.kp-das-dialog { max-width: 420px; }
.kp-das-dialog__body { padding: 16px; font-size: 13px; line-height: 1.6; }
`;

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function button(
  label: string,
  variant: "primary" | "danger" | "text" | "default",
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "kp-das-btn";
  if (variant === "primary") btn.classList.add("kp-das-btn--primary");
  if (variant === "danger") btn.classList.add("kp-das-btn--danger");
  if (variant === "text") btn.classList.add("kp-das-btn--text");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

export interface BannerOptions {
  message: string;
  warn: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  onDeleteAll: () => void;
}

const CONTAINER_ID = "kp-das-banner-container";

/** Remove any existing plugin banner/notice from a container (idempotency). */
export function clearBanner(container: HTMLElement): void {
  const existing = container.querySelector(`#${CONTAINER_ID}`);
  if (existing) {
    existing.remove();
  }
}

/** Render the restore banner. Rebuilt from scratch on each show event. */
export function renderBanner(container: HTMLElement, opts: BannerOptions): void {
  ensureStyles();
  clearBanner(container);

  const wrap = document.createElement("div");
  wrap.id = CONTAINER_ID;

  const banner = document.createElement("div");
  banner.className = "kp-das-banner" + (opts.warn ? " kp-das-banner--warn" : "");
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "下書きの復元");

  const msg = document.createElement("div");
  msg.className = "kp-das-banner__msg";
  msg.textContent = opts.message;
  banner.appendChild(msg);

  const actions = document.createElement("div");
  actions.className = "kp-das-banner__actions";

  const restoreBtn = button(
    "内容を確認して復元",
    opts.warn ? "default" : "primary",
    opts.onRestore,
  );
  const discardBtn = button("破棄", opts.warn ? "primary" : "default", opts.onDiscard);
  actions.appendChild(restoreBtn);
  actions.appendChild(discardBtn);

  // Menu with "delete all drafts".
  const menu = document.createElement("div");
  menu.className = "kp-das-menu";
  const menuBtn = button("メニュー", "default", () => {
    const open = menu.querySelector(".kp-das-menu__list");
    if (open) {
      open.remove();
      return;
    }
    const list = document.createElement("div");
    list.className = "kp-das-menu__list";
    list.setAttribute("role", "menu");
    const item = document.createElement("button");
    item.type = "button";
    item.className = "kp-das-menu__item";
    item.setAttribute("role", "menuitem");
    item.textContent = "保存済みの下書きをすべて削除";
    item.addEventListener("click", () => {
      list.remove();
      opts.onDeleteAll();
    });
    list.appendChild(item);
    menu.appendChild(list);
  });
  menuBtn.setAttribute("aria-label", "下書きメニュー");
  menu.appendChild(menuBtn);
  actions.appendChild(menu);

  banner.appendChild(actions);
  wrap.appendChild(banner);
  container.appendChild(wrap);

  // Initial focus follows the default action (FR-11).
  (opts.warn ? discardBtn : restoreBtn).focus();
}

export type NoticeKind = "success" | "stop";

/** Render a persistent notice with a close button (result / stop notices). */
export function renderNotice(container: HTMLElement, kind: NoticeKind, lines: string[]): void {
  ensureStyles();
  clearBanner(container);

  const wrap = document.createElement("div");
  wrap.id = CONTAINER_ID;
  const banner = document.createElement("div");
  banner.className = "kp-das-banner" + (kind === "stop" ? " kp-das-banner--warn" : "");
  banner.setAttribute("role", kind === "stop" ? "alert" : "status");

  const msg = document.createElement("div");
  msg.className = "kp-das-banner__msg";
  msg.textContent = lines.join("\n");
  banner.appendChild(msg);

  const actions = document.createElement("div");
  actions.className = "kp-das-banner__actions";
  actions.appendChild(button("閉じる", "text", () => wrap.remove()));
  banner.appendChild(actions);

  wrap.appendChild(banner);
  container.appendChild(wrap);
}

/**
 * Open the diff preview modal. Resolves true when the user confirms the
 * restore, false on cancel or Esc.
 */
export function openDiffModal(opts: {
  rows: DiffRow[];
  showAttachmentNote: boolean;
}): Promise<boolean> {
  ensureStyles();
  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "kp-das-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "下書きの内容");

    const modal = document.createElement("div");
    modal.className = "kp-das-modal";

    const title = document.createElement("div");
    title.className = "kp-das-modal__title";
    title.textContent = "下書きの内容";
    modal.appendChild(title);

    const body = document.createElement("div");
    body.className = "kp-das-modal__body";

    const table = document.createElement("table");
    table.className = "kp-das-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const h of ["フィールド", "現在の値", "下書きの値"]) {
      const th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const row of opts.rows) {
      const tr = document.createElement("tr");
      for (const cell of [row.label, row.current, row.draft]) {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    body.appendChild(table);

    if (opts.showAttachmentNote) {
      const note = document.createElement("p");
      note.className = "kp-das-note";
      note.textContent = "添付ファイルは復元されません。";
      body.appendChild(note);
    }
    modal.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "kp-das-modal__footer";
    const cancelBtn = button("キャンセル", "text", () => close(false));
    const confirmBtn = button("この内容で復元", "primary", () => close(true));
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const focusable = [confirmBtn, cancelBtn];
    confirmBtn.focus();

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key === "Tab") {
        trapFocus(e, focusable);
      }
    }

    function close(result: boolean): void {
      document.removeEventListener("keydown", onKeydown, true);
      overlay.remove();
      resolve(result);
    }

    document.addEventListener("keydown", onKeydown, true);
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });
  });
}

/** A confirm dialog with a danger-styled confirm button. Resolves the choice. */
export function confirmDialog(opts: { message: string; confirmLabel: string }): Promise<boolean> {
  ensureStyles();
  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "kp-das-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const modal = document.createElement("div");
    modal.className = "kp-das-modal kp-das-dialog";

    const body = document.createElement("div");
    body.className = "kp-das-dialog__body";
    body.textContent = opts.message;
    modal.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "kp-das-modal__footer";
    const cancelBtn = button("キャンセル", "text", () => close(false));
    const confirmBtn = button(opts.confirmLabel, "danger", () => close(true));
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const focusable = [confirmBtn, cancelBtn];
    confirmBtn.focus();

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key === "Tab") {
        trapFocus(e, focusable);
      }
    }
    function close(result: boolean): void {
      document.removeEventListener("keydown", onKeydown, true);
      overlay.remove();
      resolve(result);
    }
    document.addEventListener("keydown", onKeydown, true);
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });
  });
}

function trapFocus(e: KeyboardEvent, focusable: HTMLElement[]): void {
  if (focusable.length === 0) {
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
