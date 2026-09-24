# AGENTS.md

Guidance for automated coding agents working in this repository.

## Project scope

`aliyunoss-cli` is a Node.js package with two published CommonJS surfaces:

- The `aliyunoss-cli` executable recursively uploads a local directory to Alibaba Cloud OSS.
- The package root re-exports the `ali-oss` client constructor unchanged.

The repository also owns a static documentation website, a no-network React example, TypeDoc API
documentation, search and social metadata, and an installable Progressive Web App (PWA). Keep all
website behavior and dependencies out of the published runtime.

CI and the installed Node.js type declarations currently use Node.js 22, while emitted TypeScript
targets ES2022. `package.json` has no `engines` field, and the repository has no `.nvmrc`; treat
Node.js 22 as the current development and CI baseline, not as a declared consumer requirement.

Inspect `git status` before editing. Preserve unrelated work. Do not stage, commit, tag, push,
publish, or deploy unless the user explicitly asks.

## Repository map

- `src/index.ts`: canonical CLI entrypoint. It parses arguments, reads the package version, merges
  configuration, validates required fields, and calls `upload()`.
- `src/upload.ts`: synchronous file discovery plus OSS upload, retry, progress, and summary logic.
- `src/library.ts`: canonical package-root `ali-oss` re-export.
- `bin/index.js` and `bin/upload.js`: tracked CLI output generated from `src` by TypeScript.
- `lib/index.js`: tracked CommonJS package-root output generated from `src/library.ts` by Rollup.
- `project.config.js`: central authority for package-derived metadata, GitHub Pages routes, SEO,
  theme values, PWA identity, icons, and cache names.
- `site/`: static homepage templates and shared navigation, theme, PWA, API enhancement, and CSS
  source.
- `examples/`: React 19 no-network example and its HTML/CSS source.
- `scripts/`: package build, Webpack site build, TypeDoc/Pages assembly, content fingerprinting, and
  package, SEO, and PWA validation.
- `images/`: source favicon, logo, social image, and PWA icons.
- `test/`: Node test-runner coverage for the CLI, public package root, project configuration,
  website source boundaries, theme integration, and Pages fingerprinting.
- `.github/workflows/pages.yml`: Pages validation, artifact upload, and deployment.
- `.github/workflows/publish-npm.yml`: release-branch package validation, npm publication, and tag
  creation.
- `alioss.config.json`: example CLI configuration. Never add real credentials.

## Runtime and configuration flow

```text
process.argv
  -> minimist
  -> --config or ./alioss.config.json
  -> selected releaseEnvConf entry
  -> explicit CLI overrides
  -> required-field validation
  -> upload(config)
  -> recursive local file list
  -> concurrent ali-oss client.put() calls
  -> one retry per failed file
  -> per-file output and final summary
```

Configuration precedence is base JSON, selected environment, then explicit flags. The resolved
configuration requires `region`, `accessKeyId`, `accessKeySecret`, `bucket`, `source`, and `target`.
Preserve this ordering and the existing OSS object-key construction unless a behavioral change is
explicitly requested.

`src/upload.ts` keeps `allNumber`, `tmpNumber`, `sucNumber`, `retNumber`, and `sizeNumber` as
module-level mutable counters. They are shared by asynchronous callbacks and are not reset for a
second `upload()` call in the same process. Add deterministic regression tests before changing
traversal, concurrency, retry, completion, or path behavior. Mock filesystem and OSS calls; never
use production credentials or network services in tests.

## Website architecture

The production routes are `/aliyunoss-cli/`, `/aliyunoss-cli/examples/`, and
`/aliyunoss-cli/api/`.

- Webpack builds `site/index.html`, the React examples, shared Bootstrap CSS/navigation, image
  assets, and page scripts into `dist-dev/`.
- `DefinePlugin` injects the browser-safe `__SITE_RUNTIME_CONFIG__` value derived from
  `project.config.js`; `site/runtime-config.ts` exposes it as `SITE_RUNTIME_CONFIG`. Do not import
  build-only configuration into `src`, `bin`, or `lib`.
- `site/shared.ts` initializes theme controls, Bootstrap navigation, and website-only PWA behavior.
  `site/index.ts` owns the homepage copy action, while `site/api.ts` marks TypeDoc pages as
  enhanced.
