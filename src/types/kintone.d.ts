// Minimal type surface for the kintone global used by this plugin. It covers
// only the members this code touches, not the full kintone JS API.

export {};

declare global {
  interface KintoneRecordField {
    type: string;
    value: unknown;
    // Subtable rows carry an optional id; other fields do not.
    [extra: string]: unknown;
  }

  type KintoneRecord = Record<string, KintoneRecordField>;

  interface KintoneEvent {
    appId: number;
    recordId?: number | string;
    record: KintoneRecord;
    [extra: string]: unknown;
  }

  type KintoneEventHandler = (event: KintoneEvent) => KintoneEvent | Promise<KintoneEvent>;

  interface KintoneLoginUser {
    id: string;
    code: string;
    name: string;
    timeZone: string;
    [extra: string]: unknown;
  }

  interface KintoneRecordApi {
    get(): { record: KintoneRecord } | null | undefined;
    set(data: { record: KintoneRecord }): void;
    getId(): number | null;
    getHeaderMenuSpaceElement?(): HTMLElement | null;
    getSpaceElement?(code: string): HTMLElement | null;
  }

  interface KintoneAppApi {
    getId(): number | null;
    record: KintoneRecordApi;
    getHeaderMenuSpaceElement?(): HTMLElement | null;
  }

  interface KintoneMobileAppApi {
    getId(): number | null;
    record: KintoneRecordApi;
    getHeaderSpaceElement?(): HTMLElement | null;
  }

  interface KintonePluginApp {
    getConfig(id: string): Record<string, string>;
    setConfig(config: Record<string, string>, callback?: () => void): void;
    getId?(): string;
  }

  interface KintoneNamespace {
    app: KintoneAppApi;
    mobile: { app: KintoneMobileAppApi };
    events: {
      on(events: string | string[], handler: KintoneEventHandler): void;
    };
    plugin: { app: KintonePluginApp };
    getLoginUser(): KintoneLoginUser;
    getRequestToken?(): string;
    api: {
      url(path: string, detectGuestSpace?: boolean): string;
    };
  }

  const kintone: KintoneNamespace;
}
