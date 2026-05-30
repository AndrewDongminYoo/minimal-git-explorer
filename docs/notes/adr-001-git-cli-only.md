# ADR-001: Use Git CLI Instead of VS Code Git Extension API

**Status:** Accepted  
**Date:** 2026-05-30

## Context

VS Code ships a built-in Git extension that exposes an internal API via `vscode.extensions.getExtension('vscode.git')`. This API provides typed access to repository state, commits, branches, etc., without spawning child processes.

The alternative is to spawn `git` directly via `child_process.execFile`.

## Decision

Use the git CLI directly. Do not depend on the VS Code git extension API.

## Rationale

1. **Stability** — The VS Code git extension API is not officially documented or versioned. It can change between VS Code releases without notice. Depending on it would require ongoing compatibility testing.

2. **Local-first principle** — The extension's core value is predictable, local git access. Wrapping an internal extension adds an indirect layer with its own caching and state model.

3. **Testability** — Git CLI output is a plain string. Parser functions can be unit-tested without loading the VS Code Extension Host. The internal API cannot be mocked without the full VS Code runtime.

4. **Transparency** — Every data access is a visible git command. Developers reading the code can verify exactly what is being run.

## Consequences

- Must handle git not being installed (show error: `"Git executable not found."`).
- Must parse stdout strings manually in `parsers.ts`.
- Shell injection risk: mitigated by always using `execFile` with argument arrays (never `exec` with string concatenation).
- Slight latency overhead from process spawning, acceptable for a sidebar view with manual refresh.
