import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import {
  BranchGroupItem,
  BranchItem,
  CommitItem,
  EmptyItem,
  RemoteItem,
  RemoteUrlItem,
  StashItem,
  TagItem,
  WorktreeItem,
} from "./gitExplorerItems";

export interface SectionProvider {
  refresh(): void;
}

abstract class BaseSectionProvider<T extends vscode.TreeItem>
  implements vscode.TreeDataProvider<T>, SectionProvider
{
  protected readonly _ev = new vscode.EventEmitter<T | undefined | void>();
  readonly onDidChangeTreeData = this._ev.event;

  constructor(protected readonly svc: GitService | null) {}

  refresh(): void {
    this._ev.fire();
  }

  getTreeItem(el: T): T {
    return el;
  }

  abstract getChildren(element?: T): Promise<T[]>;
}

// ── Commits ──────────────────────────────────────────────────────────────────

type CommitNode = CommitItem | EmptyItem;

export class CommitsProvider extends BaseSectionProvider<CommitNode> {
  async getChildren(_element?: CommitNode): Promise<CommitNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }
    const commits = await this.svc.listCommits();
    return commits.length
      ? commits.map((c) => new CommitItem(c))
      : [new EmptyItem("No commits found")];
  }
}

// ── Branches ─────────────────────────────────────────────────────────────────

type BranchNode = BranchGroupItem | BranchItem | EmptyItem;

export class BranchesProvider extends BaseSectionProvider<BranchNode> {
  async getChildren(element?: BranchNode): Promise<BranchNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }

    if (!element) {
      const branches = await this.svc.listBranches();
      const local = branches.filter((b) => !b.isRemote);
      const remote = branches.filter((b) => b.isRemote);
      const groups: BranchNode[] = [];
      if (local.length) {
        groups.push(new BranchGroupItem("local", local));
      }
      if (remote.length) {
        groups.push(new BranchGroupItem("remote", remote));
      }
      return groups.length ? groups : [new EmptyItem("No branches found")];
    }

    if (element instanceof BranchGroupItem) {
      return element.branches.map((b) => new BranchItem(b));
    }

    return [];
  }
}

// ── Remotes ───────────────────────────────────────────────────────────────────

type RemoteNode = RemoteItem | RemoteUrlItem | EmptyItem;

export class RemotesProvider extends BaseSectionProvider<RemoteNode> {
  async getChildren(element?: RemoteNode): Promise<RemoteNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }

    if (!element) {
      const remotes = await this.svc.listRemotes();
      return remotes.length
        ? remotes.map((r) => new RemoteItem(r))
        : [new EmptyItem("No remotes configured")];
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
}

// ── Stashes ───────────────────────────────────────────────────────────────────

type StashNode = StashItem | EmptyItem;

export class StashesProvider extends BaseSectionProvider<StashNode> {
  async getChildren(_element?: StashNode): Promise<StashNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }
    const stashes = await this.svc.listStashes();
    return stashes.length
      ? stashes.map((s) => new StashItem(s))
      : [new EmptyItem("No stashes found")];
  }
}

// ── Tags ─────────────────────────────────────────────────────────────────────

type TagNode = TagItem | EmptyItem;

export class TagsProvider extends BaseSectionProvider<TagNode> {
  async getChildren(_element?: TagNode): Promise<TagNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }
    const tags = await this.svc.listTags();
    return tags.length
      ? tags.map((t) => new TagItem(t))
      : [new EmptyItem("No tags found")];
  }
}

// ── Worktrees ─────────────────────────────────────────────────────────────────

type WorktreeNode = WorktreeItem | EmptyItem;

export class WorktreesProvider extends BaseSectionProvider<WorktreeNode> {
  async getChildren(_element?: WorktreeNode): Promise<WorktreeNode[]> {
    if (!this.svc) {
      return [new EmptyItem("No Git repository found")];
    }
    const worktrees = await this.svc.listWorktrees();
    return worktrees.length
      ? worktrees.map((w) => new WorktreeItem(w))
      : [new EmptyItem("No worktrees found")];
  }
}
