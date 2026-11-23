// SPDX-License-Identifier: Apache-2.0
// Shows one section per tool, with a button per command and its keys.
import { TOOLS } from "./tools/index.js";
import { run } from "./registry.js";

const $ = (id) => document.getElementById(id);

function element(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

for (const tool of TOOLS) {
  const buttons = tool.commands.map((command) => {
    const button = element("button", { type: "button", textContent: command.label },
      element("kbd"));
    button.dataset.command = command.name;
    button.addEventListener("click", async () => {
      try {
        await run(command.name);
        window.close();
      } catch (error) {
        $("error").textContent = error.message;
      }
    });
    return button;
  });
  const section = element("section", {},
    element("h2", { textContent: tool.label }),
    element("div", { className: "column" }, ...buttons));
  if (tool.note) section.append(element("p", { className: "hint", textContent: tool.note }));
  section.dataset.tool = tool.id;
  $("tools").append(section);
}

// Shows each command's current keys, or "not set".
chrome.commands.getAll().then((commands) => {
  for (const { name, shortcut } of commands) {
    const kbd = document.querySelector(`[data-command="${name}"] kbd`);
    if (kbd) kbd.textContent = shortcut || "not set";
  }
});

// An extension can open its browser's shortcuts page; a plain link cannot.
$("shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  window.close();
});
