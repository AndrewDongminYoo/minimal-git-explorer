# Phase 1: Basic View

**Goal:** Show a static TreeView in the Source Control sidebar.

**Status:** Not started

## Tasks

- [ ] Remove `minimal-git-explorer.helloWorld` from `package.json` and `extension.ts`
- [ ] Add `views.scm` contribution to `package.json` with view id `minimal-git-explorer.gitExplorer`
- [ ] Register `minimal-git-explorer.refresh` command in `package.json`
- [ ] Create `src/views/gitExplorerProvider.ts` implementing `vscode.TreeDataProvider<GitExplorerItem>`
  - `getTreeItem()`: return the item as-is
  - `getChildren()`: return 6 static section nodes (Commits, Branches, Remotes, Stashes, Tags, Worktrees)
  - `_onDidChangeTreeData` event wired to refresh command
- [ ] Create `src/views/gitExplorerItems.ts` with a `SectionItem extends vscode.TreeItem` class
- [ ] Register the TreeView in `extension.ts` via `vscode.window.createTreeView`
- [ ] Create the output channel in `extension.ts`: `vscode.window.createOutputChannel("Minimal Git Explorer")`

## Definition of Done

```markdown
- Extension activates without error (F5 in VS Code)
- Source Control sidebar shows "Minimal Git Explorer" with 6 collapsed sections
- Clicking the refresh toolbar button does not throw
- No "Hello World" command in the Command Palette
```

## Files to Create/Modify

| File                               | Action |
| ---------------------------------- | ------ |
| `package.json`                     | Modify |
| `src/extension.ts`                 | Modify |
| `src/views/gitExplorerProvider.ts` | Create |
| `src/views/gitExplorerItems.ts`    | Create |

## Verification

```bash
pnpm run compile   # must pass with no errors
```

Then press F5 in VS Code. Open Source Control panel (Ctrl+Shift+G). Confirm "Minimal Git Explorer" appears.
