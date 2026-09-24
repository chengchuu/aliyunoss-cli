const fs = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");

const root = path.resolve(__dirname, "..");
const docs = path.join(root, "docs");
const failures = [];
const fail = (message) => failures.push(message);

function pngDimensions(file) {
  const data = fs.readFileSync(file);
  if (data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw new Error("invalid PNG signature");
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

const manifestFile = path.join(docs, "manifest.webmanifest");
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
} catch (error) {
  fail(`manifest.webmanifest is missing or invalid: ${error.message}`);
}
if (manifest) {
  for (const field of ["id", "start_url", "scope"]) {
    if (manifest[field] !== config.site.basePath)
      fail(`Manifest ${field} must be ${config.site.basePath}`);
  }
  if (
    manifest.name !== config.pwa.name ||
    manifest.short_name !== config.pwa.shortName
  )
    fail("Manifest identity does not match project.config.js");
  const sizes = new Set();
  let maskable = false;
  for (const icon of manifest.icons ?? []) {
    sizes.add(icon.sizes);
    maskable ||= String(icon.purpose).split(/\s+/).includes("maskable");
    const file = path.join(docs, icon.src.slice(config.site.basePath.length));
    if (!fs.existsSync(file)) {
      fail(`Manifest icon is missing: ${icon.src}`);
      continue;
    }
    const [width, height] = icon.sizes.split("x").map(Number);
    const actual = pngDimensions(file);
    if (actual.width !== width || actual.height !== height)
      fail(`Manifest icon dimensions do not match ${icon.src}`);
  }
  if (!sizes.has("192x192") || !sizes.has("512x512"))
    fail("Manifest requires 192x192 and 512x512 icons");
  if (!maskable) fail("Manifest requires a maskable icon");
}

for (const file of ["index.html", "examples/index.html", "api/index.html"]) {
  const fullPath = path.join(docs, file);
  if (!fs.existsSync(fullPath)) {
    fail(`${file} is missing`);
    continue;
  }
  const html = fs.readFileSync(fullPath, "utf8");
  if (!html.includes(`href="${config.pwa.manifestUrl}"`))
    fail(`${file} is missing the configured manifest link`);
  if (!/<meta\b[^>]*name="theme-color"[^>]*data-theme-color/.test(html))
    fail(`${file} is missing dynamic theme-color metadata`);
  if (!html.includes("data-pwa-update-now"))
    fail(`${file} is missing the explicit update action`);
}

const workerFile = path.join(docs, "service-worker.js");
if (!fs.existsSync(workerFile)) fail("service-worker.js is missing");
else {
  const worker = fs.readFileSync(workerFile, "utf8");
  if (/__[A-Z_]+__/.test(worker))
    fail("Service worker contains unresolved tokens");
  for (const guard of [
    `const PROJECT_BASE = "${config.site.basePath}"`,
    'request.method !== "GET"',
    "url.origin !== self.location.origin",
    "url.pathname.startsWith(PROJECT_BASE)",
    'event.data?.type === "SKIP_WAITING"',
  ]) {
    if (!worker.includes(guard))
      fail(`Service worker is missing guard: ${guard}`);
  }
  const apiIndex = fs.readFileSync(
    path.join(docs, "api", "index.html"),
    "utf8",
  );
  const apiAsset = apiIndex.match(
    /(?:href|src)=["'](?:\.\/)?(assets\/[^"']+)["']/,
  )?.[1];
  if (apiAsset && !worker.includes(`${config.site.basePath}api/${apiAsset}`))
    fail(`Service worker does not precache the TypeDoc asset: ${apiAsset}`);
}

const packageSource = ["src/index.ts", "src/upload.ts", "src/library.ts"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
if (
  /serviceWorker|manifest\.webmanifest|beforeinstallprompt/.test(packageSource)
)
  fail("Published package source contains website-only PWA behavior");

if (failures.length)
  throw new Error(`PWA validation failed:\n- ${failures.join("\n- ")}`);
console.log(
  "PWA validation passed for manifest, icons, pages, and service worker.",
);
