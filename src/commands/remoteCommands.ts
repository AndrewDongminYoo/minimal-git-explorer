import * as vscode from "vscode";
import { RemoteUrlItem } from "../views/gitExplorerItems";

const SCP_LIKE = /^(?:[^@\s/]+@)?([^\s/:]{2,}):(?!\/)(.+)$/;
const SCHEME_LIKE =
  /^(ssh|git\+ssh|git|https?):\/\/(?:[^@/]+@)?([^\s/:]+)(?::\d+)?\/(.+)$/;
const AZURE_SSH_HOST = "ssh.dev.azure.com";
const AZURE_SSH_PATH = /^v3\/([^/]+)\/([^/]+)\/(.+)$/;

/**
 * Converts a Git remote URL to the web page URL of the same repository.
 * Returns null when the remote has no web equivalent, such as a local path.
 * Any embedded credentials are dropped so they never reach the browser.
 */
export function toBrowsableUrl(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();

  const scp = SCP_LIKE.exec(trimmed);
  if (scp) {
    return azureDevOpsUrl(scp[1], scp[2]) ?? webUrl("https", scp[1], scp[2]);
  }

  const scheme = SCHEME_LIKE.exec(trimmed);
  return scheme ? webUrl(scheme[1], scheme[2], scheme[3]) : null;
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

function webUrl(scheme: string, host: string, repoPath: string): string {
  const protocol = scheme === "http" ? "http" : "https";
  const page = repoPath.replace(/^\/+/, "").replace(/\.git\/?$/, "");
  return `${protocol}://${host}/${page}`;
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
