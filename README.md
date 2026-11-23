[![test](https://github.com/filmil/chrome-swiss-army-knife/actions/workflows/test.yml/badge.svg)](https://github.com/filmil/chrome-swiss-army-knife/actions/workflows/test.yml)
[![release](https://github.com/filmil/chrome-swiss-army-knife/actions/workflows/release.yml/badge.svg)](https://github.com/filmil/chrome-swiss-army-knife/actions/workflows/release.yml)

# filmil's Swiss Army Knife

A Chrome extension of small tools for working with tabs and windows. It
starts with one tool, keyboard shortcuts to close and pin tabs, which
was [filmil's Tab Shortcuts](https://github.com/filmil/chrome-tab-shortcuts).
More tools can be added as they are needed; see [Adding a
tool](#adding-a-tool). It is meant to stay small enough to read in a few
minutes, so that you can trust it without taking anyone's word for it.

## What it can and cannot do

- **No permissions.** The manifest asks for none, so Chrome shows no
  permission warning. Closing, pinning and listing tabs by position need
  no permission in Chrome. The extension never reads a tab's address,
  title or content, and a test fails if its code mentions any of them.
  A future tool that needs a permission must declare it, and a test
  checks that the manifest asks for exactly what the tools declare.
- **No network.** It makes no requests and loads no remote code. A test
  fails if any of its files names `fetch`, `XMLHttpRequest`, `WebSocket`,
  `eval`, or a URL.
- **Keeps nothing.** It stores no settings and no data.
- **Small.** A little JavaScript and a popup, in
  [`extension/`](extension/), with no dependencies and no build step:
  the release zip is that folder, with the version filled in.

## Use

| Shortcut (default) | What it does |
|---|---|
| Alt+Shift+, (comma) | Close the tabs to the left of this one |
| Alt+Shift+. (period) | Close the tabs to the right of this one |
| Alt+Shift+O | Close the other tabs in this window |
| Alt+Shift+P | Pin or unpin this tab |

Pinned tabs are never closed. The commands act on the current window
only.

Clicking the extension's icon shows each tool as a section, with a
button for each of its commands and the command's current keys. To change the keys, or to make a shortcut work
when Chrome is not the focused app, open `chrome://extensions/shortcuts`
(the popup has a link to it). Each command there has a key and a scope:
**In Chrome**, the default, or **Global**, which Chrome allows only for
Ctrl+Shift+0 to 9. If Chrome or another extension already uses a
default key, Chrome leaves that command without a key, and you can pick
one there.

## Install

From a [release](https://github.com/filmil/chrome-swiss-army-knife/releases):
download `swiss-army-knife-<version>.zip`, check it against the `.sha256`
file beside it, and unzip it. In Chrome, open `chrome://extensions`, turn
on **Developer mode**, choose **Load unpacked**, and pick the unzipped
folder.

Or from source: clone this repository and load its `extension/` folder
the same way.

Chrome 120 or later.

## Releases

[`release.yml`](.github/workflows/release.yml) runs every day. If
`extension/` changed since the last release, it runs the tests, builds
the zip with Bazel, tests that zip in Chrome, and publishes a release
named after the date (for example `v2026.11.10`). It can also be run by
hand from the Actions tab, with **force** to release without changes.

## Development

[Bazel](https://bazel.build) builds the release zip and runs the unit
tests. Use [Bazelisk](https://github.com/bazelbuild/bazelisk), which runs
the version in `.bazelversion`. Bazel downloads Node by itself, so the
machine needs no Node for these.

```sh
bazel test //...                          # unit tests, and the permission and network checks
bazel build //:zip --//:version=1.2.3     # bazel-bin/swiss-army-knife-1.2.3.zip
```

The same source and version build the same zip, byte for byte.

The end-to-end test needs Node 22 and npm, since Puppeteer downloads its
own Chrome:

```sh
npm ci
npm run test:e2e    # loads the extension into Chrome for Testing
```

It opens six local test tabs with two of them pinned, uses each of the
popup's buttons as a person would (they run the same code as the
shortcuts, which a test cannot press), and checks which tabs are left
and which are pinned. On Ubuntu 23.10 and later, Chrome's sandbox cannot
start without user namespaces; run it with `E2E_NO_SANDBOX=1`. It loads
`extension/` unless `E2E_EXTENSION_DIR` names another folder; the release
points it at the unzipped zip.

## Adding a tool

A tool is a folder in [`extension/tools/`](extension/tools/) with a
`tool.js` that exports an object:

```js
export default {
  id: "windows",              // lowercase; every command name starts with it
  title: "Windows",           // the popup section's heading
  note: "Optional hint.",     // shown under the buttons
  permissions: [],            // the Chrome permissions this tool needs
  commands: [
    {
      name: "windows-merge",  // "<id>-...", also the manifest's command name
      title: "Merge all windows",
      run: async (tab) => { /* act from the active tab */ },
    },
  ],
};
```

Then:

1. Add it to `TOOLS` in [`extension/tools/index.js`](extension/tools/index.js).
   The popup shows tools in that order.
2. Add each command to `commands` in
   [`extension/manifest.json`](extension/manifest.json), with a
   `description`. Chrome gives suggested keys to at most four commands,
   and the tabs tool uses all four, so new commands start with no key;
   set one at `chrome://extensions/shortcuts`.
3. If the tool needs a permission, list it in both the tool's
   `permissions` and the manifest's `permissions`, and say why in the
   tool's comment and in this README.
4. Put pure logic in the tool's own `lib.js` and unit-test it in
   `test/`, as [`tools/tabs/lib.js`](extension/tools/tabs/lib.js) does.

`bazel test //...` checks that every tool is well formed, that command
names are unique, that the manifest and the tools agree, and that no
code reaches the network.

Each tool should fit the extension's single purpose, small tools for
tabs and windows. The Chrome Web Store asks every extension to have
one narrow purpose, and rejects bundles of unrelated features.

## License

Apache 2.0; see [LICENSE](LICENSE).
