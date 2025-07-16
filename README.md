This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Supabase Setup

1. Create a `.env` or `.env.local` file in the project root.
2. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace `your-supabase-url` and `your-supabase-anon-key` with your Supabase project credentials.

## Railway Deployment

- Ensure you have a `start` script in your `package.json` (already set up).
- Add your environment variables in the Railway dashboard under Project > Variables.
- Railway will run `postinstall` and then `start` automatically.

## Local Development

- Use `npm run dev` to start the development server.
- Make sure your `.env.local` or `.env` file is present with the correct Supabase credentials.

## Example Supabase Table: notes

You can use the following schema to create a `notes` table in Supabase:

| Column      | Type      | Description                       |
|-------------|-----------|-----------------------------------|
| id          | uuid      | Primary key, default: uuid_generate_v4() |
| user_id     | uuid      | User who owns the note            |
| title       | text      | Note title                        |
| content     | text      | Note body/content                 |
| folder      | text      | Folder/category                   |
| tags        | text[]    | Array of tags                     |
| is_pinned   | boolean   | Whether the note is pinned        |
| is_private  | boolean   | Whether the note is private       |
| created_at  | timestamp | Creation time, default: now()     |
| updated_at  | timestamp | Last update time, default: now()  |

**SQL Example:**
```sql
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  folder text,
  tags text[],
  is_pinned boolean default false,
  is_private boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

Be sure to adjust the schema to match your app's needs and set up Row Level Security (RLS) as appropriate.

---

## 📝 Plan to Use Supabase for Calendar Events

1. **Create a `calendar_events` table** in Supabase with columns:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `user_id` (uuid, references auth.users)
   - `title` (text)
   - `date` (date)
   - `time` (text, e.g., '15:00')
   - `location` (text, optional)
   - `reminders` (text[], optional)
   - `calendar` (text, optional)
   - `meeting_link` (text, optional)
   - `created_at` (timestamp, default: now())
   - `updated_at` (timestamp, default: now())

2. **Add RLS policies** so users can only access their own events.

3. **Update `CalendarPane.tsx`:**
   - Fetch events from Supabase for the logged-in user and selected week.
   - Insert new events into Supabase.
   - Update and delete events in Supabase.
   - Use local state for UI responsiveness, but always sync with Supabase.

---

## 1. SQL for Supabase Table

```sql
<code_block_to_apply_changes_from>
```

---

## 2. Would you like me to:
- Proceed with the code changes in `CalendarPane.tsx` to use Supabase for all event CRUD?
- Or do you want to set up the table and policies in Supabase first?

**Let me know when your table is ready, or if you want to proceed with the code now!**
