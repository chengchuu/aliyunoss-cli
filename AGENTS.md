# AGENTS.md

Guidance for automated coding agents working in this repository.

## Project Scope

`aliyunoss-cli` is a Node.js command-line tool for recursively uploading a local directory to
Alibaba Cloud OSS. It is not a frontend application and has no component framework, DOM rendering,
or browser state. Keep changes focused on the CLI, its configuration precedence, upload behavior,
and published package contract.

Inspect `git status` before editing. Preserve unrelated work, and do not commit, tag, publish, or
rewrite history unless the user explicitly asks.

## Repository Map

- `src/index.ts`: canonical CLI entrypoint; parses arguments, loads configuration, applies
  overrides, validates required fields, and starts the upload.
- `src/upload.ts`: file discovery, OSS client creation, upload/retry handling, progress counters,
  and console output.
- `bin/index.js` and `bin/upload.js`: committed JavaScript emitted from `src` and used by the
  package `bin` entry. Regenerate them after source changes; do not treat them as primary source.
- `lib/index.js`: separate legacy module referenced by `package.json#main`; it is not produced by
  the current TypeScript build command.
- `alioss.config.json`: example configuration. Never add real credentials.
- `README.md`: installation, configuration, and CLI usage contract.
- `.github/workflows/publish-npm.yml`: test, publish, and tag automation.

## Runtime And Data Flow

```text
process.argv
  -> minimist in src/index.ts
  -> optional JSON config from --config or ./alioss.config.json
  -> selected releaseEnvConf entry
  -> explicit CLI option overrides
  -> required-field validation
  -> upload(aliossConfig)
  -> recursive local file listing
  -> ali-oss client.put() for each file
  -> one retry on failure
  -> progress and final summary on stdout
```

Configuration precedence is: base JSON configuration, selected release environment, then explicit
CLI flags. Preserve that ordering unless intentionally changing the public behavior. The required
fields are `region`, `accessKeyId`, `accessKeySecret`, `bucket`, `source`, and `target`.

## Frontend Component Hierarchy

There is no frontend component hierarchy.

- **Shared state:** `src/upload.ts` owns module-level counters (`allNumber`, `tmpNumber`,
  `sucNumber`, `retNumber`, and `sizeNumber`). Async upload callbacks mutate them and `_result()`
  prints the summary once all files have settled. Be careful if making `upload()` reusable or
  allowing more than one upload per process, because the counters are not reset per invocation.
- **Prop flow:** no component props exist. The closest data flow is the assembled `aliossConfig`
  object passed from `src/index.ts` into `upload()`, then into each `_upload()` call together with
  the shared OSS client and file record.
- **Context usage:** no React, Vue, dependency-injection, or browser context exists. Runtime context
  comes only from `process.argv`, `process.cwd()`, the selected JSON file, filesystem state, and OSS
  credentials. Keep these dependencies explicit and avoid hidden global configuration.
- **Rendering bottlenecks:** there is no UI render cycle. The relevant throughput constraints are
  synchronous recursive filesystem calls (`existsSync`, `statSync`, and `readdirSync`), launching
  every `client.put()` without a concurrency limit, and per-file console logging. Preserve current
  behavior for small fixes; add bounded concurrency and tests before optimizing large uploads.

## Build And Validation

Install dependencies with `npm install` when needed. Use the repository's existing scripts:

```bash
npm run build:tsc
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run lint` currently performs TypeScript static validation; there is no separate style linter.
For TypeScript changes, run `npm run build:tsc`, inspect the resulting `bin` diff, and exercise safe
CLI paths such as `node bin/index.js --help`. Do not run a real upload without an explicit request
and suitable non-secret test configuration. For package-facing changes, also run
`npm pack --dry-run` and confirm the expected `bin`, `lib`, README, license, and metadata are
included.

## Change Discipline

- Keep compatibility with the existing CommonJS executable output and the `aliyunoss-cli` bin name.
- Update `README.md` when flags, precedence, required fields, output, or setup changes.
- Add deterministic tests before changing traversal, retries, path mapping, or async completion.
  Mock filesystem and OSS calls; tests must not require network access or real credentials.
- Avoid logging access keys, secrets, or complete credential-bearing configuration objects.
- Keep source and committed executable output synchronized, and check `git diff --check` before
  handoff.
