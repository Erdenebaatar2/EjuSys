# EJU Registration System

Mongolian-language registration platform for the Japanese university entrance exam (EJU). Built with TanStack Start (React SSR), Supabase, and shadcn/ui.

## Tech Stack
- **Framework**: TanStack Start + TanStack Router (SSR React 19)
- **Build**: Vite 7, configured via `@lovable.dev/vite-tanstack-config`
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style, slate base)
- **Backend**: Supabase (auth + database)
- **Forms**: react-hook-form + zod
- **Data**: @tanstack/react-query

## Project Structure
- `src/routes/` — file-based routes (admin & student dashboards, auth flows)
- `src/components/` — UI components (incl. shadcn `ui/`)
- `src/integrations/supabase/` — Supabase client + generated types
- `src/contexts/`, `src/hooks/`, `src/lib/` — app utilities
- `supabase/` — Supabase project config & migrations
- `server.mjs` — Node HTTP wrapper around the SSR fetch handler (production)

## Replit Setup
- **Dev workflow**: `npm run dev` on port `5000`, host `0.0.0.0`, `allowedHosts: true` so the proxied iframe preview works.
- **vite.config.ts**: passes `cloudflare: false` to disable the Cloudflare Workers build target (the project originally targets Workers via `wrangler.jsonc`); Vite produces `dist/client/` (static assets) and `dist/server/server.js` (web fetch handler).
- **Production server**: `server.mjs` serves `dist/client/` statically and forwards everything else to the SSR fetch handler. Listens on `process.env.PORT || 5000` at `0.0.0.0`.
- **Deployment**: `autoscale`, build `npm run build`, run `node server.mjs`.

## Environment Variables
The `.env` file ships with a public Supabase project URL and anon key (both `VITE_*` prefixed and unprefixed for SSR).
