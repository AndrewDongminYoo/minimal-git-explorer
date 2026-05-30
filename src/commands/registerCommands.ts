import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { GitExplorerContentProvider } from "../utils/openTextDocument";
import { GitExplorerProvider } from "../views/gitExplorerProvider";
import {
  BranchItem,
  CommitItem,
  RemoteUrlItem,
  StashItem,
  TagItem,
  WorktreeItem,
} from "../views/gitExplorerItems";
import { openCommit } from "./commitCommands";
import { checkoutBranch } from "./branchCommands";
import { copyRemoteUrl } from "./remoteCommands";
import { showStash, applyStash } from "./stashCommands";
import { copyTagName } from "./tagCommands";
import { openWorktree } from "./worktreeCommands";

export function registerCommands(
  context: vscode.ExtensionContext,
  gitService: GitService | null,
  provider: GitExplorerProvider,
  contentProvider: GitExplorerContentProvider,
  outputChannel: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("minimal-git-explorer.refresh", () =>
      provider.refresh(),
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.openCommit",
      async (item: CommitItem) => {
        if (!gitService || !(item instanceof CommitItem)) {
          return;
        }
        await openCommit(item, gitService, contentProvider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.checkoutBranch",
      async (item: BranchItem) => {
        if (!gitService || !(item instanceof BranchItem)) {
          return;
        }
        await checkoutBranch(item, gitService, provider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.copyRemoteUrl",
      async (item: RemoteUrlItem) => {
        if (!(item instanceof RemoteUrlItem)) {
          return;
        }
        await copyRemoteUrl(item);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.showStash",
      async (item: StashItem) => {
        if (!gitService || !(item instanceof StashItem)) {
          return;
        }
        await showStash(item, gitService, contentProvider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.applyStash",
      async (item: StashItem) => {
        if (!gitService || !(item instanceof StashItem)) {
          return;
        }
        await applyStash(item, gitService, provider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.copyTagName",
      async (item: TagItem) => {
        if (!(item instanceof TagItem)) {
          return;
        }
        await copyTagName(item);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.openWorktree",
      async (item: WorktreeItem) => {
        if (!(item instanceof WorktreeItem)) {
          return;
        }
        await openWorktree(item);
      },
    ),
  );
}
