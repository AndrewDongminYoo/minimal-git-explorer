import * as vscode from "vscode";
import { execGit, GitError } from "../utils/execGit";
import {
  GitBranch,
  GitCommit,
  GitRemote,
  GitStash,
  GitTag,
  GitUserInfo,
  GitWorktree,
} from "./gitTypes";
import {
  parseCommits,
  parseLocalBranches,
  parseRemoteBranches,
  parseRemotes,
  parseStashes,
  parseTags,
  parseWorktrees,
} from "./parsers";

export class GitService {
  constructor(
    public readonly repoRoot: string,
    private readonly outputChannel: vscode.OutputChannel,
  ) {}

  async listCommits(): Promise<GitCommit[]> {
    return this.run(
      [
        "log",
        "-n",
        "50",
        "--pretty=format:%H%x09%h%x09%an%x09%ae%x09%ar%x09%s",
      ],
      parseCommits,
    );
  }

  async listBranches(): Promise<GitBranch[]> {
    const local = await this.run(
      [
        "branch",
        "--format=%(refname:short)%09%(objectname:short)%09%(upstream:short)%09%(HEAD)",
      ],
      parseLocalBranches,
    );
    const remote = await this.run(
      ["branch", "-r", "--format=%(refname:short)%09%(objectname:short)"],
      parseRemoteBranches,
    );
    return [...local, ...remote];
  }

  async listRemotes(): Promise<GitRemote[]> {
    return this.run(["remote", "-v"], parseRemotes);
  }

  async listStashes(): Promise<GitStash[]> {
    return this.run(["stash", "list", "--date=relative"], parseStashes);
  }

  async listTags(): Promise<GitTag[]> {
    const tags = await this.run(["tag", "--sort=-creatordate"], parseTags);
    return tags.slice(0, 50);
  }

  async listWorktrees(): Promise<GitWorktree[]> {
    return this.run(["worktree", "list", "--porcelain"], parseWorktrees);
  }

  async isDirty(): Promise<boolean> {
    const stdout = await this.run(["status", "--porcelain"], (s) => s);
    return stdout.trim().length > 0;
  }

  async showCommit(fullHash: string): Promise<string> {
    return execGit(["show", "--stat", "--patch", fullHash], this.repoRoot);
  }

  async showStash(ref: string): Promise<string> {
    return execGit(["stash", "show", "-p", ref], this.repoRoot);
  }

  async checkoutBranch(branchName: string): Promise<void> {
    try {
      await execGit(["checkout", branchName], this.repoRoot);
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(`[checkout] ${err.stderr}`);
      }
      throw err;
    }
  }

  async applyStash(ref: string): Promise<void> {
    try {
      await execGit(["stash", "apply", ref], this.repoRoot);
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(`[stash apply] ${err.stderr}`);
      }
      throw err;
    }
  }

  async getUserInfo(): Promise<GitUserInfo | null> {
    try {
      const name = (
        await execGit(["config", "user.name"], this.repoRoot)
      ).trim();
      const email = (
        await execGit(["config", "user.email"], this.repoRoot)
      ).trim();
      if (!name) {
        return null;
      }
      return { name, email };
    } catch {
      return null;
    }
  }

  private async run<T>(
    args: string[],
    parser: (stdout: string) => T,
  ): Promise<T> {
    try {
      const stdout = await execGit(args, this.repoRoot);
      return parser(stdout);
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(`[git ${args.join(" ")}] ${err.stderr}`);
      }
      return parser("");
    }
  }
}
