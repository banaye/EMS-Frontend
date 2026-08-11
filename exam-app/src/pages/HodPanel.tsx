import React from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import HodDashboard from './HodDashboard';
import ManageUsers from '../components/hod/ManageUsers';
import ManageExams from '../components/hod/ManageExams';
import ManageCourses from '../components/hod/ManageCourses';
import ManageQuestions from '../components/hod/ManageQuestions';
import ViewReports from '../components/hod/ViewReports';
import ExamResults from '../components/hod/ExamResults';
import '../styles/HodPanel.css';

const HodPanel: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="hod-panel">
      <Navigation />

      <div className="hod-container">
        <aside className="hod-sidebar">
          <div className="sidebar-header">
            <h2> {user?.role === 'hod' ? 'HOD Panel' : 'Instructor Panel'}</h2>
          </div>

          <nav className="sidebar-nav">
            <Link to="/hod" className="nav-item">
              Dashboard
            </Link>
            <Link to="/hod/users" className="nav-item">
               Manage Users
            </Link>
            <Link to="/hod/results" className="nav-item">
             Exam Results
            </Link>
            <Link to="/hod/exams" className="nav-item">
              Manage Exams
            </Link>
            <Link to="/hod/courses" className="nav-item">
              Manage Courses
            </Link>
            <Link to="/hod/questions" className="nav-item">
              Manage Questions
            </Link>
            <Link to="/hod/reports" className="nav-item">
              📈Reports & Analytics
            </Link>
          </nav>
        </aside>

        <main className="hod-main">
          <Routes>
            <Route path="/" element={<HodDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="exams" element={<ManageExams />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="questions" element={<ManageQuestions />} />
            <Route path="reports" element={<ViewReports />} />
            <Route path="results" element={<ExamResults />} />
            <Route path="*" element={<Navigate to="/hod" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default HodPanel;
