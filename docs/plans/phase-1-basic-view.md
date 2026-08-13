# Phase 1: Basic View

**Goal:** Show a static TreeView in the Source Control sidebar.

**Status:** Completed

> Historical plan: the initial single-provider design was superseded in `0.2.0` by six independent TreeViews backed by `src/views/sectionProviders.ts`.

## Tasks

- [x] Remove `minimal-git-explorer.helloWorld` from `package.json` and `extension.ts`
- [x] Add six `views.scm` contributions to `package.json`
- [x] Register `minimal-git-explorer.refresh` in `package.json`
- [x] Create `src/views/sectionProviders.ts` with one `TreeDataProvider` per contributed view
- [x] Create `src/views/gitExplorerItems.ts` with typed data, empty, and error items
- [x] Register all six TreeViews in `extension.ts`
- [x] Create the `Minimal Git Explorer` output channel in `extension.ts`

## Definition of Done

```markdown
- Extension activates without error (F5 in VS Code)
- Source Control sidebar shows six Minimal Git Explorer views
- Clicking the refresh toolbar button does not throw
- No "Hello World" command in the Command Palette
```

## Files to Create/Modify

| File                            | Action |
| ------------------------------- | ------ |
| `package.json`                  | Modify |
| `src/extension.ts`              | Modify |
| `src/views/sectionProviders.ts` | Create |
| `src/views/gitExplorerItems.ts` | Create |

## Verification

```bash
pnpm run compile   # must pass with no errors
```

Then press F5 in VS Code. Open Source Control panel (Ctrl+Shift+G). Confirm "Minimal Git Explorer" appears.
