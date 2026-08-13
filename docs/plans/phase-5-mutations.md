# Phase 5: Minimal Mutations

**Goal:** Add only the safest high-value Git actions.

**Status:** Completed
**Depends on:** Phase 4

> Historical plan: checkout and stash apply now fail closed if dirty-state detection fails, log formatted diagnostics, and show concise notifications.

## Tasks

- [x] Create `src/commands/branchCommands.ts`
  - `checkoutBranch(item: BranchItem)`:
    1. Run `git status --porcelain` to detect dirty working tree
    2. If dirty: show confirmation dialog (`vscode.window.showWarningMessage` with Yes/No)
    3. If confirmed (or clean): run `git checkout <branch>`
    4. On Git error: log the formatted diagnostic and show a concise error notification
    5. On success: refresh the tree via provider

- [x] Extend `src/commands/stashCommands.ts` (started in Phase 4):
  - `applyStash` already implemented in Phase 4

- [x] Error notification pattern (apply consistently):

  ```typescript
  try {
    await execGit(args, repoRoot);
    provider.refresh();
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(formatGitError(err));
      vscode.window.showErrorMessage(
        "Git operation failed. See the output for details.",
      );
    }
  }
  ```

- [x] Refresh after successful mutations:
  - All mutation commands must call `provider.refresh()` on success
  - Always rediscover the repository and refresh all six views

## Definition of Done

```markdown
- Branch checkout works from the tree (clean and dirty working tree cases)
- Stash apply works
- Git errors produce a concise notification and detailed output-channel diagnostic
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
