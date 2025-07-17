'use client';

import React, { useState } from 'react';
import Calendar, { CalendarProps, Value } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CalendarComponent = () => {
  const [date, setDate] = useState<Date | Date[] | null>(new Date());

  const handleChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setDate(value);
    }
  };

  return (
    <div>
      <Calendar onChange={handleChange} value={date} />
    </div>
  );
};

export default CalendarComponent;
