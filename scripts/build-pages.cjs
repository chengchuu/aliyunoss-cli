const fs = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");
const { fingerprintPages } = require("./fingerprint-pages.cjs");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "dist-dev");
const output = path.join(root, "docs");
const markerStart = `<!-- ${config.site.markerPrefix}-site:start -->`;
const markerEnd = `<!-- ${config.site.markerPrefix}-site:end -->`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function filesIn(directory) {
  return fs.readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return fs.statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function apiUrl(relativeFile) {
  const route = relativeFile
    .replaceAll(path.sep, "/")
    .replace(/index\.html$/, "");
  return new URL(route, config.site.pages.api.url).href;
}

function apiEnhancement(relativeFile, title, canonical) {
  const description = config.site.pages.api.description;
  const social = config.seo.openGraphImage;
  const base = config.site.basePath;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: config.brand.displayName,
      url: config.site.url,
    },
  });
  return `${markerStart}
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="sitemap" type="application/xml" href="${config.urls.sitemap}" />
<link rel="icon" type="image/png" href="${base}images/${config.assets.faviconFile}" />
<link rel="manifest" href="${config.pwa.manifestUrl}" />
<meta name="theme-color" content="${config.site.theme.colorPrimary}" data-theme-color data-theme-color-light="${config.site.theme.colorLight}" data-theme-color-dark="${config.site.theme.colorDark}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${config.brand.displayName}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${social.url}" />
<meta property="og:image:type" content="${social.type}" />
<meta property="og:image:width" content="${social.width}" />
<meta property="og:image:height" content="${social.height}" />
<meta property="og:image:alt" content="${escapeHtml(social.alt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${social.url}" />
<link rel="stylesheet" href="${base}assets/shared.css" />
<link rel="stylesheet" href="${base}assets/api.css" />
<script type="application/ld+json">${jsonLd}</script>
${markerEnd}`;
}

function apiToolbar() {
  return `${markerStart}<header class="api-project-header"><nav class="navbar navbar-expand-xl site-navbar" aria-label="Project navigation" data-site-navbar><div class="container-fluid"><a class="navbar-brand" href="${config.site.basePath}">${config.brand.displayName}</a><button class="navbar-toggler" type="button" aria-controls="api-project-navigation" aria-expanded="false" aria-label="Toggle project navigation" data-nav-toggle><span class="navbar-toggler-icon" aria-hidden="true"></span></button><div id="api-project-navigation" class="navbar-collapse" data-mobile-nav><ul class="navbar-nav ms-auto"><li class="nav-item"><a class="nav-link" href="${config.site.basePath}">Project home</a></li><li class="nav-item"><a class="nav-link" href="${config.site.basePath}api/">API overview</a></li><li class="nav-item"><a class="nav-link" href="${config.urls.github}">GitHub repository</a></li><li class="nav-item"><a class="nav-link" href="${config.urls.npm}">npm package</a></li></ul><label class="theme-control ms-xl-3"><span>Theme</span><select class="form-select form-select-sm w-auto" data-theme-select aria-label="Choose API documentation theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div></div></nav></header>${markerEnd}`;
}

