# aliyunoss-cli

[![npm version](https://img.shields.io/npm/v/aliyunoss-cli)](https://www.npmjs.com/package/aliyunoss-cli)
[![license](https://img.shields.io/npm/l/aliyunoss-cli)](https://github.com/chengchuu/aliyunoss-cli/blob/master/LICENSE)

`aliyunoss-cli` recursively uploads a local directory to Alibaba Cloud Object Storage Service (OSS). It supports reusable JSON configuration and environment-specific source and target paths. Command-line flags override values from the JSON file and selected environment.

- [Project website](https://chengchuu.github.io/aliyunoss-cli/)
- [Examples](https://chengchuu.github.io/aliyunoss-cli/examples/)
- [API documentation](https://chengchuu.github.io/aliyunoss-cli/api/)

## Install

Install the package as a development dependency in the project that builds the directory you want to upload:

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

The CLI resolves configuration in the following order, from lowest to highest precedence:

1. Base values in the JSON file.
2. Values from the selected `releaseEnvConf` entry.
3. Explicit command-line flags.

The merged configuration must include `region`, `accessKeyId`, `accessKeySecret`, `bucket`, `source`, and `target`.

**Warning:** Never commit real OSS access keys. Store credentials in a protected local configuration file or provide them through protected continuous integration (CI) configuration.

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

The command recursively discovers files beneath `source` and uploads each file beneath `target`. Before you use production credentials or a production bucket, verify the resolved source path, target path, and configuration.

## Command options

The CLI supports the following options:

| Option              | Purpose                                                             |
| :------------------ | :------------------------------------------------------------------ |
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

For compatibility, the package root re-exports the [`ali-oss`](https://www.npmjs.com/package/ali-oss) client constructor:

```js
const OSS = require("aliyunoss-cli");

const client = new OSS({
  region: "oss-region-id",
  accessKeyId: "your-access-key-id",
  accessKeySecret: "your-access-key-secret",
  bucket: "your-bucket",
});
```

Creating a client does not upload data. Calling an OSS operation, such as `client.put()`, performs a network request.

## Develop

```bash
corepack enable
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run docs
npm run format:check
```

`npm run docs` creates and validates the final GitHub Pages artifact in `docs/`. Treat `bin/`, `lib/`, `dist-dev/`, `docs/`, and `coverage/` as generated output. Update the maintained source or build configuration, then regenerate the affected output instead of editing it directly.

## License

[MIT](https://github.com/chengchuu/aliyunoss-cli/blob/master/LICENSE)
