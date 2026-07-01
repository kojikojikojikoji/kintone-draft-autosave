import { DraftAutosaveController, type KintoneAdapter } from "../kintone/controller";
import type { RecordData } from "../core";

// Mobile entry. Same controller, using the mobile.app.* record API and event
// names. Banner insertion uses the mobile header space (see dom-map.ts).

const adapter: KintoneAdapter = {
  platform: "mobile",
  getRecord: () =>
    (kintone.mobile.app.record.get()?.record as unknown as RecordData | undefined) ?? null,
  setRecord: (record) =>
    kintone.mobile.app.record.set({ record: record as unknown as KintoneRecord }),
  getAppId: () => kintone.mobile.app.getId(),
  getRecordId: () => {
    const id = kintone.mobile.app.record.getId();
    return id === null || id === undefined ? null : String(id);
  },
};

const controller = new DraftAutosaveController(adapter);

kintone.events.on(["mobile.app.record.create.show", "mobile.app.record.edit.show"], (event) => {
  void controller.onShow();
  return event;
});

kintone.events.on(
  ["mobile.app.record.create.submit.success", "mobile.app.record.edit.submit.success"],
  (event) => {
    controller.onSubmitSuccess();
    return event;
  },
);
