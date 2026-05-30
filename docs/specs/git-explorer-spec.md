# Git Explorer — Extension Specification

Source: `PLAN.md` (authoritative). This file distills the VS Code contribution contract and command surface for implementation reference.

## View Contribution

| Field      | Value                              |
| ---------- | ---------------------------------- |
| View ID    | `minimal-git-explorer.gitExplorer` |
| Title      | `Minimal Git Explorer`             |
| Container  | `scm` (Source Control sidebar)     |
| Visibility | When workspace has a git repo      |

`package.json` contribution point:

```json
"contributes": {
  "viewsContainers": {},
  "views": {
    "scm": [
      {
        "id": "minimal-git-explorer.gitExplorer",
        "name": "Minimal Git Explorer",
        "when": "gitOpenRepositoryCount != 0"
      }
    ]
  }
}
```

## Tree Structure

```log
Minimal Git Explorer
├─ Commits        (recent 50, collapsible)
├─ Branches       (Local / Remote sub-groups, collapsible)
├─ Remotes        (per-remote with fetch/push URLs, collapsible)
├─ Stashes        (collapsible)
├─ Tags           (latest 50, collapsible)
└─ Worktrees      (collapsible)
```

Each top-level node is a collapsible `TreeItem` with `collapsibleState = Collapsed`.

Empty state: if a section has no data, show a single disabled child item with a descriptive message (e.g., `"No stashes found"`). If no git repo exists, the view itself shows `"No Git repository found."`.

## Commands

| Command                               | Trigger                    | Action                                  | Destructive |
| ------------------------------------- | -------------------------- | --------------------------------------- | ----------- |
| `minimal-git-explorer.refresh`        | Toolbar button             | Reload all sections                     | No          |
| `minimal-git-explorer.openCommit`     | Click commit item          | Open `git show` output as read-only doc | No          |
| `minimal-git-explorer.checkoutBranch` | Click branch item          | `git checkout <branch>`                 | Risky\*     |
| `minimal-git-explorer.copyRemoteUrl`  | Context menu on remote URL | Copy to clipboard                       | No          |
| `minimal-git-explorer.showStash`      | Click stash item           | Open stash diff as read-only doc        | No          |
| `minimal-git-explorer.applyStash`     | Context menu on stash      | `git stash apply stash@{N}`             | No          |
| `minimal-git-explorer.copyTagName`    | Context menu on tag        | Copy tag name to clipboard              | No          |
| `minimal-git-explorer.openWorktree`   | Click worktree item        | `vscode.openFolder` in new window       | No          |

\*`checkoutBranch`: ask confirmation only when working tree is dirty. On git error, show raw error message — no custom recovery for 0.1.0.

**Remove before release:** `minimal-git-explorer.helloWorld`

## Output Channel

Create once in `activate()`:

```typescript
const outputChannel = vscode.window.createOutputChannel("Minimal Git Explorer");
```

Log git stderr here. Do not show raw stderr in notification toasts.

## Activation

`activationEvents` should be empty (VS Code 1.74+ activates on contributed views automatically). No `onCommand:*` entries needed.

## Repository Detection

On activation, detect git root:

```bash
git rev-parse --show-toplevel
```

Run from the first workspace folder path. If it fails, the view shows the empty state. Multi-root workspace: use the first folder that returns a valid git root.

## No Settings for 0.1.0

Do not add `contributes.configuration`. No user-facing settings until a real need arises post-release.
