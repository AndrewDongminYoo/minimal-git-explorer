import * as vscode from "vscode";
import { detectGitRoot } from "./git/repository";
import { GitService } from "./git/gitService";
import {
  GIT_EXPLORER_SCHEME,
  GitExplorerContentProvider,
} from "./utils/openTextDocument";
import { GitExplorerProvider } from "./views/gitExplorerProvider";
import { registerCommands } from "./commands/registerCommands";

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

  const provider = new GitExplorerProvider(gitService);
  const treeView = vscode.window.createTreeView(
    "minimal-git-explorer.gitExplorer",
    { treeDataProvider: provider, showCollapseAll: true },
  );
  context.subscriptions.push(treeView);

  if (!gitService) {
    treeView.message = "No Git repository found.";
  }

  registerCommands(
    context,
    gitService,
    provider,
    contentProvider,
    outputChannel,
  );
}

export function deactivate(): void {}
