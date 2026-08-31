import * as vscode from "vscode";
import { RemoteUrlItem } from "../views/gitExplorerItems";

const SCP_LIKE = /^(?:[^@\s/]+@)?([^\s/:@]{2,}):(?!\/)(.+)$/;
const SCHEME_LIKE =
  /^(ssh|git\+ssh|git|https?):\/\/(?:[^@/]+@)?([^\s/:@]+)(?::(\d+))?\/(.+)$/;
const AZURE_SSH_HOST = "ssh.dev.azure.com";
const AZURE_SSH_PATH = /^v3\/([^/]+)\/([^/]+)\/(.+)$/;

/**
 * Converts a Git remote URL to the web page URL of the same repository.
 * Returns null when the remote has no web equivalent, such as a local path.
 * Every credential carrier is dropped so none reaches the browser: userinfo, a
 * query or fragment such as `?access_token=`, and a host that still holds an
 * `@`, which is rejected rather than resolved so a remote like
 * `git@github.com@evil.com:o/r` cannot open a page on the trailing host.
 */
export function toBrowsableUrl(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim().replace(/[?#].*$/, "");

  const scp = SCP_LIKE.exec(trimmed);
  if (scp) {
    return azureDevOpsUrl(scp[1], scp[2]) ?? webUrl("https", scp[1], scp[2]);
  }

  const scheme = SCHEME_LIKE.exec(trimmed);
  if (!scheme) {
    return null;
  }
  const [, protocol, host, port, repoPath] = scheme;
  return webUrl(protocol, host, repoPath, port);
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
function webUrl(
  scheme: string,
  host: string,
  repoPath: string,
  port?: string,
): string {
  const isWeb = scheme === "http" || scheme === "https";
  const authority = isWeb && port ? `${host}:${port}` : host;
  const page = repoPath.replace(/^\/+/, "").replace(/\.git\/?$/, "");
  return `${isWeb ? scheme : "https"}://${authority}/${page}`;
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
