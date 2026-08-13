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
    const repoRoot = await detectGitRoot(workspaceFolder);
    if (repoRoot) {
      return repoRoot;
    }
  }

  return null;
}
