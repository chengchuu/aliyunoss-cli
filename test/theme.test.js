const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

class FakeSelect {
  constructor({ id = "", projectControl = false, value }) {
    this.id = id;
    this.projectControl = projectControl;
    this.value = value;
  }

  matches(selector) {
    return selector === "[data-theme-select]" && this.projectControl;
  }
}

function loadThemeModule(mazey, document, window) {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../site/theme.ts"),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  const context = {
    document,
    exports,
    HTMLSelectElement: FakeSelect,
    module: { exports },
    require(name) {
      if (name === "mazey") return mazey;
      return require(name);
    },
    window,
  };
  vm.runInNewContext(code, context, { filename: "site/theme.ts" });
  return context.module.exports;
}

test("TypeDoc theme changes use the project preference and survive storage failure", () => {
  const listeners = new Map();
  const media = {
    addEventListener() {},
    matches: false,
    removeEventListener() {},
  };
  const root = { dataset: {}, style: {} };
  const projectControl = new FakeSelect({
    projectControl: true,
    value: "light",
  });
  const typeDocControl = new FakeSelect({ id: "tsd-theme", value: "dark" });
  const themeColor = {
    content: "#4d8ffb",
    dataset: { themeColorDark: "#0d1220", themeColorLight: "#f7f8fc" },
  };
  const document = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    documentElement: root,
    querySelector(selector) {
      if (selector === "#tsd-theme") return typeDocControl;
      if (selector.includes('meta[name="theme-color"]')) return themeColor;
      return null;
    },
    querySelectorAll(selector) {
      return selector === "[data-theme-select]" ? [projectControl] : [];
    },
    readyState: "loading",
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  const writes = [];
  const mazey = {
    getSystemTheme: () => "dark",
    listenMediaQueryChanges: () => () => undefined,
    resolveThemePreference: () => ({ label: "System", value: "light" }),
    setThemePreference(key, value) {
      writes.push([key, value]);
      return false;
    },
  };
  const { initializeThemeControls } = loadThemeModule(mazey, document, {
    matchMedia: () => media,
  });

  initializeThemeControls("aliyunoss-cli-theme");
  assert.equal(root.dataset.bsTheme, "light");
  assert.equal(projectControl.value, "system");
  assert.equal(typeDocControl.value, "os");

  root.dataset.theme = "dark";
  typeDocControl.value = "dark";
  listeners.get("DOMContentLoaded")();
  assert.equal(root.dataset.theme, "light");
  assert.equal(typeDocControl.value, "os");

  typeDocControl.value = "dark";
  listeners.get("change")({ target: typeDocControl });
  assert.deepEqual(writes.at(-1), ["aliyunoss-cli-theme", "dark"]);
  assert.equal(root.dataset.bsTheme, "dark");
  assert.equal(projectControl.value, "dark");

  typeDocControl.value = "os";
  listeners.get("change")({ target: typeDocControl });
  assert.deepEqual(writes.at(-1), ["aliyunoss-cli-theme", "system"]);
  assert.equal(root.dataset.bsTheme, "dark");
  assert.equal(projectControl.value, "system");
});
