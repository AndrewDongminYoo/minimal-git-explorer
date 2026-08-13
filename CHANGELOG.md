# Changelog

All notable changes to Minimal Git Explorer are documented here.

## [Unreleased]

### Added

- Added explicit Workspace Trust metadata and GitHub Actions coverage for VS Code 1.125.0 and stable

### Changed

- Switched stash show/apply actions from mutable reflog indices to immutable stash object IDs and list the shared stash ref only once across linked worktrees
- Made Refresh rediscover repositories, including folders initialized with `git init` after extension activation
- Synchronized contributor guidance, product specifications, and historical release plans with the current six-TreeView architecture

### Fixed

- Preserved spaces in local remote URLs, excluded symbolic remote HEAD rows, and preserved newline-containing worktree paths with NUL-delimited porcelain output
- Propagated Git read and dirty-state failures instead of presenting them as empty or clean states
- Treated newly initialized repositories without commits as empty history instead of a Git read failure
- Distinguished provider errors from empty data and released closed virtual document content
- Updated the VS Code test runner so supported and stable hosts run without a manual macOS executable workaround

## [0.2.0] — 2026-05-30

Release hardening and Git Explorer stability improvements.

### Added

- Detached accordion layout backed by six independent TreeViews for commits, branches, remotes, stashes, tags, and worktrees
- Release smoke and integration coverage for extension activation, Git service behavior, repository detection, tree items, and stash commands

### Changed

- Updated release packaging metadata and extension icon assets
- Fixed the VS Code build task problem matcher and Trunk lint action configuration

### Fixed

- Collected stashes from every worktree instead of only the main worktree
- Stabilized repository discovery and stash reference handling across worktrees
- Guarded stash apply when the working tree is dirty and tightened command exposure to the intended explorer actions

### Security

- Added dependency overrides for vulnerable transitive versions of `diff` and `serialize-javascript`

## [0.1.0] — 2026-05-30

Initial release.

### Added

- Git Explorer view in the Source Control sidebar
- **Commits** section: shows last 50 commits with hash, subject, author, and relative date; click to open a read-only diff
- **Branches** section: shows local and remote branches grouped separately; marks the current branch; click a local branch to check it out
- **Remotes** section: shows configured remotes with fetch/push URLs; click a URL to copy it to the clipboard
- **Stashes** section: shows all stashes; click to view the diff; right-click to apply
- **Tags** section: shows latest 50 tags; click to copy the tag name
- **Worktrees** section: shows all worktrees with branch and HEAD info; click to open in a new VS Code window
- Refresh button in the view title bar
- Output channel "Minimal Git Explorer" for git error logging
- Confirmation dialogs before checkout or stash apply when the working tree is dirty
