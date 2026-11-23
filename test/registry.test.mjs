// SPDX-License-Identifier: Apache-2.0
// The tools are well formed, and the registry runs the right command.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COMMANDS, find, run } from "../extension/registry.js";
import { TOOLS } from "../extension/tools/index.js";

test("every tool has an id, a title, a permission list and commands", () => {
  assert.ok(TOOLS.length > 0);
  for (const tool of TOOLS) {
    assert.match(tool.id, /^[a-z][a-z0-9]*$/, "tool id");
    assert.equal(typeof tool.title, "string", `${tool.id} title`);
    assert.ok(Array.isArray(tool.permissions), `${tool.id} permissions`);
    assert.ok(tool.commands.length > 0, `${tool.id} commands`);
    for (const command of tool.commands) {
      // A command's name starts with its tool's id, so names never clash.
      assert.match(command.name, new RegExp(`^${tool.id}-[a-z0-9-]+$`), command.name);
      assert.equal(typeof command.title, "string", `${command.name} title`);
      assert.equal(typeof command.run, "function", `${command.name} run`);
    }
  }
});

test("tool ids and command names are unique", () => {
  const ids = TOOLS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  const names = COMMANDS.map((c) => c.name);
  assert.equal(new Set(names).size, names.length);
});

test("run calls the named command with the given tab, and ignores unknown names", async () => {
  const command = find("tabs-toggle-pin");
  const original = command.run;
  const seen = [];
  command.run = async (tab) => seen.push(tab);
  try {
    await run("tabs-toggle-pin", { id: 7 });
    await run("no-such-command", { id: 8 });
  } finally {
    command.run = original;
  }
  assert.deepEqual(seen, [{ id: 7 }]);
});
