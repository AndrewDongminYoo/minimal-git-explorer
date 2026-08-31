import * as vscode from "vscode";
import { RemoteUrlItem } from "../views/gitExplorerItems";

// The two-character host guard keeps a Windows drive path such as `C:\repo.git`
// out of the SCP shape, where it would otherwise resolve to the host `c`.
const SCP_LIKE = /^(?:([^@\s/]+)@)?([^\s/]{2,}):(?!\/)(.+)$/;
const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const SSH_PROTOCOLS = new Set(["ssh:", "git+ssh:", "git:"]);
const AZURE_SSH_HOST = "ssh.dev.azure.com";
const AZURE_SSH_PATH = /^\/?v3\/([^/]+)\/([^/]+)\/(.+)$/;

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
 * `@`, which is rejected rather than resolved so a remote like
 * `git@github.com@evil.com:o/r` does not open a page on the trailing host.
 */
export function toBrowsableUrl(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();
  const scp = SCP_LIKE.exec(trimmed);
  const candidate = scp
    ? `ssh://${scp[1] ? `${scp[1]}@` : ""}${scp[2]}/${scp[3]}`
    : trimmed;

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
  // An encoded `@` survives in the userinfo only when a second separator hid the
  // real host, so the remote is ambiguous and is not opened.
  if (!parsed.hostname || parsed.username.includes("%40")) {
    return null;
  }

  return (
    azureDevOpsUrl(parsed.hostname, parsed.pathname) ?? webUrl(parsed, isWeb)
  );
}

/**
 * Azure DevOps is the one common host whose SSH path does not match its web path.
 * ponytail: single-provider special case; add another only when a real remote needs it.
 */
function azureDevOpsUrl(host: string, repoPath: string): string | null {
  if (host !== AZURE_SSH_HOST) {
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
 */
function webUrl(parsed: URL, isWeb: boolean): string {
  const protocol = parsed.protocol === "http:" ? "http" : "https";
  const authority =
    isWeb && parsed.port
      ? `${parsed.hostname}:${parsed.port}`
      : parsed.hostname;
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
