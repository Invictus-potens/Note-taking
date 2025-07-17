'use client';

import { useState, useEffect } fromreact';
import { useAuth } from '../../lib/authContext';
import ProtectedRoute from../../components/Auth/ProtectedRoute';
import Header from../../components/Layout/Header';
import { supabase } from '../../lib/supabaseClient';

interface Calendar[object Object]id: string;
  name: string;
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

function OutlookCalendarApp() [object Object]  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendars, setCalendars] = useState<Calendar);
  const events, setEvents] = useState<CalendarEvent]);
  consterror, setError] = useState<string>(');  // Check if user is connected to Outlook
  useEffect(() => {
    if (!user) return;
    
    const checkOutlookConnection = async () => {
      try[object Object]      const { data, error } = await supabase
          .from(outlook_tokens')
          .select(*)         .eq(user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking Outlook connection:, error);
        }

        setIsConnected(!!data);
        
        if (data)[object Object]       await fetchCalendars();
        }
      } catch (error)[object Object]     console.error('Error checking Outlook connection:, error);
        setError('Failed to check Outlook connection');
      } finally {
        setIsLoading(false);
      }
    };

    checkOutlookConnection();
  }, [user]);

  const fetchCalendars = async () =>[object Object]   try {
      setError('');
      const response = await fetch('/api/outlook/calendars');
      if (response.ok) {
        const calendarsData = await response.json();
        setCalendars(calendarsData);
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch calendars: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to fetch calendars');
    }
  };

  const handleMicrosoftLogin = () => [object Object]    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI ||;
    const scopes = encodeURIComponent('Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read');   
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0uthorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&response_mode=query`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () =>[object Object] try[object Object]    await supabase
        .from(outlook_tokens)        .delete()
        .eq('user_id', user!.id);
      
      setIsConnected(false);
      setCalendars([]);
      setEvents([]);
      setError(Disconnected from Outlook successfully.');
    } catch (error) {
      console.error('Error disconnecting Outlook:', error);
      setError('Failed to disconnect Outlook');
    }
  };

  if (isLoading) {
    return (
      <div className=flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Outlook Calendar...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      
      <div className=main-content-area">
        <div className="top-bar">
          <div className="app-title>Outlook Calendar</div>
          <div className="top-bar-actions">
            {!isConnected ? (
              <button
                onClick={handleMicrosoftLogin}
                className=px-42lue-600 text-white rounded hover:bg-blue-700 transition >
                Sign in with Microsoft
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className=px-4-2red-600 text-white rounded hover:bg-red-700 transition >
                Disconnect Outlook
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
  [object Object]error}
            <button
              onClick={() => setError(         className=ml-2text-red-50hover:text-red-70   >
              ✕
            </button>
          </div>
        )}

        {!isConnected ? (
          <div className=flex items-center justify-center min-h-[400x]">
            <div className="text-center>              <div className=text-6xl mb-4">📅</div>
              <h2 className="text-2l font-bold mb-2">Connect to Outlook Calendar</h2>
              <p className=text-gray-600 mb-4>              Sign in with your Microsoft account to access your Outlook calendars and events.
              </p>
              <button
                onClick={handleMicrosoftLogin}
                className=px-62lue-600 text-white rounded-lg hover:bg-blue-700 transition >
                Connect Microsoft Account
              </button>
            </div>
          </div>
        ) : (
          <div className="calendar-container">
            <div className="mb-4>
              <h3 className="text-lg font-semibold mb-2>Your Calendars</h3             [object Object]calendars.length > 0 ? (
                <div className="space-y-2">
                  {calendars.map((calendar) => (
                    <div key={calendar.id} className="p-3 bg-gray-100 rounded">
                      {calendar.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className=text-gray-600No calendars found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutlookCalendarPage() {
  return (
    <ProtectedRoute>
      <OutlookCalendarApp />
    </ProtectedRoute>
  );
} 