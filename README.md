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

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Microsoft Outlook Calendar Integration
```
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook-auth/callback
```

**For Production:**
- Update `NEXT_PUBLIC_MICROSOFT_REDIRECT_URI` to your production domain
- Set up the redirect URI in your Microsoft Azure app registration

### Microsoft Azure App Registration Setup
1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App registrations
2. Create a new registration or use existing one
3. Add redirect URI: `http://localhost:3000/api/outlook-auth/callback` (for development)
4. Note down the Client ID and generate a Client Secret
5. Request the following API permissions:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `Calendars.Read.Shared`
   - `User.Read`

## Railway Deployment

- Ensure you have a `start`