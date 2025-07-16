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

const CalendarPane: React.FC<{ expanded: boolean; onToggle: () => void }> = ({ expanded, onToggle }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<Partial<CalendarEvent>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // For week navigation
  const startOfWeek = React.useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekStartStr = formatDate(startOfWeek);
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
      const weekEnd = formatDate(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000));
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEnd)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [user, weekStartStr]);

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
    <div
      className={`calendar-pane flex flex-col h-full border-l transition-all duration-300 ${expanded ? 'sm:w-[clamp(280px,32vw,500px)] w-full' : 'w-0 min-w-0'} overflow-hidden`}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
        boxShadow: expanded ? '0 0 24px 0 rgba(0,0,0,0.12)' : 'none',
      }}
    >
      {/* Header: Month and Week Navigation + Collapse Button */}
      <div className="flex items-center justify-between px-6 py-4 rounded-t-xl shadow-md bg-gray-900 border-b border-gray-800">
        {/* Left: Calendar Icon and Month/Year */}
        <div className="flex items-center gap-2">
          {/* Calendar Icon (Heroicons) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v13.5c0 .414.336.75.75.75z" />
          </svg>
          <span className="text-xl font-bold text-white select-none">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        {/* Center: Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 7)))}
            aria-label="Previous week"
            className="p-2 rounded-full hover:bg-gray-800 text-gray-300 hover:text-blue-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow"
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 7)))}
            aria-label="Next week"
            className="p-2 rounded-full hover:bg-gray-800 text-gray-300 hover:text-blue-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        {/* Right: Collapse Button */}
        <button
          onClick={onToggle}
          className="ml-2 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-blue-400 transition"
          aria-label={expanded ? 'Collapse calendar' : 'Expand calendar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transform transition-transform ${expanded ? '' : 'rotate-180'}`}> 
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
      </div>
        {/* Day Selection Bar */}
        <div className="flex justify-between px-6 py-2 border-b border-gray-800 bg-gray-900">
          {weekDates.map((date, idx) => {
            const isToday = formatDate(date) === formatDate(new Date());
            const isSelected = formatDate(date) === formatDate(selectedDate);
            return (
              <button
                key={idx}
                className={`flex flex-col items-center px-2 py-1 rounded-lg transition text-xs font-medium
                  ${isSelected ? 'bg-blue-600 text-white shadow' :
                    isToday ? 'border border-blue-500 text-blue-400' :
                    'hover:bg-gray-800 text-gray-300'}
                `}
                onClick={() => setSelectedDate(new Date(date))}
              >
                <span>{daysOfWeek[date.getDay()]}</span>
                <span className="font-bold text-base">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
        {/* Daily Agenda View */}
        <div className="flex-1 overflow-y-auto relative px-6 py-2 bg-gray-950">
          <div className="relative">
            {/* Empty state if no events for the day */}
            {dayEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="text-lg font-semibold">No events for this day</span>
                <span className="text-sm">Click a time slot or "+ Novo evento" to add one!</span>
              </div>
            )}
            {hours.map((hour, idx) => {
              // Find event for this hour
              const event = dayEvents.find(e => e.time === hour);
              // Blue line for current time
              const isNow =
                formatDate(selectedDate) === formatDate(now) &&
                now.getHours() === idx;
              return (
                <div key={hour} className="relative flex items-center group h-12 border-b border-gray-800">
                  <div className="w-16 text-xs text-gray-500">{hour}</div>
                  <div className="flex-1 h-8">
                    {event ? (
                      <div
                        className="bg-gradient-to-r from-blue-900 via-blue-800 to-gray-900 text-blue-100 rounded-lg px-3 py-2 shadow-md cursor-pointer border border-blue-800 hover:scale-[1.02] hover:shadow-lg transition-all duration-150"
                        onClick={() => openModal(hour, event)}
                      >
                        <div className="font-semibold text-base flex items-center gap-2">
                          <span>{event.title}</span>
                          {event.note_id && (() => {
                            const note = notes.find(n => n.id === event.note_id);
                            return note ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-xs text-white ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v-1.125A2.625 2.625 0 0013.875 2.25h-3.75A2.625 2.625 0 007.5 4.875V6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M4.5 21h15a.75.75 0 00.75-.75V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v13.5c0 .414.336.75.75.75z" />
                                </svg>
                                {note.title}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {event.location && <div className="text-xs text-blue-200 mt-1">{event.location}</div>}
                      </div>
                    ) : (
                      <button
                        className="w-full h-8 text-left text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-800 rounded transition"
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
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900 rounded-b-xl shadow-inner flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-base shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
            onClick={() => openModal()}
            aria-label="Add new event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
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
  );
};

export default CalendarPane; 