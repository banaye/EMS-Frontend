import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ExamResults.css';

interface Attempt {
  id: number;
  exam_id: number;
  student_id: number;
  student_name: string;
  status: string;
  score: number;
  percentage: number;
  is_passed: boolean;
  time_spent_seconds: number;
  started_at: string;
  submitted_at: string;
  graded_at: string;
}

interface Exam {
  id: number;
  title: string;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
}

interface ExamSummary {
  total_attempts: number;
  passed: number;
  failed: number;
  pass_rate_pct: number;
  avg_score_pct: number;
  highest_score_pct: number;
  lowest_score_pct: number;
}

const ExamResults: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'instructor';
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [summary, setSummary] = useState<ExamSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchAttempts(selectedExam);
      fetchSummary(selectedExam);
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    setExamsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/exams', { headers });
      const json = await res.json();
      const data = json.data || json.exams || json;
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchAttempts = async (examId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/exams/${examId}/attempts`,
        { headers }
      );
      const json = await res.json();
      const data = json.data || json;
      setAttempts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (examId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/exams/${examId}/results/summary`,
        { headers }
      );
      const json = await res.json();
      setSummary(json.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttemptDetail = async (attempt: Attempt) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/exams/${attempt.exam_id}/attempts/${attempt.id}`,
        { headers }
      );
      const json = await res.json();
      setSelectedAttempt(json.data || attempt);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedAttempt(attempt);
      setShowDetailModal(true);
    }
  };

  const handleDeleteAttempt = async (attemptId: number, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}'s attempt? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingId(attemptId);
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${selectedExam}/attempts/${attemptId}/delete`, {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        alert('Attempt deleted successfully!');
        fetchAttempts(selectedExam!);
        fetchSummary(selectedExam!);
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to delete attempt');
      }
    } catch (err) {
      alert('Failed to delete attempt');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#f97316';
    return '#ef4444';
  };

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch = a.student_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'passed' && a.is_passed) ||
      (statusFilter === 'failed' && !a.is_passed) ||
      (statusFilter === 'graded' && a.status === 'graded') ||
      (statusFilter === 'in_progress' && a.status === 'in_progress');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="exam-results">
      <div className="page-header">
        <h1>Student Results</h1>
        <p>View and analyze student exam performance</p>
      </div>

      {/* Exam Selector */}
      <div className="exam-selector">
        <label>Select Exam</label>
        {examsLoading ? (
          <p>Loading exams...</p>
        ) : (
          <select
            value={selectedExam || ''}
            onChange={(e) => {
              setSelectedExam(Number(e.target.value));
              setAttempts([]);
              setSummary(null);
            }}
            className="filter-select"
          >
            <option value="">-- Choose an Exam --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedExam && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.total_attempts}</span>
                  <span className="summary-label">Total Attempts</span>
                </div>
              </div>
              <div className="summary-card passed">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.passed}</span>
                  <span className="summary-label">Passed</span>
                </div>
              </div>
              <div className="summary-card failed">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.failed}</span>
                  <span className="summary-label">Failed</span>
                </div>
              </div>
              <div className="summary-card rate">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.pass_rate_pct}%</span>
                  <span className="summary-label">Pass Rate</span>
                </div>
              </div>
              <div className="summary-card avg">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.avg_score_pct}%</span>
                  <span className="summary-label">Average Score</span>
                </div>
              </div>
              <div className="summary-card high">
                <div className="summary-icon"></div>
                <div className="summary-info">
                  <span className="summary-value">{summary.highest_score_pct}%</span>
                  <span className="summary-label">Highest Score</span>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="results-filters">
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="graded">Graded</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="loading">Loading results...</div>
          ) : filteredAttempts.length === 0 ? (
            <div className="no-results">No results found</div>
          ) : (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th>Time Spent</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt, index) => (
                    <tr key={attempt.id}>
                      <td>{index + 1}</td>
                      <td className="student-name">
                        <div className="student-avatar">
                          {attempt.student_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {attempt.student_name || `Student #${attempt.student_id}`}
                      </td>
                      <td>
                        <span className={`status-badge ${attempt.status}`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="text-center">
                        {attempt.score?.toFixed(1) ?? '—'}
                      </td>
                      <td>
                        <div className="score-bar-container">
                          <div
                            className="score-bar"
                            style={{
                              width: `${attempt.percentage || 0}%`,
                              background: getScoreColor(attempt.percentage || 0),
                            }}
                          />
                          <span
                            className="score-text"
                            style={{ color: getScoreColor(attempt.percentage || 0) }}
                          >
                            {attempt.percentage?.toFixed(1) ?? '0'}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {attempt.status === 'graded' ? (
                          <span className={`result-badge ${attempt.is_passed ? 'passed' : 'failed'}`}>
                            {attempt.is_passed ? '✅ Passed' : '❌ Failed'}
                          </span>
                        ) : (
                          <span className="result-badge pending">⏳ Pending</span>
                        )}
                      </td>
                      <td className="text-center">
                        {attempt.time_spent_seconds
                          ? formatTime(attempt.time_spent_seconds)
                          : '—'}
                      </td>
                      <td>
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="actions">
                        <button
                          onClick={() => fetchAttemptDetail(attempt)}
                          className="btn-small btn-view"
                        >
                          View Detail
                        </button>
                        {isStaff && (
                          <button
                            onClick={() => handleDeleteAttempt(attempt.id, attempt.student_name)}
                            disabled={deletingId === attempt.id}
                            className="btn-small btn-delete"
                          >
                            {deletingId === attempt.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAttempt && (
        <div className="modal" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Attempt Detail — {selectedAttempt.student_name}</h2>
              <button onClick={() => setShowDetailModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-summary">
                <div className="detail-stat">
                  <span className="detail-label">Score</span>
                  <span className="detail-value">{selectedAttempt.score?.toFixed(1)}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Percentage</span>
                  <span
                    className="detail-value"
                    style={{ color: getScoreColor(selectedAttempt.percentage || 0) }}
                  >
                    {selectedAttempt.percentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Result</span>
                  <span className={`result-badge ${selectedAttempt.is_passed ? 'passed' : 'failed'}`}>
                    {selectedAttempt.is_passed ? '✅ Passed' : '❌ Failed'}
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Time Spent</span>
                  <span className="detail-value">
                    {selectedAttempt.time_spent_seconds
                      ? formatTime(selectedAttempt.time_spent_seconds)
                      : '—'}
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Started</span>
                  <span className="detail-value">
                    {selectedAttempt.started_at
                      ? new Date(selectedAttempt.started_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Submitted</span>
                  <span className="detail-value">
                    {selectedAttempt.submitted_at
                      ? new Date(selectedAttempt.submitted_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
              </div>

              {(selectedAttempt as any).answers && (
                <div className="answers-section">
                  <h3>Answer Breakdown</h3>
                  {((selectedAttempt as any).answers as any[]).map(
                    (answer: any, index: number) => (
                      <div
                        key={answer.id}
                        className={`answer-row ${answer.is_correct ? 'correct' : 'incorrect'}`}
                      >
                        <span className="answer-num">Q{index + 1}</span>
                        <span className="answer-result">
                          {answer.is_correct === true
                            ? '✅ Correct'
                            : answer.is_correct === false
                            ? '❌ Incorrect'
                            : '⏳ Pending'}
                        </span>
                        <span className="answer-marks">
                          {answer.marks_awarded ?? 0} marks
                        </span>
                        {answer.text_answer && (
                          <span className="answer-text">"{answer.text_answer}"</span>
                        )}
                        {answer.feedback && (
                          <span className="answer-feedback">💬 {answer.feedback}</span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;