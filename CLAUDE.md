# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # install deps + prisma generate + migrate

# Development
npm run dev            # Next.js dev server with Turbopack at localhost:3000

# Testing
npm test               # run all tests with Vitest
npx vitest run src/path/to/file.test.ts   # run a single test file

# Database
npm run db:reset       # drop and re-run all migrations (destroys data)

# Linting
npm run lint
```

Do NOT run `npm audit fix` — dependencies are intentionally pinned.

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without a real key the app uses a `MockLanguageModel` that returns canned components. The mock is triggered when the key is absent or still set to `your-api-key-here`.

## Architecture

### Core data flow

1. User sends a chat message in `ChatInterface`
2. `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` via Vercel AI SDK's `useChat`, serializing the in-memory `VirtualFileSystem` in the request body
3. The API route (`src/app/api/chat/route.ts`) reconstructs the VFS, calls Claude (`claude-haiku-4-5`) with two tools, and streams back a response
4. As tool calls stream in, `FileSystemContext.handleToolCall` applies them to the in-memory VFS
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders the VFS contents whenever files change

### Virtual file system

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree — no files are ever written to disk. It serializes to/from a plain `Record<string, FileNode>` for transport (request body) and persistence (Prisma `Project.data` column, stored as JSON string).

### AI tools

Two tools are registered on the server and handled client-side:

- **`str_replace_editor`** — create/str_replace/insert operations on VFS files (`src/lib/tools/str-replace.ts`)
- **`file_manager`** — rename/delete operations (`src/lib/tools/file-manager.ts`)

Client-side handling lives in `FileSystemContext.handleToolCall`.

### Preview rendering

`src/lib/transform/jsx-transformer.ts` runs entirely in the browser:
- Compiles JSX/TSX with `@babel/standalone`
- Creates blob URLs for each compiled file
- Builds an ES module import map (resolves `@/` aliases, creates placeholder modules for missing imports, proxies third-party packages through `esm.sh`)
- Generates a full HTML document injected into an `<iframe>` in `PreviewFrame`

Tailwind CSS is loaded from CDN in the preview iframe; it is not the host app's Tailwind build.

### Authentication

JWT sessions stored in an `httpOnly` cookie (`auth-token`, 7-day expiry). `src/lib/auth.ts` is `server-only`. The middleware (`src/middleware.ts`) protects routes. Anonymous users can generate components without signing up; any in-progress work is tracked in `src/lib/anon-work-tracker.ts` and can be saved after sign-up.

### Persistence

Prisma + SQLite (`prisma/dev.db`). The `Project` model stores `messages` (JSON array of AI SDK `Message` objects) and `data` (serialized `VirtualFileSystem`) as plain string columns. Only authenticated users have projects saved; anonymous sessions are ephemeral.

### Routing

- `/` — anonymous landing or redirect to most-recent project for authenticated users
- `/[projectId]` — project workspace; requires authentication

### Provider abstraction

`src/lib/provider.ts` exports `getLanguageModel()`, which returns either `anthropic("claude-haiku-4-5")` or `MockLanguageModel`. All AI calls go through this function.

### Testing

Vitest with jsdom. Tests live alongside source in `__tests__` subdirectories. Coverage includes contexts, components, the VFS, and the JSX transformer.

## Git Workflow

Always create a feature branch from `main` before making changes. Never commit directly to `main`.

```bash
git checkout -b feat/your-feature-name   # branch from main
# make changes, then:
git push -u origin feat/your-feature-name
# open a PR to merge back into main
```

## Claude Code Hooks

Two hooks are active in `.claude/settings.json` (committed, applies to all collaborators):

- **`protect-env.sh`** (PreToolUse on `Read|Bash`) — blocks any read or shell command targeting `.env*`, `*.pem`, `*.key`, `*.p12` files.
- **`log-modifications.sh`** (PostToolUse on `Edit|Write|NotebookEdit`) — appends a log entry to `.claude/logs/modifications.log` for every file Claude modifies, including filename, line number, and a diff-style preview.

`.claude/settings.local.json` is for personal overrides (e.g. MCP permissions) and should not be committed.

## Secrets

Never read or echo `.env` files. Rotate credentials immediately if they appear in a conversation — the hook blocks Claude's own tools, but terminal output is still visible.
