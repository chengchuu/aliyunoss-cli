const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const packageApi = require(root);
const ossApi = require("ali-oss");

assert.equal(
  packageApi,
  ossApi,
  "The package root must re-export ali-oss unchanged",
);
assert.equal(
  typeof packageApi,
  "function",
  "The package root must remain constructible",
);
assert.equal(pkg.main, "lib/index.js");
assert.equal(pkg.bin["aliyunoss-cli"], "./bin/index.js");
assert.ok(
  fs.existsSync(path.join(root, pkg.main)),
  "The package main file is missing",
);
assert.ok(
  fs.existsSync(path.join(root, pkg.bin["aliyunoss-cli"])),
  "The CLI executable is missing",
);
for (const websiteOnly of ["bootstrap", "mazey", "react", "react-dom"]) {
  assert.equal(
    pkg.dependencies[websiteOnly],
    undefined,
    `${websiteOnly} must not be a runtime dependency`,
  );
}
console.log("Package runtime contract is valid.");
