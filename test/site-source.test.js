const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("theme controls delegate preference behavior to Mazey", () => {
  const source = fs.readFileSync(path.join(root, "site/theme.ts"), "utf8");
  for (const api of [
    "resolveThemePreference",
    "setThemePreference",
    "listenMediaQueryChanges",
  ]) {
    assert.match(source, new RegExp(`\\b${api}\\b`));
  }
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem)/);
});

test("examples use the package root and contain no OSS operation call", () => {
  const source = fs.readFileSync(path.join(root, "examples/App.tsx"), "utf8");
  assert.match(source, /from "aliyunoss-cli"/);
  assert.doesNotMatch(source, /\.put\s*\(|\.multipartUpload\s*\(/);
});
