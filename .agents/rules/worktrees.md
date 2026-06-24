# Worktrees

This project uses **git worktrees** to run parallel AI agents without conflicts. Each worktree has its own isolated branch, directory, database, and dev server port.

## When this applies

- Always. Every agent session runs in a worktree.

## Worktree convention

- Worktree location: `.worktrees/<feature-branch-name>/`
- Name matches the feature branch (e.g., branch `feat/03-F00-frontend-bootstrap` → worktree `.worktrees/feat-03-F00-frontend-bootstrap`)
- **ALWAYS** create a new worktree before starting new work: `git worktree add .worktrees/<name> <branch>`

## Isolation rules

- Each worktree has its own `.env.local` overriding `DATABASE_URL` and `PORT`
- Each worktree uses a separate SQLite database file in `data/` (e.g., `data/frontend.sqlite`)
- **NEVER** modify files outside the worktree's directory
- **NEVER** commit `.env.local` or `data/` files (they're in `.gitignore`)

## First-time setup in a new worktree

```bash
cd .worktrees/<name>/qrify-backend
cp .env.example .env.local
# Edit .env.local: change DATABASE_URL and PORT
bun install
bun run migrate
bun run seed
```

## Cleanup

When done: `git worktree remove .worktrees/<name>`

## APEX -b workflow

- When `/apex -b` is called (the `-b` flag creates a new branch):
  - **ALWAYS** first create a worktree from `main`: `git worktree add .worktrees/<branch-name> main`
  - Then create the feature branch inside the worktree: `git checkout -b feat/<task-id>`
  - Work and commit inside the worktree
  - Never branch from inside another worktree — always start from `main`
