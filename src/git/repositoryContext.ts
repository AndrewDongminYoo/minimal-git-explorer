import * as vscode from "vscode";
import { formatGitError, GitError } from "../utils/execGit";
import { GitService } from "./gitService";
import { findFirstGitRoot } from "./repository";

export interface RepositoryServiceAccessor {
  readonly service: GitService | null;
  readonly errorMessage: string | null;
}

export class RepositoryContext implements RepositoryServiceAccessor {
  private _service: GitService | null = null;
  private _errorMessage: string | null = null;

  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  get service(): GitService | null {
    return this._service;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  async rediscover(workspaceFolders: readonly string[]): Promise<void> {
    try {
      const repoRoot = await findFirstGitRoot([...workspaceFolders]);
      this._service = repoRoot
        ? new GitService(repoRoot, this.outputChannel)
        : null;
      this._errorMessage = null;
    } catch (error) {
      this._service = null;
      this._errorMessage = "Git is unavailable";
      if (error instanceof GitError) {
        this.outputChannel.appendLine(
          `[repository detection] ${formatGitError(error)}`,
        );
        return;
      }
      throw error;
    }
  }
}
