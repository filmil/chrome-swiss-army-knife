// SPDX-License-Identifier: Apache-2.0
// The tabs tool: close the tabs to the left, to the right, or all
// others, and pin or unpin a tab. It acts on the tab it is used from, in
// that tab's window.
//
// It needs no permission: tab ids, positions and pinned state are open to
// every extension. It never reads a tab's address, title or content.
import { tabsToClose } from "./lib.js";

async function close(action, tab) {
  const tabs = await chrome.tabs.query({ windowId: tab.windowId });
  const ids = tabsToClose(action, tabs, tab);
  if (ids.length) await chrome.tabs.remove(ids);
}

export default {
  id: "tabs",
  label: "Tabs",
  note: "Pinned tabs are never closed.",
  permissions: [],
  commands: [
    {
      name: "tabs-close-left",
      label: "Close tabs to the left",
      run: (tab) => close("close-left", tab),
    },
    {
      name: "tabs-close-right",
      label: "Close tabs to the right",
      run: (tab) => close("close-right", tab),
    },
    {
      name: "tabs-close-others",
      label: "Close other tabs",
      run: (tab) => close("close-others", tab),
    },
    {
      name: "tabs-toggle-pin",
      label: "Pin or unpin this tab",
      run: (tab) => chrome.tabs.update(tab.id, { pinned: !tab.pinned }),
    },
  ],
};
