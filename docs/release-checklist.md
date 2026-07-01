# Release checklist

Run before publishing a new plugin zip.

## Build and tests

- [ ] `npm ci` completes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` reports no errors
- [ ] `npm test` is green
- [ ] `npm run build` produces `dist/desktop.js`, `dist/mobile.js`, `dist/config.js`
- [ ] `npm run pack` produces `dist/plugin.zip`

## Manual browser and screen matrix

Load the demo app (fields listed in the README) and check each cell.

| Screen | Chrome | Edge | Firefox | Safari |
| --- | --- | --- | --- | --- |
| Create | | | | |
| Edit | | | | |
| Reuse (copy) | | | | |

For each browser and screen, confirm:

- [ ] Type in the title and a subtable, wait one interval, reload, restore from the banner
- [ ] Restore applies the values shown in the diff preview
- [ ] Discard removes the draft and the banner does not return after reload
- [ ] Saving the record removes the draft key
- [ ] Opening a screen with no config does not log errors to the console
- [ ] After deleting a saved field from the form, restore skips it and lists the skipped code
- [ ] Two sibling plugins in this series do not clash on CSS or DOM ids

## Mobile

| Environment | Result |
| --- | --- |
| iOS Safari (mobile view) | |
| Android Chrome (mobile view) | |
| kintone mobile app (in-app WebView) | |

- [ ] Input, close the app, reopen the same screen, restore from the banner

## Edge cases

- [ ] Edit a record updated by someone else after the draft was saved: the banner shows the warning and focuses Discard
- [ ] Private browsing with localStorage blocked: no console errors, auto-save simply off
- [ ] Tamper with a draft value in localStorage: the screen still loads and the bad draft is removed
- [ ] Force-quit the browser mid-edit, reopen: input up to the last interval is restored

## Privacy

- [ ] README states drafts are stored unencrypted per browser profile and how to clear them
