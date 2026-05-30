import * as path from "path";
import * as vscode from "vscode";
import { detectGitRoot } from "./git/repository";
import { GitService } from "./git/gitService";
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
  );

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  let gitService: GitService | null = null;

  if (workspaceFolder) {
    const repoRoot = await detectGitRoot(workspaceFolder);
    if (repoRoot) {
      gitService = new GitService(repoRoot, outputChannel);
    }
  }

  const commitsProvider = new CommitsProvider(gitService);
  const branchesProvider = new BranchesProvider(gitService);
  const remotesProvider = new RemotesProvider(gitService);
  const stashesProvider = new StashesProvider(gitService);
  const tagsProvider = new TagsProvider(gitService);
  const worktreesProvider = new WorktreesProvider(gitService);

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

  context.subscriptions.push(...views);

  if (gitService) {
    const userInfo = await gitService.getUserInfo();
    if (userInfo) {
      const repoName = path.basename(gitService.repoRoot);
      const desc = `${repoName}  ·  ${userInfo.name}`;
      views.forEach((v) => {
        v.description = desc;
      });
    }
  } else {
    const noRepo = "No Git repository found";
    views.forEach((v) => {
      v.message = noRepo;
    });
  }

  registerCommands(
    context,
    gitService,
    allProviders,
    contentProvider,
    outputChannel,
  );
}

export function deactivate(): void {}
