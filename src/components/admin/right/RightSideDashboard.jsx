// src/components/admin/right/RightSideDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaBullhorn, FaChartBar, FaUsers } from 'react-icons/fa';
import styles from './RightSideDashboard.module.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RightSideDashboard = () => {
  const [date, setDate] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState([
    { department: 'COLLEGE', count: 0, icon: <FaUsers /> },
    { department: 'TVET', count: 0, icon: <FaUsers /> },
    { department: 'SHS', count: 0, icon: <FaUsers /> },
    { department: 'JHS', count: 0, icon: <FaUsers /> }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch announcements (mock data)
        const mockAnnouncements = [
          {
            id: 1,
            title: 'Parent-Teacher Meeting',
            date: '2023-06-20',
            content: 'All teachers are required to attend the meeting at 2 PM in the auditorium.',
            priority: 'high'
          },
          {
            id: 2,
            title: 'Sports Day',
            date: '2023-06-25',
            content: 'Annual sports day event. All students must participate.',
            priority: 'medium'
          },
          {
            id: 3,
            title: 'Examination Schedule',
            date: '2023-07-05',
            content: 'Final examination schedule has been posted. Check the notice board.',
            priority: 'low'
          }
        ];

        // Fetch student counts by department
        const departments = ['college', 'tvet', 'shs', 'jhs'];
        const counts = await Promise.all(
          departments.map(async (dept) => {
            const q = query(collection(db, 'students'), where('department', '==', dept));
            const snapshot = await getCountFromServer(q);
            return { department: dept.toUpperCase(), count: snapshot.data().count };
          })
        );

        setAnnouncements(mockAnnouncements);
        setDepartmentStats(prev => prev.map(stat => {
          const found = counts.find(c => c.department === stat.department);
          return found ? { ...stat, count: found.count } : stat;
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const departmentData = {
    labels: departmentStats.map(stat => stat.department),
    datasets: [
      {
        label: 'Number of Students',
        data: departmentStats.map(stat => stat.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Students by Department',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.calendarSection}>
        <div className={styles.sectionHeader}>
          <FaCalendarAlt className={styles.sectionIcon} />
          <h2>School Calendar</h2>
        </div>
        <div className={styles.calendarContainer}>
          <Calendar
            onChange={setDate}
            value={date}
            className={styles.calendar}
          />
        </div>
      </div>

      <div className={styles.announcementsSection}>
        <div className={styles.sectionHeader}>
          <FaBullhorn className={styles.sectionIcon} />
          <h2>Announcements</h2>
        </div>
        <ul className={styles.announcementsList}>
          {announcements.map(announcement => (
            <li key={announcement.id} className={`${styles.announcementItem} ${styles[announcement.priority]}`}>
              <h3 className={styles.announcementTitle}>{announcement.title}</h3>
              <p className={styles.announcementDate}>{announcement.date}</p>
              <p className={styles.announcementText}>{announcement.content}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <FaChartBar className={styles.sectionIcon} />
          <h2>Department Statistics</h2>
        </div>
        
        {/* Bar Chart */}
        <div className={styles.chartContainer}>
          <Bar data={departmentData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default RightSideDashboard;