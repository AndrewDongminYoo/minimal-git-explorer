import * as assert from "assert";
import * as vscode from "vscode";
import { checkoutBranch } from "../commands/branchCommands";
import { GitService } from "../git/gitService";
import { GitError } from "../utils/execGit";
import { BranchItem } from "../views/gitExplorerItems";

suite("checkoutBranch", () => {
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage;

  setup(() => {
    originalShowErrorMessage = vscode.window.showErrorMessage;
  });

  teardown(() => {
    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: originalShowErrorMessage,
    });
  });

  test("does not mutate when the dirty-state check fails", async () => {
    let checkedOut = false;
    let errorMessage = "";
    let output = "";

    const gitService = {
      isDirty: async () => {
        throw new GitError("spawn git ENOENT", ["status"], "", 1);
      },
      checkoutBranch: async () => {
        checkedOut = true;
      },
    } as unknown as GitService;

    const item = {
      branch: {
        name: "feature/test",
        shortHash: "abc1234",
        isCurrent: false,
        isRemote: false,
      },
    } as BranchItem;

    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: async (message: string) => {
        errorMessage = message;
        return undefined;
      },
    });

    await checkoutBranch(item, gitService, { refresh: () => undefined }, {
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);

    assert.strictEqual(checkedOut, false);
    assert.match(output, /spawn git ENOENT/);
    assert.strictEqual(
      errorMessage,
      'Failed to checkout "feature/test". See the Minimal Git Explorer output for details.',
    );
  });
});
