import * as assert from "assert";
import * as vscode from "vscode";
import { openRemoteUrl, toBrowsableUrl } from "../commands/remoteCommands";
import { RemoteUrlItem } from "../views/gitExplorerItems";

suite("toBrowsableUrl", () => {
  test("converts scp-like SSH remotes", () => {
    assert.strictEqual(
      toBrowsableUrl(
        "git@github.com:AndrewDongminYoo/minimal-git-explorer.git",
      ),
      "https://github.com/AndrewDongminYoo/minimal-git-explorer",
    );
  });

  test("drops the SSH scheme and port", () => {
    assert.strictEqual(
      toBrowsableUrl("ssh://git@github.com:2222/owner/repo.git"),
      "https://github.com/owner/repo",
    );
  });

  test("strips credentials from https remotes", () => {
    assert.strictEqual(
      toBrowsableUrl("https://user:token@github.com/owner/repo.git"),
      "https://github.com/owner/repo",
    );
  });

  test("rewrites Azure DevOps SSH remotes to their web layout", () => {
    assert.strictEqual(
      toBrowsableUrl("git@ssh.dev.azure.com:v3/org/project/repo"),
      "https://dev.azure.com/org/project/_git/repo",
    );
  });

  test("keeps plain http remotes on http", () => {
    assert.strictEqual(
      toBrowsableUrl("http://git.internal/owner/repo.git"),
      "http://git.internal/owner/repo",
    );
  });

  test("returns null for remotes without a web page", () => {
    assert.strictEqual(toBrowsableUrl("/tmp/project remote.git"), null);
    assert.strictEqual(toBrowsableUrl("file:///tmp/repo.git"), null);
    assert.strictEqual(toBrowsableUrl("../sibling.git"), null);
  });
});

suite("openRemoteUrl", () => {
  let originalOpenExternal: typeof vscode.env.openExternal;
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage;

  setup(() => {
    originalOpenExternal = vscode.env.openExternal;
    originalShowErrorMessage = vscode.window.showErrorMessage;
  });

  teardown(() => {
    Object.defineProperty(vscode.env, "openExternal", {
      configurable: true,
      value: originalOpenExternal,
    });
    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: originalShowErrorMessage,
    });
  });

  test("opens the converted web page", async () => {
    const opened: string[] = [];
    Object.defineProperty(vscode.env, "openExternal", {
      configurable: true,
      value: (uri: vscode.Uri) => {
        opened.push(uri.toString());
        return Promise.resolve(true);
      },
    });

    await openRemoteUrl(
      new RemoteUrlItem("fetch", "git@github.com:owner/repo.git"),
    );

    assert.deepStrictEqual(opened, ["https://github.com/owner/repo"]);
  });

  test("reports remotes without a web page instead of opening one", async () => {
    let opened = false;
    let message = "";
    Object.defineProperty(vscode.env, "openExternal", {
      configurable: true,
      value: () => {
        opened = true;
        return Promise.resolve(true);
      },
    });
    Object.defineProperty(vscode.window, "showErrorMessage", {
      configurable: true,
      value: (value: string) => {
        message = value;
        return Promise.resolve(undefined);
      },
    });

    await openRemoteUrl(new RemoteUrlItem("fetch", "/tmp/local.git"));

    assert.strictEqual(opened, false);
    assert.ok(message.includes("/tmp/local.git"));
  });
});
