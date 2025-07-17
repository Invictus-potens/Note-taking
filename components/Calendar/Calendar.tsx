'use client';

import React, { useState } from 'react';

const CalendarComponent = () => {
  const [date, setDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderDays = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday =
        i === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();
      days.push(
        <div
          key={i}
          className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer ${
            isToday ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </div>
      );
    }

    return days;
  };

  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          &lt;
        </button>
        <h2 className="text-lg font-semibold">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        <div className="font-semibold">Sun</div>
        <div className="font-semibold">Mon</div>
        <div className="font-semibold">Tue</div>
        <div className="font-semibold">Wed</div>
        <div className="font-semibold">Thu</div>
        <div className="font-semibold">Fri</div>
        <div className="font-semibold">Sat</div>
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarComponent;
