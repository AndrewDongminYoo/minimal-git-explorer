import * as vscode from "vscode";
import { RepositoryServiceAccessor } from "../git/repositoryContext";
import { GitExplorerContentProvider } from "../utils/openTextDocument";
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
  repository: RepositoryServiceAccessor,
  refreshAll: () => Promise<void>,
  contentProvider: GitExplorerContentProvider,
  outputChannel: vscode.OutputChannel,
): void {
  const refreshProvider = { refresh: refreshAll };

  context.subscriptions.push(
    vscode.commands.registerCommand("minimal-git-explorer.refresh", () =>
      refreshAll(),
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.openCommit",
      async (item: CommitItem) => {
        const gitService = repository.service;
        if (!gitService || !(item instanceof CommitItem)) {
          return;
        }
        await openCommit(item, gitService, contentProvider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.checkoutBranch",
      async (item: BranchItem) => {
        const gitService = repository.service;
        if (!gitService || !(item instanceof BranchItem)) {
          return;
        }
        await checkoutBranch(item, gitService, refreshProvider, outputChannel);
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
        const gitService = repository.service;
        if (!gitService || !(item instanceof StashItem)) {
          return;
        }
        await showStash(item, gitService, contentProvider, outputChannel);
      },
    ),

    vscode.commands.registerCommand(
      "minimal-git-explorer.applyStash",
      async (item: StashItem) => {
        const gitService = repository.service;
        if (!gitService || !(item instanceof StashItem)) {
          return;
        }
        await applyStash(item, gitService, refreshProvider, outputChannel);
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
