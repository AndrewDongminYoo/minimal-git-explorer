import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class GitError extends Error {
  constructor(
    message: string,
    public readonly args: string[],
    public readonly stderr: string,
    public readonly exitCode: number | null,
    public readonly systemCode?: string,
    public readonly signal?: NodeJS.Signals,
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
    const e = err as {
      stderr?: string;
      code?: number | string;
      message?: string;
      signal?: NodeJS.Signals | null;
    };
    throw new GitError(
      e.message ?? "git command failed",
      args,
      e.stderr ?? "",
      typeof e.code === "number" ? e.code : null,
      typeof e.code === "string" ? e.code : undefined,
      e.signal ?? undefined,
    );
  }
}

export function formatGitError(error: GitError): string {
  const stderr = error.stderr.trim();
  if (error.signal) {
    const diagnostic = stderr || error.message.trim();
    const termination = error.systemCode
      ? `${error.systemCode}, ${error.signal}`
      : error.signal;
    return `${diagnostic} (${termination})`;
  }
  return stderr || error.message;
}
