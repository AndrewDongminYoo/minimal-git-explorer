# Architecture Layers

```log
extension.ts
  ├── views/gitExplorerProvider.ts   (TreeDataProvider, owns GitService ref)
  │     └── views/gitExplorerItems.ts  (TreeItem subclasses, no logic)
  ├── commands/registerCommands.ts   (wires commands to context.subscriptions)
  │     ├── commands/commitCommands.ts
  │     ├── commands/branchCommands.ts
  │     ├── commands/remoteCommands.ts
  │     ├── commands/stashCommands.ts
  │     ├── commands/tagCommands.ts
  │     └── commands/worktreeCommands.ts
  └── git/gitService.ts              (spawns git, delegates to parsers)
        ├── git/repository.ts        (detectGitRoot)
        ├── git/parsers.ts           (pure functions, NO vscode import)
        ├── git/gitTypes.ts          (interfaces only, NO vscode import)
        └── utils/execGit.ts         (execFile wrapper, GitError class)

utils/openTextDocument.ts           (read-only doc helper, used by commands)
```

## Dependency rules

- `parsers.ts` and `gitTypes.ts`: zero external deps, zero vscode deps
- `execGit.ts`: Node `child_process` only, zero vscode deps
- `gitService.ts`: imports execGit + parsers + gitTypes + vscode (OutputChannel)
- `views/`: imports gitService + gitTypes + vscode
- `commands/`: imports gitService + gitItems + vscode
- `extension.ts`: imports views + commands + vscode

## Build output

`src/extension.ts` → esbuild → `dist/extension.js` (CJS bundle, vscode external)
Tests: `src/test/*.test.ts` → tsc → `out/test/*.test.js` → @vscode/test-cli
