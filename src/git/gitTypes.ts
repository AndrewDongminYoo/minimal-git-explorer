export interface GitCommit {
  fullHash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  relativeDate: string;
  subject: string;
}

export interface GitUserInfo {
  name: string;
  email: string;
}

export interface GitBranch {
  name: string;
  shortHash: string;
  upstream?: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface GitStash {
  index: number;
  ref: string;
  branch: string;
  message: string;
  worktreePath?: string;
}

export interface GitTag {
  name: string;
}

export interface GitWorktree {
  path: string;
  headHash: string;
  branch?: string;
  isBare: boolean;
  isDetached: boolean;
}
