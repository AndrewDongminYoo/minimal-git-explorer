# ADR-002: Use esbuild as the Bundler

**Status:** Accepted  
**Date:** 2026-05-30

## Context

VS Code extensions must ship as a single CommonJS file (`dist/extension.js`). The official VS Code extension generator supports both webpack and esbuild. The project was scaffolded with esbuild.

## Decision

Keep esbuild. Do not migrate to webpack or any other bundler.

## Rationale

1. **Already configured** — `esbuild.js` is the build script. Changing bundlers would add churn with no feature benefit.

2. **Speed** — esbuild is significantly faster than webpack for incremental builds, which matters during development (`pnpm run watch`).

3. **Simplicity** — The build config is ~50 lines of plain JS. Webpack configs for VS Code extensions are typically 100-200 lines with multiple plugins.

4. **No advanced needs** — This extension has no CSS, no asset pipeline, no dynamic imports. esbuild handles all required scenarios.

## Build Config Summary

- Entry: `src/extension.ts`
- Output: `dist/extension.js` (CJS, Node platform)
- External: `vscode` only
- Production: minified, no sourcemaps
- Development: sourcemaps, watch mode via `ctx.watch()`

## Consequences

- `esbuild.js` uses `require()` (CommonJS) — keep it as `.js`, not `.mjs`.
- TypeScript type-checking is a separate step (`tsc --noEmit`) because esbuild strips types without checking them. Always run `pnpm run check-types` before committing.
