import * as vscode from "vscode";
import { execGit, formatGitError, GitError } from "../utils/execGit";
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
    const verifyHeadArgs = ["rev-parse", "--verify", "--quiet", "HEAD"];
    try {
      await execGit(verifyHeadArgs, this.repoRoot);
    } catch (err) {
      if (
        err instanceof GitError &&
        err.exitCode === 1 &&
        err.systemCode === undefined &&
        err.signal === undefined &&
        err.stderr.trim() === ""
      ) {
        return [];
      }
      if (err instanceof GitError) {
        this.outputChannel.appendLine(
          `[git ${verifyHeadArgs.join(" ")}] ${formatGitError(err)}`,
        );
      }
      throw err;
    }

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
      [
        "branch",
        "-r",
        "--format=%(refname:short)%09%(objectname:short)%09%(symref)",
      ],
      parseRemoteBranches,
    );
    return [...local, ...remote];
  }

  async listRemotes(): Promise<GitRemote[]> {
    return this.run(["remote", "-v"], parseRemotes);
  }

  async listStashes(): Promise<GitStash[]> {
    return this.run(
      ["stash", "list", "--format=%gd%x09%H%x09%gs"],
      parseStashes,
    );
  }

  async listTags(): Promise<GitTag[]> {
    const tags = await this.run(["tag", "--sort=-creatordate"], parseTags);
    return tags.slice(0, 50);
  }

  async listWorktrees(): Promise<GitWorktree[]> {
    return this.run(["worktree", "list", "--porcelain", "-z"], parseWorktrees);
  }

  async isDirty(cwd = this.repoRoot): Promise<boolean> {
    try {
      const stdout = await execGit(["status", "--porcelain"], cwd);
      return stdout.trim().length > 0;
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(
          `[git status --porcelain] ${formatGitError(err)}`,
        );
      }
      throw err;
    }
  }

  async showCommit(fullHash: string): Promise<string> {
    return execGit(["show", "--stat", "--patch", fullHash], this.repoRoot);
  }

  async showStash(objectId: string): Promise<string> {
    return execGit(["stash", "show", "-p", objectId], this.repoRoot);
  }

  async checkoutBranch(branchName: string): Promise<void> {
    try {
      await execGit(["checkout", branchName], this.repoRoot);
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(`[checkout] ${formatGitError(err)}`);
      }
      throw err;
    }
  }

  async applyStash(objectId: string): Promise<void> {
    try {
      await execGit(["stash", "apply", objectId], this.repoRoot);
    } catch (err) {
      if (err instanceof GitError) {
        this.outputChannel.appendLine(`[stash apply] ${formatGitError(err)}`);
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
        this.outputChannel.appendLine(
          `[git ${args.join(" ")}] ${formatGitError(err)}`,
        );
      }
      throw err;
    }
  }
}
