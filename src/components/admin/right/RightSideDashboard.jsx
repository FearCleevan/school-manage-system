import React from 'react';
import './rightSideDashboard.css';

const RightSideDashboard = () => {
  return (
    <div className="right-sidebar">
      <div className="calendar-section">
        <h2 className="sidebar-section-title">School Calendar</h2>
        <div className="calendar-placeholder">
          [Calendar will be displayed here]
        </div>
      </div>

      <div className="announcements-section">
        <h2 className="sidebar-section-title">Announcements</h2>
        <ul className="announcements-list">
          <li className="announcement-item">
            <h3 className="announcement-title">Parent-Teacher Meeting</h3>
            <p className="announcement-date">Friday, June 10</p>
            <p className="announcement-text">All teachers are required to attend the meeting at 2 PM in the auditorium.</p>
          </li>
          <li className="announcement-item">
            <h3 className="announcement-title">Sports Day</h3>
            <p className="announcement-date">Monday, June 13</p>
            <p className="announcement-text">Annual sports day event. All students must participate.</p>
          </li>
        </ul>
      </div>

      <div className="quick-links-section">
        <h2 className="sidebar-section-title">Quick Links</h2>
        <div className="quick-links">
          <a href="#timetable" className="quick-link">Timetable</a>
          <a href="#syllabus" className="quick-link">Syllabus</a>
          <a href="#grades" className="quick-link">Grades</a>
          <a href="#resources" className="quick-link">Resources</a>
        </div>
      </div>
    </div>
  );
};

export default RightSideDashboard;