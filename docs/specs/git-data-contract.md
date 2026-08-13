# Git Data Contract

This document defines the production Git commands, raw output formats, and TypeScript interfaces.

Implementations live in:

- `src/git/gitTypes.ts` — interfaces
- `src/git/parsers.ts` — pure parsers with no VS Code dependency
- `src/git/gitService.ts` — command execution and parser delegation
- `src/utils/execGit.ts` — typed process execution and diagnostics

## Commits

```bash
git log -n 50 --pretty=format:%H%x09%h%x09%an%x09%ae%x09%ar%x09%s
```

The first five tab boundaries separate `fullHash`, `shortHash`, `author`, `authorEmail`, and `relativeDate`.
The remaining text is `subject`, so tabs in a subject are preserved.

```typescript
interface GitCommit {
  fullHash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  relativeDate: string;
  subject: string;
}
```

Open action: `git show --stat --patch <fullHash>` in a read-only virtual document.

## Branches

```bash
# Local
git branch --format=%(refname:short)%09%(objectname:short)%09%(upstream:short)%09%(HEAD)

# Remote
git branch -r --format=%(refname:short)%09%(objectname:short)%09%(symref)
```

Remote rows with a non-empty `symref` are symbolic pointers such as `origin/HEAD` and are not rendered as branches.

```typescript
interface GitBranch {
  name: string;
  shortHash: string;
  upstream?: string;
  isCurrent: boolean;
  isRemote: boolean;
}
```

Checkout action: run `git checkout <name>` only after `git status --porcelain` succeeds.
Prompt for confirmation when the working tree is dirty.

## Remotes

```bash
git remote -v
```

Raw output lines are `<name>\t<url> (fetch|push)`.
The parser uses the first tab and final fetch/push marker so local paths and URLs containing spaces are preserved.

```typescript
interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}
```

Copy action: `vscode.env.clipboard.writeText(url)`.

## Stashes

```bash
git stash list --format=%gd%x09%H%x09%gs
```

Raw output fields are display ref, immutable stash commit object ID, and reflog subject.
The stash ref is shared across linked worktrees, so the command runs once at the repository root.

```typescript
interface GitStash {
  index: number;
  ref: string; // Display-only reflog identity such as "stash@{0}"
  objectId: string; // Immutable identity captured when the list is loaded
  branch: string;
  message: string;
}
```

Show and apply actions use `objectId`, not the mutable `stash@{N}` display ref:

```bash
git stash show -p <objectId>
git stash apply <objectId>
```

## Tags

```bash
git tag --sort=-creatordate
```

One tag name is parsed per line, and `GitService` limits the result to 50 tags.

```typescript
interface GitTag {
  name: string;
}
```

Copy action: `vscode.env.clipboard.writeText(name)`.

## Worktrees

```bash
git worktree list --porcelain -z
```

Fields are NUL-delimited, and worktree records are separated by a double NUL.
This preserves valid worktree paths containing newline characters.

```log
worktree /path/to/worktree\0
HEAD <hash>\0
branch refs/heads/<branch>\0
\0
```

The `branch` field may be replaced by `detached`, and a record may include `bare`.

```typescript
interface GitWorktree {
  path: string;
  headHash: string;
  branch?: string;
  isBare: boolean;
  isDetached: boolean;
}
```

Open action: `vscode.commands.executeCommand("vscode.openFolder", uri, { forceNewWindow: true })`.

## Git Errors

```typescript
class GitError extends Error {
  readonly args: string[];
  readonly stderr: string;
  readonly exitCode: number;
  readonly systemCode?: string;
}
```

`execGit` uses `child_process.execFile` and always wraps command/process failures in `GitError`.
`formatGitError` returns trimmed stderr or falls back to the error message when stderr is empty.
Normal non-repository `git rev-parse` exits resolve to `null`, while spawn/system errors are rethrown.
GitService read methods log diagnostics and rethrow; they never convert failures to empty arrays or a clean working-tree result.

## Parser Contract

All parsers in `src/git/parsers.ts` must be pure `(stdout: string) => T[]` functions, import no VS Code API, have no side effects, and be covered by `src/test/parsers.test.ts`.
