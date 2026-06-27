# Eddy 每日學習

Minimal daily learning card app built with Next.js and Supabase.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set these in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Run `supabase/learning_cards.sql` in the Supabase SQL editor.

For a private personal writer account, create your user in Supabase Auth and keep public sign-ups disabled.
