import * as assert from "assert";
import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import { GitService } from "../git/gitService";

const execFileAsync = promisify(execFile);

suite("GitService integration", () => {
  let tempDir: string;
  let repoRoot: string;
  let service: GitService;
  let output = "";

  setup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "minimal-git-service-"));
    repoRoot = path.join(tempDir, "repo");
    fs.mkdirSync(repoRoot);

    await git(["init"], repoRoot);
    await git(["checkout", "-b", "main"], repoRoot);
    await git(["config", "user.name", "Test User"], repoRoot);
    await git(["config", "user.email", "test@example.com"], repoRoot);

    fs.writeFileSync(path.join(repoRoot, "README.md"), "initial\n");
    await git(["add", "README.md"], repoRoot);
    await git(["commit", "-m", "initial commit"], repoRoot);
    await git(["branch", "feature/test"], repoRoot);
    await git(
      ["remote", "add", "origin", "https://example.com/owner/repo.git"],
      repoRoot,
    );
    await git(["update-ref", "refs/remotes/origin/main", "HEAD"], repoRoot);
    await git(["tag", "v1.0.0"], repoRoot);

    fs.writeFileSync(path.join(repoRoot, "README.md"), "changed\n");
    await git(["stash", "push", "-m", "saved work"], repoRoot);

    output = "";
    service = new GitService(repoRoot, {
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("reads commits, branches, remotes, stashes, tags, and worktrees", async () => {
    const commits = await service.listCommits();
    const branches = await service.listBranches();
    const remotes = await service.listRemotes();
    const stashes = await service.listStashes();
    const tags = await service.listTags();
    const worktrees = await service.listWorktrees();
    const realRepoRoot = fs.realpathSync(repoRoot);

    assert.strictEqual(commits[0].subject, "initial commit");
    assert.ok(
      branches.some((branch) => branch.name === "main" && branch.isCurrent),
    );
    assert.ok(branches.some((branch) => branch.name === "feature/test"));
    assert.ok(
      branches.some(
        (branch) => branch.name === "origin/main" && branch.isRemote,
      ),
    );
    assert.deepStrictEqual(remotes[0], {
      name: "origin",
      fetchUrl: "https://example.com/owner/repo.git",
      pushUrl: "https://example.com/owner/repo.git",
    });
    assert.strictEqual(stashes[0].message, "saved work");
    assert.strictEqual(tags[0].name, "v1.0.0");
    assert.ok(
      worktrees.some(
        (worktree) => fs.realpathSync(worktree.path) === realRepoRoot,
      ),
    );
    assert.strictEqual(output, "");
  });

  test("opens commit and stash details from real git output", async () => {
    const [commit] = await service.listCommits();
    const [stash] = await service.listStashes();

    const commitOutput = await service.showCommit(commit.fullHash);
    const stashOutput = await service.showStash(stash.objectId);

    assert.match(commitOutput, /initial commit/);
    assert.match(stashOutput, /README\.md/);
  });

  test("lists a shared stash only once with linked worktrees", async () => {
    const linkedRoot = path.join(tempDir, "linked");
    await git(["worktree", "add", linkedRoot, "feature/test"], repoRoot);

    const stashes = await service.listStashes();

    assert.strictEqual(stashes.length, 1);
  });

  test("applies the selected stash after reflog indices change", async () => {
    const [captured] = await service.listStashes();
    assert.ok(captured.objectId);

    fs.writeFileSync(path.join(repoRoot, "README.md"), "newer\n");
    await git(["stash", "push", "-m", "newer work"], repoRoot);

    await service.applyStash(captured.objectId);

    assert.strictEqual(
      fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
      "changed\n",
    );
  });

  test("detects dirty and clean working trees", async () => {
    assert.strictEqual(await service.isDirty(), false);

    fs.writeFileSync(path.join(repoRoot, "dirty.txt"), "dirty\n");

    assert.strictEqual(await service.isDirty(), true);
  });
});

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout;
}
