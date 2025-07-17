import type { NextApiRequest, NextApiResponse } from 'next;
import { createClient } from '@supabase/supabase-js;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Exchange refresh token for new access token
    const params = new URLSearchParams();
    params.append('client_id', process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!);
    params.append('scope', 'Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read');
    params.append('refresh_token', refresh_token);
    params.append('grant_type', 'refresh_token');
    params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);

    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to refresh token', details: tokenData });
    }

    // Get user from Supabase session
    const { data: { user } } = await supabase.auth.getUser(req.cookies['sb-access-token'] || '');
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update tokens in Supabase
    await supabase.from('outlook_tokens').upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refresh_token, // Use new refresh token if provided
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    });

    res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
} 