import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/ExamTaking.css';

interface Option {
  id: number;
  text: string;
  order_index: number;
}

interface Question {
  id: number;
  text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  options: Option[];
}

interface ExamSession {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
}

const ExamTaking: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected_option_id?: number; text_answer?: string }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState('');

  // Security refs
  const hasAutoSubmitted = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Auto submit function
  const handleAutoSubmit = async (reason: string) => {
    if (hasAutoSubmitted.current || submitting || !attemptId) return;
    
    hasAutoSubmitted.current = true;
    setSubmitting(true);
    setWarning(reason);
    
    try {
      const res = await fetch(
        `http://localhost:5000/api/exams/${examId}/attempts/${attemptId}/submit`,
        { method: 'POST', headers }
      );
      if (res.ok) {
        alert(`${reason}\n\nYour exam has been automatically submitted.`);
        navigate(`/results/${examId}`);
      }
    } catch (err) {
      console.error('Auto-submit failed:', err);
      setSubmitting(false);
      hasAutoSubmitted.current = false;
    }
  };

  // Security: Detect tab/window switch - AUTO SUBMIT IMMEDIATELY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmitted.current) {
        handleAutoSubmit('Exam auto-submitted: Tab switch detected.');
      }
    };
    
    const handleBlur = () => {
      if (!hasAutoSubmitted.current) {
        handleAutoSubmit('Exam auto-submitted: Window focus lost.');
      }
    };
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasAutoSubmitted.current) {
        e.preventDefault();
        e.returnValue = 'You are leaving the exam. Your exam will be submitted automatically.';
        handleAutoSubmit('Exam auto-submitted: Page navigation detected.');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attemptId]);

  // Security: Prevent copy/paste for text questions
  const handleKeyDown = (e: React.KeyboardEvent, questionType: string) => {
    if (questionType === 'short_answer' || questionType === 'essay') {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        setWarning('Copy/Paste is not allowed during exam.');
        setTimeout(() => setWarning(''), 2000);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setWarning('Pasting is not allowed during exam.');
    setTimeout(() => setWarning(''), 2000);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setWarning('Right-click is disabled during exam.');
    setTimeout(() => setWarning(''), 2000);
  };

  useEffect(() => {
    initExam();
  }, [examId]);

  // Timer with auto-submit on time elapsed
  useEffect(() => {
    if (timeLeft <= 0 || !exam || hasAutoSubmitted.current) return;
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleAutoSubmit('Exam auto-submitted: Time elapsed.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeLeft, exam]);

  const initExam = async () => {
    try {
      const examRes = await fetch(`http://localhost:5000/api/exams/${examId}`, { headers });
      if (!examRes.ok) throw new Error('Failed to fetch exam');
      const examJson = await examRes.json();
      const examData = examJson.data || examJson;
      const durationMinutes = Number(examData.duration_minutes) || 0;
      setExam({ ...examData, duration_minutes: durationMinutes });
      setTimeLeft(durationMinutes * 60);

      const attemptRes = await fetch(`http://localhost:5000/api/exams/${examId}/attempts`, {
        method: 'POST',
        headers,
      });
      if (!attemptRes.ok) throw new Error('Failed to start attempt');
      const attemptJson = await attemptRes.json();
      const attempt = attemptJson.data || attemptJson;
      setAttemptId(attempt.id);

      const questionsRes = await fetch(`http://localhost:5000/api/exams/${examId}/questions`, { headers });
      if (!questionsRes.ok) throw new Error('Failed to fetch questions');
      const questionsJson = await questionsRes.json();
      const questionsData = questionsJson.data || questionsJson;
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (err) {
      setError('Failed to load exam. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (
    questionId: number,
    value: { selected_option_id?: number; text_answer?: string }
  ) => {
    if (hasAutoSubmitted.current) return;
    
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!attemptId) return;
    try {
      await fetch(`http://localhost:5000/api/exams/${examId}/attempts/${attemptId}/answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question_id: questionId, ...value }),
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleSubmitExam = async () => {
    if (submitting || !attemptId || hasAutoSubmitted.current) return;
    const confirm = window.confirm('Are you sure you want to submit your exam?');
    if (!confirm) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/exams/${examId}/attempts/${attemptId}/submit`,
        { method: 'POST', headers }
      );
      if (!res.ok) throw new Error('Failed to submit exam');
      navigate(`/results/${examId}`);
    } catch (err) {
      setError('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading exam...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!exam || questions.length === 0) return <div className="error">Exam not found</div>;

  const currentQuestion = questions[currentIndex];
  const safeTimeLeft = Number.isFinite(timeLeft) ? timeLeft : 0;
  const minutes = Math.floor(safeTimeLeft / 60);
  const seconds = safeTimeLeft % 60;
  const currentAnswer = answers[currentQuestion.id];

  const isTextQuestion = (type: string) => {
    return type === 'short_answer' || type === 'essay';
  };

  return (
    <div className="exam-taking-container" onContextMenu={handleContextMenu}>
      <Navigation />

      {warning && (
        <div className="warning-banner">
          Warning: {warning}
        </div>
      )}

      <div className="exam-header">
        <div>
          <h1>{exam.title}</h1>
          <div className="exam-duration">Duration: {exam.duration_minutes} mins</div>
        </div>
        <div className="timer">
          <span className={`timer-display ${timeLeft < 300 ? 'critical' : ''}`}>
            <span className="timer-text">
              Time Left: {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </span>
        </div>
      </div>

      <div className="exam-body">
        <div className="question-counter">
          Question {currentIndex + 1} of {questions.length}
        </div>

        <div className="question-container">
          <h2>{currentQuestion.text}</h2>

          {(currentQuestion.question_type === 'mcq' ||
            currentQuestion.question_type === 'true_false') && (
            <div className="options">
              {(currentQuestion.options || []).map((option) => (
                <label key={option.id} className="option">
                  <input
                    type="radio"
                    name={`question_${currentQuestion.id}`}
                    value={option.id}
                    checked={currentAnswer?.selected_option_id === option.id}
                    onChange={() =>
                      handleAnswerChange(currentQuestion.id, { selected_option_id: option.id })
                    }
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {isTextQuestion(currentQuestion.question_type) && (
            <div className="answer-input">
              <textarea
                value={currentAnswer?.text_answer || ''}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, { text_answer: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, currentQuestion.question_type)}
                onPaste={handlePaste}
                onCopy={handlePaste}
                onCut={handlePaste}
                placeholder={`Enter your ${currentQuestion.question_type === 'essay' ? 'essay' : 'answer'} here...`}
                rows={currentQuestion.question_type === 'essay' ? 8 : 4}
              />
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          <button
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            disabled={currentIndex === 0}
            className="nav-btn"
          >
            Previous
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            disabled={currentIndex === questions.length - 1}
            className="nav-btn"
          >
            Next
          </button>

          <button
            onClick={handleSubmitExam}
            disabled={submitting || hasAutoSubmitted.current}
            className="submit-btn"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;