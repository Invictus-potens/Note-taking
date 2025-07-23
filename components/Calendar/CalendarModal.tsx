'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventChangeArg } from '@fullcalendar/core';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, isDark }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Sample Event',
      start: new Date().toISOString(),
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Another Event',
      start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      color: '#10b981'
    }
  ]);

  const handleDateClick = (arg: DateSelectArg) => {
    const title = prompt('Please enter a title for your event');
    if (title) {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title,
        start: arg.startStr,
        end: arg.endStr,
        allDay: arg.allDay,
        color: '#3b82f6'
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (confirm(`Are you sure you want to delete the event '${arg.event.title}'`)) {
      setEvents(events.filter(event => event.id !== arg.event.id));
    }
  };

  const handleEventChange = (arg: EventChangeArg) => {
    setEvents(events.map(event => 
      event.id === arg.event.id 
        ? { 
            ...event, 
            start: arg.event.startStr, 
            end: arg.event.endStr 
          }
        : event
    ));
  };

  if (!isOpen) return null;

  return (
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
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateClick}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            height="auto"
            themeSystem={isDark ? 'dark' : 'light'}
            eventColor="#3b82f6"
            eventTextColor="#ffffff"
            dayCellClassNames={isDark ? 'dark-theme' : 'light-theme'}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal; 