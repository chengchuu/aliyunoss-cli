const fs = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");

const root = path.resolve(__dirname, "..");
const docs = path.join(root, "docs");
const failures = [];
const fail = (message) => failures.push(message);

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)(?:=["']([^"']*)["'])?/g)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? "",
    ]),
  );
}

function findTag(html, name, key, value) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))]
    .map((match) => attributes(match[0]))
    .find((entry) => entry[key] === value);
}

function visibleText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filesIn(directory) {
  return fs.readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return fs.statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function validateLocalReferences(file, html) {
  const tags = [...html.matchAll(/<(?:a|img|link|script)\b[^>]*>/gi)].map(
    (match) => attributes(match[0]),
  );
  for (const tag of tags) {
    const reference = tag.href || tag.src;
    if (
      !reference ||
      reference.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)
    )
      continue;
    const pathname = reference.split(/[?#]/, 1)[0];
    let target;
    if (pathname.startsWith(config.site.basePath)) {
      target = path.join(docs, pathname.slice(config.site.basePath.length));
    } else if (pathname.startsWith("/")) {
      fail(
        `${path.relative(docs, file)}: root-relative reference leaves the project base: ${reference}`,
      );
      continue;
    } else {
      target = path.resolve(path.dirname(file), pathname);
    }
    const relative = path.relative(docs, target);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      fail(`${path.relative(docs, file)}: reference leaves docs: ${reference}`);
      continue;
    }
    const resolved =
      fs.existsSync(target) && fs.statSync(target).isDirectory()
        ? path.join(target, "index.html")
        : target;
    if (!fs.existsSync(resolved))
      fail(
        `${path.relative(docs, file)}: missing local reference ${reference}`,
      );
  }
}

function validatePage(label, file, expected) {
  if (!fs.existsSync(file)) {
    fail(`${label}: missing ${path.relative(root, file)}`);
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || titles[0][1].trim() !== expected.title)
    fail(`${label}: title must match project.config.js`);
  if (
    findTag(html, "meta", "name", "description")?.content !==
    expected.description
  )
    fail(`${label}: description must match project.config.js`);
  if (findTag(html, "link", "rel", "canonical")?.href !== expected.url)
    fail(`${label}: canonical must be ${expected.url}`);
  if (findTag(html, "meta", "property", "og:url")?.content !== expected.url)
    fail(`${label}: Open Graph URL must match the canonical URL`);
  for (const property of [
    "og:type",
    "og:site_name",
    "og:title",
    "og:description",
    "og:image",
  ]) {
    if (!findTag(html, "meta", "property", property)?.content)
      fail(`${label}: missing ${property}`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description"]) {
    if (!findTag(html, "meta", "name", name)?.content)
      fail(`${label}: missing ${name}`);
  }
  if (!findTag(html, "link", "rel", "icon")) fail(`${label}: missing favicon`);
  if (!findTag(html, "link", "rel", "manifest"))
    fail(`${label}: missing manifest link`);
  const h1s = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
  if (h1s.length !== 1) fail(`${label}: expected one h1, found ${h1s.length}`);
  if (visibleText(html).length < 220)
    fail(`${label}: insufficient crawlable initial content`);
  const jsonLd = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  if (!jsonLd.length) fail(`${label}: missing JSON-LD`);
  for (const entry of jsonLd) {
    try {
      JSON.parse(entry[1]);
    } catch (error) {
      fail(`${label}: invalid JSON-LD (${error.message})`);
    }
  }
}

validatePage("Homepage", path.join(docs, "index.html"), config.site.pages.home);
validatePage(
  "Examples",
  path.join(docs, "examples", "index.html"),
  config.site.pages.examples,
);

for (const file of filesIn(docs).filter((entry) => entry.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  validateLocalReferences(file, html);
  if (file.startsWith(path.join(docs, "api"))) {
    const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];
    if (!htmlTag || !attributes(htmlTag)["data-base"])
      fail(`${path.relative(docs, file)}: missing TypeDoc data-base attribute`);
    if (html.includes("api-project-header"))
      fail(`${path.relative(docs, file)}: contains the surplus project header`);
    const toolbarLinks = html.match(
      /<nav\b[^>]*class=["'][^"']*site-project-links[^"']*["'][^>]*>[\s\S]*?<\/nav>/i,
    )?.[0];
    if (!toolbarLinks) {
      fail(
        `${path.relative(docs, file)}: missing native toolbar project links`,
      );
    } else {
      for (const url of [
        config.site.basePath,
        `${config.site.basePath}examples/`,
        `${config.site.basePath}api/`,
        config.urls.github,
        config.urls.npm,
      ]) {
        if (!toolbarLinks.includes(`href="${url}"`))
          fail(`${path.relative(docs, file)}: toolbar is missing ${url}`);
      }
    }
    const h1Count = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)].length;
    if (h1Count !== 1)
      fail(`${path.relative(docs, file)}: expected one h1, found ${h1Count}`);
  }
}
validatePage(
  "API overview",
  path.join(docs, "api", "index.html"),
  config.site.pages.api,
);

const sitemapFile = path.join(docs, "sitemap.xml");
if (!fs.existsSync(sitemapFile)) fail("sitemap.xml is missing");
else {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  const expected = Object.values(config.site.pages).map(({ url }) => url);
  if (!sitemap.startsWith("<?xml") || !sitemap.includes("<urlset"))
    fail("sitemap.xml is not a complete XML document");
  if (new Set(locations).size !== locations.length)
    fail("sitemap.xml contains duplicate locations");
  if (JSON.stringify(locations) !== JSON.stringify(expected))
    fail("sitemap.xml routes do not match project.config.js");
}
const robotsFile = path.join(docs, "robots.txt");
if (!fs.existsSync(robotsFile)) fail("robots.txt is missing");
else if (
  !fs
    .readFileSync(robotsFile, "utf8")
    .includes(`Sitemap: ${config.urls.sitemap}`)
)
  fail("robots.txt does not reference the canonical sitemap URL");

if (failures.length)
  throw new Error(`SEO validation failed:\n- ${failures.join("\n- ")}`);
console.log(
  "SEO validation passed for the homepage, examples, and API overview.",
);
