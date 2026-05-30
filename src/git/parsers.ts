import {
  GitBranch,
  GitCommit,
  GitRemote,
  GitStash,
  GitTag,
  GitWorktree,
} from "./gitTypes";

export function parseCommits(stdout: string): GitCommit[] {
  if (!stdout.trim()) {
    return [];
  }
  return stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      const t1 = line.indexOf("\t");
      if (t1 === -1) {
        return [];
      }
      const t2 = line.indexOf("\t", t1 + 1);
      if (t2 === -1) {
        return [];
      }
      const t3 = line.indexOf("\t", t2 + 1);
      if (t3 === -1) {
        return [];
      }
      const t4 = line.indexOf("\t", t3 + 1);
      if (t4 === -1) {
        return [];
      }
      return [
        {
          fullHash: line.slice(0, t1),
          shortHash: line.slice(t1 + 1, t2),
          author: line.slice(t2 + 1, t3),
          relativeDate: line.slice(t3 + 1, t4),
          subject: line.slice(t4 + 1),
        },
      ];
    });
}

export function parseLocalBranches(stdout: string): GitBranch[] {
  if (!stdout.trim()) {
    return [];
  }
  // Do NOT call trim() on the whole stdout before splitting — git's %(HEAD) field
  // outputs a literal space for non-current branches, and trim() would strip it
  // along with surrounding tabs when it appears at the end of the last line.
  return stdout
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      const parts = line.split("\t");
      const [name, shortHash = "", upstream = "", head = ""] = parts;
      if (!name || !name.trim()) {
        return [];
      }
      return [
        {
          name: name.trim(),
          shortHash: shortHash.trim(),
          upstream: upstream.trim() || undefined,
          isCurrent: head.trim() === "*",
          isRemote: false,
        },
      ];
    });
}

export function parseRemoteBranches(stdout: string): GitBranch[] {
  if (!stdout.trim()) {
    return [];
  }
  return stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      const parts = line.split("\t");
      if (parts.length < 2) {
        return [];
      }
      const [name, shortHash] = parts;
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.includes("->")) {
        return [];
      }
      return [
        {
          name: trimmedName,
          shortHash: shortHash.trim(),
          upstream: undefined,
          isCurrent: false,
          isRemote: true,
        },
      ];
    });
}

export function parseRemotes(stdout: string): GitRemote[] {
  if (!stdout.trim()) {
    return [];
  }
  const map = new Map<string, { fetch?: string; push?: string }>();
  for (const line of stdout.trim().split("\n")) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match) {
      continue;
    }
    const [, name, url, type] = match;
    const entry = map.get(name) ?? {};
    if (type === "fetch") {
      entry.fetch = url;
    } else {
      entry.push = url;
    }
    map.set(name, entry);
  }
  return Array.from(map.entries()).map(([name, { fetch, push }]) => ({
    name,
    fetchUrl: fetch ?? push ?? "",
    pushUrl: push ?? fetch ?? "",
  }));
}

export function parseStashes(stdout: string): GitStash[] {
  if (!stdout.trim()) {
    return [];
  }
  return stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      const refMatch = line.match(/^(stash@\{(\d+)\}):\s*/);
      if (!refMatch) {
        return [];
      }
      const ref = refMatch[1];
      const index = parseInt(refMatch[2], 10);
      const rest = line.slice(refMatch[0].length);

      const onMatch = rest.match(/^On ([^:]+):\s*(.*)/);
      if (onMatch) {
        return [{ index, ref, branch: onMatch[1], message: onMatch[2] }];
      }

      const wipMatch = rest.match(/^WIP on ([^:]+):\s*\S+\s*(.*)/);
      if (wipMatch) {
        return [
          { index, ref, branch: wipMatch[1], message: wipMatch[2] || "WIP" },
        ];
      }

      return [{ index, ref, branch: "unknown", message: rest }];
    });
}

export function parseTags(stdout: string): GitTag[] {
  if (!stdout.trim()) {
    return [];
  }
  return stdout
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((name) => ({ name: name.trim() }));
}

export function parseWorktrees(stdout: string): GitWorktree[] {
  if (!stdout.trim()) {
    return [];
  }
  const blocks = stdout.trim().split(/\n\n+/);
  const result: GitWorktree[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    let path = "";
    let headHash = "";
    let branch: string | undefined;
    let isBare = false;
    let isDetached = false;

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        path = line.slice("worktree ".length);
      } else if (line.startsWith("HEAD ")) {
        headHash = line.slice("HEAD ".length);
      } else if (line.startsWith("branch ")) {
        const ref = line.slice("branch ".length);
        branch = ref.replace(/^refs\/heads\//, "");
      } else if (line === "detached") {
        isDetached = true;
      } else if (line === "bare") {
        isBare = true;
      }
    }

    if (path) {
      result.push({ path, headHash, branch, isBare, isDetached });
    }
  }

  return result;
}
