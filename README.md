# aliyunoss-cli

[![npm version](https://img.shields.io/npm/v/aliyunoss-cli)](https://www.npmjs.com/package/aliyunoss-cli)
[![license](https://img.shields.io/npm/l/aliyunoss-cli)](https://github.com/chengchuu/aliyunoss-cli/blob/master/LICENSE)

`aliyunoss-cli` recursively uploads a local directory to Alibaba Cloud Object Storage Service (OSS). It supports reusable JSON configuration, environment-specific source and target paths, and explicit command-line overrides.

- [Project website](https://chengchuu.github.io/aliyunoss-cli/)
- [Playground](https://chengchuu.github.io/aliyunoss-cli/playground/)
- [API documentation](https://chengchuu.github.io/aliyunoss-cli/api/)

## Install

The package requires Node.js 22 or later. Install it as a development dependency in the project that produces the files you want to upload:

```bash
npm install --save-dev aliyunoss-cli
```

## Configure

Create `alioss.config.json` in the directory where you run the command:

```json
{
  "region": "oss-region-id",
  "accessKeyId": "your-access-key-id",
  "accessKeySecret": "your-access-key-secret",
  "bucket": "your-bucket",
  "releaseEnvConf": {
    "development": {
      "source": "dist/",
      "target": "site/development/"
    },
    "production": {
      "source": "dist/",
      "target": "site/production/"
    }
  }
}
```

The final configuration uses this precedence, from lowest to highest:

1. Base values in the JSON file.
2. Values from the selected `releaseEnvConf` entry.
3. Explicit command-line flags.

The command requires `region`, `accessKeyId`, `accessKeySecret`, `bucket`, `source`, and `target` after merging configuration.

**Warning:** Never commit real OSS access keys. Keep credentials in a protected local file or inject them through a secured continuous integration environment.

## Upload a directory

Select a configured environment:

```bash
npx aliyunoss-cli --releaseEnv development
npx aliyunoss-cli --releaseEnv production
```

Override individual values for one run:

```bash
npx aliyunoss-cli \
  --releaseEnv production \
  --source public/ \
  --target static/
```

The command recursively discovers files beneath `source` and uploads each file beneath `target`. Do not point it at production credentials or a production bucket until you have verified the resolved paths and configuration.

## Command options

| Option              | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `--help`            | Show CLI help without starting an upload.                           |
| `--version`         | Show the CLI version.                                               |
| `--config`          | Select a configuration file. The default is `./alioss.config.json`. |
| `--releaseEnv`      | Select an entry from `releaseEnvConf`.                              |
| `--source`          | Override the local source directory.                                |
| `--target`          | Override the Alibaba Cloud OSS target path.                         |
| `--accessKeyId`     | Override the Alibaba Cloud OSS access key ID.                       |
| `--accessKeySecret` | Override the Alibaba Cloud OSS access key secret.                   |
| `--bucket`          | Override the Alibaba Cloud OSS bucket.                              |
| `--region`          | Override the Alibaba Cloud OSS region.                              |

Run `npx aliyunoss-cli --help` to inspect the CLI without uploading files.

## Use the package root

The package root re-exports the [`ali-oss`](https://www.npmjs.com/package/ali-oss) client constructor for compatibility:

```js
const OSS = require("aliyunoss-cli");

const client = new OSS({
  region: "oss-region-id",
  accessKeyId: "your-access-key-id",
  accessKeySecret: "your-access-key-secret",
  bucket: "your-bucket",
});
```

Creating a client does not upload data. An OSS operation such as `client.put()` performs a network request.

## Develop

This repository uses pnpm for reproducible dependency installation:

```bash
corepack enable
pnpm install
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run docs
pnpm run format:check
```

`pnpm run docs` creates and validates the final GitHub Pages artifact in `docs/`. Generated `bin/`, `lib/`, `dist-dev/`, `docs/`, and `coverage/` output must be changed through source or build configuration rather than manual edits.

## License

[MIT](https://github.com/chengchuu/aliyunoss-cli/blob/master/LICENSE)