function transformApiHtml(file) {
  const relative = path.relative(path.join(output, "api"), file);
  let html = fs.readFileSync(file, "utf8");
  const markerPattern = new RegExp(
    `${markerStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "g",
  );
  html = html.replace(markerPattern, "");
  const existingTitle = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const title =
    relative === "index.html"
      ? config.site.pages.api.title
      : existingTitle || config.site.pages.api.title;
  const canonical = apiUrl(relative);
  html = html
    .replace(/<html\b[^>]*>/i, '<html lang="en" data-bs-theme="light">')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\b[^>]*(?:name=["']description["']|property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>\s*/gi,
      "",
    )
    .replace(
      /<link\b[^>]*rel=["'](?:canonical|manifest|icon|sitemap)["'][^>]*>\s*/gi,
      "",
    )
    .replace(
      "</head>",
      `${apiEnhancement(relative, title, canonical)}\n</head>`,
    )
    .replace(/<body\b[^>]*>/i, (body) => `${body}\n${apiToolbar()}`)
    .replace(
      "</body>",
      `${markerStart}<aside class="pwa-update-notice" aria-label="Website update" data-pwa-update hidden><span>A new website version is available.</span><button type="button" data-pwa-update-now>Update now</button></aside><span class="visually-hidden" role="status" aria-live="polite" data-pwa-status></span><script src="${config.site.basePath}assets/shared.js"></script><script src="${config.site.basePath}assets/api.js"></script>${markerEnd}</body>`,
    );
  let foundPrimaryHeading = false;
  html = html.replace(
    /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi,
    (heading, attributes, content) => {
      if (!foundPrimaryHeading) {
        foundPrimaryHeading = true;
        return heading;
      }
      return `<h2${attributes}>${content}</h2>`;
    },
  );
  fs.writeFileSync(file, html);
}

if (!fs.existsSync(path.join(input, "index.html"))) {
  throw new Error("Website build is missing dist-dev/index.html");
}
if (!fs.existsSync(path.join(input, "api", "index.html"))) {
  throw new Error("TypeDoc build is missing dist-dev/api/index.html");
}
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(input, output, { recursive: true });

for (const file of filesIn(path.join(output, "api")).filter((entry) =>
  entry.endsWith(".html"),
)) {
  transformApiHtml(file);
}

const manifest = {
  name: config.pwa.name,
  short_name: config.pwa.shortName,
  description: config.pwa.description,
  id: config.site.basePath,
  start_url: config.site.basePath,
  scope: config.site.basePath,
  display: config.pwa.display,
  theme_color: config.pwa.themeColor,
  background_color: config.pwa.backgroundColor,
  icons: config.pwa.icons.map(({ file, ...icon }) => icon),
};
fs.writeFileSync(
  path.join(output, "manifest.webmanifest"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(output, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${config.urls.sitemap}\n`,
);
fs.writeFileSync(
  path.join(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.values(
    config.site.pages,
  )
    .map(({ url }) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);

const shell = [
  config.site.basePath,
  `${config.site.basePath}playground/`,
  `${config.site.basePath}api/`,
  config.pwa.manifestUrl,
  ...config.pwa.icons.map(({ src }) => src),
  ...filesIn(path.join(output, "images")).map(
    (file) =>
      `${config.site.basePath}${path.relative(output, file).replaceAll(path.sep, "/")}`,
  ),
  ...filesIn(path.join(output, "assets"))
    .filter((file) => !file.endsWith(".map"))
    .map(
      (file) =>
        `${config.site.basePath}${path.relative(output, file).replaceAll(path.sep, "/")}`,
    ),
  ...filesIn(path.join(output, "api", "assets"))
    .filter((file) => !file.endsWith(".map"))
    .map(
      (file) =>
        `${config.site.basePath}${path.relative(output, file).replaceAll(path.sep, "/")}`,
    ),
];
const digest = fingerprintPages(output, [
  { name: "generated/app-shell.json", contents: JSON.stringify(shell) },
  {
    name: "generated/service-worker-source.js",
    contents: fs.readFileSync(path.join(root, "site", "service-worker.js")),
  },
]);
const worker = fs
  .readFileSync(path.join(root, "site", "service-worker.js"), "utf8")
  .replaceAll("__PROJECT_BASE__", config.site.basePath)
  .replaceAll("__CACHE_PREFIX__", config.pwa.cachePrefix)
  .replaceAll("__CACHE_VERSION__", digest)
  .replace("__APP_SHELL__", JSON.stringify([...new Set(shell)], null, 2));
fs.writeFileSync(path.join(output, "service-worker.js"), worker);

console.log(
  `Assembled ${path.relative(root, output)} with ${shell.length} app-shell entries.`,
);
