import themeCss from "./theme.css?raw";
import {
  DEFAULT_SETTINGS,
  INTERVAL_CHOICES,
  TTL_CHOICES,
  parseConfig,
  serializeConfig,
} from "../core";
import type { Settings } from "../core";

// Settings screen. Two required radio groups (interval, TTL). Values are always
// valid, so there is no field-level validation. On save, the settings are
// written as a single JSON string under the "config" key.

const PLUGIN_ID = "kintone-draft-autosave";
const TITLE = "kintone-draft-autosave 設定";
const LEAD = "入力内容を一定間隔で自動保存し、画面を閉じても復元できるようにします。";

const intervalLabels: Record<number, string> = { 3: "3秒", 5: "5秒", 10: "10秒", 30: "30秒" };
const ttlLabels: Record<number, string> = { 1: "1時間", 24: "24時間", 72: "72時間" };

function injectStyles(): void {
  const style = document.createElement("style");
  style.textContent = themeCss;
  document.head.appendChild(style);
}

function radioGroup(
  name: string,
  choices: readonly number[],
  labels: Record<number, string>,
  selected: number,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "kp-das-radios";
  wrap.setAttribute("role", "radiogroup");
  for (const value of choices) {
    const label = document.createElement("label");
    label.className = "kp-das-radio";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = String(value);
    input.checked = value === selected;
    const span = document.createElement("span");
    span.textContent = labels[value];
    label.appendChild(input);
    label.appendChild(span);
    wrap.appendChild(label);
  }
  return wrap;
}

function selectedValue(name: string, fallback: number): number {
  const checked = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return checked ? Number(checked.value) : fallback;
}

function field(labelText: string, descText: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "kp-das-field";
  const label = document.createElement("span");
  label.className = "kp-das-field__label";
  label.textContent = labelText;
  const desc = document.createElement("p");
  desc.className = "kp-das-field__desc";
  desc.textContent = descText;
  wrap.appendChild(label);
  wrap.appendChild(control);
  wrap.appendChild(desc);
  return wrap;
}

function render(settings: Settings): void {
  injectStyles();
  document.body.className = "kp-das-config";

  const inner = document.createElement("div");
  inner.className = "kp-das-config__inner";

  const h1 = document.createElement("h1");
  h1.textContent = TITLE;
  const lead = document.createElement("p");
  lead.className = "kp-das-config__lead";
  lead.textContent = LEAD;
  inner.appendChild(h1);
  inner.appendChild(lead);

  const card = document.createElement("div");
  card.className = "kp-das-card";
  const cardTitle = document.createElement("h2");
  cardTitle.className = "kp-das-card__title";
  cardTitle.textContent = "自動保存";
  card.appendChild(cardTitle);

  card.appendChild(
    field(
      "保存間隔",
      "入力内容に変化があったときだけ保存します。",
      radioGroup("intervalSec", INTERVAL_CHOICES, intervalLabels, settings.intervalSec),
    ),
  );
  card.appendChild(
    field(
      "下書きの保存期間",
      "期限を過ぎた下書きは、画面を開いたときに削除します。",
      radioGroup("ttlHours", TTL_CHOICES, ttlLabels, settings.ttlHours),
    ),
  );

  const bar = document.createElement("div");
  bar.className = "kp-das-bar";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "kp-das-btn kp-das-btn--text";
  cancel.textContent = "キャンセル";
  cancel.addEventListener("click", () => {
    history.back();
  });
  const save = document.createElement("button");
  save.type = "button";
  save.className = "kp-das-btn kp-das-btn--primary";
  save.textContent = "保存する";
  save.addEventListener("click", onSave);
  bar.appendChild(cancel);
  bar.appendChild(save);
  card.appendChild(bar);

  inner.appendChild(card);
  document.body.appendChild(inner);
}

function onSave(): void {
  const settings: Settings = {
    intervalSec: selectedValue("intervalSec", DEFAULT_SETTINGS.intervalSec),
    ttlHours: selectedValue("ttlHours", DEFAULT_SETTINGS.ttlHours),
  };
  kintone.plugin.app.setConfig({ config: serializeConfig(settings) }, () => {
    // kintone reloads the app settings page after a successful save.
  });
}

const stored = kintone.plugin.app.getConfig(PLUGIN_ID);
render(parseConfig(stored?.config));
