# Step 02: Plan

**Task:** F00 initialize SvelteKit frontend
**Started:** 2026-06-24T14:51:19Z

---

## Implementation Plan: F00 initialize SvelteKit frontend

### Overview
Scaffold a SvelteKit project in the worktree using the official `sv create` CLI, configure tools (ESLint, Prettier, Tailwind CSS, Playwright), and clean up backend artifacts to make the frontend branch independent.

### Prerequisites
- [x] Git worktree created at `/home/kali/projects/qrify-frontend/`
- [x] Branch `feat/03-F00-frontend-bootstrap` ready
- [x] Bun 1.3.14 available

---

### Execution Steps

#### Step 1: Scaffold SvelteKit project
- Run `sv create` in the worktree root with:
  - `--template minimal` → minimal SvelteKit scaffold
  - `--types ts` → TypeScript
  - `--add prettier eslint tailwindcss` → tooling
  - `--install bun` → Bun as package manager
  - `--no-dir-check` → allow non-empty directory

#### Step 2: Install Playwright
- Run `bun add --dev @playwright/test` for e2e tests
- Run `bunx playwright install chromium` for browser binary
- Update `package.json` scripts to add `"test:e2e": "playwright test"`

#### Step 3: Clean up backend artifacts
- Remove from worktree: `qrify-backend/`, `PROJECT.md`, `PLAN.md`
- Clean up any backend-related `.gitignore` entries
- Add root `.gitignore` for SvelteKit project (node_modules, .env, build, .svelte-kit)

#### Step 4: Create `.env.example`
- Create `APP_NAME=QRify`
- Add placeholder for `PUBLIC_API_URL=http://localhost:3000/api/v1`

#### Step 5: Create `.gitignore` at root
- Add SvelteKit standard ignores
- Add `.env` files

#### Step 6: Verify project boots
- Run `bun install` (if not already done)
- Run `bun run dev` and confirm it starts
- Confirm TypeScript compiles with `bun run check` (or svelte-check)

---

### Acceptance Criteria Mapping
- [ ] AC1: SvelteKit project scaffolded with `sv create` CLI → Step 1
- [ ] AC2: TypeScript enabled → Step 1 (`--types ts`)
- [ ] AC3: Minimal template used → Step 1 (`--template minimal`)
- [ ] AC4: Bun as package manager → Step 1 (`--install bun`)
- [ ] AC5: ESLint configured → Step 1 (`--add eslint`)
- [ ] AC6: Prettier configured → Step 1 (`--add prettier`)
- [ ] AC7: Tailwind CSS configured → Step 1 (`--add tailwindcss`)
- [ ] AC8: Playwright installed for e2e tests → Step 2
- [ ] AC9: Project starts with `bun run dev` → Step 6
- [ ] AC10: No direct dependency on backend → Step 3
- [ ] AC11: Worktree cleaned → Step 3

---

### Risks & Considerations
- `--no-dir-check` required because worktree is not empty
- Playwright browser download may take time
- SvelteKit `check` command may need `svelte-check` package installed separately
- The `sv create` interactive flow includes a prompt for Tailwind CSS plugins; use defaults ("none")

---

## Step Complete
**Status:** ✓ Complete
**Files planned:** N/A (project initialization)
**Next:** step-03-execute.md
