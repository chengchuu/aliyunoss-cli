import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default {
  input: path.join(root, "src/library.ts"),
  external: ["ali-oss"],
  output: {
    file: path.join(root, "lib/index.js"),
    format: "cjs",
    exports: "default",
    interop: "auto",
  },
};
