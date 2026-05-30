# ADR-003: Isolate Parsers as Pure Functions

**Status:** Accepted  
**Date:** 2026-05-30

## Context

Git command output must be parsed into typed objects used by the TreeDataProvider. The parsing logic could live in `gitService.ts` alongside the `execGit` calls, or it could be separated into a dedicated module.

## Decision

All git output parsing lives in `src/git/parsers.ts` as pure functions with zero VS Code imports.

```typescript
// Signature pattern for all parsers
function parseCommits(stdout: string): GitCommit[];
function parseBranches(stdout: string): GitBranch[];
// etc.
```

## Rationale

1. **Unit testability** — `@vscode/test-cli` requires launching a VS Code Extension Host process to run tests that import `vscode`. Pure functions with no `vscode` imports can be tested with plain Node.js (or any test runner). This makes parser tests fast and hermetic.

2. **Separation of concerns** — `gitService.ts` owns process spawning and error handling; `parsers.ts` owns data transformation. Each module has one reason to change.

3. **Debuggability** — Git output parsing is the most error-prone part (edge cases in branch names, stash messages, etc.). Isolating it makes it easy to write regression tests for specific git output strings.

## Consequences

- `parsers.ts` must not import from `vscode`. Enforce this with an ESLint rule or code review.
- `gitTypes.ts` must also be free of VS Code imports (it only contains interfaces).
- `gitService.ts` imports both — it is the only layer allowed to depend on all three.
- Test file: `src/test/parsers.test.ts` (compiles to `out/test/parsers.test.js`).
