import * as assert from "assert";
import {
  parseCommits,
  parseLocalBranches,
  parseRemoteBranches,
  parseRemotes,
  parseStashes,
  parseTags,
  parseWorktrees,
} from "../git/parsers";

suite("parseCommits", () => {
  test("parses a typical log line", () => {
    const stdout =
      "abc1234def5678\tabc1234\tJohn Doe\tjohn@example.com\t2 days ago\tfix: resolve null pointer";
    const [commit] = parseCommits(stdout);
    assert.strictEqual(commit.fullHash, "abc1234def5678");
    assert.strictEqual(commit.shortHash, "abc1234");
    assert.strictEqual(commit.author, "John Doe");
    assert.strictEqual(commit.authorEmail, "john@example.com");
    assert.strictEqual(commit.relativeDate, "2 days ago");
    assert.strictEqual(commit.subject, "fix: resolve null pointer");
  });

  test("handles subject containing tabs", () => {
    const stdout =
      "abc1234def5678\tabc1234\tJohn Doe\tjohn@example.com\t2 days ago\tfix: tab\there";
    const [commit] = parseCommits(stdout);
    assert.strictEqual(commit.subject, "fix: tab\there");
  });

  test("parses multiple lines", () => {
    const stdout = [
      "aaa\ta1\tAlice\talice@x.com\t1 day ago\tfirst",
      "bbb\tb1\tBob\tbob@x.com\t2 days ago\tsecond",
    ].join("\n");
    const commits = parseCommits(stdout);
    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].shortHash, "a1");
    assert.strictEqual(commits[1].shortHash, "b1");
  });

  test("returns empty array for empty input", () => {
    assert.deepStrictEqual(parseCommits(""), []);
    assert.deepStrictEqual(parseCommits("   "), []);
  });

  test("skips malformed lines", () => {
    const stdout = "bad-line\naaa\ta1\tAlice\talice@x.com\t1 day ago\tmessage";
    const commits = parseCommits(stdout);
    assert.strictEqual(commits.length, 1);
  });
});

suite("parseLocalBranches", () => {
  test("parses current branch", () => {
    const stdout = "main\tabc1234\torigin/main\t*";
    const [branch] = parseLocalBranches(stdout);
    assert.strictEqual(branch.name, "main");
    assert.strictEqual(branch.isCurrent, true);
    assert.strictEqual(branch.upstream, "origin/main");
    assert.strictEqual(branch.isRemote, false);
  });

  test("parses non-current branch without upstream", () => {
    const stdout = "feature/xyz\tdef5678\t\t ";
    const [branch] = parseLocalBranches(stdout);
    assert.strictEqual(branch.name, "feature/xyz");
    assert.strictEqual(branch.isCurrent, false);
    assert.strictEqual(branch.upstream, undefined);
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseLocalBranches(""), []);
  });
});

suite("parseRemoteBranches", () => {
  test("parses remote branch", () => {
    const stdout = "origin/main\tabc1234";
    const [branch] = parseRemoteBranches(stdout);
    assert.strictEqual(branch.name, "origin/main");
    assert.strictEqual(branch.isRemote, true);
    assert.strictEqual(branch.isCurrent, false);
  });

  test("skips HEAD pointer lines", () => {
    const stdout = "origin/HEAD -> origin/main\nabc123\norigin/main\tabc1234";
    const branches = parseRemoteBranches(stdout);
    assert.ok(branches.every((b) => !b.name.includes("->")));
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseRemoteBranches(""), []);
  });
});

