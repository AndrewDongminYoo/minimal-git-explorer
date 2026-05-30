import * as path from "path";
import * as vscode from "vscode";
import {
  GitBranch,
  GitCommit,
  GitRemote,
  GitStash,
  GitTag,
  GitWorktree,
} from "../git/gitTypes";

export type GitExplorerItem =
  | SectionItem
  | CommitItem
  | BranchGroupItem
  | BranchItem
  | RemoteItem
  | RemoteUrlItem
  | StashItem
  | TagItem
  | WorktreeItem
  | EmptyItem;

export class SectionItem extends vscode.TreeItem {
  constructor(
    public readonly sectionType:
      | "commits"
      | "branches"
      | "remotes"
      | "stashes"
      | "tags"
      | "worktrees",
    label: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = `section:${sectionType}`;
  }
}

export class CommitItem extends vscode.TreeItem {
  constructor(public readonly commit: GitCommit) {
    super(
      `${commit.shortHash} ${commit.subject}`,
      vscode.TreeItemCollapsibleState.None,
    );
    this.tooltip = `${commit.fullHash}\n${commit.author} · ${commit.relativeDate}\n\n${commit.subject}`;
    this.description = `${commit.author} · ${commit.relativeDate}`;
    this.contextValue = "commit";
    this.command = {
      command: "minimal-git-explorer.openCommit",
      title: "Open Commit",
      arguments: [this],
    };
  }
}

export class BranchGroupItem extends vscode.TreeItem {
  constructor(
    public readonly groupType: "local" | "remote",
    public readonly branches: GitBranch[],
  ) {
    super(
      groupType === "local" ? "Local" : "Remote",
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.contextValue = `branchGroup:${groupType}`;
  }
}

export class BranchItem extends vscode.TreeItem {
  constructor(public readonly branch: GitBranch) {
    const label = branch.isCurrent ? `$(check) ${branch.name}` : branch.name;
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = branch.upstream ?? "";
    this.tooltip = branch.upstream
      ? `${branch.name} → ${branch.upstream}`
      : branch.name;
    this.contextValue = "branch";
    if (!branch.isRemote) {
      this.command = {
        command: "minimal-git-explorer.checkoutBranch",
        title: "Checkout Branch",
        arguments: [this],
      };
    }
  }
}

export class RemoteItem extends vscode.TreeItem {
  constructor(public readonly remote: GitRemote) {
    super(remote.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "remote";
  }
}

export class RemoteUrlItem extends vscode.TreeItem {
  constructor(
    public readonly urlType: "fetch" | "push",
    public readonly url: string,
  ) {
    super(`${urlType}: ${url}`, vscode.TreeItemCollapsibleState.None);
    this.tooltip = url;
    this.contextValue = "remoteUrl";
    this.command = {
      command: "minimal-git-explorer.copyRemoteUrl",
      title: "Copy URL",
      arguments: [this],
    };
  }
}

export class StashItem extends vscode.TreeItem {
  constructor(public readonly stash: GitStash) {
    super(
      `${stash.ref}: ${stash.message}`,
      vscode.TreeItemCollapsibleState.None,
    );
    this.tooltip = `${stash.ref} on ${stash.branch}`;
    this.description = stash.branch;
    this.contextValue = "stash";
    this.command = {
      command: "minimal-git-explorer.showStash",
      title: "Show Stash",
      arguments: [this],
    };
  }
}

export class TagItem extends vscode.TreeItem {
  constructor(public readonly tag: GitTag) {
    super(tag.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "tag";
    this.command = {
      command: "minimal-git-explorer.copyTagName",
      title: "Copy Tag Name",
      arguments: [this],
    };
  }
}

export class WorktreeItem extends vscode.TreeItem {
  constructor(public readonly worktree: GitWorktree) {
    super(path.basename(worktree.path), vscode.TreeItemCollapsibleState.None);
    const branchInfo = worktree.isDetached
      ? "detached"
      : worktree.isBare
        ? "bare"
        : (worktree.branch ?? "unknown");
    this.description = branchInfo;
    this.tooltip = `${worktree.path}\n${branchInfo} @ ${worktree.headHash.slice(0, 8)}`;
    this.contextValue = "worktree";
    this.command = {
      command: "minimal-git-explorer.openWorktree",
      title: "Open Worktree",
      arguments: [this],
    };
  }
}

export class EmptyItem extends vscode.TreeItem {
  constructor(message: string) {
    super(message, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "empty";
  }
}
