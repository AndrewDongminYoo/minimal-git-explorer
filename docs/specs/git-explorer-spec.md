# Git Explorer — Extension Specification

This document defines the current VS Code contribution, repository lifecycle, and command surface.
`PLAN.md` is the historical `0.1.0` release plan.

## View Contributions

The extension contributes six independent TreeViews under the built-in `scm` Source Control container:

| View ID                          | Name      | Provider class      |
| -------------------------------- | --------- | ------------------- |
| `minimal-git-explorer.commits`   | Commits   | `CommitsProvider`   |
| `minimal-git-explorer.branches`  | Branches  | `BranchesProvider`  |
| `minimal-git-explorer.remotes`   | Remotes   | `RemotesProvider`   |
| `minimal-git-explorer.stashes`   | Stashes   | `StashesProvider`   |
| `minimal-git-explorer.tags`      | Tags      | `TagsProvider`      |
| `minimal-git-explorer.worktrees` | Worktrees | `WorktreesProvider` |

Each provider reads the current `RepositoryContext.service` whenever children are requested.
Branches contain Local and Remote groups, and remotes may contain fetch/push URL children.

## Empty and Error States

A successful empty result renders a disabled `EmptyItem` with section-specific text such as `No stashes found`.
A Git read failure renders an `ErrorItem` such as `Failed to load stashes` and keeps the detailed diagnostic in the `Minimal Git Explorer` output channel.

When no repository is present, all views show `No Git repository found`.
When Git repository detection fails because Git cannot be executed, the views show `Git is unavailable` and the process diagnostic is logged.

## Commands

| Command                               | Trigger                 | Action                                        |
| ------------------------------------- | ----------------------- | --------------------------------------------- |
| `minimal-git-explorer.refresh`        | Toolbar button          | Rediscover repository and reload all views    |
| `minimal-git-explorer.openCommit`     | Click commit item       | Open `git show` output as a read-only doc     |
| `minimal-git-explorer.checkoutBranch` | Click local branch item | Checkout after a fail-closed dirty check      |
| `minimal-git-explorer.copyRemoteUrl`  | Click remote URL item   | Copy URL to clipboard                         |
| `minimal-git-explorer.showStash`      | Click stash item        | Open stash object diff as a read-only doc     |
| `minimal-git-explorer.applyStash`     | Stash context menu      | Apply captured stash object after dirty check |
| `minimal-git-explorer.copyTagName`    | Click tag item          | Copy tag name to clipboard                    |
| `minimal-git-explorer.openWorktree`   | Click worktree item     | Open the folder in a new VS Code window       |

Checkout and stash apply ask for confirmation when the working tree is dirty.
If dirty-state detection fails, the mutation does not run.
Notifications remain concise, while formatted Git diagnostics are written to the output channel.

## Activation and Refresh

`activationEvents` is empty because VS Code 1.74+ activates extensions for contributed views automatically.
Activation creates the output channel, content provider, repository context, six providers, six TreeViews, and command registrations, then performs the same rediscovery operation used by Refresh.

Repository discovery runs `git rev-parse --show-toplevel` for workspace folders in order and uses the first valid Git root.
Refresh repeats discovery, so an ordinary workspace folder becomes usable after `git init` without reloading the extension.
The extension remains intentionally focused on one repository even in a multi-root workspace.

Successful branch checkout and stash apply await the same full rediscovery/refresh operation before reporting completion.
External Git operations are not watched automatically.

## Virtual Documents

Commit and stash output is stored under the `git-explorer:` URI scheme and opened as a read-only diff document.
Stored content is removed when the corresponding document closes.

## Workspace Trust

The manifest declares `capabilities.untrustedWorkspaces.supported` as `false`.
Local Git commands and Git hooks may run only after the workspace is trusted.

## Configuration

The extension contributes no user-facing settings.
