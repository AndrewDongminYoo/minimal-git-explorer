import * as fs from "fs";
import { execGit, GitError } from "../utils/execGit";

export async function detectGitRoot(
  workspaceFolder: string,
): Promise<string | null> {
  try {
    const result = await execGit(
      ["rev-parse", "--show-toplevel"],
      workspaceFolder,
    );
    return result.trim() || null;
  } catch (err) {
    if (err instanceof GitError && !err.systemCode) {
      return null;
    }
    throw err;
  }
}

export async function findFirstGitRoot(
  workspaceFolders: string[],
): Promise<string | null> {
  for (const workspaceFolder of workspaceFolders) {
    try {
      const repoRoot = await detectGitRoot(workspaceFolder);
      if (repoRoot) {
        return repoRoot;
      }
    } catch (error) {
      if (
        error instanceof GitError &&
        error.systemCode === "ENOENT" &&
        (await isMissingWorkspaceFolder(workspaceFolder))
      ) {
        continue;
      }
      throw error;
    }
  }

  return null;
}

async function isMissingWorkspaceFolder(
  workspaceFolder: string,
): Promise<boolean> {
  try {
    await fs.promises.stat(workspaceFolder);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT";
  }
}
