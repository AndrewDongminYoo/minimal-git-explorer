# Quality Tooling Refresh Plan

## Work

1. Verify repository identity, instructions, current changes and Oracle precedent.
2. Refresh compatible dependency and linter versions with existing package managers.
3. Run the declared local gates and `trunk check --all --no-fix`.
4. Reconcile affected knowledge and review the scoped candidate.
5. Commit locally and prepare visible evidence before requesting publication approval.

## Declared Gates

- `pnpm install --frozen-lockfile`
- `pnpm run package`
- `VSCODE_TEST_VERSION=1.137.0 pnpm test`
- `VSCODE_TEST_VERSION=stable pnpm test`
- `pnpm run vsix`
- `python3 -B .trunk/configs/tests/test_trufflehog_to_sarif.py`
- `trunk check --all --no-fix --jobs=2`

## Success Criteria

1. Resolve refreshed declarations without replacing the existing lockfile → verify: `pnpm update`, followed by `pnpm install --frozen-lockfile` and resolved dependency graph inspection.
2. Preserve supported compiler and API boundaries → verify: `pnpm run check-types`, `pnpm run lint`, and `pnpm run package`.
3. Preserve the extension's minimum and current supported hosts → verify: real `VSCODE_TEST_VERSION=1.137.0 pnpm test` and `VSCODE_TEST_VERSION=stable pnpm test` runs with disposable profiles.
4. Preserve the distributable → verify: `pnpm run vsix` and inspect the resulting archive for the production bundle and manifest.
5. Apply security overrides only to actual consumers → verify: lockfile dependency paths, `pnpm audit`, direct OSV lockfile scan, and affected tool paths.
6. Enable the requested quality versions and commands → verify: resolved `trunk config print`, failure controls, actual Pinact `lint` and `upgrade` invocation logs, and `trunk check --all --no-fix --jobs=2`.
7. Reconcile affected knowledge → verify: documented command and path checks, protected manifest comparison, scoped diff review, and `git diff --check`.

## Verified Local Evidence

The regenerated lockfile passes `pnpm install --frozen-lockfile` under Node `24.22.1` and pnpm `11.28.9`.
The production bundle, type checks, lint, compiled tests, and VSIX packaging pass.
The archive contains the production bundle and current manifest while excluding source, tests, documentation, dependencies, and quality configuration.
The real minimum VS Code `1.137.0` and stable `1.144.0` hosts each pass 76 tests.
A temporary configuration preserved the original relative test pattern and verified its exact 12 compiled test files before launch.
Separate disposable profiles avoid this Mac's Unix socket path limit; the temporary configuration and profiles were removed after checking for open handles.
Two setup-only failures are retained in external evidence: an overlong socket path and an absolute wildcard treated literally by the installed runner.
Production source, test behavior, assets, public contributions, extension version, and minimum host contract remain unchanged.
Two exact URI-detector suppressions annotate existing synthetic credential-stripping fixtures.
TypeScript transpilation without comments is identical before and after those annotations.

Mocha's consumer-specific overrides pass a real assertion-failure diff reporter control and a two-test parallel-worker run.
The local secret reader passes its thirteen regressions.
Actual encoded and literal findings both fail configured Trunk with exit `1`; a clean control passes with exit `0`.
The old reader drops the same encoded finding, confirming the regression.

The initial dependency audits report `GHSA-xcx6-jx8p-x3h5` in `@azure/msal-node@6.0.1` through VSCE and Azure Identity.
The scoped Azure Identity override selects patched `7.1.2`.
Injected in-memory HTTP responses exercise Azure Identity's client-secret token path and construction of MSAL's public client without real credentials or provider requests.
Authenticated publishing, managed identity, and interactive browser authentication are outside this verification.
VSIX packaging passes with the patched graph.
The package manager added exact release-age exclusions for `@azure/msal-node@7.1.2` and its `@azure/msal-common@16.15.0` dependency while resolving those recent releases.
The final package-manager audit reports no advisories; the direct OSV and full Trunk results are recorded in the visible review evidence.

TypeScript `6.0.3` remains within the ESLint integration's `<6.1.0` peer range.
`@types/vscode@1.137.0` preserves the declared minimum API surface.
These are the only direct dependencies reported as outdated by the package manager.

## Source-Line Repair

The current reader uses the independently reviewed `localizations` repair at `b47e59659a886ad673a2f4a9bed6a3bf4986615b`.
It prefers a positive integer filesystem line only when the literal starts on that line.
Invalid hints retain literal-search and file-level fallbacks.
Thirteen CLI tests cover repeated and out-of-order findings in addition to the existing lossless conversion cases.
