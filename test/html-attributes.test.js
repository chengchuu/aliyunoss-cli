const assert = require("node:assert/strict");
const test = require("node:test");
const {
  attributes,
  findElementContents,
  findTag,
} = require("../scripts/html-attributes.cjs");

test("parses quoted, unquoted, and boolean HTML attributes", () => {
  assert.deepEqual(
    attributes(
      '<meta name=description content="Upload files" data-theme-color disabled>',
    ),
    {
      meta: "",
      name: "description",
      content: "Upload files",
      "data-theme-color": "",
      disabled: "",
    },
  );
});

test("finds SEO tags after production HTML removes optional quotes", () => {
  const html = [
    '<meta name=description content="Upload directories to OSS">',
    "<meta property=og:type content=website>",
    "<link rel=canonical href=https://chengchuu.github.io/aliyunoss-cli/>",
  ].join("");

  assert.equal(
    findTag(html, "meta", "name", "description").content,
    "Upload directories to OSS",
  );
  assert.equal(findTag(html, "meta", "property", "og:type").content, "website");
  assert.equal(
    findTag(html, "link", "rel", "canonical").href,
    "https://chengchuu.github.io/aliyunoss-cli/",
  );
});

test("finds JSON-LD after production HTML removes optional quotes", () => {
  const jsonLd = '{"@context":"https://schema.org"}';
  const html = `<script type=application/ld+json>${jsonLd}</script>`;

  assert.deepEqual(
    findElementContents(html, "script", "type", "application/ld+json"),
    [jsonLd],
  );
});
