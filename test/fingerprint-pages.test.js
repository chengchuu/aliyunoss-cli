const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { fingerprintPages } = require("../scripts/fingerprint-pages.cjs");

test("Pages fingerprint changes when an asset changes without being renamed", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aliyunoss-pages-"));
  try {
    const asset = path.join(directory, "asset.js");
    fs.writeFileSync(asset, "first");
    const first = fingerprintPages(directory);
    fs.writeFileSync(asset, "second");
    const second = fingerprintPages(directory);
    assert.notEqual(first, second);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("Pages fingerprint ignores generated service workers and source maps", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aliyunoss-pages-"));
  try {
    fs.writeFileSync(path.join(directory, "index.html"), "page");
    const first = fingerprintPages(directory);
    fs.writeFileSync(path.join(directory, "service-worker.js"), "generated");
    fs.writeFileSync(path.join(directory, "asset.js.map"), "map");
    assert.equal(fingerprintPages(directory), first);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
