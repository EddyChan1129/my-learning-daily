# Day One / One Day

Daily learning journal built with Next.js and Supabase.

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
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

## Supabase

Run `supabase/learning_cards.sql` in the Supabase SQL editor.

For a private personal writer account, create your user in Supabase Auth and keep public sign-ups disabled.

## Cloudinary

Create an unsigned upload preset in Cloudinary and use it as `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
Images are uploaded with `folder=eddy-learning`.
