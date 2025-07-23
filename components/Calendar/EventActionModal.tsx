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
  reminder_minutes?: number;
  reminder_set?: boolean;
}

interface EventActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onSetReminder: (eventId: string, reminderTime: string) => void;
  isDark: boolean;
}

const EventActionModal: React.FC<EventActionModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  onEdit, 
  onDelete, 
  onSetReminder,
  isDark 
}) => {
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderTime, setReminderTime] = useState(event?.reminder_minutes?.toString() || '15');

  // Update reminder time when event changes
  React.useEffect(() => {
    setReminderTime(event?.reminder_minutes?.toString() || '15');
  }, [event]);

  const reminderOptions = [
    { value: '5', label: '5 minutes before' },
    { value: '15', label: '15 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
    { value: '1440', label: '1 day before' },
  ];

  const handleEdit = () => {
    if (event) {
      onEdit(event);
    }
    onClose();
  };

  const handleDelete = () => {
    if (event && confirm(`Are you sure you want to delete the event '${event.title}'?`)) {
      onDelete(event.id);
    }
    onClose();
  };

  const handleSetReminder = () => {
    if (event) {
      onSetReminder(event.id, reminderTime);
      setShowReminderInput(false);
      setReminderTime('15');
    }
    onClose();
  };

  const handleCancel = () => {
    setShowReminderInput(false);
    setReminderTime('15');
    onClose();
  };

  if (!isOpen || !event) return null;

  const eventStart = new Date(event.start);
  const eventEnd = event.end ? new Date(event.end) : null;
  const isAllDay = event.allDay;

  return (
    <div className="event-action-modal-overlay" onClick={handleCancel}>
      <div className="event-action-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-action-modal-header">
          <h3>Event Options</h3>
          <button 
            className="event-action-modal-close"
            onClick={handleCancel}
            aria-label="Close event actions"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        
        <div className="event-action-content">
          <div className="event-details">
            <h4 className="event-title">{event.title}</h4>
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
            <div className="event-time">
              <i className="ri-time-line minimalist-icon"></i>
              <span>
                {isAllDay ? (
                  `${eventStart.toLocaleDateString()} (All day)`
                ) : (
                  `${eventStart.toLocaleDateString()} ${eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                )}
                {eventEnd && !isAllDay && (
                  ` - ${eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                )}
              </span>
            </div>
            {event.reminder_set && event.reminder_minutes && (
              <div className="event-reminder-info">
                <i className="ri-notification-fill minimalist-icon" style={{ color: '#f59e0b' }}></i>
                <span>Reminder set for {event.reminder_minutes} minutes before</span>
              </div>
            )}
          </div>

          {!showReminderInput ? (
            <div className="event-actions">
              <button 
                className="event-action-btn edit"
                onClick={handleEdit}
              >
                <i className="ri-edit-line minimalist-icon"></i>
                Edit Event
              </button>
              
              <button 
                className="event-action-btn reminder"
                onClick={() => setShowReminderInput(true)}
              >
                <i className={`${event.reminder_set ? 'ri-notification-fill' : 'ri-notification-line'} minimalist-icon`}></i>
                {event.reminder_set ? 'Change Reminder' : 'Set Reminder'}
              </button>
              
              <button 
                className="event-action-btn delete"
                onClick={handleDelete}
              >
                <i className="ri-delete-bin-line minimalist-icon"></i>
                Delete Event
              </button>
            </div>
          ) : (
            <div className="reminder-input">
              <h4>Set Reminder</h4>
              <p className="reminder-description">
                Choose when you'd like to be notified about this event:
              </p>
              
              <div className="reminder-options">
                {reminderOptions.map((option) => (
                  <label key={option.value} className="reminder-option">
                    <input
                      type="radio"
                      name="reminderTime"
                      value={option.value}
                      checked={reminderTime === option.value}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="reminder-actions">
                <button 
                  className="event-action-btn secondary"
                  onClick={() => setShowReminderInput(false)}
                >
                  Back
                </button>
                <button 
                  className="event-action-btn primary"
                  onClick={handleSetReminder}
                >
                  Set Reminder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventActionModal; 