import * as assert from "assert";
import { formatGitError, GitError } from "../utils/execGit";

suite("formatGitError", () => {
  test("includes a termination signal alongside partial stderr", () => {
    const error = new GitError(
      "git command failed",
      ["rev-parse"],
      "partial stderr\n",
      1,
      undefined,
      "SIGTERM",
    );

    assert.strictEqual(formatGitError(error), "partial stderr (SIGTERM)");
  });
});
