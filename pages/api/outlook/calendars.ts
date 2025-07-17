import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user from Supabase session cookie
  const { data: { user } } = await supabase.auth.getUser(req.cookies['sb-access-token'] || '');
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Get access token from Supabase
  const { data: tokenRow, error } = await supabase
    .from('outlook_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error || !tokenRow) {
    return res.status(401).json({ error: 'No Outlook token found' });
  }

  // Fetch calendars from Microsoft Graph
  const graphRes = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
    headers: {
      Authorization: `Bearer ${tokenRow.access_token}`,
    },
  });
  const graphData = await graphRes.json();
  if (!graphRes.ok) {
    return res.status(400).json({ error: 'Failed to fetch calendars', details: graphData });
  }
  res.status(200).json(graphData.value);
} 