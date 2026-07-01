import { DraftAutosaveController, type KintoneAdapter } from "../kintone/controller";
import type { RecordData } from "../core";

// Desktop entry. Registers create/edit show and submit-success handlers and
// delegates all behavior to the shared controller. One controller instance per
// page load; a new show event resets its per-screen state.

const adapter: KintoneAdapter = {
  platform: "desktop",
  getRecord: () => (kintone.app.record.get()?.record as unknown as RecordData | undefined) ?? null,
  setRecord: (record) => kintone.app.record.set({ record: record as unknown as KintoneRecord }),
  getAppId: () => kintone.app.getId(),
  getRecordId: () => {
    const id = kintone.app.record.getId();
    return id === null || id === undefined ? null : String(id);
  },
};

const controller = new DraftAutosaveController(adapter);

kintone.events.on(["app.record.create.show", "app.record.edit.show"], (event) => {
  void controller.onShow();
  return event;
});

kintone.events.on(
  ["app.record.create.submit.success", "app.record.edit.submit.success"],
  (event) => {
    controller.onSubmitSuccess();
    return event;
  },
);
