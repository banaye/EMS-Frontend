import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation.tsx';
import '../styles/Results.css';

interface Answer {
  id: number;
  is_correct: boolean;
  marks_awarded: number;
  text_answer: string;
  feedback: string;
  answered_at: string;
}

interface Attempt {
  id: number;
  status: string;
  score: number;
  percentage: number;
  is_passed: boolean;
  time_spent_seconds: number;
  started_at: string;
  submitted_at: string;
  answers?: Answer[];
}

const Results: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      // Get exam title
      const examRes = await fetch(`http://localhost:5000/api/exams/${examId}`, { headers });
      if (!examRes.ok) throw new Error('Failed to fetch exam');
      const examJson = await examRes.json();
      const examData = examJson.data || examJson;
      setExamTitle(examData.title);

      // Get attempts list and pick the latest graded one
      const attemptsRes = await fetch(
        `http://localhost:5000/api/exams/${examId}/attempts`,
        { headers }
      );
      if (!attemptsRes.ok) throw new Error('Failed to fetch attempts');
      const attemptsJson = await attemptsRes.json();
      const attempts: Attempt[] = attemptsJson.data || attemptsJson;

      if (!Array.isArray(attempts) || attempts.length === 0) {
        throw new Error('No attempts found');
      }

      // Pick latest graded attempt
      const graded = attempts
        .filter((a) => a.status === 'graded')
        .sort((a, b) => b.id - a.id)[0];

      if (!graded) throw new Error('No graded attempt found');

      // Get full attempt detail with answers
      const detailRes = await fetch(
        `http://localhost:5000/api/exams/${examId}/attempts/${graded.id}`,
        { headers }
      );
      if (!detailRes.ok) throw new Error('Failed to fetch attempt detail');
      const detailJson = await detailRes.json();
      setAttempt(detailJson.data || detailJson);
      setError('');
    } catch (err) {
      setError('Failed to load results. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!attempt) return <div className="error">Results not found</div>;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
  };

  const minutes = Math.floor((attempt.time_spent_seconds || 0) / 60);
  const seconds = (attempt.time_spent_seconds || 0) % 60;

  return (
    <div className="results-container">
      <Navigation />

      <div className="results-content">
        <div className="results-header">
          <h1>{examTitle}</h1>
          <p>Your Exam Results</p>
        </div>

        <div className={`score-card ${getScoreColor(attempt.percentage)}`}>
          <div className="score-display">
            <div className="percentage">{attempt.percentage?.toFixed(1)}%</div>
            <div className="score-details">
              <p>Score: {attempt.score}</p>
              <p>Status: {attempt.is_passed ? 'Passed' : ' Failed'}</p>
              <p>Time Spent: {minutes} mins {seconds} secs</p>
            </div>
          </div>
        </div>

        {attempt.answers && attempt.answers.length > 0 && (
          <div className="results-details">
            <h2>Answer Details</h2>
            {attempt.answers.map((answer, index) => (
              <div
                key={answer.id}
                className={`answer-detail ${answer.is_correct ? 'correct' : 'incorrect'}`}
              >
                <div className="question-number">Q{index + 1}</div>
                <div className="answer-info">
                  {answer.text_answer && (
                    <p className="your-answer">Your Answer: {answer.text_answer}</p>
                  )}
                  <p className="marks">
                    Marks: {answer.marks_awarded}
                  </p>
                  {answer.feedback && (
                    <p className="feedback">Feedback: {answer.feedback}</p>
                  )}
                </div>
                <div className="result-badge">
                  {answer.is_correct ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="action-buttons">
          <button onClick={() => navigate('/dashboard')} className="action-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;