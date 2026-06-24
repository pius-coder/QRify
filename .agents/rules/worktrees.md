# Worktrees

This project uses **git worktrees** to run parallel AI agents without conflicts. Each worktree has its own isolated branch, directory, database, and dev server port.

Based on: https://www.mindstudio.ai/blog/parallel-ai-coding-agents-git-worktrees

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

## Port allocation

Each worktree gets a unique port. Increment from main:

| Worktree | Backend port | Frontend port |
|----------|-------------|---------------|
| main | 3000 | 5173 |
| .worktrees/feat-* | 3001 | 5174 |
| .worktrees/feat-* (next) | 3002 | 5175 |

Assign the next available port when creating a new worktree.

## First-time setup in a new worktree

```bash
cd .worktrees/<name>/qrify-backend
cp .env.example .env.local
# Edit .env.local:
#   PORT=<next available>
#   DATABASE_URL=./data/<name>.sqlite
#   CORS_ORIGIN=http://localhost:<frontend-port>
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
  - Set up `.env.local` with next available port + isolated database
  - Work and commit inside the worktree
  - Never branch from inside another worktree — always start from `main`
