# Minimal Git Explorer - Release Plan

## Product Goal

Minimal Git Explorer is a lightweight VS Code extension that adds a focused Git explorer to the Source Control sidebar.

The extension is intended for developers who want a free, predictable, and local-first alternative to the GitLens sidebar features they commonly use, without accounts, subscriptions, telemetry-heavy workflows, or AI feature lock-in.

The first release does not aim to replace all GitLens features. It only focuses on fast Git repository navigation inside VS Code.

## First Release Target

Version: `0.1.0`

The first publishable version should provide a useful read-first Git explorer inside the VS Code Source Control view.

### Core Scope

The extension should add one view to the Source Control sidebar:

```text
Minimal Git Explorer
├─ Commits
├─ Branches
├─ Remotes
├─ Stashes
├─ Tags
└─ Worktrees
```

Each section should be collapsible and should show the current workspace repository state.

## Non-Goals

The first version must not attempt to implement the following:

```text
- Full GitLens replacement
- Inline blame annotations
- Commit graph rendering
- Pull request integration
- AI commit message generation
- GitHub/GitLab/Bitbucket account integration
- Custom SCM provider implementation
- Complex rebase/cherry-pick UI
- WebView-based custom interface
- Multi-repository dashboard
- Background indexing
- Telemetry
```

If a feature requires a custom WebView, account login, background daemon, or large state model, it is out of scope for `0.1.0`.

## Guiding Principles

### 1. Local-first

All Git data should come from the local repository using Git commands.

The extension should not require:

```text
- User account
- Cloud API
- Subscription
- Remote service
- Personal access token
```

### 2. Read-first

The first version should prioritize safe exploration over mutation.

Read actions are preferred:

```text
- Show commit
- Show stash
- Show branch list
- Show remotes
- Show tags
- Show worktrees
```

Mutation actions should be limited and explicit.

### 3. Small surface area

Every feature should map directly to a common Git command.

Avoid abstract workflows that hide Git behavior.

### 4. No GitLens clone creep

The extension should solve a narrow problem well:

```text
"Show the Git objects I frequently inspect from the Source Control sidebar."
```

Anything outside that should be deferred.

## Functional Requirements

## 1. Source Control View Contribution

The extension should contribute a new Tree View under VS Code's Source Control view container.

Suggested view id:

```text
minimal-git-explorer.gitExplorer
```

Suggested view title:

```text
Minimal Git Explorer
```

The view should appear when the current workspace contains a Git repository.

If no Git repository is found, the view should show a clear empty state.

Example:

```text
No Git repository found.
```

## 2. Repository Detection

The extension should detect the Git root for the active workspace.

Initial behavior:

```text
- Use the first workspace folder
- Run git rev-parse --show-toplevel
- Use that path as the repository root
```

Out of scope for the first release:

```text
- Advanced multi-root workspace support
- Nested repository handling
- Submodule dashboard
```

If multiple workspace folders exist, the first release may use the first Git repository found.

## 3. Refresh Behavior

The view should support manual refresh.

Command:

```text
minimal-git-explorer.refresh
```

Refresh should reload all sections:

```text
- Commits
- Branches
- Remotes
- Stashes
- Tags
- Worktrees
```

Optional for first release:

```text
- Auto-refresh when files change
- Auto-refresh after Git commands
```

Manual refresh is sufficient for `0.1.0`.

## 4. Commits Section

The Commits section should show recent commits.

Git command:

```bash
git log -n 50 --pretty=format:%H%x09%h%x09%an%x09%ar%x09%s
```

Each item should show:

```text
<short hash> <subject>
```

Description or tooltip may include:

```text
- Full hash
- Author
- Relative date
- Subject
```

Required action:

```text
- Open commit details
```

Suggested command:

```text
minimal-git-explorer.openCommit
```

Implementation:

```bash
git show --stat --patch <commit>
```

The result can be opened as a read-only virtual document or an untitled text document.

## 5. Branches Section

The Branches section should show local and remote branches.

Suggested structure:

```text
Branches
├─ Local
│  ├─ main
│  └─ feature/example
└─ Remote
   ├─ origin/main
   └─ origin/develop
```

Git command options:

```bash
git branch --format="%(refname)%09%(refname:short)%09%(objectname:short)%09%(upstream:short)%09%(HEAD)"
git branch -r --format="%(refname)%09%(refname:short)%09%(objectname:short)"
```

