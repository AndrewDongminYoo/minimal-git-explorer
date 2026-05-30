import * as vscode from "vscode";
import { TagItem } from "../views/gitExplorerItems";

export async function copyTagName(item: TagItem): Promise<void> {
  await vscode.env.clipboard.writeText(item.tag.name);
  vscode.window.showInformationMessage(`Copied: ${item.tag.name}`);
}
