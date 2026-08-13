import * as path from "path";
import * as vscode from "vscode";
import { RepositoryContext } from "./git/repositoryContext";
import {
  GIT_EXPLORER_SCHEME,
  GitExplorerContentProvider,
} from "./utils/openTextDocument";
import {
  BranchesProvider,
  CommitsProvider,
  RemotesProvider,
  StashesProvider,
  TagsProvider,
  WorktreesProvider,
} from "./views/sectionProviders";
import { registerCommands } from "./commands/registerCommands";

const VIEW_IDS = {
  commits: "minimal-git-explorer.commits",
  branches: "minimal-git-explorer.branches",
  remotes: "minimal-git-explorer.remotes",
  stashes: "minimal-git-explorer.stashes",
  tags: "minimal-git-explorer.tags",
  worktrees: "minimal-git-explorer.worktrees",
} as const;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel(
    "Minimal Git Explorer",
  );
  context.subscriptions.push(outputChannel);

  const contentProvider = new GitExplorerContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      GIT_EXPLORER_SCHEME,
      contentProvider,
    ),
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.uri.scheme === GIT_EXPLORER_SCHEME) {
        contentProvider.remove(document.uri);
      }
    }),
  );

  const repository = new RepositoryContext(outputChannel);

  const commitsProvider = new CommitsProvider(repository);
  const branchesProvider = new BranchesProvider(repository);
  const remotesProvider = new RemotesProvider(repository);
  const stashesProvider = new StashesProvider(repository);
  const tagsProvider = new TagsProvider(repository);
  const worktreesProvider = new WorktreesProvider(repository);

  const allProviders = [
    commitsProvider,
    branchesProvider,
    remotesProvider,
    stashesProvider,
    tagsProvider,
    worktreesProvider,
  ];

  const views = [
    vscode.window.createTreeView(VIEW_IDS.commits, {
      treeDataProvider: commitsProvider,
      showCollapseAll: false,
    }),
    vscode.window.createTreeView(VIEW_IDS.branches, {
      treeDataProvider: branchesProvider,
      showCollapseAll: false,
    }),
    vscode.window.createTreeView(VIEW_IDS.remotes, {
      treeDataProvider: remotesProvider,
      showCollapseAll: false,
    }),
    vscode.window.createTreeView(VIEW_IDS.stashes, {
      treeDataProvider: stashesProvider,
      showCollapseAll: false,
    }),
    vscode.window.createTreeView(VIEW_IDS.tags, {
      treeDataProvider: tagsProvider,
      showCollapseAll: false,
    }),
    vscode.window.createTreeView(VIEW_IDS.worktrees, {
      treeDataProvider: worktreesProvider,
      showCollapseAll: false,
    }),
  ];

  context.subscriptions.push(...allProviders, ...views);

  const refreshAll = async (): Promise<void> => {
    const workspaceFolders =
      vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ??
      [];
    await repository.rediscover(workspaceFolders);

    views.forEach((view) => {
      view.description = undefined;
      view.message = undefined;
    });

    const gitService = repository.service;
    if (gitService) {
      const userInfo = await gitService.getUserInfo();
      const repoName = path.basename(gitService.repoRoot);
      const description = userInfo
        ? `${repoName}  ·  ${userInfo.name}`
        : repoName;
      views.forEach((v) => {
        v.description = description;
      });
    } else {
      const message = repository.errorMessage ?? "No Git repository found";
      views.forEach((view) => {
        view.message = message;
      });
    }

    allProviders.forEach((provider) => provider.refresh());
  };

  await refreshAll();

  registerCommands(
    context,
    repository,
    refreshAll,
    contentProvider,
    outputChannel,
  );
}

export function deactivate(): void {}
