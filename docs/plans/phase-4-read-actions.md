# Phase 4: Read Actions

**Goal:** Allow users to inspect Git objects from the sidebar.

**Status:** Completed
**Depends on:** Phase 3

> Historical plan: current command wiring resolves the active `GitService` through `RepositoryContext`, and stash actions use immutable object IDs.

## Tasks

- [x] Create `src/utils/openTextDocument.ts`
  - Store generated content under the `git-explorer:` URI scheme
  - Open generated URIs as read-only diff documents and release their content when they close

- [x] Create `src/commands/commitCommands.ts`
  - `openCommit(item: CommitItem)`: run `git show --stat --patch <fullHash>`, open as read-only doc

- [x] Create `src/commands/stashCommands.ts`
  - `showStash(item: StashItem)`: run `git stash show -p <objectId>`, open as read-only doc
  - `applyStash(item: StashItem)`: run `git stash apply <objectId>`, show a success/error notification, and refresh all views

- [x] Create `src/commands/remoteCommands.ts`
  - `copyRemoteUrl(item: RemoteUrlItem)`: `vscode.env.clipboard.writeText(url)` + show info notification

- [x] Create `src/commands/tagCommands.ts`
  - `copyTagName(item: TagItem)`: `vscode.env.clipboard.writeText(name)` + show info notification

- [x] Create `src/commands/worktreeCommands.ts`
  - `openWorktree(item: WorktreeItem)`: `vscode.commands.executeCommand("vscode.openFolder", uri, { forceNewWindow: true })`

- [x] Create `src/commands/registerCommands.ts`
  - Collects all command registrations and pushes to `context.subscriptions`

- [x] Update `extension.ts` to call `registerCommands` with the shared repository accessor and asynchronous refresh callback

## Definition of Done

```markdown
- Clicking a commit opens a read-only document with git show output
- Clicking a stash opens a read-only document with the stash diff
- Applying a stash shows a notification and refreshes the tree
- Copying a remote URL or tag name shows a confirmation notification
- Clicking a worktree opens it in a new VS Code window
- No destructive action is available without confirmation
```

## Files to Create/Modify

| File                               | Action |
| ---------------------------------- | ------ |
| `src/utils/openTextDocument.ts`    | Create |
| `src/commands/commitCommands.ts`   | Create |
| `src/commands/stashCommands.ts`    | Create |
| `src/commands/remoteCommands.ts`   | Create |
| `src/commands/tagCommands.ts`      | Create |
| `src/commands/worktreeCommands.ts` | Create |
| `src/commands/registerCommands.ts` | Create |
| `src/extension.ts`                 | Modify |

## Verification

Press F5. Test each action manually against a real git repository.
