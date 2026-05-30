# Git Data Contract

Defines the git commands, raw output formats, and TypeScript interfaces for each section.

Implementations live in:

- `src/git/gitTypes.ts` — interfaces
- `src/git/parsers.ts` — pure parse functions (no VS Code deps, unit-testable)
- `src/git/gitService.ts` — calls `execGit` and delegates to parsers

---

## Commits

```bash
git log -n 50 --pretty=format:"%H%x09%h%x09%an%x09%ar%x09%s"
```

Tab-separated fields: `fullHash`, `shortHash`, `author`, `relativeDate`, `subject`

```typescript
interface GitCommit {
  fullHash: string;
  shortHash: string;
  author: string;
  relativeDate: string;
  subject: string;
}
```

Tree item label: `${shortHash} ${subject}`
Tooltip: `${fullHash}\n${author} · ${relativeDate}\n\n${subject}`

Open action: `git show --stat --patch <fullHash>` → read-only virtual document.

---

## Branches

```bash
# Local
git branch --format="%(refname:short)%x09%(objectname:short)%x09%(upstream:short)%x09%(HEAD)"

# Remote
git branch -r --format="%(refname:short)%x09%(objectname:short)"
```

```typescript
interface GitBranch {
  name: string;
  shortHash: string;
  upstream?: string;
  isCurrent: boolean; // HEAD == "*"
  isRemote: boolean;
}
```

Tree structure: two sub-groups (`Local`, `Remote`). Current branch marked with `$(check)` icon or `*` prefix.

Checkout action: run `git checkout <name>`. Prompt confirmation if `git status --porcelain` is non-empty.

---

## Remotes

```bash
git remote -v
```

Raw output lines: `<name>\t<url> (fetch|push)`

```typescript
interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}
```

Tree structure: remote name → fetch URL child → push URL child (omit push child if identical to fetch).

Copy URL action: `vscode.env.clipboard.writeText(url)`.

---

## Stashes

```bash
git stash list --date=relative
```

Raw output lines: `stash@{N}: On <branch>: <message>` or `stash@{N}: WIP on <branch>: <hash> <message>`

```typescript
interface GitStash {
  index: number; // N from stash@{N}
  ref: string; // "stash@{N}"
  branch: string;
  message: string;
}
```

Show action: `git stash show -p stash@{N}` → read-only virtual document.
Apply action: `git stash apply stash@{N}` → refresh view on success.

---

## Tags

```bash
git tag --sort=-creatordate
```

One tag name per line. Limit to 50 tags.

```typescript
interface GitTag {
  name: string;
}
```

Copy action: `vscode.env.clipboard.writeText(name)`.

---

## Worktrees

```bash
git worktree list --porcelain
```

Porcelain block per worktree:

```log
worktree /path/to/worktree
HEAD <hash>
branch refs/heads/<branch>   (or "detached" line)
[bare]
```

```typescript
interface GitWorktree {
  path: string;
  headHash: string;
  branch?: string; // undefined if detached
  isBare: boolean;
  isDetached: boolean;
}
```

Tree item label: last path segment (basename).
Tooltip: full path + branch + HEAD hash + detached/bare flags.
Open action: `vscode.commands.executeCommand("vscode.openFolder", uri, { forceNewWindow: true })`.

---

## execGit Helper

```typescript
// src/utils/execGit.ts
async function execGit(args: string[], cwd: string): Promise<string>;
```

- Uses `child_process.execFile` (not `exec`) to avoid shell injection.
- Rejects with a typed `GitError` on non-zero exit.
- Caller decides whether to log stderr to the output channel or surface to user.
- Never throws raw `Error` — always wraps in `GitError` with `stderr` and `args` fields.

---

## Parser Contract

All parsers in `src/git/parsers.ts` must be:

- Pure functions: `(stdout: string) => T[]`
- No imports from `vscode`
- No side effects
- Tested in `src/test/parsers.test.ts`
