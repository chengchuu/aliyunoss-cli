const assert = require("node:assert/strict");
const test = require("node:test");
const config = require("../project.config.js");
const pkg = require("../package.json");

test("project configuration keeps canonical Pages routes synchronized", () => {
  assert.equal(pkg.homepage, "https://chengchuu.github.io/aliyunoss-cli/");
  assert.equal(config.site.basePath, "/aliyunoss-cli/");
  assert.deepEqual(Object.keys(config.site.pages), ["home", "examples", "api"]);
  assert.equal(config.site.pages.home.url, pkg.homepage);
  assert.equal(config.site.pages.examples.url, `${pkg.homepage}examples/`);
  assert.equal(config.site.pages.api.url, `${pkg.homepage}api/`);
  assert.equal(config.seo.examplesJsonLd.url, config.site.pages.examples.url);
  assert.equal(config.pwa.manifestUrl, "/aliyunoss-cli/manifest.webmanifest");
  assert.equal(config.pwa.serviceWorkerUrl, "/aliyunoss-cli/service-worker.js");
});

test("website dependencies remain development-only", () => {
  for (const name of [
    "bootstrap",
    "mazey",
    "react",
    "react-dom",
    "typedoc",
    "webpack",
  ]) {
    assert.ok(
      pkg.devDependencies[name],
      `${name} must be a development dependency`,
    );
    assert.equal(pkg.dependencies[name], undefined);
  }
});
