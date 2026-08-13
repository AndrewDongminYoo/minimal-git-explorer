import * as assert from "assert";
import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { RepositoryContext } from "../git/repositoryContext";

const execFileAsync = promisify(execFile);

suite("RepositoryContext", () => {
  let tempDir: string;
  let output: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "minimal-git-context-"));
    output = "";
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("rediscovers a repository created after activation", async () => {
    const repository = new RepositoryContext({
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);

    await repository.rediscover([tempDir]);
    assert.strictEqual(repository.service, null);

    await execFileAsync("git", ["init"], { cwd: tempDir });
    await repository.rediscover([tempDir]);

    const service = repository.service as GitService | null;
    assert.strictEqual(service?.repoRoot, fs.realpathSync(tempDir));
    assert.strictEqual(repository.errorMessage, null);
  });

  test("treats a missing workspace folder as no repository", async () => {
    const repository = new RepositoryContext({
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);

    await repository.rediscover([path.join(tempDir, "missing")]);

    assert.strictEqual(repository.service, null);
    assert.strictEqual(repository.errorMessage, null);
    assert.strictEqual(output, "");
  });

  test("records a missing Git executable separately from no repository", async () => {
    const repository = new RepositoryContext({
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);
    const originalPath = process.env.PATH;

    try {
      process.env.PATH = "";
      await repository.rediscover([tempDir]);
    } finally {
      if (originalPath === undefined) {
        delete process.env.PATH;
      } else {
        process.env.PATH = originalPath;
      }
    }

    assert.strictEqual(repository.service, null);
    assert.strictEqual(repository.errorMessage, "Git is unavailable");
    assert.match(output, /repository detection.*ENOENT/);
  });
});
