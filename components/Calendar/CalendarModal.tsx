'use client';

import React from 'react';
import CalendarComponent from './Calendar';

interface CalendarModalProps {
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Calendar</h3>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-content">
          <CalendarComponent />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
