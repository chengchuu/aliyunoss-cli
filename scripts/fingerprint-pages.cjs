const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function filesIn(directory) {
  return fs.readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return fs.statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function updateHash(hash, name, contents) {
  const normalizedName = String(name).replaceAll(path.sep, "/");
  const data = Buffer.isBuffer(contents)
    ? contents
    : Buffer.from(String(contents));
  hash.update(
    `${Buffer.byteLength(normalizedName)}:${normalizedName}${data.byteLength}:`,
  );
  hash.update(data);
}

function fingerprintPages(directory, additionalSources = []) {
  const hash = crypto.createHash("sha256");
  const files = filesIn(directory)
    .filter(
      (file) => !file.endsWith("service-worker.js") && !file.endsWith(".map"),
    )
    .map((file) => ({ file, name: path.relative(directory, file) }))
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );

  for (const { file, name } of files)
    updateHash(hash, name, fs.readFileSync(file));
  for (const source of additionalSources)
    updateHash(hash, source.name, source.contents);

  return hash.digest("hex").slice(0, 12);
}

module.exports = { fingerprintPages };