- `examples/App.tsx` owns its form, error, and result state with React `useState`. It accepts no
  props and uses no React Context. It constructs the package-root OSS client with placeholder
  credentials but must not call `put`, `multipartUpload`, or any other network operation.
- Theme preference and media-query behavior delegate to the installed `mazey` APIs. Keep the
  `system`, `light`, and `dark` controls synchronized across the homepage, examples, and TypeDoc.
- PWA installation and service-worker updates remain user-controlled. Local `build:dev` output has
  PWA registration disabled; the production Pages build enables it under the project base path.

The React example is small and has no material render bottleneck; local form state intentionally
re-renders only `App`. The CLI's practical throughput risks are synchronous recursive filesystem
access, unbounded parallel uploads, and per-file logging. The website's heavier work is build-time
Webpack, TypeDoc, HTML transformation, and artifact validation.

## Artifact graph and publishing boundary

```text
src/index.ts + src/upload.ts -> tsc -> bin/
src/library.ts -> Rollup -> lib/index.js
site/ + examples/ + images/ -> Webpack -> dist-dev/
src/library.ts + README.md -> TypeDoc -> dist-dev/api/
dist-dev/ + project.config.js + service-worker source -> Pages assembly -> docs/
```

`bin/` and `lib/` are tracked generated artifacts. Edit their source first, run the owning build,
and review the generated diff. `dist-dev/`, `docs/`, and `coverage/` are ignored outputs and must
never be edited manually. `scripts/fingerprint-pages.cjs` makes the service-worker cache version
content-sensitive while excluding generated workers and source maps.

The `package.json#files` allowlist publishes only `bin`, `lib`, `README.md`, and `LICENSE`. Keep
React, Bootstrap, Mazey, Webpack, TypeDoc, PWA code, site configuration, and examples development-
only. When a package entry changes, update source, generated output, validation, tests, examples,
and documentation together.

## Build and validation

Use npm for the current documented local workflow and for all package scripts. Both GitHub Actions
workflows also use `npm install` and npm scripts without dependency caching. The repository still
commits `pnpm-lock.yaml`, while `.gitignore` excludes `package-lock.json`; preserve that state
unless the user explicitly requests a package-manager policy change.

The package has no `type` field. The root TypeScript project uses `NodeNext` and treats the CLI
sources as CommonJS; regular `.js` and `.cjs` files are also CommonJS, while Rollup configuration
uses `.mjs`. The root `tsconfig.json` starts from `src/index.ts` and follows its imports,
`tsconfig.library.json` validates `src/library.ts`, and `tsconfig.site.json` owns browser and React
sources.

Run checks that match the change:

```bash
corepack enable
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run docs
npm run format:check
npm pack --dry-run
git diff --check
```

- `typecheck` validates the CLI, library entry, and site/example TypeScript projects.
- `lint` currently repeats `typecheck`; it is not a separate style linter.
- `build` regenerates `bin/` and `lib/`, then verifies the package-root and executable contract.
- `build:dev` creates a one-off local site artifact in `dist-dev/`; it does not start a server.
- `docs` builds the production site and TypeDoc, assembles `docs/`, and runs SEO and PWA validators.
- `package:validate` confirms the root re-export, executable paths, and website dependency boundary.

For CLI changes, also run `node bin/index.js --help` and `node bin/index.js --version`; these paths
do not upload data. For package changes, inspect the dry-run tarball contents. For site changes,
validate the final `docs/index.html`, `docs/examples/index.html`, and `docs/api/index.html`, not
only source templates or `dist-dev/`.

## Delivery boundaries

Pages deploys pushes to `main` and `release/v*`, plus manual dispatches, after the full package,
site, formatting, SEO, and PWA pipeline passes. It uploads only `docs/` through the `github-pages`
environment. The publication workflow tests pull requests to `main` and `release/v*`; pushes to
`release/v*` build and publish to npm, then create and push the package-version tag. Manual runs do
not publish because the publish job is restricted to push events.

Do not alter triggers, permissions, secrets, deployment environments, publication, or tagging as a
side effect of unrelated work. Never log access keys, secrets, or complete credential-bearing
configuration objects.
