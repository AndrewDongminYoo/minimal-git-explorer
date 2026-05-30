import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { GitError } from "../utils/execGit";
import {
  GitExplorerContentProvider,
  openReadonlyDocument,
} from "../utils/openTextDocument";
import { StashItem } from "../views/gitExplorerItems";

export async function showStash(
  item: StashItem,
  gitService: GitService,
  contentProvider: GitExplorerContentProvider,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  try {
    const output = await gitService.showStash(
      item.stash.ref,
      item.stash.worktreePath,
    );
    const uri = contentProvider.create(
      output,
      `stash-${item.stash.index}.diff`,
    );
    await openReadonlyDocument(uri);
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[stash show] ${err.stderr}`);
      vscode.window.showErrorMessage(
        `Failed to show stash: ${err.stderr || err.message}`,
      );
    }
  }
}

export async function applyStash(
  item: StashItem,
  gitService: GitService,
  provider: { refresh(): void },
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  try {
    await gitService.applyStash(item.stash.ref, item.stash.worktreePath);
    provider.refresh();
    vscode.window.showInformationMessage(`Applied ${item.stash.ref}`);
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[stash apply] ${err.stderr}`);
      vscode.window.showErrorMessage(
        `Failed to apply stash: ${err.stderr || err.message}`,
      );
    }
  }
}
