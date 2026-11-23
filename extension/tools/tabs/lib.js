// SPDX-License-Identifier: Apache-2.0
// Pure helpers of the tabs tool, unit-tested in Node. Nothing here
// touches the chrome.* APIs.

// The ids of the tabs that `action` closes, from the tabs of one window,
// when `active` is the tab it acts from. `action` is "close-left",
// "close-right" or "close-others". Pinned tabs are never closed: they
// are the ones a person keeps on purpose.
export function tabsToClose(action, tabs, active) {
  const keep = (tab) => tab.id === active.id || tab.pinned;
  const picks = {
    "close-left": (tab) => tab.index < active.index,
    "close-right": (tab) => tab.index > active.index,
    "close-others": () => true,
  };
  // Own keys only: "toString" or "constructor" must not pick anything.
  if (!Object.hasOwn(picks, action)) return [];
  const pick = picks[action];
  return tabs.filter((tab) => !keep(tab) && pick(tab)).map((tab) => tab.id);
}
