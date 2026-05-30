# Phase 4: Read Actions

**Goal:** Allow users to inspect Git objects from the sidebar.

**Status:** Not started  
**Depends on:** Phase 3

## Tasks

- [ ] Create `src/utils/openTextDocument.ts`
  - `openReadonlyDocument(content: string, languageId?: string): Promise<void>`
  - Uses a `vscode.TextDocumentContentProvider` registered to a custom URI scheme (`git-explorer:`)
  - Or: create an untitled document with `vscode.workspace.openTextDocument({ content, language })`

- [ ] Create `src/commands/commitCommands.ts`
  - `openCommit(item: CommitItem)`: run `git show --stat --patch <fullHash>`, open as read-only doc

- [ ] Create `src/commands/stashCommands.ts`
  - `showStash(item: StashItem)`: run `git stash show -p stash@{N}`, open as read-only doc
  - `applyStash(item: StashItem)`: run `git stash apply stash@{N}`, show success/error notification, refresh tree

- [ ] Create `src/commands/remoteCommands.ts`
  - `copyRemoteUrl(item: RemoteUrlItem)`: `vscode.env.clipboard.writeText(url)` + show info notification

- [ ] Create `src/commands/tagCommands.ts`
  - `copyTagName(item: TagItem)`: `vscode.env.clipboard.writeText(name)` + show info notification

- [ ] Create `src/commands/worktreeCommands.ts`
  - `openWorktree(item: WorktreeItem)`: `vscode.commands.executeCommand("vscode.openFolder", uri, { forceNewWindow: true })`

- [ ] Create `src/commands/registerCommands.ts`
  - Collects all command registrations and pushes to `context.subscriptions`

- [ ] Update `extension.ts` to call `registerCommands(context, gitService, provider)`

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
