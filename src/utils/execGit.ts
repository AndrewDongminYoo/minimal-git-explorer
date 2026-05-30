import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class GitError extends Error {
  constructor(
    message: string,
    public readonly args: string[],
    public readonly stderr: string,
    public readonly exitCode: number,
  ) {
    super(message);
    this.name = "GitError";
  }
}

export async function execGit(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (err: unknown) {
    const e = err as { stderr?: string; code?: number; message?: string };
    throw new GitError(
      e.message ?? "git command failed",
      args,
      e.stderr ?? "",
      typeof e.code === "number" ? e.code : 1,
    );
  }
}
