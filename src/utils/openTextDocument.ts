import * as vscode from "vscode";

export const GIT_EXPLORER_SCHEME = "git-explorer";

export class GitExplorerContentProvider
  implements vscode.TextDocumentContentProvider
{
  private readonly _store = new Map<string, string>();
  private _counter = 0;

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this._store.get(uri.toString()) ?? "";
  }

  create(content: string, filename: string): vscode.Uri {
    const id = ++this._counter;
    const uri = vscode.Uri.from({
      scheme: GIT_EXPLORER_SCHEME,
      path: `/${filename}`,
      query: `id=${id}`,
    });
    this._store.set(uri.toString(), content);
    return uri;
  }
}

export async function openReadonlyDocument(
  uri: vscode.Uri,
  languageId = "diff",
): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.languages.setTextDocumentLanguage(doc, languageId);
  await vscode.window.showTextDocument(doc, {
    preview: true,
    preserveFocus: false,
  });
}
