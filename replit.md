# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **ai-chat** (`/`): "AayanSamee AI" — Gemini-style chat web app. Clerk Google sign-in, four modes (Coding, Math, General, All-in-One), persistent chat history, SSE streaming responses, markdown + code + KaTeX math rendering, dark mode default, "AayanSamee" watermark bottom-right. File uploads (images, video, audio, PDF, text up to 25 MB) sent as inlineData parts to Gemini, rendered inline in the chat.
- **api-server**: Express backend with Clerk session auth, Drizzle/PostgreSQL persistence, Gemini 2.5 Flash streaming via `@google/genai`. Routes under `/api/gemini/conversations`. Mode-specific system prompts. Object storage routes under `/api/storage/*` for presigned uploads + serving private objects from GCS via Replit's object storage.
- **mockup-sandbox**: design preview server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
