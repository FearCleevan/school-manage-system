import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaChalkboardTeacher, FaBook, FaBuilding,
  FaUserPlus, FaCalendarAlt, FaChartBar, FaMoneyBillWave, FaHome,
  FaEdit, FaTrash, FaUserCheck, FaBookOpen
} from 'react-icons/fa';
import { collection, getCountFromServer, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useNavigate } from 'react-router-dom';
import styles from './CenterSideDashboard.module.css';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CenterSideDashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Students', value: '0', icon: <FaUsers />, trend: 0 },
    { title: 'Total Teachers', value: '0', icon: <FaChalkboardTeacher />, trend: 0 },
    { title: 'Total Courses', value: '0', icon: <FaBook />, trend: 0 },
    { title: 'Total Departments', value: '0', icon: <FaBuilding />, trend: 0 }
  ]);

  const [recentStudents, setRecentStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    students: true,
    activities: true
  });
  const [activityError, setActivityError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch counts
        const [studentsCount, teachersCount] = await Promise.all([
          getCountFromServer(collection(db, 'students')),
          getCountFromServer(collection(db, 'users'))
        ]);

        setStats([
          { title: 'Total Students', value: studentsCount.data().count.toLocaleString(), icon: <FaUsers />, trend: 12.5 },
          { title: 'Total Teachers', value: teachersCount.data().count.toLocaleString(), icon: <FaChalkboardTeacher />, trend: 5.2 },
          { title: 'Total Courses', value: '32', icon: <FaBook />, trend: 3.7 },
          { title: 'Total Departments', value: '6', icon: <FaBuilding />, trend: 0 }
        ]);

        setLoading(prev => ({ ...prev, stats: false }));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchInitialData();

    // Real-time listeners
    const setupListeners = () => {
      try {
        // Students listener
        const studentsQuery = query(
          collection(db, 'students'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const unsubscribeStudents = onSnapshot(studentsQuery,
          (snapshot) => {
            const students = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate().toLocaleDateString()
            }));
            setRecentStudents(students);
            setLoading(prev => ({ ...prev, students: false }));
          },
          (error) => {
            console.error("Students listener error:", error);
            toast.error("Failed to load recent students");
            setLoading(prev => ({ ...prev, students: false }));
          }
        );

        // Activities listener
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('timestamp', 'desc'),
          limit(5) // Only fetch the 5 most recent activities
        );
        const unsubscribeActivities = onSnapshot(activitiesQuery,
          (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                action: data.action,
                user: data.userName || data.userEmail || 'System',
                timestamp: formatDistanceToNow(data.timestamp?.toDate() || new Date(), { addSuffix: true }),
                details: data.details,
                icon: getActivityIcon(data.action)
              };
            });
            setActivities(activitiesData);
            setActivityError(null);
            setLoading(prev => ({ ...prev, activities: false }));
          },
          (error) => {
            console.error("Activities listener error:", error);
            setActivityError("Failed to load activities. Please refresh or check permissions.");
            setLoading(prev => ({ ...prev, activities: false }));
          }
        );

        return () => {
          unsubscribeStudents();
          unsubscribeActivities();
        };
      } catch (error) {
        console.error("Listener setup error:", error);
        toast.error("Failed to initialize real-time updates");
        setLoading(prev => ({ ...prev, students: false, activities: false }));
      }
    };

    return setupListeners();
  }, []);

  const getActivityIcon = (action) => {
    const actionIcons = {
      'added a new student': <FaUserPlus />,
      'edited a student': <FaEdit />,
      'deleted a student': <FaTrash />,
      'enrolled existing student': <FaUserCheck />,
      'customized subjects for student': <FaBookOpen />,
      default: <FaCalendarAlt />
    };

    for (const [key, icon] of Object.entries(actionIcons)) {
      if (action.includes(key)) return icon;
    }
    return actionIcons.default;
  };

  if (loading.stats || loading.students || loading.activities) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className={styles.centerContent}>
      <div className={styles.centerHeaderContainer}>
        <h2 className={styles.dashboardTitle}><FaHome /> Admin Dashboard</h2>

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
            <button
              className={styles.viewAllButton}
              onClick={() => navigate('/dashboard/manage-student')}
            >
              View All
            </button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.studentsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.studentId}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`${styles.departmentBadge} ${styles[student.department?.toLowerCase()]}`}>
                        {student.department}
                      </span>
                    </td>
                    <td>{student.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.recentActivities}>
          <div className={styles.sectionHeader}>
            <h2>Recent Activities</h2>
            <button
              className={styles.refreshButton}
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>

          {activityError ? (
            <div className={styles.errorMessage}>
              {activityError}
            </div>
          ) : activities.length === 0 ? (
            <div className={styles.emptyState}>
              No activities found. Activities will appear here when changes are made.
            </div>
          ) : (
            <ul className={styles.activitiesList}>
              {activities.map(activity => (
                <li key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{getActivityIcon(activity.action)}</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityAction}>
                      <strong>{activity.userName || 'System'}</strong> {activity.action}
                      {activity.details && (
                        <>
                          <span className={styles.activityDetails}> - {activity.details.studentId}</span>
                          {activity.details.studentName && (
                            <span className={styles.activityDetails}> ({activity.details.studentName})</span>
                          )}
                        </>
                      )}
                    </p>
                    <span className={styles.activityTime}>{activity.timestamp}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterSideDashboard;