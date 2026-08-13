import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { formatGitError, GitError } from "../utils/execGit";
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
    const output = await gitService.showStash(item.stash.objectId);
    const uri = contentProvider.create(
      output,
      `stash-${item.stash.index}.diff`,
    );
    await openReadonlyDocument(uri);
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[stash show] ${formatGitError(err)}`);
      vscode.window.showErrorMessage(
        "Failed to show stash. See the Minimal Git Explorer output for details.",
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
    const dirty = await gitService.isDirty();
    if (dirty) {
      const choice = await vscode.window.showWarningMessage(
        `Working tree has uncommitted changes. Apply ${item.stash.ref} anyway?`,
        { modal: true },
        "Apply Stash",
      );
      if (choice !== "Apply Stash") {
        return;
      }
    }

    await gitService.applyStash(item.stash.objectId);
    provider.refresh();
    vscode.window.showInformationMessage(`Applied ${item.stash.ref}`);
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[stash apply] ${formatGitError(err)}`);
      vscode.window.showErrorMessage(
        "Failed to apply stash. See the Minimal Git Explorer output for details.",
      );
    }
  }
}
