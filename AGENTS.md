# AGENTS.md

Guidance for automated coding agents working in this repository.

## Project Scope

`aliyunoss-cli` is a Node.js command-line tool for recursively uploading a local directory to
Alibaba Cloud OSS. The repository also contains a documentation website and no-network browser
playground. Keep published runtime changes focused on the CLI, its configuration precedence,
upload behavior, and package-root contract; website code must remain build-time only.

Inspect `git status` before editing. Preserve unrelated work, and do not commit, tag, publish, or
rewrite history unless the user explicitly asks.

## Repository Map

- `src/index.ts`: canonical CLI entrypoint; parses arguments, loads configuration, applies
  overrides, validates required fields, and starts the upload.
- `src/upload.ts`: file discovery, OSS client creation, upload/retry handling, progress counters,
  and console output.
- `bin/index.js` and `bin/upload.js`: committed JavaScript emitted from `src` and used by the
  package `bin` entry. Regenerate them after source changes; do not treat them as primary source.
- `src/library.ts`: canonical source for the package-root `ali-oss` re-export.
- `lib/index.js`: committed CommonJS package root generated from `src/library.ts` by Rollup.
- `project.config.js`: central package, site, SEO, theme, PWA, and URL configuration.
- `site/` and `examples/`: Bootstrap website, shared browser behavior, and React playground source.
- `scripts/`: Rollup, Webpack, Pages assembly, and artifact validation code.
- `images/`: source logo, favicon, social image, and PWA icons.
- `dist-dev/`, `docs/`, and `coverage/`: generated output; never edit these directories manually.
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

The website is separate from the published CLI runtime.

- `site/shared.ts` initializes Bootstrap navigation, Mazey-based theme handling, and website-only
  PWA behavior for every primary route.
- `site/index.ts` handles the homepage install-command copy action.
- `examples/App.tsx` renders the playground and constructs the public package-root OSS client with
  placeholder credentials. It must never call upload methods or issue network requests.
- TypeDoc owns API HTML generation. `scripts/build-pages.cjs` applies deterministic metadata and
  navigation enhancements before assembling the final `docs/` artifact.

- **Shared state:** `src/upload.ts` owns module-level counters (`allNumber`, `tmpNumber`,
  `sucNumber`, `retNumber`, and `sizeNumber`). Async upload callbacks mutate them and `_result()`
  prints the summary once all files have settled. Be careful if making `upload()` reusable or
  allowing more than one upload per process, because the counters are not reset per invocation.
- **Prop flow:** no component props exist. The closest data flow is the assembled `aliossConfig`
  object passed from `src/index.ts` into `upload()`, then into each `_upload()` call together with
  the shared OSS client and file record.
- **Context usage:** CLI runtime context comes only from `process.argv`, `process.cwd()`, the selected
  JSON file, filesystem state, and OSS credentials. Website runtime configuration is injected from
  `project.config.js` by Webpack and must not enter `src/`, `bin/`, or `lib/`.
- **Rendering bottlenecks:** there is no UI render cycle. The relevant throughput constraints are
  synchronous recursive filesystem calls (`existsSync`, `statSync`, and `readdirSync`), launching
  every `client.put()` without a concurrency limit, and per-file console logging. Preserve current
  behavior for small fixes; add bounded concurrency and tests before optimizing large uploads.

## Build And Validation

Use pnpm and the committed `pnpm-lock.yaml`. Relevant scripts are:

```bash
npm run build:tsc
npm run typecheck
npm run lint
npm test
npm run build
npm run docs
npm run seo:validate
npm run pwa:validate
npm run format:check
```

`npm run lint` currently performs TypeScript static validation; there is no separate style linter.
For TypeScript changes, run `npm run build:tsc`, inspect the resulting `bin` diff, and exercise safe
CLI paths such as `node bin/index.js --help`. Do not run a real upload without an explicit request
and suitable non-secret test configuration. For package-facing changes, also run
`npm pack --dry-run` and confirm the expected `bin`, `lib`, README, license, and metadata are
included. For site work, validate the final `docs/index.html`, `docs/playground/index.html`, and
`docs/api/index.html`, not only the source templates.

## Change Discipline

- Keep compatibility with the existing CommonJS executable output and the `aliyunoss-cli` bin name.
- Keep Rollup responsible for `lib/index.js`, TSC responsible for `bin/`, Webpack responsible for
  the website and playground, TypeDoc responsible for API HTML, and the Pages script responsible
  for `docs/` assembly.
- Update `README.md` when flags, precedence, required fields, output, or setup changes.
- Add deterministic tests before changing traversal, retries, path mapping, or async completion.
  Mock filesystem and OSS calls; tests must not require network access or real credentials.
- Avoid logging access keys, secrets, or complete credential-bearing configuration objects.
- Keep source and committed executable output synchronized, and check `git diff --check` before
  handoff.
