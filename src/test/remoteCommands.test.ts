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

  test("drops a query or fragment that could carry a token", () => {
    assert.strictEqual(
      toBrowsableUrl("https://host/org/repo.git?access_token=secret"),
      "https://host/org/repo",
    );
    assert.strictEqual(
      toBrowsableUrl("https://host/org/repo.git#readme"),
      "https://host/org/repo",
    );
  });

  test("keeps a self-hosted web port", () => {
    assert.strictEqual(
      toBrowsableUrl("https://git.internal:8443/owner/repo.git"),
      "https://git.internal:8443/owner/repo",
    );
  });

  test("accepts a bracketed IPv6 authority", () => {
    assert.strictEqual(
      toBrowsableUrl("https://[2001:db8::1]:8443/owner/repo.git"),
      "https://[2001:db8::1]:8443/owner/repo",
    );
  });

  test("keeps plain http remotes on http", () => {
    assert.strictEqual(
      toBrowsableUrl("http://git.internal/owner/repo.git"),
      "http://git.internal/owner/repo",
    );
  });

  test("rejects remotes whose host hides behind a second credential separator", () => {
    assert.strictEqual(
      toBrowsableUrl("git@github.com@evil.com:owner/repo.git"),
      null,
    );
    assert.strictEqual(
      toBrowsableUrl("ssh://git@github.com@evil.com/owner/repo.git"),
      null,
    );
  });

  test("returns null for remotes without a web page", () => {
    assert.strictEqual(toBrowsableUrl("/tmp/project remote.git"), null);
    assert.strictEqual(toBrowsableUrl("file:///tmp/repo.git"), null);
    assert.strictEqual(toBrowsableUrl("../sibling.git"), null);
    assert.strictEqual(toBrowsableUrl("C:\\repo.git"), null);
    assert.strictEqual(toBrowsableUrl("C:/repos/foo"), null);
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
