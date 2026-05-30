# Changelog

All notable changes to Minimal Git Explorer are documented here.

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
- Checkout confirmation dialog when the working tree is dirty
