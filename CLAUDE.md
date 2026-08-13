# CLAUDE.md

This file provides contributor guidance for work in this repository.

## Project Overview

Minimal Git Explorer is a lightweight VS Code extension that adds six local-first Git views to the Source Control sidebar.
The current manifest version is `0.3.0`.
The extension has no accounts, telemetry, background indexing, or network API integration.

## Documentation Map

Read only what the task requires:

| Working on…                       | Read…                                    |
| --------------------------------- | ---------------------------------------- |
| VS Code view/command contribution | `docs/specs/git-explorer-spec.md`        |
| Git data types / parsers          | `docs/specs/git-data-contract.md`        |
| Why git CLI (not VS Code git API) | `docs/notes/adr-001-git-cli-only.md`     |
| Why esbuild                       | `docs/notes/adr-002-esbuild-bundler.md`  |
| Why parsers are pure functions    | `docs/notes/adr-003-parser-isolation.md` |
| Initial release history           | `PLAN.md`, `docs/plans/phase-*.md`       |

`PLAN.md` and the numbered phase plans are historical `0.1.0` planning artifacts.
Current behavior and contracts live in `docs/specs/` and the production source.

## Common Commands

```bash
# Install the pinned dependency graph
pnpm install --frozen-lockfile

# Compile, type-check, lint, and build
pnpm run compile

# Type-check or lint independently
pnpm run check-types
pnpm run lint

# Run the full extension test suite on stable VS Code
pnpm test

# Run the supported-version test matrix locally
VSCODE_TEST_VERSION=1.125.0 pnpm test
VSCODE_TEST_VERSION=stable pnpm test

# Build the production bundle and package a VSIX
pnpm run package
pnpm run vsix
```

Tests live in `src/test/` and compile to `out/test/`.
The test configuration is in `.vscode-test.mjs`, and CI runs VS Code `1.125.0` plus `stable`.

## Architecture

esbuild bundles `src/extension.ts` to `dist/extension.js` as CommonJS for the Node extension host.
TypeScript uses strict mode, an ES2022 target, and Node16 modules.

```log
src/
  extension.ts             — activation, six TreeViews, rediscovery, document cleanup
  git/
    repository.ts          — git root detection
    repositoryContext.ts   — current GitService and repository error state
    gitService.ts          — Git read/action methods
    gitTypes.ts            — shared Git data interfaces
    parsers.ts             — pure stdout parsers
  views/
    sectionProviders.ts    — six independent TreeDataProviders
    gitExplorerItems.ts    — typed data, empty, and error TreeItems
  commands/
    registerCommands.ts    — dynamic command registration
    *Commands.ts           — section-specific actions
  utils/
    execGit.ts             — typed execFile wrapper and diagnostics
    openTextDocument.ts    — read-only virtual document provider
```

## Key Constraints

- All Git data comes from local `git` commands through `execFile`.
- The extension contributes six independent TreeViews under the `scm` container.
- Refresh must rediscover the repository so a folder that becomes a repository after `git init` is usable without reloading the extension.
- Empty repository data and Git read errors must render as distinct items.
- Stash UI labels may use `stash@{N}`, but show/apply actions must use the captured immutable stash object ID.
- Git command details belong in the `Minimal Git Explorer` output channel; user notifications remain concise.
- Checkout and stash apply must fail closed when dirty-state detection fails.
- Restricted Mode is unsupported because local Git commands and hooks may execute.
- Do not add settings or dependencies without a concrete product need.

## Commands

The command IDs are:

```text
minimal-git-explorer.refresh
minimal-git-explorer.openCommit
minimal-git-explorer.checkoutBranch
minimal-git-explorer.copyRemoteUrl
minimal-git-explorer.showStash
minimal-git-explorer.applyStash
minimal-git-explorer.copyTagName
minimal-git-explorer.openWorktree
```

## Testing

Parser tests remain independent of VS Code APIs.
Integration tests cover real temporary Git repositories, repository rediscovery, providers, commands, manifest contracts, and extension activation.
Before release work, run the frozen install, both VS Code test versions, the production build, VSIX packaging, dependency audit, and Trunk checks.
