import * as assert from "assert";
import { GitExplorerContentProvider } from "../utils/openTextDocument";

suite("GitExplorerContentProvider", () => {
  test("removes closed document content", () => {
    const provider = new GitExplorerContentProvider();
    const uri = provider.create("diff content", "commit.diff");

    assert.strictEqual(
      provider.provideTextDocumentContent(uri),
      "diff content",
    );
    provider.remove(uri);
    assert.strictEqual(provider.provideTextDocumentContent(uri), "");
  });
});
