import React from 'react';
import './centerSideDashboard.css';

const CenterSideDashboard = () => {
    return (
        <div className="center-content">
            <div className='center-header-container'>
                <h1 className="dashboard-title">Student Management System</h1>
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-title">Total Students</h3>
                        <p className="stat-value">1,250</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Total Teachers</h3>
                        <p className="stat-value">1,000</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Total Courses</h3>
                        <p className="stat-value">25</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Total Department</h3>
                        <p className="stat-value">5</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CenterSideDashboard;