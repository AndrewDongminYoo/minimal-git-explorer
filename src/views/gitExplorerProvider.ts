import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import {
  BranchGroupItem,
  BranchItem,
  CommitItem,
  EmptyItem,
  GitExplorerItem,
  RemoteItem,
  RemoteUrlItem,
  SectionItem,
  StashItem,
  TagItem,
  WorktreeItem,
} from "./gitExplorerItems";

export class GitExplorerProvider implements vscode.TreeDataProvider<GitExplorerItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    GitExplorerItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly gitService: GitService | null) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: GitExplorerItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: GitExplorerItem): Promise<GitExplorerItem[]> {
    if (!this.gitService) {
      return [];
    }

    if (!element) {
      return [
        new SectionItem("commits", "Commits"),
        new SectionItem("branches", "Branches"),
        new SectionItem("remotes", "Remotes"),
        new SectionItem("stashes", "Stashes"),
        new SectionItem("tags", "Tags"),
        new SectionItem("worktrees", "Worktrees"),
      ];
    }

    if (element instanceof SectionItem) {
      return this.getSectionChildren(element);
    }

    if (element instanceof BranchGroupItem) {
      return element.branches.map((b) => new BranchItem(b));
    }

    if (element instanceof RemoteItem) {
      const items: RemoteUrlItem[] = [
        new RemoteUrlItem("fetch", element.remote.fetchUrl),
      ];
      if (element.remote.pushUrl !== element.remote.fetchUrl) {
        items.push(new RemoteUrlItem("push", element.remote.pushUrl));
      }
      return items;
    }

    return [];
  }

  private async getSectionChildren(
    section: SectionItem,
  ): Promise<GitExplorerItem[]> {
    const svc = this.gitService!;

    switch (section.sectionType) {
      case "commits": {
        const commits = await svc.listCommits();
        return commits.length > 0
          ? commits.map((c) => new CommitItem(c))
          : [new EmptyItem("No commits found")];
      }

      case "branches": {
        const branches = await svc.listBranches();
        const local = branches.filter((b) => !b.isRemote);
        const remote = branches.filter((b) => b.isRemote);
        const groups: GitExplorerItem[] = [];
        if (local.length > 0) {
          groups.push(new BranchGroupItem("local", local));
        }
        if (remote.length > 0) {
          groups.push(new BranchGroupItem("remote", remote));
        }
        return groups.length > 0
          ? groups
          : [new EmptyItem("No branches found")];
      }

      case "remotes": {
        const remotes = await svc.listRemotes();
        return remotes.length > 0
          ? remotes.map((r) => new RemoteItem(r))
          : [new EmptyItem("No remotes configured")];
      }

      case "stashes": {
        const stashes = await svc.listStashes();
        return stashes.length > 0
          ? stashes.map((s) => new StashItem(s))
          : [new EmptyItem("No stashes found")];
      }

      case "tags": {
        const tags = await svc.listTags();
        return tags.length > 0
          ? tags.map((t) => new TagItem(t))
          : [new EmptyItem("No tags found")];
      }

      case "worktrees": {
        const worktrees = await svc.listWorktrees();
        return worktrees.length > 0
          ? worktrees.map((w) => new WorktreeItem(w))
          : [new EmptyItem("No worktrees found")];
      }
    }
  }
}
