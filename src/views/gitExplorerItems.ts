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
  | CommitItem
  | BranchGroupItem
  | BranchItem
  | RemoteItem
  | RemoteUrlItem
  | StashItem
  | TagItem
  | WorktreeItem
  | EmptyItem;

export class CommitItem extends vscode.TreeItem {
  constructor(public readonly commit: GitCommit) {
    super(
      `${commit.shortHash}  ${commit.subject}`,
      vscode.TreeItemCollapsibleState.None,
    );
    this.iconPath = new vscode.ThemeIcon(
      "git-commit",
      new vscode.ThemeColor("gitDecoration.untrackedResourceForeground"),
    );
    this.description = `${commit.author} · ${commit.relativeDate}`;

    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown(`**${escapeMarkdown(commit.subject)}**\n\n`);
    md.appendMarkdown(`$(person) ${escapeMarkdown(commit.author)}`);
    if (commit.authorEmail) {
      md.appendMarkdown(` \`<${commit.authorEmail}>\``);
    }
    md.appendMarkdown(`\n\n$(history) ${commit.relativeDate}\n\n`);
    md.appendMarkdown(`$(git-commit) \`${commit.fullHash}\``);
    this.tooltip = md;

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
    this.iconPath = new vscode.ThemeIcon(
      groupType === "local" ? "git-branch" : "cloud",
    );
    this.description = `${branches.length}`;
    this.contextValue = `branchGroup:${groupType}`;
  }
}

export class BranchItem extends vscode.TreeItem {
  constructor(public readonly branch: GitBranch) {
    super(branch.name, vscode.TreeItemCollapsibleState.None);

    if (branch.isCurrent) {
      this.iconPath = new vscode.ThemeIcon(
        "check",
        new vscode.ThemeColor("gitDecoration.addedResourceForeground"),
      );
    } else if (branch.isRemote) {
      this.iconPath = new vscode.ThemeIcon("cloud");
    } else {
      this.iconPath = new vscode.ThemeIcon("git-branch");
    }

    this.description = branch.upstream ?? "";

    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown(`$(git-branch) **${escapeMarkdown(branch.name)}**`);
    if (branch.isCurrent) {
      md.appendMarkdown(" *(current)*");
    }
    if (branch.upstream) {
      md.appendMarkdown(
        `\n\n$(remote-explorer) tracking \`${branch.upstream}\``,
      );
    }
    this.tooltip = md;

    this.contextValue = branch.isRemote ? "remoteBranch" : "localBranch";
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
    this.iconPath = new vscode.ThemeIcon(remoteIcon(remote.fetchUrl));
    this.description = remoteHost(remote.fetchUrl);
    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown(`$(remote-explorer) **${remote.name}**\n\n`);
    md.appendMarkdown(`$(cloud-download) \`${remote.fetchUrl}\``);
    if (remote.pushUrl !== remote.fetchUrl) {
      md.appendMarkdown(`\n\n$(cloud-upload) \`${remote.pushUrl}\``);
    }
    this.tooltip = md;
    this.contextValue = "remote";
  }
}

export class RemoteUrlItem extends vscode.TreeItem {
  constructor(
    public readonly urlType: "fetch" | "push",
    public readonly url: string,
  ) {
    super(`${urlType}: ${url}`, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(
      urlType === "fetch" ? "cloud-download" : "cloud-upload",
    );
    this.tooltip = new vscode.MarkdownString(
      `$(${urlType === "fetch" ? "cloud-download" : "cloud-upload"}) \`${url}\``,
      true,
    );
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
    super(stash.message, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon("archive");

    const wtLabel = stash.worktreePath
      ? ` · ${path.basename(stash.worktreePath)}`
      : "";
    this.description = `${stash.ref} · ${stash.branch}${wtLabel}`;

    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown(`$(archive) **${escapeMarkdown(stash.message)}**\n\n`);
    md.appendMarkdown(`$(git-branch) \`${stash.branch}\`\n\n`);
    md.appendMarkdown(`$(list-ordered) ${stash.ref}`);
    if (stash.worktreePath) {
      md.appendMarkdown(`\n\n$(folder-opened) \`${stash.worktreePath}\``);
    }
    this.tooltip = md;

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
    this.iconPath = new vscode.ThemeIcon("tag");
    this.tooltip = new vscode.MarkdownString(`$(tag) \`${tag.name}\``, true);
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

    this.iconPath = new vscode.ThemeIcon(
      worktree.isBare
        ? "folder"
        : worktree.isDetached
          ? "git-commit"
          : "folder-opened",
    );
    this.description = branchInfo;

    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown(
      `$(folder-opened) **${path.basename(worktree.path)}**\n\n`,
    );
    md.appendMarkdown(`$(file-directory) \`${worktree.path}\`\n\n`);
    md.appendMarkdown(`$(git-branch) ${branchInfo}\n\n`);
    md.appendMarkdown(`$(git-commit) \`${worktree.headHash.slice(0, 8)}\``);
    if (worktree.isDetached) {
      md.appendMarkdown(" *(detached)*");
    }
    if (worktree.isBare) {
      md.appendMarkdown(" *(bare)*");
    }
    this.tooltip = md;

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
    this.iconPath = new vscode.ThemeIcon("info");
    this.contextValue = "empty";
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
}

function remoteHost(url: string): string {
  const match = url.match(/[@/]([^/:]+\.[^/:]+)[:/]/);
  return match ? match[1] : "";
}

function remoteIcon(url: string): string {
  if (url.includes("github.com")) {
    return "github";
  }
  if (url.includes("gitlab.com")) {
    return "source-control";
  }
  if (url.includes("bitbucket.org")) {
    return "source-control";
  }
  return "remote-explorer";
}
