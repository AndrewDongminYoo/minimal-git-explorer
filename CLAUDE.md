# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight VS Code extension that adds a focused Git explorer to the Source Control sidebar. Local-first, read-first, no accounts, no telemetry, no background indexing. Target version: `0.1.0`.

See `PLAN.md` for the full specification, phased implementation plan, and non-goals.

## Common Commands

```bash
# Compile (type-check + lint + esbuild)
pnpm run compile

# Watch mode (esbuild + tsc in parallel)
pnpm run watch

# Type-check only
pnpm run check-types

# Lint only
pnpm run lint

# Run tests (compiles first, then runs vscode-test)
pnpm test

# Build production bundle (minified, no sourcemaps)
pnpm run package
```

To run the extension locally: open the project in VS Code and press **F5** (launches Extension Development Host).

Tests live in `src/test/` and compile to `out/test/`. The test runner (`@vscode/test-cli`) requires VS Code to be installed — it launches a headless Electron host.

## Architecture

### Build pipeline

esbuild bundles `src/extension.ts` → `dist/extension.js` (CJS, Node platform). The `vscode` module is the only external — everything else is bundled inline. Config is in `esbuild.js`.

TypeScript target is ES2022, module system is Node16. `tsconfig.json` enables strict mode with no relaxations.

### Planned source layout (from PLAN.md)

The extension is not yet implemented beyond the scaffold. The intended structure is:

```
src/
  extension.ts          — activate/deactivate; registers TreeView and commands
  git/
    repository.ts       — detect git root via `git rev-parse --show-toplevel`
    gitService.ts       — one method per section (listCommits, listBranches, etc.)
    gitTypes.ts         — shared TypeScript interfaces for git data
    parsers.ts          — pure functions parsing git command stdout into typed objects
  views/
    gitExplorerProvider.ts  — TreeDataProvider implementation
    gitExplorerItems.ts     — TreeItem subclasses for each section/item type
  commands/
    registerCommands.ts     — wires all commands to context.subscriptions
    commitCommands.ts
    branchCommands.ts
    remoteCommands.ts
    stashCommands.ts
    tagCommands.ts
    worktreeCommands.ts
  utils/
    execGit.ts          — wraps child_process.execFile for git commands
    openTextDocument.ts — opens read-only virtual documents in the editor
```

### Key design constraints

- **No helloWorld command** — remove `minimal-git-explorer.helloWorld` from `package.json` and `extension.ts` before any meaningful commit.
- **No mutations without confirmation** — destructive or risky git operations must show a confirmation dialog.
- **No settings for 0.1.0** — do not add `contributes.configuration` until there is a real user need.
- **Git commands only** — all data comes from spawning `git` locally. No VS Code git extension API, no libgit2 bindings.
- **Output channel** — create one named `"Minimal Git Explorer"` and log git command stderr there instead of showing raw errors to users.
- **View id** — `minimal-git-explorer.gitExplorer`, contributed under the `scm` view container.

### Parser contract

`parsers.ts` must contain pure functions with no side effects. Each parser takes a raw `string` (stdout) and returns a typed array. These are the primary unit-test targets — keep them isolated from VS Code APIs.

### Commands

Registered commands for 0.1.0:

```
minimal-git-explorer.refresh
minimal-git-explorer.openCommit
minimal-git-explorer.checkoutBranch
minimal-git-explorer.copyRemoteUrl
minimal-git-explorer.showStash
minimal-git-explorer.applyStash
minimal-git-explorer.copyTagName
minimal-git-explorer.openWorktree
```

### Testing

Unit tests target parser functions in `src/git/parsers.ts`. The test framework is Mocha via `@vscode/test-cli`. Tests compile to `out/` before running — run `pnpm run compile-tests` separately if you only want to type-check tests.

Manual test checklist (before any release): see `PLAN.md` § "Testing Plan".