suite("parseRemotes", () => {
  test("parses fetch and push URLs", () => {
    const stdout = [
      "origin\tgit@github.com:owner/repo.git (fetch)",
      "origin\tgit@github.com:owner/repo.git (push)",
    ].join("\n");
    const [remote] = parseRemotes(stdout);
    assert.strictEqual(remote.name, "origin");
    assert.strictEqual(remote.fetchUrl, "git@github.com:owner/repo.git");
    assert.strictEqual(remote.pushUrl, "git@github.com:owner/repo.git");
  });

  test("parses multiple remotes", () => {
    const stdout = [
      "origin\thttps://github.com/a/b.git (fetch)",
      "origin\thttps://github.com/a/b.git (push)",
      "upstream\thttps://github.com/c/d.git (fetch)",
      "upstream\thttps://github.com/c/d.git (push)",
    ].join("\n");
    const remotes = parseRemotes(stdout);
    assert.strictEqual(remotes.length, 2);
    assert.strictEqual(remotes[0].name, "origin");
    assert.strictEqual(remotes[1].name, "upstream");
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseRemotes(""), []);
  });
});

suite("parseStashes", () => {
  test('parses "On branch:" format', () => {
    const stdout = "stash@{0}: On main: my saved work";
    const [stash] = parseStashes(stdout);
    assert.strictEqual(stash.index, 0);
    assert.strictEqual(stash.ref, "stash@{0}");
    assert.strictEqual(stash.branch, "main");
    assert.strictEqual(stash.message, "my saved work");
  });

  test('parses "WIP on branch:" format', () => {
    const stdout = "stash@{1}: WIP on feature/xyz: abc1234 some commit";
    const [stash] = parseStashes(stdout);
    assert.strictEqual(stash.index, 1);
    assert.strictEqual(stash.branch, "feature/xyz");
    assert.strictEqual(stash.message, "some commit");
  });

  test("parses multiple stashes", () => {
    const stdout = [
      "stash@{0}: On main: first",
      "stash@{1}: On main: second",
    ].join("\n");
    const stashes = parseStashes(stdout);
    assert.strictEqual(stashes.length, 2);
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseStashes(""), []);
  });
});

suite("parseTags", () => {
  test("parses tag names", () => {
    const stdout = "v1.0.0\nv0.9.0\nv0.8.0";
    const tags = parseTags(stdout);
    assert.strictEqual(tags.length, 3);
    assert.strictEqual(tags[0].name, "v1.0.0");
    assert.strictEqual(tags[2].name, "v0.8.0");
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseTags(""), []);
  });

  test("skips blank lines", () => {
    const stdout = "v1.0.0\n\nv0.9.0";
    const tags = parseTags(stdout);
    assert.strictEqual(tags.length, 2);
  });
});

suite("parseWorktrees", () => {
  test("parses a normal worktree", () => {
    const stdout = [
      "worktree /Users/user/project",
      "HEAD abc1234",
      "branch refs/heads/main",
      "",
    ].join("\n");
    const [wt] = parseWorktrees(stdout);
    assert.strictEqual(wt.path, "/Users/user/project");
    assert.strictEqual(wt.headHash, "abc1234");
    assert.strictEqual(wt.branch, "main");
    assert.strictEqual(wt.isBare, false);
    assert.strictEqual(wt.isDetached, false);
  });

  test("parses a detached worktree", () => {
    const stdout = [
      "worktree /Users/user/project-detached",
      "HEAD def5678",
      "detached",
      "",
    ].join("\n");
    const [wt] = parseWorktrees(stdout);
    assert.strictEqual(wt.isDetached, true);
    assert.strictEqual(wt.branch, undefined);
  });

  test("parses a bare worktree", () => {
    const stdout = [
      "worktree /Users/user/project-bare",
      "HEAD 0000000",
      "bare",
      "",
    ].join("\n");
    const [wt] = parseWorktrees(stdout);
    assert.strictEqual(wt.isBare, true);
  });

  test("parses multiple worktrees", () => {
    const stdout = [
      "worktree /path/main",
      "HEAD aaa",
      "branch refs/heads/main",
      "",
      "worktree /path/feature",
      "HEAD bbb",
      "branch refs/heads/feature",
      "",
    ].join("\n");
    const worktrees = parseWorktrees(stdout);
    assert.strictEqual(worktrees.length, 2);
  });

  test("returns empty for empty input", () => {
    assert.deepStrictEqual(parseWorktrees(""), []);
  });
});
