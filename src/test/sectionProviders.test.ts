import * as assert from "assert";
import { GitService } from "../git/gitService";
import { RepositoryServiceAccessor } from "../git/repositoryContext";
import { GitError } from "../utils/execGit";
import { CommitItem, EmptyItem, ErrorItem } from "../views/gitExplorerItems";
import { CommitsProvider } from "../views/sectionProviders";

suite("CommitsProvider", () => {
  test("renders a section error instead of an empty result", async () => {
    const service = {
      listCommits: async () => {
        throw new GitError("git log failed", ["log"], "fatal: broken", 1);
      },
    } as unknown as GitService;
    const provider = new CommitsProvider({
      service,
      errorMessage: null,
    });

    const items = await provider.getChildren();

    assert.strictEqual(items.length, 1);
    assert.ok(items[0] instanceof ErrorItem);
    assert.strictEqual(items[0].label, "Failed to load commits");
    provider.dispose();
  });

  test("reads the current repository service on every request", async () => {
    const repository: {
      service: GitService | null;
      errorMessage: string | null;
    } = {
      service: null,
      errorMessage: null,
    };
    const provider = new CommitsProvider(
      repository as RepositoryServiceAccessor,
    );

    const emptyItems = await provider.getChildren();
    assert.ok(emptyItems[0] instanceof EmptyItem);

    repository.service = {
      listCommits: async () => [
        {
          fullHash: "0123456789abcdef",
          shortHash: "0123456",
          author: "Test User",
          authorEmail: "test@example.com",
          relativeDate: "now",
          subject: "initial commit",
        },
      ],
    } as unknown as GitService;

    const commitItems = await provider.getChildren();
    assert.ok(commitItems[0] instanceof CommitItem);
    provider.dispose();
  });

  test("renders repository detection errors distinctly", async () => {
    const provider = new CommitsProvider({
      service: null,
      errorMessage: "Git is unavailable",
    });

    const items = await provider.getChildren();

    assert.ok(items[0] instanceof ErrorItem);
    assert.strictEqual(items[0].label, "Git is unavailable");
    provider.dispose();
  });
});
