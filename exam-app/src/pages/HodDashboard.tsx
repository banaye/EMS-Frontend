import React, { useEffect, useState } from 'react';
import '../styles/HodDashboard.css';
import { API_URL } from '../config';


interface DashboardStats {
  totalExams: number;
  totalCourses: number;
  totalQuestions: number;
}

const HodDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const getHeaders = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const [examsRes, coursesRes, questionsRes] = await Promise.all([
        fetch(`${API_URL}/exams`, { headers: getHeaders }),
        fetch(`${API_URL}/courses`, { headers: getHeaders }),
        fetch(`${API_URL}/questions`, { headers: getHeaders }),
      ]);

      const [examsJson, coursesJson, questionsJson] = await Promise.all([
        examsRes.json(),
        coursesRes.json(),
        questionsRes.json(),
      ]);

      const exams = examsJson.data || examsJson.exams || examsJson;
      const courses = coursesJson.data || coursesJson.courses || coursesJson;
      const questions = questionsJson.data || questionsJson.questions || questionsJson;

      setStats({
        totalExams: examsJson.meta?.total || (Array.isArray(exams) ? exams.length : 0),
        totalCourses: coursesJson.meta?.total || (Array.isArray(courses) ? courses.length : 0),
        totalQuestions: questionsJson.meta?.total || (Array.isArray(questions) ? questions.length : 0),
      });
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="hod-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>System Statistics & Management</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon exams"></div>
            <div className="stat-content">
              <h3>Total Exams</h3>
              <p className="stat-value">{stats.totalExams}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon courses"></div>
            <div className="stat-content">
              <h3>Total Courses</h3>
              <p className="stat-value">{stats.totalCourses}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon questions"></div>
            <div className="stat-content">
              <h3>Question Bank</h3>
              <p className="stat-value">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodDashboard;