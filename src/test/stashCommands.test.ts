import * as assert from "assert";
import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { GitError } from "../utils/execGit";
import { applyStash } from "../commands/stashCommands";
import { StashItem } from "../views/gitExplorerItems";

suite("applyStash", () => {
  let originalShowWarningMessage: typeof vscode.window.showWarningMessage;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage;

  setup(() => {
    originalShowWarningMessage = vscode.window.showWarningMessage;
    originalShowInformationMessage = vscode.window.showInformationMessage;
    originalShowErrorMessage = vscode.window.showErrorMessage;
  });

  teardown(() => {
    Object.defineProperty(vscode.window, "showWarningMessage", {
      configurable: true,
      value: originalShowWarningMessage,
    });
    Object.defineProperty(vscode.window, "showInformationMessage", {
      configurable: true,
      value: originalShowInformationMessage,
    });
    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: originalShowErrorMessage,
    });
  });

  test("does not apply to a dirty working tree when confirmation is cancelled", async () => {
    let applied = false;
    let refreshed = false;

    const gitService = {
      isDirty: async (cwd?: string) => {
        assert.strictEqual(cwd, undefined);
        return true;
      },
      applyStash: async () => {
        applied = true;
      },
    } as unknown as GitService;

    const item = {
      stash: {
        index: 0,
        ref: "stash@{0}",
        objectId: "object-0",
        branch: "main",
        message: "saved work",
      },
    } as StashItem;

    Object.defineProperty(vscode.window, "showWarningMessage", {
      configurable: true,
      value: async () => undefined,
    });
    Object.defineProperty(vscode.window, "showInformationMessage", {
      configurable: true,
      value: async () => undefined,
    });

    await applyStash(item, gitService, { refresh: () => (refreshed = true) }, {
      appendLine: () => undefined,
    } as unknown as vscode.OutputChannel);

    assert.strictEqual(applied, false);
    assert.strictEqual(refreshed, false);
  });

  test("logs raw git stderr instead of showing it in the error toast", async () => {
    let errorMessage = "";
    let output = "";

    const gitService = {
      isDirty: async () => false,
      applyStash: async () => {
        throw new GitError(
          "git command failed",
          ["stash", "apply", "stash@{0}"],
          "fatal: local changes would be overwritten",
          1,
        );
      },
    } as unknown as GitService;

    const item = {
      stash: {
        index: 0,
        ref: "stash@{0}",
        objectId: "object-0",
        branch: "main",
        message: "saved work",
      },
    } as StashItem;

    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: async (message: string) => {
        errorMessage = message;
        return undefined;
      },
    });

    await applyStash(item, gitService, { refresh: () => undefined }, {
      appendLine: (line: string) => {
        output += `${line}\n`;
      },
    } as unknown as vscode.OutputChannel);

    assert.match(output, /fatal: local changes would be overwritten/);
    assert.strictEqual(
      errorMessage,
      "Failed to apply stash. See the Minimal Git Explorer output for details.",
    );
  });

  test("applies a stash by immutable object ID", async () => {
    let appliedIdentity = "";
    let refreshed = false;
    const objectId = "0123456789abcdef0123456789abcdef01234567";

    const gitService = {
      isDirty: async () => false,
      applyStash: async (identity: string) => {
        appliedIdentity = identity;
      },
    } as unknown as GitService;

    const item = {
      stash: {
        index: 0,
        ref: "stash@{0}",
        objectId,
        branch: "main",
        message: "saved work",
      },
    } as StashItem;

    Object.defineProperty(vscode.window, "showInformationMessage", {
      configurable: true,
      value: async () => undefined,
    });

    await applyStash(item, gitService, { refresh: () => (refreshed = true) }, {
      appendLine: () => undefined,
    } as unknown as vscode.OutputChannel);

    assert.strictEqual(appliedIdentity, objectId);
    assert.strictEqual(refreshed, true);
  });
});
