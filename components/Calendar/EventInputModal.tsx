'use client';

import React, { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
}

interface EventInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  selectedDate?: string;
  isDark: boolean;
}

const EventInputModal: React.FC<EventInputModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate,
  isDark 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#3b82f6');

  const eventColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#84cc16', // lime
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = allDay ? startDate : `${startDate}T${startTime}`;
    const endDateTime = allDay ? endDate : `${endDate}T${endTime}`;

    onSave({
      title: title.trim(),
      description: description.trim(),
      start: startDateTime,
      end: endDateTime,
      allDay,
      color
    });

    // Reset form
    setTitle('');
    setDescription('');
    setStartDate(selectedDate || new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndDate(selectedDate || new Date().toISOString().split('T')[0]);
    setEndTime('10:00');
    setAllDay(false);
    setColor('#3b82f6');
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setStartDate(selectedDate || new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndDate(selectedDate || new Date().toISOString().split('T')[0]);
    setEndTime('10:00');
    setAllDay(false);
    setColor('#3b82f6');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="event-input-modal-overlay" onClick={handleCancel}>
      <div className="event-input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-input-modal-header">
          <h3>Add New Event</h3>
          <button 
            className="event-input-modal-close"
            onClick={handleCancel}
            aria-label="Close event input"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="event-input-form">
          <div className="form-group">
            <label htmlFor="eventTitle">Title *</label>
            <input
              type="text"
              id="eventTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title..."
              required
              className="event-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventDescription">Description</label>
            <textarea
              id="eventDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description..."
              rows={3}
              className="event-textarea"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="event-checkbox"
              />
              <span>All day event</span>
            </label>
          </div>

          <div className="date-time-group">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="event-input"
              />
            </div>

            {!allDay && (
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="event-input"
                />
              </div>
            )}
          </div>

          <div className="date-time-group">
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="event-input"
              />
            </div>

            {!allDay && (
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="event-input"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-palette">
              {eventColors.map((eventColor) => (
                <button
                  key={eventColor}
                  type="button"
                  className={`color-option ${color === eventColor ? 'selected' : ''}`}
                  style={{ backgroundColor: eventColor }}
                  onClick={() => setColor(eventColor)}
                  aria-label={`Select color ${eventColor}`}
                />
              ))}
            </div>
          </div>

          <div className="event-input-modal-actions">
            <button type="button" className="event-input-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="event-input-btn primary">
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventInputModal; 