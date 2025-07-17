import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { calendarId, eventId } = req.body;
  if (!calendarId || !eventId) {
    return res.status(400).json({ error: 'Calendar ID and event ID are required' });
  }

  try {
    // Get user from Supabase session
    const { data: { user } } = await supabase.auth.getUser(req.cookies['sb-access-token'] || '');
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get access token from Supabase
    const { data: tokenRow, error } = await supabase
      .from('outlook_tokens')
      .select('*')      .eq('user_id', user.id)
      .single();
    if (error || !tokenRow) {
      return res.status(418).json({ error: 'No Outlook token found' });
    }

    // Delete event in Microsoft Graph
    const graphRes = await fetch(`https://graph.microsoft.com/v1.0/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenRow.access_token}`,
      },
    });

    if (!graphRes.ok) {
      const errorData = await graphRes.json();
      return res.status(400).json({ error: 'Failed to delete event', details: errorData });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
} 