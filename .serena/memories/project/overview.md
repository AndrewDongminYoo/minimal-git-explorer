# minimal-git-explorer — Project Overview

A lightweight VS Code extension (TypeScript) that adds a Git explorer to the Source Control sidebar.

**Target version:** 0.1.0  
**Current state:** Scaffold only. The planned architecture (`src/git/`, `src/views/`, `src/commands/`, `src/utils/`) has not been implemented. Only `src/extension.ts` exists with a `helloWorld` stub.

## Core values

- Local-first: all data from local `git` CLI, no accounts, no cloud, no telemetry
- Read-first: prioritize safe inspection over mutation
- Small surface: every feature maps to a common git command

## What it shows (0.1.0 scope)

6 collapsible sections in Source Control sidebar:
Commits | Branches (Local/Remote) | Remotes | Stashes | Tags | Worktrees

## What it explicitly does NOT do

- No inline blame, no commit graph, no PR integration, no AI, no WebView, no multi-repo dashboard, no background indexing, no settings (0.1.0)

## Key references

- `CLAUDE.md` — agent entry point, documentation map
- `PLAN.md` — authoritative product spec
- `docs/specs/` — implementation-ready specifications
- `docs/notes/` — ADRs (why decisions were made)
- `docs/plans/` — phase-by-phase implementation plans
