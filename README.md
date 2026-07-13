# 每日一知 / knowbit

Daily learning journal built with Next.js, Supabase, Cloudinary, and Resend.

## Features

- Public learning wall with private author controls
- Rich learning cards with Cloudinary image upload and cleanup
- Per-user database todo list with priority and estimated completion date
- Contact form email delivery through Resend

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set these in `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL="https://my-learning-daily.vercel.app"
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL="Knowbit <onboarding@resend.dev>"
my_email="abc@gmail.com"
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin so canonical URLs,
`robots.txt`, and `sitemap.xml` point to the live site.

Keep `CLOUDINARY_API_SECRET` and `RESEND_API_KEY` server-only. Never prefix
them with `NEXT_PUBLIC_`.

## Supabase

For a new database, run `supabase/learning_cards.sql` in the Supabase SQL
editor.

For an existing database, run migrations in order:

1. `supabase/version2.sql`
2. `supabase/version3.sql`

Version 2 adds database todos and the programmer-focused categories. Version 3
adds todo priority (`1` highest, `4` lowest) and estimated completion dates.

For a private personal writer account, create your user in Supabase Auth and keep public sign-ups disabled.

## Cloudinary

Create an unsigned upload preset in Cloudinary and use it as `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
Images are stored under `learning/{user}/{post}`. The server credentials are
required to remove images when an image or learning card is deleted.

## Contact email

Create a Resend API key and set `RESEND_API_KEY`. Contact form submissions are
sent to `process.env.my_email`. Set `RESEND_FROM_EMAIL` to a sender address
verified by Resend before production deployment.
