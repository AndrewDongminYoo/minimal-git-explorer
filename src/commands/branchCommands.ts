import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { GitError } from "../utils/execGit";
import { BranchItem } from "../views/gitExplorerItems";

export async function checkoutBranch(
  item: BranchItem,
  gitService: GitService,
  provider: { refresh(): void },
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const branchName = item.branch.name;

  if (item.branch.isCurrent) {
    return;
  }

  const dirty = await gitService.isDirty();
  if (dirty) {
    const choice = await vscode.window.showWarningMessage(
      `Working tree has uncommitted changes. Checkout "${branchName}" anyway?`,
      { modal: true },
      "Checkout",
    );
    if (choice !== "Checkout") {
      return;
    }
  }

  try {
    await gitService.checkoutBranch(branchName);
    provider.refresh();
  } catch (err) {
    if (err instanceof GitError) {
      outputChannel.appendLine(`[checkout] ${err.stderr}`);
      vscode.window.showErrorMessage(
        `Failed to checkout "${branchName}": ${err.stderr || err.message}`,
      );
    }
  }
}
