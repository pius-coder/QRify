# QRify

Attendance tracking app with multi-tenant QR code scanning.

## Tech Stack

- Backend: Hono + TypeScript on Bun, SQLite, repository pattern
- Frontend: SvelteKit + TypeScript
- Database: SQLite via bun:sqlite, no ORM, repository pattern with contracts

## Commands

- `cd qrify-backend && bun run dev` — Dev server
- `cd qrify-backend && bun test` — Run tests
- `cd qrify-backend && bun run typecheck` — TypeScript check
- `cd qrify-backend && bun run migrate` — Run migrations
- `cd qrify-backend && bun run seed` — Seed demo data

## Rules

- **Worktrees** — [.agents/rules/worktrees.md](.agents/rules/worktrees.md) — Worktree usage for parallel AI agents

## Universal Rules

- NEVER modify files outside your assigned worktree
- ALWAYS check `git worktree list` before starting to confirm which worktree you're in
- ALWAYS use parameterized SQL queries (never string interpolation for WHERE clauses)
- ALL status/role values must be UPPERCASE (e.g., `'ACTIVE'`, `'EMPLOYEE'`, `'SUPER_ADMIN'`)