Each branch item should show:

```text
- Branch name
- Current branch marker
- Upstream branch if available
```

Required action:

```text
- Checkout branch
```

Suggested command:

```text
minimal-git-explorer.checkoutBranch
```

Checkout should ask for confirmation only when the working tree is dirty.

For `0.1.0`, it is acceptable to fail with the raw Git error message if checkout is blocked.

## 6. Remotes Section

The Remotes section should show configured Git remotes.

Git command:

```bash
git remote -v
```

Suggested structure:

```text
Remotes
├─ origin
│  ├─ fetch: git@github.com:owner/repo.git
│  └─ push: git@github.com:owner/repo.git
```

Required actions:

```text
- Copy remote URL
```

Optional actions:

```text
- Open remote URL in browser if it is an HTTPS GitHub/GitLab/Bitbucket URL
```

SSH URL browser conversion is optional and can be deferred.

## 7. Stashes Section

The Stashes section should show the stash list.

Git command:

```bash
git stash list --date=relative
```

Each item should show:

```text
stash@{0}: <message>
```

Required actions:

```text
- Show stash
- Apply stash
```

Suggested commands:

```text
minimal-git-explorer.showStash
minimal-git-explorer.applyStash
```

Optional actions for first release:

```text
- Pop stash
- Drop stash
```

For destructive actions such as drop, the extension must ask for confirmation.

## 8. Tags Section

The Tags section should show Git tags.

Git command:

```bash
git tag --sort=-creatordate
```

For the first release, showing the latest 50 tags is enough.

Each item should show:

```text
<tag name>
```

Required action:

```text
- Copy tag name
```

Optional action:

```text
- Checkout tag
- Show tag details
```

## 9. Worktrees Section

The Worktrees section should show Git worktrees.

Git command:

```bash
git worktree list --porcelain
```

Each item should show:

```text
<path>
```

Description or tooltip should include:

```text
- Branch
- Commit hash
- Detached state if applicable
- Bare state if applicable
```

Required action:

```text
- Open worktree path in new VS Code window
```

Suggested command:

```text
minimal-git-explorer.openWorktree
```

Out of scope for first release:

```text
- Create worktree
- Remove worktree
- Prune worktrees
- Move worktree
```

Worktree mutation should stay CLI-first initially.

## Commands

Initial command list:

```text
minimal-git-explorer.refresh
minimal-git-explorer.openCommit
minimal-git-explorer.checkoutBranch
minimal-git-explorer.copyRemoteUrl
minimal-git-explorer.showStash
minimal-git-explorer.applyStash
minimal-git-explorer.copyTagName
minimal-git-explorer.openWorktree
```

Remove the generated command before release:

```text
minimal-git-explorer.helloWorld
```

## Suggested File Structure

```text
src/
  extension.ts

  git/
    gitService.ts
    gitTypes.ts
    parsers.ts
    repository.ts

  views/
    gitExplorerProvider.ts
    gitExplorerItems.ts

  commands/
    registerCommands.ts
    commitCommands.ts
    branchCommands.ts
    remoteCommands.ts
    stashCommands.ts
    tagCommands.ts
    worktreeCommands.ts

  utils/
    execGit.ts
    openTextDocument.ts
```

## Implementation Strategy

## Phase 1: Basic View

Goal:

```text
Show a static TreeView in the Source Control sidebar.
```

Tasks:

```text
- Add Source Control view contribution in package.json
- Remove helloWorld command
- Register refresh command
- Implement GitExplorerProvider
- Show placeholder sections
```

Definition of Done:

```text
- Extension activates
- Source Control sidebar shows Minimal Git Explorer
- Refresh command exists
- No generated Hello World command remains
```

## Phase 2: Git Service

Goal:

```text
Read Git repository data through local Git commands.
```

Tasks:

```text
- Implement repository root detection
- Implement execGit helper
- Implement listCommits
- Implement listBranches
- Implement listRemotes
- Implement listStashes
- Implement listTags
- Implement listWorktrees
```

Definition of Done:

```text
- Each GitService method returns typed data
- Parser functions are isolated
- Git command errors are handled gracefully
```

## Phase 3: Tree Data Rendering

Goal:

```text
Render real Git data in the TreeView.
```

Tasks:

