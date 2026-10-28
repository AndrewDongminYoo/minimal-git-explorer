# Quality Tooling Refresh

## Approved Scope

Refresh supported dependencies and existing quality tooling.
Preserve public APIs, generated artifacts and repository-specific boundaries.

## Acceptance

- Pinact remains locked to `4.1.1` with `lint` and `upgrade`.
- The full no-fix Trunk scan and declared project gates pass.
- Changed manifests have package-manager-generated lockfiles under repository policy.
- Advisory dispositions have specific evidence and affected knowledge claims are reconciled.

## Compatibility Boundaries

Preserve extension version `0.3.0`, the VS Code engine range `^1.137.0`, contributions, production source, tests, and assets.
Keep `@types/vscode` on the `1.137` minor line and run the real `1.137.0` host separately from `stable`.
The registry reports TypeScript `7.0.2`, but `typescript-eslint@8.72.1` accepts TypeScript `>=4.8.4 <6.1.0`.
Retain TypeScript `6.0.3` rather than crossing that peer boundary.
Retain the pnpm `11` major.

Use existing build approvals and consumer-specific security overrides.
The Azure Identity consumer uses patched MSAL Node `7.1.2` for `GHSA-xcx6-jx8p-x3h5`.
The MSAL 7 interactive-request change removes `responseMode`; the installed Azure Identity request builder does not supply that field.
Verify the injected offline token path and packaging, and disclose that real authentication flows remain untested.
Keep supported lockfiles in vulnerability scans.
TruffleHog must use `--no-verification --no-update` so the maintenance scan does not contact credential providers.
The project-local filesystem reader must retain encoded findings without a literal position and reject malformed input.
CI runs its standard-library regressions through the exact test file.
Actual encoded and literal negative controls must fail the configured Trunk gate while a clean control passes.
Pinact must retain `4.1.1!` and enable both `lint` and `upgrade` in the resolved Trunk configuration.

## Verification Environment

The inspected local Node interpreter is `/Users/dongminyu/.nvm/versions/node/v24.22.1/bin/node` (`v24.22.1`).
CI declares Node `24` for both quality and extension-host jobs.
Trunk separately declares managed Node `22.16.0` and Python `3.14.4` runtimes.
Record the actual interpreter for each executed gate.
Run extension tests in disposable user-data and extensions directories against temporary Git repositories.

## Precedent

Oracle returned source commit `9670d54de3076c5239713f54900c7a855bd18478` with freshness marked `UNVERIFIED/PARTIAL`.
`raw/sources/minimal-git-explorer/CLAUDE.md`, `raw/sources/minimal-git-explorer/CHANGELOG.md`, and `wiki/entities/minimal-git-explorer.md` support separate minimum and stable hosts, scoped overrides, independent pure-parser tests, production bundling, and actual VSIX packaging.
These precedents confirm the existing repository test matrix and packaging gates.
`wiki/sources/minimal-git-explorer--vsc-extension-quickstart.md` is historical Yeoman guidance and does not define the current maintenance contract.

## Publication

Push and PR creation require explicit repository-specific approval.
After approval, continue the requested hosted gates, merge, cleanup and memory recording.
