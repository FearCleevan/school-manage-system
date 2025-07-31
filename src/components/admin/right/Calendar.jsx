import React, { useState, useEffect } from 'react';
import styles from './Calendar.module.css';

const Calendar = ({ announcements }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});

  // Process announcements into date-based events
  useEffect(() => {
    const eventsMap = {};
    announcements.forEach(announcement => {
      const dateKey = formatDateKey(new Date(announcement.date));
      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push(announcement);
    });
    setEventsByDate(eventsMap);
  }, [announcements]);

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const daysFromPrevMonth = firstDay;
    const prevMonthDays = getDaysInMonth(year, month - 1);
    
    // Days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className={`${styles.day} ${styles.dayOutside}`}>
          {prevMonthDays - i}
        </div>
      );
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${month}-${i}`;
      const hasEvent = eventsByDate[dateKey];
      
      days.push(
        <div
          key={`current-${i}`}
          className={`${styles.day} ${hasEvent ? styles.hasEvent : ''} ${isToday(year, month, i) ? styles.today : ''}`}
        >
          {i}
          {hasEvent && (
            <div className={styles.eventTooltip}>
              {eventsByDate[dateKey].map((event, idx) => (
                <div key={idx} className={`${styles.eventItem} ${styles[event.priority]}`}>
                  <strong>{event.title}</strong>
                  <p>{event.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Days from next month
    const totalDays = daysFromPrevMonth + daysInMonth;
    const remainingDays = totalDays <= 35 ? 35 - totalDays : 42 - totalDays;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className={`${styles.day} ${styles.dayOutside}`}>
          {i}
        </div>
      );
    }
    
    return days;
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={prevMonth} className={styles.navButton}>&lt;</button>
        <h2>
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className={styles.navButton}>&gt;</button>
      </div>
      
      <div className={styles.weekdays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>
      
      <div className={styles.daysGrid}>
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;