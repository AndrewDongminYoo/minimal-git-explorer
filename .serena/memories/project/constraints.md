# Hard Constraints for 0.1.0

These must never be violated without an explicit design decision (new ADR):

1. **Git CLI only** — use `child_process.execFile` with argument arrays. Never use VS Code's built-in git extension API. See `mem:notes/adr-001`.

2. **No shell injection** — always pass git args as arrays to `execFile`, never as a concatenated string to `exec`.

3. **Parsers are pure** — `src/git/parsers.ts` must have zero `vscode` imports. Pure functions only. See `mem:notes/adr-003`.

4. **No helloWorld** — `minimal-git-explorer.helloWorld` command must be removed before any real commit.

5. **Output channel for errors** — log git stderr to the "Minimal Git Explorer" output channel. Do not toast raw stderr to users.

6. **No settings** — do not add `contributes.configuration` for 0.1.0.

7. **No telemetry, no network calls, no accounts** — check before release.

8. **Confirmation required** — any mutation command on a dirty working tree or destructive git op must show `vscode.window.showWarningMessage` with explicit Yes/No.

9. **Refresh after mutation** — any successful mutation must call `provider.refresh()`.

10. **activationEvents: []** — VS Code 1.74+ auto-activates on contributed views. Do not add manual activation events.
