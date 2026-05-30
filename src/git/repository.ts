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
    if (err instanceof GitError) {
      return null;
    }
    return null;
  }
}
