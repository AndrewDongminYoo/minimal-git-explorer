import * as vscode from "vscode";
import { WorktreeItem } from "../views/gitExplorerItems";

export async function openWorktree(item: WorktreeItem): Promise<void> {
  const uri = vscode.Uri.file(item.worktree.path);
  await vscode.commands.executeCommand("vscode.openFolder", uri, {
    forceNewWindow: true,
  });
}
