import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { formatGitError, GitError } from "../utils/execGit";
import {
  GitExplorerContentProvider,
  openReadonlyDocument,
} from "../utils/openTextDocument";
import { CommitItem } from "../views/gitExplorerItems";

export async function openCommit(
  item: CommitItem,
  gitService: GitService,
  contentProvider: GitExplorerContentProvider,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  try {
    const output = await gitService.showCommit(item.commit.fullHash);
    const uri = contentProvider.create(
      output,
      `commit-${item.commit.shortHash}.diff`,
    );
    await openReadonlyDocument(uri);
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[show commit] ${formatGitError(err)}`);
      vscode.window.showErrorMessage(
        "Failed to open commit. See the Minimal Git Explorer output for details.",
      );
    }
  }
}
