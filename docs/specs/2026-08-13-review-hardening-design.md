# Review Hardening Design

## Status

Approved for implementation planning on 2026-08-13.

## Goal

Resolve every concrete P1 through P3 finding from the repository-wide review on the `fix/review-hardening` branch, including the corresponding test, CI, release-gate, Workspace Trust, and documentation gaps.

## Scope

This work includes:

- Stable stash identity and removal of duplicate linked-worktree stash entries.
- Fail-closed mutation preconditions.
- Portable parsing for remote URLs, symbolic remote HEAD refs, and worktree paths.
- Explicit distinction between empty Git data and Git command failures.
- Repository rediscovery during manual refresh.
- Cleanup of closed virtual Git documents.
- Current VS Code test tooling, minimum-version and stable-version CI coverage, and packaged-extension verification.
- Synchronization of project documentation with the implemented six-TreeView architecture and version `0.2.0`.

The following roadmap features remain outside this hardening change because they were documented future work rather than defects in the current release surface:

- Worktree creation, removal, move, and prune actions.
- Stash pop and drop actions.
- Commit graph, search, filters, configurable limits, and commit comparison features.
- Remote URL browser conversion.
- Multi-repository dashboards and automatic background refresh.

## Constraints

- Preserve the existing public command IDs and the six contributed TreeView IDs.
- Continue using local Git through `execFile`; do not add the VS Code Git extension API or a Git library.
- Add no runtime dependency.
- Keep manual refresh as the only general refresh policy.
- Ask for confirmation before an existing risky mutation when the target working tree is dirty.
- Abort checkout and stash apply when the dirty-state check fails.
- Keep raw Git diagnostics in the `Minimal Git Explorer` output channel and show concise notifications to users.
- Implement behavior changes with a failing regression test first.
- Regenerate `pnpm-lock.yaml` whenever the development dependency manifest changes.

## Design Decisions

### Stable stash identity

`git stash list` will be executed once for the selected repository.

Each `GitStash` will carry both a display ref such as `stash@{0}` and the stash commit object ID returned by Git.

The display ref may change whenever another stash is created or removed, so `showStash` and `applyStash` will execute against the immutable object ID instead.

The earlier project precedent described worktree-by-worktree enumeration, but current Git behavior reproduced during review showed that linked worktrees resolved to the same common `refs/stash` and returned the same stash list.

Current command output therefore overrides that older premise: iterating worktrees would manufacture duplicates and incorrectly imply that a shared stash belongs to a particular linked worktree.

Stash apply will target the selected repository root.

### Git parser contracts

Remote parsing will treat the first tab as the boundary between remote name and URL, then parse the trailing `(fetch)` or `(push)` marker so local paths containing spaces remain intact.

Remote branch listing will include `%(symref)` as a separate field.

Entries with a non-empty symbolic ref will be excluded instead of relying on the human-readable `HEAD -> branch` form.

Worktree listing will use `git worktree list --porcelain -z`.

The parser will split NUL-delimited fields and double-NUL-delimited records so valid paths containing newlines are preserved.

### Error and empty-state model

`GitService` read methods will log `GitError` diagnostics and rethrow rather than converting every failure into an empty parsed value.

Section providers will map an empty successful result to the existing informational empty item and a rejected read to a distinct disabled error item such as `Failed to load commits`.

Error logging will use `stderr` when present and fall back to the wrapped error message when Git cannot be spawned or produces no stderr.

`isDirty` will no longer return `false` after an execution failure.

Checkout and stash apply will catch that failure before mutation, log the diagnostic, show a concise error notification, and stop.

### Repository refresh lifecycle

The extension will keep a small mutable repository context shared by section providers and command handlers.

Manual refresh will rescan the current workspace folders, replace the context's `GitService`, update view descriptions or no-repository messages, and then fire every provider refresh event.

This permits a workspace that becomes a Git repository after activation to recover through the existing Refresh command without adding background watchers or automatic refresh.

### Virtual document lifecycle

`GitExplorerContentProvider` will expose a removal operation for a document URI.

The extension will subscribe to text-document close events and remove content for the `git-explorer` scheme.

The provider registration, close listener, output channel, views, commands, and provider event emitters will all be disposed through `ExtensionContext.subscriptions`.

### Workspace Trust

The extension manifest will explicitly declare `capabilities.untrustedWorkspaces.supported` as `false` with a concise description that local Git commands and Git hooks can execute only after the workspace is trusted.

