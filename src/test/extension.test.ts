import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const EXTENSION_ID = "dongminyu.minimal-git-explorer";

interface PackageManifest {
  activationEvents?: string[];
  bugs?: { url?: string };
  capabilities?: {
    untrustedWorkspaces?: { supported?: boolean; description?: string };
  };
  categories?: string[];
  contributes?: {
    commands?: Array<{ command: string }>;
    menus?: Record<string, Array<{ command: string; when?: string }>>;
    views?: Record<string, Array<{ id: string; name: string }>>;
  };
  engines?: { vscode?: string };
  homepage?: string;
  icon?: string;
  repository?: { url?: string };
}

function readManifest(): PackageManifest {
  const root = path.resolve(__dirname, "..", "..");
  return JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ) as PackageManifest;
}

suite("Extension manifest", () => {
  test("contributes the release command surface without helloWorld", () => {
    const manifest = readManifest();
    const commands =
      manifest.contributes?.commands?.map(({ command }) => command) ?? [];

    assert.deepStrictEqual(commands.sort(), [
      "minimal-git-explorer.applyStash",
      "minimal-git-explorer.checkoutBranch",
      "minimal-git-explorer.copyRemoteUrl",
      "minimal-git-explorer.copyTagName",
      "minimal-git-explorer.openCommit",
      "minimal-git-explorer.openWorktree",
      "minimal-git-explorer.refresh",
      "minimal-git-explorer.showStash",
    ]);
    assert.ok(!commands.includes("minimal-git-explorer.helloWorld"));
  });

  test("uses automatic view activation and contributes the six SCM views", () => {
    const manifest = readManifest();
    const scmViews = manifest.contributes?.views?.scm ?? [];

    assert.deepStrictEqual(manifest.activationEvents, []);
    assert.deepStrictEqual(
      scmViews.map(({ id }) => id),
      [
        "minimal-git-explorer.commits",
        "minimal-git-explorer.branches",
        "minimal-git-explorer.remotes",
        "minimal-git-explorer.stashes",
        "minimal-git-explorer.tags",
        "minimal-git-explorer.worktrees",
      ],
    );
  });

  test("exposes checkout only for local branch tree items", () => {
    const manifest = readManifest();
    const itemMenus = manifest.contributes?.menus?.["view/item/context"] ?? [];
    const checkoutMenu = itemMenus.find(
      ({ command }) => command === "minimal-git-explorer.checkoutBranch",
    );

    assert.strictEqual(
      checkoutMenu?.when,
      "view == minimal-git-explorer.branches && viewItem == localBranch",
    );
  });

  test("uses focused Source Control marketplace metadata", () => {
    const manifest = readManifest();

    assert.deepStrictEqual(manifest.categories, ["Other", "SCM Providers"]);
    assert.strictEqual(manifest.engines?.vscode, "^1.125.0");
    assert.strictEqual(manifest.icon, "resources/icon.png");
    assert.strictEqual(
      manifest.repository?.url,
      "https://github.com/AndrewDongminYoo/minimal-git-explorer",
    );
    assert.strictEqual(
      manifest.homepage,
      "https://github.com/AndrewDongminYoo/minimal-git-explorer#readme",
    );
    assert.strictEqual(
      manifest.bugs?.url,
      "https://github.com/AndrewDongminYoo/minimal-git-explorer/issues",
    );
  });

  test("declares its Workspace Trust requirement", () => {
    const untrustedWorkspaces =
      readManifest().capabilities?.untrustedWorkspaces;

    assert.strictEqual(untrustedWorkspaces?.supported, false);
    assert.ok(untrustedWorkspaces?.description?.trim());
  });
});

suite("Extension activation", () => {
  test("activates without throwing", async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);

    assert.ok(
      extension,
      `${EXTENSION_ID} should be installed in the test host`,
    );
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
    await vscode.commands.executeCommand("minimal-git-explorer.refresh");
  });
});
