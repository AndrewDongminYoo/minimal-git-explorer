import * as vscode from "vscode";
import { RepositoryServiceAccessor } from "../git/repositoryContext";
import {
  BranchGroupItem,
  BranchItem,
  CommitItem,
  EmptyItem,
  ErrorItem,
  RemoteItem,
  RemoteUrlItem,
  StashItem,
  TagItem,
  WorktreeItem,
} from "./gitExplorerItems";

export interface SectionProvider {
  refresh(): void;
  dispose(): void;
}

abstract class BaseSectionProvider<T extends vscode.TreeItem>
  implements vscode.TreeDataProvider<T>, SectionProvider
{
  protected readonly _ev = new vscode.EventEmitter<T | undefined | void>();
  readonly onDidChangeTreeData = this._ev.event;

  constructor(protected readonly repository: RepositoryServiceAccessor) {}

  refresh(): void {
    this._ev.fire();
  }

  getTreeItem(el: T): T {
    return el;
  }

  dispose(): void {
    this._ev.dispose();
  }

  protected unavailableItem(): EmptyItem | ErrorItem {
    return this.repository.errorMessage
      ? new ErrorItem(this.repository.errorMessage)
      : new EmptyItem("No Git repository found");
  }

  abstract getChildren(element?: T): Promise<T[]>;
}

// ── Commits ──────────────────────────────────────────────────────────────────

type CommitNode = CommitItem | EmptyItem | ErrorItem;

export class CommitsProvider extends BaseSectionProvider<CommitNode> {
  async getChildren(_element?: CommitNode): Promise<CommitNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }
    try {
      const commits = await service.listCommits();
      return commits.length
        ? commits.map((commit) => new CommitItem(commit))
        : [new EmptyItem("No commits found")];
    } catch {
      return [new ErrorItem("Failed to load commits")];
    }
  }
}

// ── Branches ─────────────────────────────────────────────────────────────────

type BranchNode = BranchGroupItem | BranchItem | EmptyItem | ErrorItem;

export class BranchesProvider extends BaseSectionProvider<BranchNode> {
  async getChildren(element?: BranchNode): Promise<BranchNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }

    if (!element) {
      try {
        const branches = await service.listBranches();
        const local = branches.filter((branch) => !branch.isRemote);
        const remote = branches.filter((branch) => branch.isRemote);
        const groups: BranchNode[] = [];
        if (local.length) {
          groups.push(new BranchGroupItem("local", local));
        }
        if (remote.length) {
          groups.push(new BranchGroupItem("remote", remote));
        }
        return groups.length ? groups : [new EmptyItem("No branches found")];
      } catch {
        return [new ErrorItem("Failed to load branches")];
      }
    }

    if (element instanceof BranchGroupItem) {
      return element.branches.map((b) => new BranchItem(b));
    }

    return [];
  }
}

// ── Remotes ───────────────────────────────────────────────────────────────────

type RemoteNode = RemoteItem | RemoteUrlItem | EmptyItem | ErrorItem;

export class RemotesProvider extends BaseSectionProvider<RemoteNode> {
  async getChildren(element?: RemoteNode): Promise<RemoteNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }

    if (!element) {
      try {
        const remotes = await service.listRemotes();
        return remotes.length
          ? remotes.map((remote) => new RemoteItem(remote))
          : [new EmptyItem("No remotes configured")];
      } catch {
        return [new ErrorItem("Failed to load remotes")];
      }
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

type StashNode = StashItem | EmptyItem | ErrorItem;

export class StashesProvider extends BaseSectionProvider<StashNode> {
  async getChildren(_element?: StashNode): Promise<StashNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }
    try {
      const stashes = await service.listStashes();
      return stashes.length
        ? stashes.map((stash) => new StashItem(stash))
        : [new EmptyItem("No stashes found")];
    } catch {
      return [new ErrorItem("Failed to load stashes")];
    }
  }
}

// ── Tags ─────────────────────────────────────────────────────────────────────

type TagNode = TagItem | EmptyItem | ErrorItem;

export class TagsProvider extends BaseSectionProvider<TagNode> {
  async getChildren(_element?: TagNode): Promise<TagNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }
    try {
      const tags = await service.listTags();
      return tags.length
        ? tags.map((tag) => new TagItem(tag))
        : [new EmptyItem("No tags found")];
    } catch {
      return [new ErrorItem("Failed to load tags")];
    }
  }
}

// ── Worktrees ─────────────────────────────────────────────────────────────────

type WorktreeNode = WorktreeItem | EmptyItem | ErrorItem;

export class WorktreesProvider extends BaseSectionProvider<WorktreeNode> {
  async getChildren(_element?: WorktreeNode): Promise<WorktreeNode[]> {
    const service = this.repository.service;
    if (!service) {
      return [this.unavailableItem()];
    }
    try {
      const worktrees = await service.listWorktrees();
      return worktrees.length
        ? worktrees.map((worktree) => new WorktreeItem(worktree))
        : [new EmptyItem("No worktrees found")];
    } catch {
      return [new ErrorItem("Failed to load worktrees")];
    }
  }
}