This preserves the current security-conscious default while making the decision visible and testable.

## Components and Interfaces

### `GitStash`

`GitStash` will replace the inferred `worktreePath` field with an immutable object ID field.

The exact interface will be:

```typescript
export interface GitStash {
  index: number;
  ref: string;
  objectId: string;
  branch: string;
  message: string;
}
```

### Repository context

A focused repository context will own the currently selected `GitService | null` and provide an asynchronous rediscovery operation.

Providers will read the current service at `getChildren` time rather than capturing the activation-time value.

Command handlers will request the current service when invoked so a manual refresh cannot leave them bound to a stale repository.

### Section provider state

The existing provider classes will remain separate.

Their shared base will own and dispose its `EventEmitter`, read the current repository context, and provide a small helper that converts service failures into an error item.

No generic result framework or new state-management library will be introduced.

## Data Flow

1. Activation creates the output channel, repository context, content provider, six section providers, and six views.
2. Repository rediscovery scans workspace folders and installs the first valid `GitService` in the shared context.
3. A provider expansion reads the current service and executes its section-specific Git command.
4. Git stdout is parsed into typed records; a successful empty result becomes an empty item, while a `GitError` becomes an error item.
5. A stash action receives a tree item containing both the display ref and object ID, checks the selected repository state, then uses the object ID for show or apply.
6. Refresh repeats repository discovery, updates view state, and refreshes all providers.
7. Closing a generated commit or stash document removes its stored content.

## Testing Strategy

### Unit and integration regressions

The test suite will cover:

- One stash result regardless of linked-worktree count.
- Stable stash show and apply behavior after `stash@{N}` numbering changes.
- Remote URLs containing spaces.
- Symbolic remote HEAD exclusion using the explicit `symref` field.
- NUL-delimited worktree output with a newline in the path.
- Dirty-state execution errors aborting checkout and stash apply.
- Service read failures producing error items instead of empty-state items.
- Repository discovery recovering after `git init` followed by manual refresh.
- Virtual document removal when a generated document closes.
- Manifest categories and explicit Workspace Trust capability.

Tests should exercise real temporary Git repositories wherever the behavior depends on Git semantics.

Mocks are limited to VS Code UI boundaries and deterministic failure injection that cannot be produced safely through a real repository.

### Release gates

The local and CI release boundary will run:

```bash
pnpm install --frozen-lockfile
pnpm run check-types
pnpm run lint
pnpm test
pnpm run package
pnpm run vsix
```

CI will exercise both VS Code `1.74.0`, the declared minimum, and the current stable channel.

The VSIX file list will be inspected to ensure only runtime assets and user-facing documentation are packaged.

## Documentation Updates

- `CLAUDE.md` will describe the implemented architecture instead of scaffold state.
- The original phase documents will be marked completed or superseded where the six-TreeView architecture diverged from the initial single-tree plan.
- `docs/specs/git-explorer-spec.md` and `docs/specs/git-data-contract.md` will reflect stable stash object IDs, NUL-delimited worktrees, current error behavior, and manual rediscovery.
- `README.md` will describe current `0.2.0` limitations without presenting future roadmap work as implemented.
- `PLAN.md` will remain the historical first-release plan and will be labeled accordingly instead of being rewritten as the current implementation specification.

## Delivery Sequence

The implementation will be divided into independently reviewable concerns:

1. Stable stash identity and single repository-level enumeration.
2. Portable Git parser contracts and fail-closed errors.
3. Repository refresh, explicit provider errors, and virtual-document cleanup.
4. Test tooling, CI, manifest capability, and release gates.
5. Documentation synchronization.

Each production concern will carry its regression tests in the same commit.

The full release gate will run again after all concerns have been integrated.

## Acceptance Criteria

- No stash appears more than once solely because linked worktrees exist.
- Creating or deleting another stash cannot redirect an existing tree item's show or apply action.
- No checkout or stash apply occurs when dirty-state detection fails.
- Valid remote paths containing spaces and valid worktree paths containing newlines remain intact.
- Symbolic remote HEAD refs never appear as selectable remote branches.
- Users can recover from a post-activation `git init` by invoking Refresh.
- Empty sections and failed section loads have distinguishable UI states.
- Closed generated documents do not retain their content in the provider store.
- Type checking, linting, the complete VS Code test suite, production bundling, and VSIX packaging pass from a clean checkout.
- CI covers the declared minimum VS Code version and stable VS Code.
- Current documentation no longer describes the repository as an unimplemented scaffold.
