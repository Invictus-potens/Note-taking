'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import Header from '../../components/Layout/Header';
import { supabase } from '../../lib/supabaseClient';

interface OutlookToken {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

interface Calendar {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
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
  isAllDay?: boolean;
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    status: {
      response: string;
    };
  }>;
  recurrence?: any;
  reminderMinutesBeforeStart?: number;
}

interface EventFormData {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  reminderMinutesBeforeStart?: number;
}

function OutlookCalendarApp() {  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState<EventFormData>({
    subject: '',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    isAllDay: false,
    location: { displayName: '' },
    attendees: [],
    reminderMinutesBeforeStart: 15,
  });

  // Check if user is connected to Outlook
  useEffect(() => {
    if (!user) return;
    
    const checkOutlookConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('outlook_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking Outlook connection:', error);
        }

        setIsConnected(!!data);
        
        if (data) {
          // Check if token is expired
          const expiresAt = new Date(data.expires_at);
          if (expiresAt <= new Date()) {
            // Token expired, try to refresh
            await refreshToken(data.refresh_token);
          } else {
            // Token valid, fetch calendars
            await fetchCalendars();
          }
        }
      } catch (error) {
        console.error('Error checking Outlook connection:', error);
        setError('Failed to check Outlook connection');
      } finally {
        setIsLoading(false);
      }
    };

    checkOutlookConnection();
  }, [user]);

  const refreshToken = async (refreshToken: string) => {
    try {
      const response = await fetch('/api/outlook-auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const { access_token, expires_in } = await response.json();
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        
        // Update token in Supabase
        await supabase
          .from('outlook_tokens')
          .upsert({
            user_id: user!.id,
            access_token: access_token,
            expires_at: expiresAt.toISOString(),
          });

        await fetchCalendars();
      } else {
        // Refresh failed, user needs to reconnect
        setIsConnected(false);
        setError('Session expired. Please reconnect to Outlook.');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setIsConnected(false);
      setError('Failed to refresh session');
    }
  };

  const fetchCalendars = async () => {
    try {
      setError('');
      const response = await fetch('/api/outlook/calendars');
      if (response.ok) {
        const calendarsData = await response.json();
        setCalendars(calendarsData);
        if (calendarsData.length > 0) {
          setSelectedCalendar(calendarsData[0].id);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch calendars: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to fetch calendars');
    }
  };

  const fetchEvents = async () => {
    if (!selectedCalendar) return;

    try {
      setError('');
      const startDate = new Date(currentDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 999);
      const response = await fetch(`/api/outlook/events?calendarId=${selectedCalendar}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch events: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    }
  };

  useEffect(() => {
    if (selectedCalendar) {
      fetchEvents();
    }
  }, [selectedCalendar, currentDate]);

  const handleMicrosoftLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI || '');
    const scopes = encodeURIComponent('Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read');   
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&response_mode=query`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    try {
      await supabase
        .from('outlook_tokens')
        .delete()
        .eq('user_id', user!.id);
      
      setIsConnected(false);
      setCalendars([]);
      setEvents([]);
      setSelectedCalendar('');
      setError('Disconnected from Outlook successfully.');
    } catch (error) {
      console.error('Error disconnecting Outlook:', error);
      setError('Failed to disconnect Outlook');
    }
  };

  const handleCreateEvent = () => {
    setEventForm({
      subject: '',
      start: {
        dateTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      isAllDay: false,
      location: { displayName: '' },
      attendees: [],
      reminderMinutesBeforeStart: 15,
    });
    setIsEditing(false);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventForm({
      subject: event.subject,
      start: event.start,
      end: event.end,
      isAllDay: event.isAllDay || false,
      location: event.location || { displayName: '' },
      attendees: event.attendees?.map(a => ({ emailAddress: a.emailAddress })) || [],
      reminderMinutesBeforeStart: event.reminderMinutesBeforeStart,
    });
    setIsEditing(true);
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete || !selectedCalendar) return;

    try {
      setIsSubmitting(true);
      setError('');
      const response = await fetch('/api/outlook/events/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarId: selectedCalendar,
          eventId: eventToDelete.id,
        }),
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        setShowDeleteConfirm(false);
        setEventToDelete(null);
      } else {
        const errorData = await response.json();
        setError(`Failed to delete event: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!selectedCalendar || !eventForm.subject.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const eventData = {
        ...eventForm,
        subject: eventForm.subject.trim(),
        location: eventForm.location?.displayName ? { displayName: eventForm.location.displayName } : undefined,
        attendees: eventForm.attendees?.filter(a => a.emailAddress.address) || undefined,
      };

      const url = isEditing ? '/api/outlook/events/update' : '/api/outlook/events/create';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { calendarId: selectedCalendar, eventId: selectedEvent!.id, event: eventData }
        : { calendarId: selectedCalendar, event: eventData };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newEvent = await response.json();
        if (isEditing) {
          setEvents(prev => prev.map(e => e.id === selectedEvent!.id ? newEvent : e));
        } else {
          setEvents(prev => [newEvent, ...prev]);
        }
        setShowEventModal(false);
        setSelectedEvent(null);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(`Failed to ${isEditing ? 'update' : 'create'} event: ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, error);
      setError(`Failed to ${isEditing ? 'update' : 'create'} event`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Outlook Calendar...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      
      <div className="main-content-area">
        <div className="top-bar">
          <div className="app-title">Outlook Calendar</div>
          <div className="top-bar-actions">
            {!isConnected ? (
              <button
                onClick={handleMicrosoftLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Sign in with Microsoft
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateEvent}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  + New Event
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Disconnect Outlook
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-50 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-2xl font-bold mb-2">Connect to Outlook Calendar</h2>
              <p className="text-gray-600 mb-4">              Sign in with your Microsoft account to access your Outlook calendars and events.
              </p>
              <button
                onClick={handleMicrosoftLogin}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Connect Microsoft Account
              </button>
            </div>
          </div>
        ) : (
          <div className="calendar-container">      {/* Calendar Controls */}
            <div className="calendar-controls mb-4">              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Today
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (viewMode === 'month') {
                          newDate.setMonth(newDate.getMonth() - 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() - 7);
                        } else {
                          newDate.setDate(newDate.getDate() - 1);
                        }
                        setCurrentDate(newDate);
                      }}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      ←
                    </button>
                    <span className="font-semibold">
                      {viewMode === 'month' && currentDate.toLocaleDateString([], { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      {viewMode === 'week' && `${formatDate(getWeekDates()[0])} - ${formatDate(getWeekDates()[6])}`}
                      {viewMode === 'day' && currentDate.toLocaleDateString([], { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (viewMode === 'month') {
                          newDate.setMonth(newDate.getMonth() + 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() + 7);
                        } else {
                          newDate.setDate(newDate.getDate() + 1);
                        }
                        setCurrentDate(newDate);
                      }}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      →
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 rounded transition ${
                      viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 rounded transition ${
                      viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1 rounded transition ${
                      viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Selector */}
            <div className="calendar-selector mb-4">           <select
                value={selectedCalendar}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar View */}
            <div className="calendar-view">             {viewMode === 'month' && (
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {[Sun,Mon,Tue,Wed,Thu,Fri, 'Sat'].map((day) => (                   <div key={day} className="p-2 text-center font-semibold bg-gray-100">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const date = new Date(currentDate);
                    date.setDate(1);
                    date.setDate(date.getDate() + i - date.getDay());
                    
                    const dayEvents = getDayEvents(date);

                    return (
                      <div
                        key={i}
                        className={`min-h-[100px] p-2 border border-gray-200 ${
                          date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0,3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 bg-blue-100ded cursor-pointer hover:bg-blue-200"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              {event.subject}
                            </div>
                          ))}
                         {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {viewMode === 'week' && (
                <div className="grid grid-cols-8 gap-1">
                  {/* Time column header */}
                  <div className="p-2 text-semibold bg-gray-100"></div>
                  
                  {/* Day headers */}
                  {getWeekDates().map((date) => (
                    <div key={date.toISOString()} className="p-2 text-center font-semibold bg-gray-100">
                      <div>{date.toLocaleDateString([], { weekday: 'short' })}</div>
                      <div className="text-sm">{date.getDate()}</div>
                    </div>
                  ))}
                  
                  {/* Time slots */}
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={hour} className="contents">
                      <div className="p-1 text-xs text-gray-500 border-r border-gray-200">
                        {hour === 0?12 AM' : hour <12${hour} AM` : hour === 1212PM' : `${hour - 12} PM`}
                      </div>
                      {getWeekDates().map((date) => {
                        const dayEvents = getDayEvents(date).filter(event => {
                          const eventHour = new Date(event.start.dateTime).getHours();
                          return eventHour === hour;
                        });

                        return (
                          <div key={date.toISOString()} className="p-1 border-r border-b border-gray-200">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="text-xs p-1 bg-blue-100ded cursor-pointer hover:bg-blue-200 mb-1"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventModal(true);
                                }}
                              >
                                {event.subject}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'day' && (
                <div className="space-y-2">
                  <div className="text-lg font-semibold mb-4">
                    {currentDate.toLocaleDateString([], { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const dayEvents = getDayEvents(currentDate).filter(event => {
                      const eventHour = new Date(event.start.dateTime).getHours();
                      return eventHour === hour;
                    });

                    return (
                      <div key={hour} className="flex border-b border-gray-200">
                        <div className="w-20 text-sm text-gray-500">
                          {hour === 0?12 AM' : hour <12${hour} AM` : hour === 1212PM' : `${hour - 12} PM`}
                        </div>
                        <div className="flex-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-2 bg-blue-100ded cursor-pointer hover:bg-blue-200 mb-2"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="font-medium">{event.subject}</div>
                              <div className="text-sm text-gray-600">
                                {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditing ? 'Edit Event' : 'Create New Event'}                </h3
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500over:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={eventForm.subject}
                    onChange={(e) => setEventForm({ ...eventForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.isAllDay}
                      onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700ll day event</span>
                  </label>
                </div>

                {!eventForm.isAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.start.dateTime.slice(0, 16)}
                        onChange={(e) => setEventForm({
                          ...eventForm,
                          start: { ...eventForm.start, dateTime: new Date(e.target.value).toISOString() }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.end.dateTime.slice(0, 16)}
                        onChange={(e) => setEventForm({
                          ...eventForm,
                          end: { ...eventForm.end, dateTime: new Date(e.target.value).toISOString() }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location?.displayName || ''}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      location: { displayName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder
                  </label>
                  <select
                    value={eventForm.reminderMinutesBeforeStart}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      reminderMinutesBeforeStart: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2ocus:ring-blue-500"
                  >
                    <option value={0}>None</option>
                    <option value={5}>5tes before</option>
                    <option value={15}>15tes before</option>
                    <option value={30}>30tes before</option>
                    <option value={60our before</option>
                    <option value={1440day before</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Detail Modal */}
        {showEventModal && selectedEvent && !isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.subject}</h3
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500over:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">Time</div>
                  <div>
                    {selectedEvent.isAllDay ? 'All day' : (
                      `${formatTime(selectedEvent.start.dateTime)} - ${formatTime(selectedEvent.end.dateTime)}`
                    )}
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Location</div>
                    <div>{selectedEvent.location.displayName}</div>
                  </div>
                )}
                
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Attendees</div>
                    <div className="space-y-1">
                      {selectedEvent.attendees.map((attendee, index) => (
                        <div key={index} className="text-sm">
                          {attendee.emailAddress.name} ({attendee.status.response})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">              <div className="mb-4">
                <h3 className="text-lg font-semibold text-red-600">Delete Event</h3
                <p className="text-gray-600 mt-2">
                  Are you sure you want to delete{eventToDelete?.subject}"? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEvent}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
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