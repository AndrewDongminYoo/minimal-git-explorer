import * as assert from "assert";
import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { detectGitRoot, findFirstGitRoot } from "../git/repository";
import { GitError } from "../utils/execGit";

const execFileAsync = promisify(execFile);

suite("findFirstGitRoot", () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "minimal-git-roots-"));
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns the first workspace folder that contains a Git repository", async () => {
    const nonGit = path.join(tempDir, "not-a-repo");
    const repo = path.join(tempDir, "repo");

    fs.mkdirSync(nonGit);
    fs.mkdirSync(repo);
    await git(["init"], repo);

    assert.strictEqual(
      await findFirstGitRoot([nonGit, repo]),
      fs.realpathSync(repo),
    );
  });

  test("returns null when no workspace folder contains a Git repository", async () => {
    const first = path.join(tempDir, "first");
    const second = path.join(tempDir, "second");

    fs.mkdirSync(first);
    fs.mkdirSync(second);

    assert.strictEqual(await findFirstGitRoot([first, second]), null);
  });

  test("rethrows repository detection process failures", async () => {
    const missingRoot = path.join(tempDir, "missing");

    await assert.rejects(
      () => detectGitRoot(missingRoot),
      (error: unknown) =>
        error instanceof GitError && error.systemCode === "ENOENT",
    );
  });
});

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout;
}
