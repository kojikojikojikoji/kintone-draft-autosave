# kintone-draft-autosave

Documentation in Japanese: [README.ja.md](./README.ja.md)

Auto-save what you type on a record create or edit screen, and restore it after the tab is closed, the session expires, or the browser crashes. kintone does not keep unsaved edits on the server, so a lost screen means retyping a long report or a many-row subtable. This plugin takes a snapshot of the form on a timer (5 seconds by default) and writes it to the browser's localStorage only when the content changed. Nothing is sent to an external server.

Works on desktop and mobile, for create and edit screens (including "reuse record", treated as create).

## What it does

- Saves a snapshot every 3, 5, 10, or 30 seconds (your choice) when the input changed since the last snapshot.
- Shows a banner at the top of the form when a saved draft exists, with buttons to review and restore or to discard. It never overwrites the form without your confirmation.
- Restores through a diff preview that lists the fields where the draft differs from the current form.
- Keeps drafts per browser, per app, per record, and per user. Deletes a draft when the record saves, or when its retention period passes.

## Install

1. Build the plugin zip:
   ```
   npm install
   npm run build
   npm run pack
   ```
   `npm run pack` writes `dist/plugin.zip`. On the first run it also generates `private.ppk` and keeps it in the project root (git-ignored). Reuse the same `private.ppk` for later builds so the plugin id stays stable.
2. In kintone, open the app settings, go to Plugins, add `dist/plugin.zip`, then add the plugin to the app.
3. Update the app to apply.

## Settings

Two options, both radio buttons:

- Save interval: 3, 5, 10, or 30 seconds. Default 5. A snapshot is written only when the form changed.
- Draft retention: 1, 24, or 72 hours. Default 24. Drafts past their expiry are deleted when a screen opens. Changing the retention affects drafts saved after the change; existing drafts keep their original expiry.

## What is saved and where

Drafts live in the browser's localStorage under keys shaped like:

```
kp-das-<domain>-<appId>-<create|recordId>-<userCode>
```

`userCode` is percent-encoded. Each draft holds the savable field values, the save time, an expiry time, and the record's update time at save. Field references are stored by field code.

These fields are never saved: attachments (their contents cannot be stored), calculated fields, record number, created/updated by, created/updated time, status, assignee, category, and lookup copy-target fields (restoring them would desync them from the lookup source). For a lookup, only the lookup field's own key value is restored; re-run the lookup to refill the copied fields.

To clear drafts:

- Use the banner menu "保存済みの下書きをすべて削除" to delete every draft this plugin stored on the current domain, for any user.
- Or clear site data for the kintone domain in the browser.

## Limitations

- Attachment contents are not saved or restored. The diff preview shows a note when the form has an attachment field.
- Lookup copy-target fields are not saved. Restore the lookup key and re-run the lookup.
- Input made within one interval of a crash can be lost (up to one interval's worth). The plugin does not save on `beforeunload`, because browsers do not guarantee that work runs on unload.
- Drafts stay on one device and browser. There is no sync across devices and no copy on the kintone server.
- Inline editing in list views is out of scope.
- There is no per-app on/off switch. Remove the plugin from the app to turn it off.

## Privacy note

Drafts are stored unencrypted in the browser profile. On a shared PC, another person using the same profile can read a previous user's drafts. Before leaving a shared machine, clear drafts with the banner menu or clear the browser's site data. The plugin sends no data to any external server and adds no analytics or error-tracking service.

## Development

```
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest, core logic
npm run lint        # eslint
npm run build       # dist/desktop.js, dist/mobile.js, dist/config.js
npm run pack        # build then dist/plugin.zip (generates private.ppk once)
```

The pure logic (snapshot diff, key building, schema validation, TTL and size checks, restore merge, time formatting) lives in `src/core` and has no kintone dependency; the unit tests target it. DOM and REST wrappers live in `src/kintone`. The E2E specs in `test/e2e` run against a development kintone app and read the connection from environment variables (`KINTONE_BASE_URL`, `KINTONE_USERNAME`, `KINTONE_PASSWORD`, `KINTONE_APP_ID`).

To regenerate the icon after editing `plugin/icon.svg`:

```
npm run icon
```

## Limitations and TODO for this build

- The E2E specs are written but not run here; they need a development kintone app with the demo form (see `docs/release-checklist.md` and the field list below) and the plugin installed. Run `npx playwright test` after setting the environment variables.
- The mobile banner uses `kintone.mobile.app.getHeaderSpaceElement()`. It is not verified on a physical device in this build; confirm on iOS Safari, Android Chrome, and the kintone mobile app before release.
- The lint setup uses `eslint:recommended` with the TypeScript parser rather than `@cybozu/eslint-config`, and the ambient kintone types are hand-written in `src/types/kintone.d.ts` rather than generated with `@kintone/dts-gen`, to keep the dependency tree small. Switching to those tools is optional follow-up.

## Demo app fields

| Field | Type | Purpose |
| --- | --- | --- |
| タイトル | Single-line text | Basic save and restore |
| 本文 | Rich text | Save without a change event |
| 金額 | Number | Diff preview display |
| 実施日 | Date | Timezone formatting |
| 区分 | Drop-down | Option-removed behavior |
| 担当者 | User select | Name display |
| 顧客名 | Lookup | Lookup key restore |
| 顧客住所 | Single-line text (lookup copy) | Copy-target exclusion |
| 明細 | Subtable (text + number) | Full row restore |
| 見積書 | Attachment | Note display |
| 合計 | Calc | Excluded from save |

## License

MIT. Copyright (c) 2026 Koji Miyazawa.
