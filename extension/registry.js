// SPDX-License-Identifier: Apache-2.0
// Finds and runs commands. The shortcuts (background.js) and the popup's
// buttons both run commands through here.
import { TOOLS } from "./tools/index.js";

// Every command of every tool, in popup order, each with its tool.
export const COMMANDS = TOOLS.flatMap((tool) =>
  tool.commands.map((command) => ({ ...command, tool })));

export function find(name) {
  return COMMANDS.find((command) => command.name === name);
}

// Runs the command `name` on `tab`, or on the active tab of the current
// window when there is none. An unknown name does nothing.
export async function run(name, tab) {
  const command = find(name);
  if (!command) return;
  const active = tab ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!active) return;
  await command.run(active);
}
