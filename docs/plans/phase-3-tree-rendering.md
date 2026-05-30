# Phase 3: Tree Data Rendering

**Goal:** Render real Git data in the TreeView.

**Status:** Not started  
**Depends on:** Phase 1, Phase 2

## Tasks

- [ ] Update `gitExplorerItems.ts` with typed item classes:
  - `SectionItem` (Commits, Branches, etc.) — collapsible, no action
  - `CommitItem` — label: `${shortHash} ${subject}`, tooltip with full details
  - `BranchGroupItem` (Local / Remote sub-groups)
  - `BranchItem` — shows current marker, upstream branch
  - `RemoteItem` (remote name node)
  - `RemoteUrlItem` (fetch/push URL leaf)
  - `StashItem` — label: `stash@{N}: ${message}`
  - `TagItem` — label: tag name
  - `WorktreeItem` — label: basename of path, tooltip: full path + branch + hash

- [ ] Update `gitExplorerProvider.ts`:
  - On construction: call `detectGitRoot()` and instantiate `GitService`
  - `getChildren(element?)`:
    - Root: return 6 `SectionItem`s
    - `SectionItem(Commits)`: call `gitService.listCommits()` → `CommitItem[]`
    - `SectionItem(Branches)`: call `gitService.listBranches()` → `[BranchGroupItem(Local), BranchGroupItem(Remote)]`
    - `BranchGroupItem`: return filtered `BranchItem[]`
    - `SectionItem(Remotes)`: call `gitService.listRemotes()` → `RemoteItem[]`
    - `RemoteItem`: return `RemoteUrlItem[]`
    - `SectionItem(Stashes)`: `StashItem[]`
    - `SectionItem(Tags)`: `TagItem[]`
    - `SectionItem(Worktrees)`: `WorktreeItem[]`
  - Empty sections: return a single disabled `vscode.TreeItem` with descriptive message
  - No-repo state: provider returns empty array; view's `message` property shows "No Git repository found."

- [ ] Wire `GitService` initialization into `extension.ts`
  - Pass `outputChannel` to `GitService`
  - Handle the case where no git repo is detected at activation

## Definition of Done

```markdown
- All 6 sections render repository data (tested against a real git repo via F5)
- Empty sections show a message item
- Refresh reloads all sections
- No unhandled promise rejections in the Extension Host console
```

## Files to Modify

| File                               | Action |
| ---------------------------------- | ------ |
| `src/views/gitExplorerItems.ts`    | Modify |
| `src/views/gitExplorerProvider.ts` | Modify |
| `src/extension.ts`                 | Modify |

## Verification

Press F5. Open Source Control panel. Expand each section. Confirm data appears. Click refresh toolbar button. Confirm view reloads.
