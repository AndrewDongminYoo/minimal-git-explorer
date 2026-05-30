import * as assert from "assert";
import { BranchItem } from "../views/gitExplorerItems";

suite("BranchItem", () => {
  test("exposes checkout only for local branches", () => {
    const local = new BranchItem({
      name: "feature/local",
      shortHash: "abc1234",
      isCurrent: false,
      isRemote: false,
    });
    const remote = new BranchItem({
      name: "origin/main",
      shortHash: "def5678",
      isCurrent: false,
      isRemote: true,
    });

    assert.strictEqual(local.contextValue, "localBranch");
    assert.strictEqual(
      local.command?.command,
      "minimal-git-explorer.checkoutBranch",
    );
    assert.strictEqual(remote.contextValue, "remoteBranch");
    assert.strictEqual(remote.command, undefined);
  });
});
