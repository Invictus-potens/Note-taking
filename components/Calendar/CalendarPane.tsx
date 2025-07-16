import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  time: string; // 'HH:mm'
  location?: string;
  reminders?: string[];
  calendar?: string;
  meeting_link?: string;
  date: string; // 'YYYY-MM-DD'
  created_at?: string;
  updated_at?: string;
  note_id?: string;
}

interface Note {
  id: string;
  title: string;
}

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

const CalendarPane: React.FC = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<Partial<CalendarEvent>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // For week navigation
  const startOfWeek = getStartOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Fetch events for the current week
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchEvents = async () => {
      const weekStart = formatDate(startOfWeek);
      const weekEnd = formatDate(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000));
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [user, startOfWeek]);

  // Fetch notes for linking
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error && data) setNotes(data);
    };
    fetchNotes();
  }, [user]);

  // For current time blue line
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Modal handlers
  const openModal = (hour?: string, event?: CalendarEvent) => {
    if (event) {
      setModalData({ ...event });
      setEditingId(event.id);
    } else {
      setModalData({
        date: formatDate(selectedDate),
        time: hour || '',
        title: '',
        location: '',
        reminders: [],
        calendar: '',
        meeting_link: '',
        note_id: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };
  const saveEvent = async () => {
    if (!modalData.title || !modalData.time || !user) return;
    if (editingId) {
      // Update existing event
      const updatedEvent = {
        ...modalData,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updatedEvent)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select();
      if (!error && data && data[0]) {
        setEvents(prev => prev.map(ev => ev.id === editingId ? data[0] : ev));
        setShowModal(false);
        setEditingId(null);
      }
    } else {
      // Create new event
      const newEvent = {
        user_id: user.id,
        title: modalData.title,
        time: modalData.time,
        date: modalData.date,
        location: modalData.location,
        reminders: modalData.reminders,
        calendar: modalData.calendar,
        meeting_link: modalData.meeting_link,
        note_id: modalData.note_id || null,
      };
      const { data, error } = await supabase.from('calendar_events').insert([newEvent]).select();
      if (!error && data && data[0]) {
        setEvents(prev => [...prev, data[0]]);
        setShowModal(false);
      }
    }
  };
  const deleteEvent = async () => {
    if (!editingId || !user) return;
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', editingId)
      .eq('user_id', user.id);
    if (!error) {
      setEvents(prev => prev.filter(ev => ev.id !== editingId));
      setShowModal(false);
      setEditingId(null);
    }
  };

  // Filter events for selected day
  const dayEvents = events.filter(e => e.date === formatDate(selectedDate));

  // UI
  return (
    <>
      {/* Expand/Collapse Button */}
      <button
        className="fixed top-1/2 right-0 z-40 bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition"
        style={{ transform: 'translateY(-50%)' }}
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Hide calendar' : 'Show calendar'}
      >
        📅
      </button>
      {/* Calendar Pane */}
      <div
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-900 shadow-2xl z-30 transition-transform duration-300 flex flex-col ${expanded ? 'translate-x-0' : 'translate-x-full'} w-[400px]`}
      >
        {/* Header: Month and Week Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 7)))} aria-label="Previous week" className="text-xl">←</button>
          <div className="text-lg font-semibold">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 7)))} aria-label="Next week" className="text-xl">→</button>
        </div>
        {/* Day Selection Bar */}
        <div className="flex justify-between px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          {weekDates.map((date, idx) => (
            <button
              key={idx}
              className={`flex flex-col items-center px-2 py-1 rounded transition text-xs ${formatDate(date) === formatDate(selectedDate) ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              onClick={() => setSelectedDate(new Date(date))}
            >
              <span>{daysOfWeek[date.getDay()]}</span>
              <span className="font-bold text-base">{date.getDate()}</span>
            </button>
          ))}
        </div>
        {/* Daily Agenda View */}
        <div className="flex-1 overflow-y-auto relative px-6 py-2">
          <div className="relative">
            {hours.map((hour, idx) => {
              // Find event for this hour
              const event = dayEvents.find(e => e.time === hour);
              // Blue line for current time
              const isNow =
                formatDate(selectedDate) === formatDate(now) &&
                now.getHours() === idx;
              return (
                <div key={hour} className="relative flex items-center group h-12 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-16 text-xs text-gray-400">{hour}</div>
                  <div className="flex-1 h-8">
                    {event ? (
                      <div
                        className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-2 py-1 cursor-pointer"
                        onClick={() => openModal(hour, event)}
                      >
                        <div className="font-semibold">{event.title}</div>
                        {event.location && <div className="text-xs">{event.location}</div>}
                        {event.note_id && (
                          <div className="text-xs mt-1">
                            <span className="text-gray-500">Linked Note: </span>
                            {(() => {
                              const note = notes.find(n => n.id === event.note_id);
                              return note ? (
                                <a
                                  href={`#note-${note.id}`}
                                  className="text-blue-600 underline hover:text-blue-800"
                                  title={note.title}
                                >
                                  {note.title}
                                </a>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        className="w-full h-8 text-left text-xs text-gray-400 hover:text-blue-600"
                        onClick={() => openModal(hour)}
                      >
                        +
                      </button>
                    )}
                  </div>
                  {isNow && (
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-500" style={{ top: '50%' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* + Novo evento Button */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <button
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
            onClick={() => openModal()}
          >
            + Novo evento
          </button>
        </div>
        {/* Event Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Event' : 'New Event'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Title"
                  value={modalData.title || ''}
                  onChange={e => setModalData({ ...modalData, title: e.target.value })}
                />
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Time (HH:mm)"
                  value={modalData.time || ''}
                  onChange={e => setModalData({ ...modalData, time: e.target.value })}
                />
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Location"
                  value={modalData.location || ''}
                  onChange={e => setModalData({ ...modalData, location: e.target.value })}
                />
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Meeting Link (Teams, Zoom, etc.)"
                  value={modalData.meeting_link || ''}
                  onChange={e => setModalData({ ...modalData, meeting_link: e.target.value })}
                />
                {/* Note linking dropdown */}
                <label htmlFor="note-link-select" className="block text-xs text-gray-500">Link to Note</label>
                <select
                  id="note-link-select"
                  aria-label="Link to Note"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={modalData.note_id || ''}
                  onChange={e => setModalData({ ...modalData, note_id: e.target.value })}
                >
                  <option value="">No linked note</option>
                  {notes.map(note => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {editingId && (
                  <button onClick={deleteEvent} className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600">Delete</button>
                )}
                <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Cancel</button>
                <button onClick={saveEvent} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPane; 