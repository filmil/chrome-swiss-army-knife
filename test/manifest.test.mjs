// SPDX-License-Identifier: Apache-2.0
// The extension's promise is how little it can do. These tests fail if a
// change widens that without saying so.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { COMMANDS } from "../extension/registry.js";
import { TOOLS } from "../extension/tools/index.js";

const dir = new URL("../extension/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8"));

// Every file Chrome could load from the extension, in subfolders too.
const files = readdirSync(dir, { recursive: true })
  .filter((f) => /\.(m?js|html|css|svg)$/i.test(f))
  .map((f) => [f, readFileSync(new URL(f, dir), "utf8")]);

test("the manifest asks for exactly the permissions the tools declare", () => {
  // A tool that needs a permission lists it in its `permissions`; the
  // manifest must list the same ones, no more. Today there are none.
  const wanted = [...new Set(TOOLS.flatMap((t) => t.permissions))].sort();
  assert.deepEqual([...(manifest.permissions ?? [])].sort(), wanted);
  if (!wanted.length) assert.equal(manifest.permissions, undefined);
  for (const key of ["host_permissions", "optional_permissions",
    "optional_host_permissions", "content_scripts", "externally_connectable",
    "web_accessible_resources", "content_security_policy"]) {
    assert.equal(manifest[key], undefined, `manifest has ${key}`);
  }
});

test("the description claims no permissions only while there are none", () => {
  const claims = /no permissions/i.test(manifest.description);
  assert.equal(claims, manifest.permissions === undefined,
    "update the description (and the README) when the permissions change");
});

test("no code reaches the network or evaluates strings", () => {
  assert.ok(files.some(([f]) => /\.js$/.test(f)) && files.some(([f]) => /\.css$/.test(f)));
  for (const [file, text] of files) {
    const bad = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/,
      /sendBeacon/, /\beval\s*\(/, /new Function\b/, /https?:\/\//i, /importScripts/,
      // A protocol-relative address in a string: "//host/x".
      /["'`]\s*\/\/(?![\s/])/];
    // A stylesheet can load a URL with @import or url(...); only data:
    // URLs are allowed.
    if (/\.(css|html|svg)$/i.test(file)) bad.push(/@import/i, /url\s*\((?!\s*["']?\s*data:)/i);
    for (const pattern of bad) assert.doesNotMatch(text, pattern, `${file} matches ${pattern}`);
  }
});

test("no code reads tab addresses, titles or page content", () => {
  for (const [file, text] of files.filter(([f]) => /\.m?js$/.test(f))) {
    for (const pattern of [/\.url\b/, /\.title\b/, /\.favIconUrl\b/, /chrome\.scripting/,
      /executeScript/, /chrome\.storage/, /chrome\.history/, /chrome\.cookies/]) {
      assert.doesNotMatch(text, pattern, `${file} matches ${pattern}`);
    }
  }
});

test("the commands in the manifest are the ones the tools offer", () => {
  assert.deepEqual(Object.keys(manifest.commands), COMMANDS.map((c) => c.name));
  for (const [name, entry] of Object.entries(manifest.commands)) {
    assert.ok(entry.description, `${name} has a description`);
  }
  // Chrome sets suggested keys for at most four commands.
  const suggested = Object.values(manifest.commands).filter((c) => c.suggested_key);
  assert.ok(suggested.length <= 4, "at most four suggested keys");
});

test("the name says whose extension it is", () => {
  const name = "filmil's Swiss Army Knife";
  assert.equal(manifest.name, name);
  assert.equal(manifest.action.default_title, name);
  const popup = readFileSync(new URL("popup.html", dir), "utf8");
  assert.match(popup, new RegExp(`<title>${name}</title>`));
  assert.match(popup, new RegExp(`<h1>${name}</h1>`));
  assert.ok(manifest.description.length <= 132, "Chrome allows 132 characters");
});
