import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!);
  params.append('scope', 'Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read');
  params.append('code', code as string);
  params.append('redirect_uri', process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI!);
  params.append('grant_type', 'authorization_code');
  params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);

  // Exchange code for tokens
  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return res.status(400).json({ error: 'Failed to get access token', details: tokenData });
  }

  // Get user from Supabase session cookie
  const { data: { user } } = await supabase.auth.getUser(req.cookies['sb-access-token'] || '');
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Store tokens in Supabase
  await supabase.from('outlook_tokens').upsert({
    user_id: user.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  });

  // Redirect to the Outlook Calendar page
  res.redirect('/app/outlook-calendar');
} 