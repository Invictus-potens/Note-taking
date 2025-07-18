'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog } from '@headlessui/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  calendar?: string;
  meeting_link?: string;
  reminders?: string[];
  created_at?: string;
  updated_at?: string;
  note_id?: string;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', location: '' });
  const { user } = useAuth();

  const fetchEvents = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .eq('user_id', user?.id);

    if (error) console.error(error);
    else setEvents(data || []);
  };

  useEffect(() => {
    if (user) fetchEvents();
  }, [currentMonth, user]);

  const createEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.time || !user?.id) return;
    const { error } = await supabase.from('calendar_events').insert({
      title: newEvent.title,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: newEvent.time,
      location: newEvent.location,
      user_id: user.id,
    });
    if (!error) {
      setIsOpen(false);
      setNewEvent({ title: '', time: '', location: '' });
      fetchEvents();
    } else {
      console.error('Create event error:', error);
    }
  };

  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="min-h-screen bg-[#1E2230] text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendário</h1>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))} className="px-3 py-1 bg-[#2E3347] rounded">Anterior</button>
          <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="px-3 py-1 bg-[#2E3347] rounded">Próximo</button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-gray-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((dayItem, idx) => {
          const dayEvents = events.filter(e => e.date === format(dayItem, 'yyyy-MM-dd'));
          return (
            <div
              key={idx}
              onClick={() => { setSelectedDate(dayItem); setIsOpen(true); }}
              className={`p-2 rounded cursor-pointer min-h-[80px] ${isSameMonth(dayItem, currentMonth) ? 'bg-[#202434]' : 'bg-[#1A1D2D]'} ${isToday(dayItem) ? 'border border-[#4D7CFE]' : ''}`}
            >
              <div className="text-sm text-gray-300">{format(dayItem, 'd')}</div>
              <div className="space-y-1 mt-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="text-xs truncate bg-[#4D7CFE] rounded px-1">{ev.title}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <Dialog.Panel className="bg-[#202434] p-6 rounded w-96">
          <Dialog.Title className="text-lg font-semibold mb-4">Novo Evento</Dialog.Title>
          <input type="text" placeholder="Título" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full p-2 mb-2 rounded bg-[#1E2230] border border-gray-600" />
          <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full p-2 mb-2 rounded bg-[#1E2230] border border-gray-600" />
          <input type="text" placeholder="Local" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full p-2 mb-4 rounded bg-[#1E2230] border border-gray-600" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsOpen(false)} className="px-3 py-1 bg-gray-600 rounded">Cancelar</button>
            <button onClick={createEvent} className="px-3 py-1 bg-[#4D7CFE] rounded">Salvar</button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
