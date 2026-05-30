# Phase 5: Minimal Mutations

**Goal:** Add only the safest high-value Git actions.

**Status:** Not started  
**Depends on:** Phase 4

## Tasks

- [ ] Create `src/commands/branchCommands.ts`
  - `checkoutBranch(item: BranchItem)`:
    1. Run `git status --porcelain` to detect dirty working tree
    2. If dirty: show confirmation dialog (`vscode.window.showWarningMessage` with Yes/No)
    3. If confirmed (or clean): run `git checkout <branch>`
    4. On git error: show `vscode.window.showErrorMessage` with the raw stderr
    5. On success: refresh the tree via provider

- [ ] Extend `src/commands/stashCommands.ts` (started in Phase 4):
  - `applyStash` already implemented in Phase 4

- [ ] Error notification pattern (apply consistently):

  ```typescript
  try {
    await execGit(args, repoRoot);
    provider.refresh();
  } catch (err) {
    if (err instanceof GitError) {
      vscode.window.showErrorMessage(`Failed: ${err.stderr || err.message}`);
      outputChannel.appendLine(err.stderr);
    }
  }
  ```

- [ ] Refresh after successful mutations:
  - All mutation commands must call `provider.refresh()` on success
  - Partial refresh (section-only) is out of scope for 0.1.0 — always refresh the full tree

## Definition of Done

```markdown
- Branch checkout works from the tree (clean and dirty working tree cases)
- Stash apply works
- Git errors surface in a notification and in the output channel
- Tree refreshes after successful operations
- No mutation command operates without user awareness
```

## Out of Scope for 0.1.0

```markdown
- Pop stash / Drop stash
- Create worktree
- Remove/prune worktrees
- Delete branch
- Create tag
```

All of the above require a confirmation dialog and should be deferred to 0.2.x.

## Files to Create/Modify

| File                               | Action |
| ---------------------------------- | ------ |
| `src/commands/branchCommands.ts`   | Create |
| `src/commands/stashCommands.ts`    | Modify |
| `src/commands/registerCommands.ts` | Modify |

## Verification

1. Press F5
2. Checkout a branch from the Branches section (clean tree) — confirm checkout succeeds
3. Make an edit without staging, checkout another branch — confirm confirmation dialog appears
4. Apply a stash — confirm it succeeds and the tree refreshes
5. Trigger a git error (e.g., checkout a branch that doesn't exist) — confirm error notification appears
