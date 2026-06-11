import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';

interface Exam {
  id: number;
  title: string;
  description: string;
  question_count: number;
  duration_minutes: number;
  is_published: boolean;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
}

const Dashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/exams', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Fetch exams failed', response.status, errorBody);
        throw new Error(`Failed to fetch exams: ${response.status}`);
      }

      const json = await response.json();
      const examsData = json.data || json.exams || json;
      setExams(Array.isArray(examsData) ? examsData : []);
      setError('');
    } catch (err) {
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startExam = (examId: number) => {
    navigate(`/exam/${examId}`);
  };

  if (loading) return <div className="loading">Loading exams...</div>;

  return (
    <div className="dashboard-container">
      <Navigation />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {(user as unknown as User)?.first_name || user?.email}!</h1>
          <p>Exam Listing & Dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="exams-section">
          <h2>Available Exams</h2>

          {exams.length === 0 ? (
            <p className="no-exams">No exams available</p>
          ) : (
            <div className="exams-grid">
              {exams.map((exam) => (
                <div key={exam.id} className="exam-card">
                  <h3>{exam.title}</h3>
                  <p className="exam-description">{exam.description}</p>

                  <div className="exam-details">
                    <span className="detail">📝 {exam.question_count ? exam.question_count : 0} Questions</span>
                    <span className="detail">⏱️ {exam.duration_minutes} mins</span>
                  </div>

                  <div className="exam-status">
                    <span className={`status-badge ${exam.is_published ? 'available' : 'upcoming'}`}>
                      {exam.is_published ? 'AVAILABLE' : 'UPCOMING'}
                    </span>
                  </div>

                  {exam.is_published && (
                    <button
                      className="start-exam-btn"
                      onClick={() => startExam(exam.id)}
                    >
                      Start Exam
                    </button>
                  )}

                  {!exam.is_published && exam.start_time && (
                    <p className="upcoming-text">
                      Scheduled for: {exam.start_time.slice(0, 10)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;