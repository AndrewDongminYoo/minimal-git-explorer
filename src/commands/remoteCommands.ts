import * as vscode from "vscode";
import { RemoteUrlItem } from "../views/gitExplorerItems";

export async function copyRemoteUrl(item: RemoteUrlItem): Promise<void> {
  await vscode.env.clipboard.writeText(item.url);
  vscode.window.showInformationMessage(`Copied: ${item.url}`);
}
