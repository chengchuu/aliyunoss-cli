function attributes(tag) {
  return Object.fromEntries(
    [
      ...tag.matchAll(
        /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
      ),
    ].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? match[4] ?? "",
    ]),
  );
}

function findTag(html, name, key, value) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))]
    .map((match) => attributes(match[0]))
    .find((entry) => entry[key] === value);
}

module.exports = { attributes, findTag };