```text
- Render Commits section
- Render Branches section
- Render Remotes section
- Render Stashes section
- Render Tags section
- Render Worktrees section
- Add icons/context values where useful
```

Definition of Done:

```text
- All six sections render repository data
- Empty sections display useful messages
- Refresh reloads the tree
```

## Phase 4: Read Actions

Goal:

```text
Allow users to inspect Git objects from the sidebar.
```

Tasks:

```text
- Open commit details
- Show stash details
- Copy remote URL
- Copy tag name
- Open worktree path in new VS Code window
```

Definition of Done:

```text
- Common inspection actions work
- No destructive action is available without confirmation
```

## Phase 5: Minimal Mutations

Goal:

```text
Add only the safest high-value Git actions.
```

Tasks:

```text
- Checkout branch
- Apply stash
- Confirm destructive or risky operations
- Refresh view after successful mutation
```

Definition of Done:

```text
- Branch checkout works
- Stash apply works
- Git errors are shown to the user
- Tree refreshes after successful operations
```

## Error Handling

Git command failures should show concise user-facing messages.

Examples:

```text
- Git executable not found.
- No Git repository found.
- Failed to load branches.
- Failed to apply stash.
- Working tree has uncommitted changes.
```

Raw stderr may be shown in an expandable output channel or notification detail.

The extension should create an output channel:

```text
Minimal Git Explorer
```

Use it for debugging command failures.

## Configuration

No settings are required for `0.1.0`.

Potential future settings:

```text
minimalGitExplorer.commitLimit
minimalGitExplorer.tagLimit
minimalGitExplorer.showRemoteBranches
minimalGitExplorer.autoRefresh
minimalGitExplorer.openWorktreeInNewWindow
```

Avoid adding settings until there is a real need.

## Testing Plan

Minimum tests:

```text
- parseCommits
- parseBranches
- parseRemotes
- parseStashes
- parseTags
- parseWorktrees
```

Manual test repositories:

```text
- Normal repository
- Repository with no stash
- Repository with tags
- Repository with remote branches
- Repository with at least one worktree
- Non-Git folder
```

Manual verification checklist:

```text
- Extension activates without error
- Source Control view appears
- Refresh works
- All sections render
- Commit details open
- Stash details open
- Branch checkout works
- Worktree opens in new window
- Non-Git folder shows empty state
```

## Release Checklist

Before publishing `0.1.0`:

```text
- Update package.json description
- Add README.md with screenshots or usage examples
- Add LICENSE
- Add CHANGELOG.md
- Remove helloWorld command
- Confirm no telemetry
- Confirm no network calls
- Confirm no account requirement
- Run pnpm run package
- Run pnpm test
- Test packaged VSIX locally
```

## package.json Updates Needed

The generated package metadata should be updated before release.

Current description:

```text
This is a free alternative extension to GitLens that is fully functional.
```

Recommended description:

```text
A lightweight local-first Git explorer for commits, branches, remotes, stashes, tags, and worktrees in the VS Code Source Control sidebar.
```

Recommended category:

```json
"categories": ["Source Control"]
```

Recommended keywords:

```json
"keywords": [
  "git",
  "source-control",
  "commits",
  "branches",
  "stashes",
  "worktrees",
  "tags"
]
```

## First Release Success Criteria

The first version is successful if a user can install the extension and use it to inspect the most common Git objects from the Source Control sidebar without needing GitLens.

Success criteria:

```text
- The extension is useful without configuration
- It works on an existing Git repository
- It does not require login
- It does not require a paid service
- It does not send data anywhere
- It makes stash/worktree visibility easier than default VS Code
- It remains small enough to understand and maintain
```

## Future Versions

Potential `0.2.x` features:

```text
- Create worktree
- Remove worktree with confirmation
- Prune worktrees
- Pop/drop stash with confirmation
- Open remote URL in browser
- Commit file list tree
- Commit compare with working tree
- Multi-root workspace support
- Auto-refresh
```

Potential `0.3.x` features:

```text
- Lightweight commit graph
- Branch grouping by prefix
- Search/filter within sections
- Configurable commit/tag limits
- Better submodule handling
```

Potentially out of scope forever:

```text
- AI features
- Account system
- Hosted service integration
- Full Git GUI
- Full PR review workflow
- GitLens-compatible feature parity
```
