# Review Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every concrete P1 through P3 review finding while preserving the existing command and six-TreeView product surface.

**Architecture:** Keep the existing Git CLI, parser, service, provider, and command layers. Introduce only one small shared repository context so providers and commands can observe repository rediscovery, use immutable stash object IDs for actions, propagate read failures to explicit UI error items, and clean virtual documents when they close.

**Tech Stack:** TypeScript 5.9, VS Code Extension API, Node.js `execFile`, Mocha through `@vscode/test-cli`, pnpm 11, esbuild, GitHub Actions, and Trunk.

## Global Constraints

- Preserve all existing public command IDs and the six contributed TreeView IDs.
- Use local Git through `execFile`; do not add the VS Code Git extension API or a Git library.
- Add no runtime dependency.
- Keep manual refresh as the only general refresh policy.
- Abort checkout and stash apply when dirty-state detection fails.
- Keep raw Git diagnostics in the `Minimal Git Explorer` output channel and show concise user notifications.
- Write and observe a failing regression test before each production behavior change.
- Regenerate `pnpm-lock.yaml` in the same concern as any `package.json` dependency change.
- Stage explicit paths and create one conventional commit per concern without Co-Author trailers.

## File Ownership Map

- `src/git/gitTypes.ts`, `src/git/parsers.ts`, and `src/git/gitService.ts` own Git data identity, command formats, parsing, and error propagation.
- `src/utils/execGit.ts` owns typed Git process failures and reusable diagnostic formatting.
- `src/git/repositoryContext.ts` will own the mutable selected-repository state and rediscovery operation.
- `src/views/gitExplorerItems.ts` and `src/views/sectionProviders.ts` own empty/error presentation and disposable provider events.
- `src/extension.ts` and `src/commands/registerCommands.ts` own lifecycle wiring and access to the current repository service.
- `src/utils/openTextDocument.ts` owns the generated-document content store.
- `src/test/*.test.ts` contain regression and integration coverage using real temporary repositories when Git semantics matter.
- `package.json`, `pnpm-lock.yaml`, `.vscode-test.mjs`, and `.github/workflows/ci.yml` own the test and release gate.
- `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `PLAN.md`, `docs/specs/*.md`, and `docs/plans/phase-*.md` own current and historical project documentation.

---

### Task 1: Stable Stash Identity and Single Enumeration

**Files:**

- Modify: `src/git/gitTypes.ts:29-35`
- Modify: `src/git/parsers.ts:134-164`
- Modify: `src/git/gitService.ts:59-82`
- Modify: `src/commands/stashCommands.ts:10-67`
- Modify: `src/views/gitExplorerItems.ts:149-175`
- Test: `src/test/parsers.test.ts:128-158`
- Test: `src/test/gitService.test.ts:12-106`
- Test: `src/test/stashCommands.test.ts:8-120`

**Interfaces:**

- Consumes: `execGit(args: string[], cwd: string): Promise<string>` and the existing `GitService.repoRoot`.
- Produces: `GitStash.objectId: string`, `GitService.showStash(objectId: string): Promise<string>`, and `GitService.applyStash(objectId: string): Promise<void>`.

- [ ] **Step 1: Add failing parser and command identity tests**

Add a parser assertion that compiles before the production type changes by narrowing only inside the assertion:

```typescript
test("parses an immutable stash object ID", () => {
  const stdout =
    "stash@{0}\t0123456789abcdef0123456789abcdef01234567\tOn main: saved work";
  const [stash] = parseStashes(stdout);

  assert.strictEqual(
    (stash as GitStash & { objectId?: string }).objectId,
    "0123456789abcdef0123456789abcdef01234567",
  );
});
```

Add a command test whose fake service records the argument supplied to `applyStash` and assert that it receives the object ID rather than `stash@{0}`.

- [ ] **Step 2: Add failing real-Git regressions for duplicate and renumbered stashes**

In `gitService.test.ts`, create a linked worktree and assert that one shared stash produces one `GitStash` result.

Capture the first stash's object ID, create a newer stash so the first entry becomes `stash@{1}`, apply the captured object ID, and assert that the restored file contains the original stash content.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "stash object ID|does not duplicate shared stashes|applies the captured stash"
```

Expected: at least one assertion fails because `objectId` is absent, current enumeration returns a duplicate per worktree, and command actions still use the display ref.

- [ ] **Step 4: Implement the minimal stable identity contract**

Change the type to:

```typescript
export interface GitStash {
  index: number;
  ref: string;
  objectId: string;
  branch: string;
  message: string;
}
```

List stashes exactly once from `repoRoot`:

```typescript
async listStashes(): Promise<GitStash[]> {
  return this.run(
    ["stash", "list", "--format=%gd%x09%H%x09%gs"],
    parseStashes,
  );
}
```

Parse the first two tab boundaries as `ref`, `objectId`, and the remaining reflog subject.

Use `item.stash.objectId` for both show and apply while retaining `item.stash.ref` in labels and notifications.

Remove every `worktreePath` read and display because Git's common stash ref does not establish worktree ownership.

- [ ] **Step 5: Run focused and complete tests and verify GREEN**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "stash"
pnpm test
```

Expected: all stash parser, service, and command tests pass without duplicate entries.

- [ ] **Step 6: Commit the stash concern**

```bash
git add src/git/gitTypes.ts src/git/parsers.ts src/git/gitService.ts src/commands/stashCommands.ts src/views/gitExplorerItems.ts src/test/parsers.test.ts src/test/gitService.test.ts src/test/stashCommands.test.ts
git diff --cached --check
git commit -m "fix(stash): use stable object identities"
```

---

### Task 2: Portable Git Parsing and Fail-Closed Errors

**Files:**

- Modify: `src/utils/execGit.ts:6-34`
- Modify: `src/git/repository.ts:3-31`
- Modify: `src/git/parsers.ts:79-132,177-213`
- Modify: `src/git/gitService.ts:40-166`
- Modify: `src/commands/branchCommands.ts:6-41`
- Modify: `src/commands/commitCommands.ts:10-31`
- Modify: `src/commands/stashCommands.ts:10-67`
- Test: `src/test/parsers.test.ts:78-126,180-237`
- Test: `src/test/gitService.test.ts:12-106`
- Test: `src/test/repository.test.ts:11-45`
- Test: `src/test/stashCommands.test.ts:8-120`
- Create: `src/test/branchCommands.test.ts`

**Interfaces:**

- Consumes: `GitError`, all pure parser functions, and current Git command call sites.
- Produces: `GitError.systemCode?: string`, `formatGitError(error: GitError): string`, remote branch rows containing `symref`, NUL-delimited worktree parsing, and read methods that reject on failure.

- [ ] **Step 1: Add failing parser regressions**

Add these behaviors to `parsers.test.ts`:

```typescript
test("preserves spaces in local remote paths", () => {
  const [remote] = parseRemotes(
    "local\t/tmp/project remote.git (fetch)\nlocal\t/tmp/project remote.git (push)",
  );
  assert.strictEqual(remote.fetchUrl, "/tmp/project remote.git");
});

test("skips symbolic remote HEAD rows", () => {
  assert.deepStrictEqual(
    parseRemoteBranches("origin\tabc1234\trefs/remotes/origin/main"),
    [],
  );
});

test("preserves newlines in NUL-delimited worktree paths", () => {
  const path = "/tmp/project\nlinked";
  const [worktree] = parseWorktrees(
    `worktree ${path}\0HEAD abc1234\0branch refs/heads/linked\0\0`,
  );
  assert.strictEqual(worktree.path, path);
});
```

- [ ] **Step 2: Add failing service and mutation error regressions**

Assert that `new GitService(missingDirectory, output).listCommits()` and `.isDirty()` reject with `GitError` instead of resolving to `[]` or `false`.

In `branchCommands.test.ts` and `stashCommands.test.ts`, make `isDirty` reject with a `GitError`, then assert that the mutation method is not invoked and the user receives the existing concise error notification.

Assert that diagnostics use the `GitError.message` when `stderr` is empty.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "spaces in local remote|symbolic remote HEAD|newlines in NUL|dirty-state check fails|read command fails"
```

Expected: the current parsers lose or invent data, read methods resolve empty values, and mutation precondition failures escape without the required guarded notification.

- [ ] **Step 4: Implement portable formats and parsers**

Change the remote branch command to:

```typescript
["branch", "-r", "--format=%(refname:short)%09%(objectname:short)%09%(symref)"];
```

Skip remote rows whose third tab-separated field is non-empty.

Parse remotes with the first tab and the final marker rather than `\S+` URL matching.

Change the worktree command to:

```typescript
["worktree", "list", "--porcelain", "-z"];
```

Parse records with `stdout.split("\0\0")` and fields with `record.split("\0")`.

- [ ] **Step 5: Implement typed fallback diagnostics and fail-closed propagation**

Capture string process codes on `GitError`:

```typescript
export function formatGitError(error: GitError): string {
  return error.stderr.trim() || error.message;
}
```

Make `GitService.run` and `isDirty` log the formatted diagnostic and rethrow.

Keep normal non-repository `rev-parse` exits mapped to `null`, but rethrow process-spawn errors identified by `systemCode`.

Wrap both the dirty check and mutation call in each command's `try` block so any precondition failure aborts the operation.

- [ ] **Step 6: Run focused and complete tests and verify GREEN**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "remote|worktree|dirty|GitService"
pnpm test
pnpm run check-types
pnpm run lint
```

Expected: every parser preserves valid data, symbolic HEAD is absent, reads reject on failure, and mutation precondition failures do not mutate.

- [ ] **Step 7: Commit the Git correctness concern**

```bash
git add src/utils/execGit.ts src/git/repository.ts src/git/parsers.ts src/git/gitService.ts src/commands/branchCommands.ts src/commands/commitCommands.ts src/commands/stashCommands.ts src/test/parsers.test.ts src/test/gitService.test.ts src/test/repository.test.ts src/test/stashCommands.test.ts src/test/branchCommands.test.ts
git diff --cached --check
git commit -m "fix(git): preserve data and fail closed"
```

---

### Task 3: Repository Rediscovery, Provider Errors, and Document Cleanup

**Files:**

- Create: `src/git/repositoryContext.ts`
- Modify: `src/views/gitExplorerItems.ts:12-261`
- Modify: `src/views/sectionProviders.ts:15-163`
- Modify: `src/commands/registerCommands.ts:20-104`
- Modify: `src/utils/openTextDocument.ts:5-25`
- Modify: `src/extension.ts:19-125`
- Create: `src/test/repositoryContext.test.ts`
- Create: `src/test/sectionProviders.test.ts`
- Create: `src/test/openTextDocument.test.ts`
- Modify: `src/test/extension.test.ts:96-107`

**Interfaces:**

- Consumes: `findFirstGitRoot`, `GitService`, `GitError`, `SectionProvider.refresh()`, and `GitExplorerContentProvider`.
- Produces: `RepositoryContext.service`, `RepositoryContext.errorMessage`, `RepositoryContext.rediscover(workspaceFolders)`, `ErrorItem`, `SectionProvider.dispose()`, and `GitExplorerContentProvider.remove(uri)`.

- [ ] **Step 1: Add a failing repository rediscovery test**

Create a temporary ordinary folder, call `RepositoryContext.rediscover([folder])`, and assert `service === null`.

Run `git init` in the same folder, rediscover again, and assert `service?.repoRoot` equals the real folder path.

- [ ] **Step 2: Add failing provider error and document cleanup tests**

Construct a `CommitsProvider` with an accessor whose service rejects `listCommits()` and assert that `getChildren()` returns one `ErrorItem` labeled `Failed to load commits`.

For the content provider, create a URI, assert the stored content is returned, call `remove(uri)`, and assert the provider returns an empty string.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "repository rediscovery|Failed to load commits|removes closed document content"
```

Expected: the new repository context, error item, and remove operation do not exist.

- [ ] **Step 4: Implement the focused repository context**

Create this implementation without a state-management dependency:

```typescript
export interface RepositoryServiceAccessor {
  readonly service: GitService | null;
  readonly errorMessage: string | null;
}

export class RepositoryContext implements RepositoryServiceAccessor {
  private _service: GitService | null = null;
  private _errorMessage: string | null = null;

  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  get service(): GitService | null {
    return this._service;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  async rediscover(workspaceFolders: readonly string[]): Promise<void> {
    try {
      const repoRoot = await findFirstGitRoot([...workspaceFolders]);
      this._service = repoRoot
        ? new GitService(repoRoot, this.outputChannel)
        : null;
      this._errorMessage = null;
    } catch (error) {
      this._service = null;
      this._errorMessage = "Git is unavailable";
      if (error instanceof GitError) {
        this.outputChannel.appendLine(
          `[repository detection] ${formatGitError(error)}`,
        );
        return;
      }
      throw error;
    }
  }
}
```

`rediscover` installs a new `GitService` for the first valid root, clears the service for an ordinary non-Git workspace, and stores a concise error while logging details if repository detection rejects.

- [ ] **Step 5: Make providers current, disposable, and error-aware**

Change provider constructors to accept `RepositoryServiceAccessor`.

Read `repository.service` each time `getChildren` runs.

Return `EmptyItem("No Git repository found")` only for a successful empty repository context, return `ErrorItem(repository.errorMessage)` for detection errors, and catch service read errors as section-specific `ErrorItem` values.

Implement `dispose()` on the provider base and add every provider to `context.subscriptions`.

- [ ] **Step 6: Wire refresh and dynamic commands through the shared context**

Change `registerCommands` to accept the repository accessor and an asynchronous `refreshAll` callback.

Resolve `repository.service` inside each command callback rather than capturing the activation-time service.

In `extension.ts`, make Refresh perform repository rediscovery, update all six view descriptions/messages, then fire all provider refresh events.

Use the same operation once during activation.

- [ ] **Step 7: Remove closed virtual documents**

Add:

```typescript
remove(uri: vscode.Uri): void {
  this._store.delete(uri.toString());
}
```

Register `vscode.workspace.onDidCloseTextDocument` and remove only documents whose URI scheme is `git-explorer`.

- [ ] **Step 8: Run focused and complete tests and verify GREEN**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "rediscovery|load commits|document content|activates"
pnpm test
pnpm run compile
```

Expected: rediscovery observes `git init`, read failures are distinct from empty results, content can be released, and activation still succeeds.

- [ ] **Step 9: Commit the lifecycle concern**

```bash
git add src/git/repositoryContext.ts src/views/gitExplorerItems.ts src/views/sectionProviders.ts src/commands/registerCommands.ts src/utils/openTextDocument.ts src/extension.ts src/test/repositoryContext.test.ts src/test/sectionProviders.test.ts src/test/openTextDocument.test.ts src/test/extension.test.ts
git diff --cached --check
git commit -m "fix(extension): refresh repository state safely"
```

---

### Task 4: Test Tooling, CI, Manifest Capability, and Release Gate

**Files:**

- Modify: `package.json:17-33,175-186`
- Modify: `pnpm-lock.yaml`
- Modify: `.vscode-test.mjs:1-5`
- Create: `.github/workflows/ci.yml`
- Modify: `src/test/extension.test.ts:8-94`

**Interfaces:**

- Consumes: the existing `pnpm test`, `pnpm run package`, and `pnpm run vsix` scripts.
- Produces: `VSCODE_TEST_VERSION` selection, explicit Workspace Trust metadata, and CI coverage for VS Code `1.74.0` and `stable`.

- [ ] **Step 1: Add failing manifest capability coverage and repair the stale category expectation**

Extend `PackageManifest` with:

```typescript
capabilities?: {
  untrustedWorkspaces?: { supported?: boolean; description?: string };
};
```

Assert the existing valid categories are `['Other', 'SCM Providers']` and assert `untrustedWorkspaces.supported === false` with a non-empty description.

- [ ] **Step 2: Run the manifest tests and verify RED**

Run:

```bash
pnpm run compile-tests
pnpm exec vscode-test --grep "marketplace metadata|Workspace Trust"
```

Expected: the stale category failure is removed and the new Workspace Trust assertion fails because the capability is absent.

- [ ] **Step 3: Add explicit manifest capability and version selector**

Add this manifest object:

```json
"capabilities": {
  "untrustedWorkspaces": {
    "supported": false,
    "description": "Local Git commands and Git hooks run only after the workspace is trusted."
  }
}
```

Add the package-manager pin used by local development and CI:

```json
"packageManager": "pnpm@11.21.0"
```

Configure `.vscode-test.mjs` with:

```javascript
export default defineConfig({
  files: "out/test/**/*.test.js",
  version: process.env.VSCODE_TEST_VERSION ?? "stable",
  mocha: { timeout: 10000 },
});
```

- [ ] **Step 4: Update the official VS Code test packages and regenerate the lockfile**

Run:

```bash
pnpm add --save-dev @vscode/test-cli@^0.0.15 @vscode/test-electron@^3.1.0
pnpm install --frozen-lockfile
```

Expected: `package.json` and `pnpm-lock.yaml` resolve the updated test runner without an install diff on the frozen verification.

- [ ] **Step 5: Add the CI workflow**

Create `.github/workflows/ci.yml` with one quality job that runs `pnpm run package` and `pnpm run vsix`, plus a test matrix job that runs `xvfb-run -a pnpm test` with `VSCODE_TEST_VERSION` set to `1.74.0` and `stable`.

Use Node.js `22`, Corepack, the repository's `packageManager` pnpm pin, `actions/checkout@v4`, and `actions/setup-node@v4`.

- [ ] **Step 6: Run local tooling and release verification**

Run:

```bash
VSCODE_TEST_VERSION=1.74.0 pnpm test
VSCODE_TEST_VERSION=stable pnpm test
pnpm run package
pnpm run vsix
pnpm audit --audit-level high
trunk check package.json pnpm-lock.yaml .vscode-test.mjs .github/workflows/ci.yml src/test/extension.test.ts
```

Expected: both VS Code versions pass, the macOS executable lookup works without a manual symlink, the production bundle and VSIX are created, audit reports no high-severity vulnerabilities, and Trunk reports no new issues.

- [ ] **Step 7: Inspect the VSIX contents and remove the generated archive from the worktree**

Run:

```bash
unzip -l minimal-git-explorer-0.2.0.vsix
```

Confirm the package contains `dist/extension.js`, `package.json`, `README.md`, `CHANGELOG.md`, `SUPPORT.md`, `LICENSE`, and `resources/**`, and excludes `src/**`, `docs/**`, `.trunk/**`, and local test artifacts.

Move the generated VSIX to an explicit temporary validation path outside the repository so no release artifact is committed:

```bash
mkdir -p /tmp/minimal-git-explorer-review-hardening
mv minimal-git-explorer-0.2.0.vsix /tmp/minimal-git-explorer-review-hardening/minimal-git-explorer-0.2.0.vsix
```

- [ ] **Step 8: Commit the release-gate concern**

```bash
git add package.json pnpm-lock.yaml .vscode-test.mjs .github/workflows/ci.yml src/test/extension.test.ts
git diff --cached --check
git commit -m "test: harden extension release gates"
```

---

### Task 5: Synchronize Current and Historical Documentation

**Files:**

- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `PLAN.md`
- Modify: `docs/specs/git-data-contract.md`
- Modify: `docs/specs/git-explorer-spec.md`
- Modify: `docs/plans/phase-1-basic-view.md`
- Modify: `docs/plans/phase-2-git-service.md`
- Modify: `docs/plans/phase-3-tree-rendering.md`
- Modify: `docs/plans/phase-4-read-actions.md`
- Modify: `docs/plans/phase-5-mutations.md`

**Interfaces:**

- Consumes: the verified final source, test commands, manifest, and six-TreeView architecture.
- Produces: current contributor guidance, current user limitations, accurate contracts, and explicitly historical initial-release plans.

- [ ] **Step 1: Update contributor and user documentation**

Change `CLAUDE.md` from scaffold state to the implemented `0.2.0` architecture, list `sectionProviders.ts` instead of the removed `gitExplorerProvider.ts`, and document current commands and test gates.

Rename the README limitation heading from `Known limitations (v0.1.0)` to `Known limitations` and retain only verified current limitations.

Add an `Unreleased` changelog entry for stable stash identities, parser/error hardening, repository rediscovery, explicit Workspace Trust, CI, and documentation synchronization.

- [ ] **Step 2: Reconcile specifications with production contracts**

Update `git-data-contract.md` with `GitStash.objectId`, the stable action identity, explicit remote `symref`, space-preserving remote parsing, `worktree list --porcelain -z`, and rethrown read errors.

Update `git-explorer-spec.md` to describe six contributed SCM TreeViews, manual repository rediscovery, distinct empty/error items, and the unchanged command IDs.

- [ ] **Step 3: Mark initial release planning as historical**

Add a top-level note to `PLAN.md` that it is the historical `0.1.0` product plan and current contracts live in `docs/specs/`.

Mark phases 1 through 5 as completed, noting that phase 3's single-tree implementation was superseded by six independent TreeViews in `0.2.0`.

Do not mark future roadmap items as implemented.

- [ ] **Step 4: Validate every modified document**

Run:

```bash
trunk check CLAUDE.md README.md CHANGELOG.md PLAN.md docs/specs/git-data-contract.md docs/specs/git-explorer-spec.md docs/plans/phase-1-basic-view.md docs/plans/phase-2-git-service.md docs/plans/phase-3-tree-rendering.md docs/plans/phase-4-read-actions.md docs/plans/phase-5-mutations.md
git diff --check
```

Expected: no Markdown, spelling, formatting, or whitespace issue is reported.

- [ ] **Step 5: Commit the documentation concern**

```bash
git add CLAUDE.md README.md CHANGELOG.md PLAN.md docs/specs/git-data-contract.md docs/specs/git-explorer-spec.md docs/plans/phase-1-basic-view.md docs/plans/phase-2-git-service.md docs/plans/phase-3-tree-rendering.md docs/plans/phase-4-read-actions.md docs/plans/phase-5-mutations.md
git diff --cached --check
git commit -m "docs: synchronize hardening contracts"
```

---

### Task 6: Final Integrated Verification

**Files:**

- Verify only: all tracked files changed by Tasks 1 through 5.

**Interfaces:**

- Consumes: every implementation and documentation concern.
- Produces: evidence that the branch is ready for review without publishing or pushing it.

- [ ] **Step 1: Run the complete local release gate from the branch root**

Run:

```bash
pnpm install --frozen-lockfile
pnpm run check-types
pnpm run lint
VSCODE_TEST_VERSION=1.74.0 pnpm test
VSCODE_TEST_VERSION=stable pnpm test
pnpm run package
pnpm run vsix
pnpm audit --audit-level high
```

Expected: every command exits zero and both VS Code test runs report zero failures.

- [ ] **Step 2: Run repository-wide configured quality checks**

Run:

```bash
trunk check --all
git diff --check main...HEAD
```

Expected: no new Trunk issue and no whitespace error.

- [ ] **Step 3: Audit branch state and concern boundaries**

Run:

```bash
git status --short --branch
git log --oneline --decorate main..HEAD
git diff --stat main...HEAD
git diff --name-status main...HEAD
```

Expected: the worktree is clean, commits are concern-split, no generated VSIX is tracked, and only the approved hardening scope is present.

- [ ] **Step 4: Report remaining manual verification explicitly**

Record manual Source Control sidebar checks as `[PARTIAL]` unless the Extension Development Host is exercised interactively for refresh after `git init`, empty/error rendering, commit and stash documents, branch checkout, stash apply, and opening a worktree.
