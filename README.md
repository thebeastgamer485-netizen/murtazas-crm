# Murtaza's CRM

A personal CRM for cold outreach, built with **Vite + React + TypeScript**, **Tailwind CSS**,
and **Supabase** (Postgres + Auth). Tracks prospects through a pipeline, logs outreach,
schedules follow-ups, and reports cold-outreach metrics.

## Features

- **Pipeline board** — Kanban of prospects by stage with drag-and-drop, search, and filters
- **Prospect detail** — editable fields plus outreach timeline, follow-ups, and deals
- **Home dashboard** — follow-ups due, pipeline counts, and hot leads
- **Stats** — outreach metrics and a per-stage bar chart (recharts)
- **CSV import** — column mapping, preview, and batch insert
- **Outreach templates** — reusable subject/body with `{{business_name}}`, `{{contact_name}}`, `{{industry}}` placeholders (stored in `localStorage`)
- **Auth** — email + password login (Supabase Auth) gating the entire app

## Prerequisites

- Node.js 18+
- A Supabase project with the `prospects`, `outreach`, `follow_ups`, and `deals` tables

## Environment variables

Copy `.env.example` to `.env` and fill in both values (Supabase dashboard → **Project Settings → API**):

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ✅ | Your project URL, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | The project's anon / public API key |

```bash
cp .env.example .env
# then edit .env
```

The app throws on startup if either variable is missing. `.env` is gitignored; **never commit it**.
These values are bundled into the client at build time, so for hosted deploys set them in your
host's environment-variable settings (e.g. Vercel / Netlify project settings).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on http://localhost:5173 |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the built `dist/` locally to verify the production build |
| `npm run lint` | Run ESLint |

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Production build

```bash
npm run build      # outputs static assets to dist/
npm run preview    # optional: preview the production build locally
```

Deploy the contents of `dist/` to any static host. The app is a single-page app, so configure
your host to rewrite all routes to `/index.html` (Vercel/Netlify do this automatically for Vite).

## Authentication

The whole app is gated behind Supabase Auth (email + password):

- Unauthenticated visitors only ever see the login screen; no page mounts or fetches data
  without a valid session.
- The session is persisted by `supabase-js` and restored on refresh.
- Use the **Sign out** button in the header to end the session.

**First-time setup:** create your account via the "Sign up" link on the login screen, or add a
user in the Supabase dashboard (**Authentication → Users**). For a private CRM, disable public
sign-ups afterward in **Authentication → Providers → Email** (turn off "Allow new users to sign up").

### Database access (RLS)

Row-Level Security is enabled on all four tables with policies granting the `anon` and
`authenticated` roles full access. This keeps the anon key working, but note it is **permissive** —
anyone with the anon key can read/write. To lock data down per user, replace those policies with
ones scoped to `auth.uid()` once you've decided on a per-user data model.
