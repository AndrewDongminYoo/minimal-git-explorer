# Phase 2: Git Service

**Goal:** Read Git repository data through local git commands.

**Status:** Completed
**Depends on:** Phase 1

> Historical plan: current command formats, stable stash identity, and fail-closed error contracts are documented in `docs/specs/git-data-contract.md`.

## Tasks

- [x] Create `src/utils/execGit.ts`
  - `execFile`-based wrapper: `execGit(args: string[], cwd: string): Promise<string>`
  - Define `GitError` class with `args`, `stderr`, `exitCode` fields
  - Never throw raw `Error` — always wrap in `GitError`

- [x] Create `src/git/gitTypes.ts`
  - Interfaces: `GitCommit`, `GitBranch`, `GitRemote`, `GitStash`, `GitTag`, `GitWorktree`
  - No `vscode` imports
  - See `docs/specs/git-data-contract.md` for field definitions

- [x] Create `src/git/parsers.ts`
  - Pure functions: `parseCommits`, `parseLocalBranches`, `parseRemoteBranches`, `parseRemotes`, `parseStashes`, `parseTags`, `parseWorktrees`
  - No `vscode` imports
  - Handle empty stdout gracefully (return `[]`)

- [x] Create `src/git/repository.ts`
  - `detectGitRoot(workspaceFolder: string): Promise<string | null>`
  - Runs `git rev-parse --show-toplevel`

- [x] Create `src/git/gitService.ts`
  - `GitService` class taking `repoRoot: string` and `outputChannel: vscode.OutputChannel`
  - Methods: `listCommits()`, `listBranches()`, `listRemotes()`, `listStashes()`, `listTags()`, `listWorktrees()`
  - Each read method calls `execGit`, passes stdout to the corresponding parser, logs formatted diagnostics, and rethrows failures

- [x] Create `src/test/parsers.test.ts`
  - Test each parser function with representative git output strings
  - Include edge cases: empty output, unusual branch names, no stashes

## Definition of Done

```markdown
- Each GitService method returns correctly typed data
- pnpm test passes
- Parser tests cover the 6 git data types
- Git command errors are logged and rethrown so providers can render explicit error items
```

## Files to Create

| File                       | Action |
| -------------------------- | ------ |
| `src/utils/execGit.ts`     | Create |
| `src/git/gitTypes.ts`      | Create |
| `src/git/parsers.ts`       | Create |
| `src/git/repository.ts`    | Create |
| `src/git/gitService.ts`    | Create |
| `src/test/parsers.test.ts` | Create |

## Reference

Git command details and TypeScript interface definitions: `docs/specs/git-data-contract.md`

## Verification

```bash
pnpm test   # parsers.test.ts must pass
pnpm run check-types   # no type errors
```
