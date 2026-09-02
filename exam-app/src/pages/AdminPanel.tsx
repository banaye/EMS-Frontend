import React from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import ManageUsers from '../components/hod/ManageUsers';
import ManageExams from '../components/hod/ManageExams';
import ManageCourses from '../components/hod/ManageCourses';
import ManageQuestions from '../components/hod/ManageQuestions';
import ViewReports from '../components/hod/ViewReports';
import ExamResults from '../components/hod/ExamResults';
import '../styles/AdminPanel.css';

const AdminDashboard: React.FC = () => (
  <section>
    <h1>Dashboard</h1>
  </section>
);

const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="admin-panel">
      <Navigation />

      <div className="admin-container">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>{user?.role === 'hod' ? 'Admin Panel' : 'Instructor Panel'}</h2>
          </div>

          <nav className="sidebar-nav">
            <Link to="/admin" className="nav-item">
              Dashboard
            </Link>
            <Link to="/admin/users" className="nav-item">
               Manage Users
            </Link>
            <Link to="/admin/results" className="nav-item">
             Exam Results
            </Link>
            <Link to="/admin/exams" className="nav-item">
              Manage Exams
            </Link>
            <Link to="/admin/courses" className="nav-item">
              Manage Courses
            </Link>
            <Link to="/admin/questions" className="nav-item">
              Manage Questions
            </Link>
            <Link to="/admin/reports" className="nav-item">
              📈Reports & Analytics
            </Link>
          </nav>
        </aside>

        <main className="admin-main">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="exams" element={<ManageExams />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="questions" element={<ManageQuestions />} />
            <Route path="reports" element={<ViewReports />} />
            <Route path="results" element={<ExamResults />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;