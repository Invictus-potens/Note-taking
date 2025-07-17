'use client';

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CalendarComponent = () => {
  const [date, setDate] = useState<Date | [Date | null, Date | null] | null>(new Date());

  const handleChange = (value: Date | [Date | null, Date | null] | null) => {
    setDate(value);
  };

  return (
    <div>
      <Calendar onChange={handleChange} value={date} />
    </div>
  );
};

export default CalendarComponent;
