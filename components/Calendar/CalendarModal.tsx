'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EventClickArg, DateSelectArg, EventChangeArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';
import EventInputModal from './EventInputModal';
import EventActionModal from './EventActionModal';

// Dynamic import only for the main FullCalendar component
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => <div className="calendar-loading">Loading calendar...</div>
});

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  reminder_minutes?: number;
  reminder_set?: boolean;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, isDark }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventInput, setShowEventInput] = useState(false);
  const [showEventAction, setShowEventAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      // Transform database format to FullCalendar format
      const transformedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_date,
        end: event.end_date,
        allDay: event.all_day,
        color: event.color,
        reminder_minutes: event.reminder_minutes,
        reminder_set: event.reminder_set
      })) || [];

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Clean up past events
  const cleanupPastEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .lt('start_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error cleaning up past events:', error);
      }
    } catch (error) {
      console.error('Error cleaning up past events:', error);
    }
  }, [user]);

  // Initialize calendar only once when user is available
  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      cleanupPastEvents().then(() => fetchEvents());
    }
  }, [user, hasInitialized, fetchEvents, cleanupPastEvents]);

  // Refresh events when modal opens (but don't re-initialize)
  useEffect(() => {
    if (isOpen && user && hasInitialized) {
      fetchEvents();
    }
  }, [isOpen, user, hasInitialized, fetchEvents]);

  // Request notification permission when calendar opens
  useEffect(() => {
    if (isOpen && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isOpen]);

  // Save event to database
  const saveEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: user.id,
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start,
          end_date: eventData.end,
          all_day: eventData.allDay,
          color: eventData.color
        }])
        .select();

      if (error) {
        console.error('Error saving event:', error);
        return;
      }

      if (data && data[0]) {
        const newEvent = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          start: data[0].start_date,
          end: data[0].end_date,
          allDay: data[0].all_day,
          color: data[0].color
        };
        setEvents(prev => [...prev, newEvent]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }, [user]);

  // Delete event from database
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting event:', error);
        return;
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }, [user]);

  // Update event in database
  const updateEvent = useCallback(async (eventId: string, eventData: Partial<CalendarEvent>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start,
          end_date: eventData.end,
          all_day: eventData.allDay,
          color: eventData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating event:', error);
        return;
      }

      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData }
          : event
      ));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }, [user]);

  // Set reminder for event
  const setEventReminder = useCallback(async (eventId: string, reminderMinutes: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          reminder_minutes: parseInt(reminderMinutes),
          reminder_set: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error setting reminder:', error);
        return;
      }

      // Schedule the reminder notification
      scheduleReminderNotification(eventId, parseInt(reminderMinutes));
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  }, [user]);

  // Schedule reminder notification
  const scheduleReminderNotification = useCallback((eventId: string, reminderMinutes: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const eventStart = new Date(event.start);
    const reminderTime = new Date(eventStart.getTime() - (reminderMinutes * 60 * 1000));
    const now = new Date();

    if (reminderTime > now) {
      const timeoutId = setTimeout(() => {
        showNotification(event.title, event.description || 'No description');
      }, reminderTime.getTime() - now.getTime());

      // Store the timeout ID for potential cancellation
      localStorage.setItem(`reminder_${eventId}`, timeoutId.toString());
    }
  }, [events]);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        }
      });
    }
  }, []);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleDateClick = useCallback((arg: DateSelectArg) => {
    setSelectedDate(arg.startStr.split('T')[0]);
    setShowEventInput(true);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = {
      id: arg.event.id,
      title: arg.event.title,
      description: arg.event.extendedProps.description,
      start: arg.event.startStr,
      end: arg.event.endStr,
      allDay: arg.event.allDay,
      color: arg.event.backgroundColor
    };
    setSelectedEvent(event);
    setShowEventAction(true);
  }, []);

  const handleEventChange = useCallback((arg: EventChangeArg) => {
    updateEvent(arg.event.id, {
      start: arg.event.startStr,
      end: arg.event.endStr
    });
  }, [updateEvent]);

  const handleSaveEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    saveEvent(eventData);
  }, [saveEvent]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventInput(true);
    setShowEventAction(false);
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    deleteEvent(eventId);
    setShowEventAction(false);
  }, [deleteEvent]);

  const handleSetReminder = useCallback((eventId: string, reminderTime: string) => {
    setEventReminder(eventId, reminderTime);
    setShowEventAction(false);
  }, [setEventReminder]);

  // Memoize calendar options to prevent unnecessary re-renders
  const calendarOptions = useMemo(() => ({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth' as const,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    events,
    select: handleDateClick,
    eventClick: handleEventClick,
    eventChange: handleEventChange,
    height: 'auto' as const,
    themeSystem: isDark ? 'dark' as const : 'light' as const,
    eventColor: '#3b82f6',
    eventTextColor: '#ffffff',
    dayCellClassNames: isDark ? 'dark-theme' : 'light-theme',
    // Performance optimizations
    lazyFetching: true,
    rerenderDelay: 10,
    eventDisplay: 'block' as const,
    displayEventTime: false,
    // Reduce DOM manipulation
    eventDidMount: () => {},
    eventWillUnmount: () => {},
  }), [events, handleDateClick, handleEventClick, handleEventChange, isDark]);

  if (!isOpen) return null;

  return (
    <>
      <div className="calendar-modal-overlay" onClick={onClose}>
        <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
          <div className="calendar-modal-header">
            <h3>Calendar</h3>
            <button 
              className="calendar-modal-close"
              onClick={onClose}
              aria-label="Close calendar"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="calendar-modal-content">
            {loading && !hasInitialized ? (
              <div className="calendar-loading">Loading events...</div>
            ) : (
              <FullCalendar {...calendarOptions} />
            )}
          </div>
        </div>
      </div>

      <EventInputModal
        isOpen={showEventInput}
        onClose={() => {
          setShowEventInput(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onUpdate={updateEvent}
        selectedDate={selectedDate}
        isDark={isDark}
        editingEvent={editingEvent}
      />

      <EventActionModal
        isOpen={showEventAction}
        onClose={() => {
          setShowEventAction(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onSetReminder={handleSetReminder}
        isDark={isDark}
      />
    </>
  );
};

export default CalendarModal; 