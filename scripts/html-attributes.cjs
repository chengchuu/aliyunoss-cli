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

function findElementContents(html, name, key, value) {
  return [
    ...html.matchAll(
      new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, "gi"),
    ),
  ]
    .filter((match) => attributes(match[1])[key] === value)
    .map((match) => match[2]);
}

module.exports = { attributes, findElementContents, findTag };
