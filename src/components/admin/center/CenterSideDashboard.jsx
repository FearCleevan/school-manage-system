// src/components/admin/center/CenterSideDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaChalkboardTeacher, 
  FaBook, 
  FaBuilding,
  FaUserPlus,
  FaCalendarAlt,
  FaChartBar,
  FaMoneyBillWave
} from 'react-icons/fa';
import styles from './CenterSideDashboard.module.css';

const CenterSideDashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Students', value: '0', icon: <FaUsers />, trend: 0 },
    { title: 'Total Teachers', value: '0', icon: <FaChalkboardTeacher />, trend: 0 },
    { title: 'Total Courses', value: '0', icon: <FaBook />, trend: 0 },
    { title: 'Total Departments', value: '0', icon: <FaBuilding />, trend: 0 }
  ]);

  const [recentStudents, setRecentStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this from your backend
        const mockStats = [
          { title: 'Total Students', value: '1,250', icon: <FaUsers />, trend: 12.5 },
          { title: 'Total Teachers', value: '85', icon: <FaChalkboardTeacher />, trend: 5.2 },
          { title: 'Total Courses', value: '32', icon: <FaBook />, trend: 3.7 },
          { title: 'Total Departments', value: '6', icon: <FaBuilding />, trend: 0 }
        ];

        const mockStudents = [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'COLLEGE', date: '2023-06-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'SHS', date: '2023-06-14' },
          { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'TVET', date: '2023-06-14' },
          { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', department: 'JHS', date: '2023-06-13' },
          { id: 5, name: 'David Brown', email: 'david@example.com', department: 'COLLEGE', date: '2023-06-12' }
        ];

        const mockActivities = [
          { id: 1, action: 'New student registered', user: 'John Doe', time: '2 hours ago' },
          { id: 2, action: 'Course updated', user: 'Admin', time: '5 hours ago' },
          { id: 3, action: 'Payment received', user: 'Jane Smith', time: '1 day ago' },
          { id: 4, action: 'Attendance marked', user: 'Teacher', time: '2 days ago' }
        ];

        setStats(mockStats);
        setRecentStudents(mockStudents);
        setActivities(mockActivities);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.centerContent}>
      <div className={styles.centerHeaderContainer}>
        <h1 className={styles.dashboardTitle}>Student Management System</h1>
        <p className={styles.dashboardSubtitle}>Welcome back! Here's what's happening today.</p>
        
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <span className={`${styles.trendIndicator} ${stat.trend >= 0 ? styles.positive : styles.negative}`}>
                  {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                </span>
              </div>
              <h3 className={styles.statTitle}>{stat.title}</h3>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.recentStudents}>
          <div className={styles.sectionHeader}>
            <h2>Recently Added Students</h2>
            <button className={styles.viewAllButton}>View All</button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.studentsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{student.name}</span>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`${styles.departmentBadge} ${styles[student.department.toLowerCase()]}`}>
                        {student.department}
                      </span>
                    </td>
                    <td>{student.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.recentActivities}>
          <div className={styles.sectionHeader}>
            <h2>Recent Activities</h2>
          </div>
          <ul className={styles.activitiesList}>
            {activities.map(activity => (
              <li key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.action.includes('student') ? <FaUserPlus /> : 
                   activity.action.includes('Course') ? <FaBook /> : 
                   activity.action.includes('Payment') ? <FaMoneyBillWave /> : <FaCalendarAlt />}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityAction}>{activity.action}</p>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityUser}>{activity.user}</span>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CenterSideDashboard;