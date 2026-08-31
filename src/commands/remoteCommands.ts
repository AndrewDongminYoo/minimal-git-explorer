import * as vscode from "vscode";
import { RemoteUrlItem } from "../views/gitExplorerItems";

// The two-character host guard keeps a Windows drive path such as `C:\repo.git`
// out of the SCP shape, where it would otherwise resolve to the host `c`.
const SCP_LIKE = /^(?:([^@\s/]+)@)?([^\s/]{2,}):(?!\/)(.+)$/;
const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const SSH_PROTOCOLS = new Set(["ssh:", "git+ssh:", "git:"]);
// Both the current and the legacy Azure DevOps transport hosts serve the same
// `v3/org/project/repo` path, and legacy organizations are reachable at
// dev.azure.com, so one rewrite covers both.
const AZURE_SSH_HOSTS = new Set([
  "ssh.dev.azure.com",
  "vs-ssh.visualstudio.com",
]);
const AZURE_SSH_PATH = /^\/?v3\/([^/]+)\/([^/]+)\/(.+)$/;
/**
 * Hosts that serve SSH transport only, mapped to the site that serves the
 * repository page. Add an entry here rather than a branch below; a transport
 * host whose web layout also differs, such as Azure DevOps, needs its own
 * function instead because the path changes too.
 */
const TRANSPORT_HOSTS = new Map([
  ["ssh.github.com", "github.com"],
  ["altssh.gitlab.com", "gitlab.com"],
  ["altssh.bitbucket.org", "bitbucket.org"],
]);

/**
 * Converts a Git remote URL to the web page URL of the same repository.
 * Returns null when the remote has no web equivalent, such as a local path.
 *
 * Only the SCP-style shape is matched by hand; everything else goes through the
 * URL standard, so IPv6 literals, ports, and escapes are parsed once instead of
 * being chased one pattern at a time.
 *
 * Every credential carrier is dropped so none reaches the browser: userinfo, a
 * query or fragment such as `?access_token=`, and a host hidden behind a second
 * raw `@`, which is rejected rather than resolved so a remote like
 * `git@github.com@evil.com:o/r` does not open a page on the trailing host. A
 * username that merely contains an encoded `@` is ordinary and is accepted.
 */
export function toBrowsableUrl(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();
  const scp = SCP_LIKE.exec(trimmed);
  const candidate = scp
    ? `ssh://${scp[1] ? `${scp[1]}@` : ""}${scp[2]}/${scp[3]}`
    : trimmed;

  // Count raw separators in the authority before parsing. A second one means the
  // real host hid behind it, while a percent-encoded `@` is a legitimate
  // username such as `user%40example.com`, and the two are indistinguishable
  // once URL has decoded them into `username`.
  const authority = candidate.replace(/^[^:]+:\/\//, "").split("/")[0];
  if ((authority.match(/@/g) ?? []).length > 1) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  const isWeb = WEB_PROTOCOLS.has(parsed.protocol);
  if (!isWeb && !SSH_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }
  if (!parsed.hostname) {
    return null;
  }

  return (
    azureDevOpsUrl(parsed.hostname, parsed.pathname) ?? webUrl(parsed, isWeb)
  );
}

/**
 * Azure DevOps is the one provider whose SSH path does not match its web path,
 * so it needs a rewrite rather than a TRANSPORT_HOSTS entry.
 * ponytail: single-provider special case; add another only when a real remote needs it.
 */
function azureDevOpsUrl(host: string, repoPath: string): string | null {
  if (!AZURE_SSH_HOSTS.has(host)) {
    return null;
  }
  const parts = AZURE_SSH_PATH.exec(repoPath);
  return parts
    ? `https://dev.azure.com/${parts[1]}/${parts[2]}/_git/${parts[3]}`
    : null;
}

/**
 * An SSH transport port says nothing about the web server, so it is discarded,
 * while a self-hosted HTTP(S) port is part of the page address and is kept.
 * A transport-only host is replaced by its web site, and its port goes with it.
 */
function webUrl(parsed: URL, isWeb: boolean): string {
  const protocol = parsed.protocol === "http:" ? "http" : "https";
  const webHost = TRANSPORT_HOSTS.get(parsed.hostname);
  const authority =
    webHost ??
    (isWeb && parsed.port
      ? `${parsed.hostname}:${parsed.port}`
      : parsed.hostname);
  const page = parsed.pathname.replace(/^\/+/, "").replace(/\.git\/?$/, "");
  return `${protocol}://${authority}/${page}`;
}

export async function copyRemoteUrl(item: RemoteUrlItem): Promise<void> {
  await vscode.env.clipboard.writeText(item.url);
  vscode.window.showInformationMessage(`Copied: ${item.url}`);
}

export async function openRemoteUrl(item: RemoteUrlItem): Promise<void> {
  const target = toBrowsableUrl(item.url);
  if (!target) {
    vscode.window.showErrorMessage(`No web page for remote: ${item.url}`);
    return;
  }
  await vscode.env.openExternal(vscode.Uri.parse(target));
}
