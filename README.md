# Minimal Git Explorer

A lightweight, local-first Git explorer for the VS Code Source Control sidebar.

Browse commits, branches, remotes, stashes, tags, and worktrees — without accounts, subscriptions, or telemetry.

## Features

### Git Explorer sidebar

Opens in the **Source Control** panel (⌃⇧G). Six collapsible sections, all populated from your local repository:

| Section       | What it shows                                          |
| ------------- | ------------------------------------------------------ |
| **Commits**   | Last 50 commits — hash, subject, author, relative date |
| **Branches**  | Local and remote branches; current branch marked       |
| **Remotes**   | Configured remotes with fetch/push URLs                |
| **Stashes**   | Full stash list with branch and message                |
| **Tags**      | Latest 50 tags sorted by creation date                 |
| **Worktrees** | All worktrees with branch and HEAD info                |

### Actions

| Action           | How                                      |
| ---------------- | ---------------------------------------- |
| Open commit diff | Click any commit                         |
| Checkout branch  | Click any local branch                   |
| Copy remote URL  | Click any remote URL                     |
| Show stash diff  | Click any stash                          |
| Apply stash      | Right-click stash → Apply Stash          |
| Copy tag name    | Click any tag                            |
| Open worktree    | Click any worktree (opens in new window) |
| Refresh          | Click the ↻ button in the view title bar |

Checkout asks for confirmation when the working tree has uncommitted changes. Git errors are shown in a notification and logged to the **Minimal Git Explorer** output channel.

## Requirements

- Git must be installed and available on `PATH`.
- A workspace folder containing a Git repository.

## No configuration required

This extension works out of the box. There are no settings to configure.

## Design principles

- **Local-first** — all data comes from local `git` commands. No network calls, no accounts, no cloud APIs.
- **Read-first** — safe exploration over mutation. Destructive actions are deferred to future versions.
- **Small surface** — every feature maps to a common `git` command.
- **No telemetry** — nothing is ever sent anywhere.

## Known limitations (v0.1.0)

- Single-repository workspaces only. Multi-root workspaces use the first folder.
- No auto-refresh. Use the toolbar refresh button after git operations.
- Stash mutations limited to apply. Pop/drop deferred to v0.2.x.
- No worktree creation/removal. Use the CLI for those.

## Release notes

See [CHANGELOG.md](CHANGELOG.md).
