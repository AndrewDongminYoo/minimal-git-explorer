# Phase 3: Tree Data Rendering

**Goal:** Render real Git data in the TreeView.

**Status:** Completed
**Depends on:** Phase 1, Phase 2

> Historical plan: the single-tree structure below was superseded in `0.2.0` by six independent TreeViews in `src/views/sectionProviders.ts`.

## Tasks

- [x] Update `gitExplorerItems.ts` with typed item classes:
  - `CommitItem` — label: `${shortHash} ${subject}`, tooltip with full details
  - `BranchGroupItem` (Local / Remote sub-groups)
  - `BranchItem` — shows current marker, upstream branch
  - `RemoteItem` (remote name node)
  - `RemoteUrlItem` (fetch/push URL leaf)
  - `StashItem` — label: `stash@{N}: ${message}`
  - `TagItem` — label: tag name
  - `WorktreeItem` — label: basename of path, tooltip: full path + branch + hash

- [x] Create `sectionProviders.ts` with one provider for commits, branches, remotes, stashes, tags, and worktrees
  - Each provider reads the current `RepositoryContext.service`
  - `BranchesProvider` renders Local and Remote groups
  - `RemotesProvider` renders URL children
  - Empty sections render `EmptyItem`; read and detection failures render `ErrorItem`

- [x] Wire `RepositoryContext` initialization and rediscovery into `extension.ts`

## Definition of Done

```markdown
- All 6 sections render repository data (tested against a real git repo via F5)
- Empty sections show a message item
- Refresh reloads all sections
- No unhandled promise rejections in the Extension Host console
```

## Files to Modify

| File                            | Action |
| ------------------------------- | ------ |
| `src/views/gitExplorerItems.ts` | Modify |
| `src/views/sectionProviders.ts` | Create |
| `src/extension.ts`              | Modify |

## Verification

Press F5. Open Source Control panel. Expand each section. Confirm data appears. Click refresh toolbar button. Confirm view reloads.
