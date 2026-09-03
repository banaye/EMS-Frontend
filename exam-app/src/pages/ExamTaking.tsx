import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/ExamTaking.css';
import { API_URL } from '../config';

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

type ViolationType = 'tab_switch' | 'window_blur' | 'copy' | 'paste' | 'right_click' | 'devtools' | 'print_screen';

const VIOLATION_THRESHOLD = 3;

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
  const [violationCount, setViolationCount] = useState(0);

  const hasAutoSubmitted = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationCountRef = useRef<number>(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeLeftRef = useRef<number>(0);
  const pendingAnswerRef = useRef<{ questionId: number; value: { selected_option_id?: number; text_answer?: string } } | null>(null);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const logViolation = useCallback(async (type: ViolationType) => {
    if (!attemptId) return;
    try {
      await fetch(`${API_URL}/exams/${examId}/attempts/${attemptId}/violations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ violation_type: type }),
      });
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  }, [attemptId, examId, headers]);

  const handleAutoSubmit = useCallback(async (reason: string) => {
    if (hasAutoSubmitted.current || !attemptId) return;

    hasAutoSubmitted.current = true;
    setSubmitting(true);
    setWarning(reason);

    try {
      const res = await fetch(
        `${API_URL}/exams/${examId}/attempts/${attemptId}/submit`,
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
  }, [attemptId, examId, headers, navigate]);

  const handleViolation = useCallback((type: ViolationType, message: string) => {
    if (hasAutoSubmitted.current) return;

    logViolation(type);
    violationCountRef.current += 1;
    setViolationCount(violationCountRef.current);
    setWarning(message);

    if (violationCountRef.current >= VIOLATION_THRESHOLD) {
      handleAutoSubmit(`Exam auto-submitted: ${VIOLATION_THRESHOLD} violations reached (${type}).`);
    } else {
      setTimeout(() => setWarning(''), 3000);
    }
  }, [logViolation, handleAutoSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmitted.current) {
        handleViolation('tab_switch', 'Tab/window switch detected. This is violation 1 of 3. Your exam will auto-submit after 3 violations.');
      }
    };

    const handleBlur = () => {
      if (!hasAutoSubmitted.current) {
        handleViolation('window_blur', 'Window focus lost. This is a violation. Your exam will auto-submit after 3 violations.');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasAutoSubmitted.current && attemptId) {
        e.preventDefault();
        e.returnValue = 'You are leaving the exam. Your exam will be submitted automatically.';
        handleAutoSubmit('Exam auto-submitted: Page navigation detected.');
        try {
          navigator.sendBeacon(
            `${API_URL}/exams/${examId}/attempts/${attemptId}/submit`,
            new Blob([], { type: 'application/json' })
          );
        } catch (err) {
          console.error('Beacon submit failed:', err);
        }
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
  }, [handleViolation, handleAutoSubmit, attemptId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAutoSubmitted.current) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        handleViolation('copy', 'Copy/Paste is prohibited. This is a violation.');
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleViolation('print_screen', 'Print is prohibited. This is a violation.');
      }

      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        handleViolation('devtools', 'Developer tools access is prohibited. This is a violation.');
      }

      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
        e.preventDefault();
        handleViolation('tab_switch', 'Page refresh is prohibited. This is a violation.');
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleViolation('devtools', 'View source is prohibited. This is a violation.');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleViolation]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasAutoSubmitted.current) {
      handleViolation('right_click', 'Right-click is disabled during the exam. This is a violation.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (!hasAutoSubmitted.current) {
      handleViolation('paste', 'Pasting is prohibited. This is a violation.');
    }
  };

  const checkIfExamAlreadyTaken = async () => {
    try {
      const checkRes = await fetch(`${API_URL}/exams/${examId}/attempts`, { headers });
      if (checkRes.ok) {
        const json = await checkRes.json();
        const attemptsData = json.data || json;
        const completedAttempt = Array.isArray(attemptsData) && attemptsData.find(
          (a: any) => a.status === 'graded' || a.status === 'submitted'
        );

        if (completedAttempt) {
          alert('You have already taken this exam. You cannot take it again.');
          navigate('/dashboard', { replace: true });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error checking exam status:', err);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const alreadyTaken = await checkIfExamAlreadyTaken();
      if (alreadyTaken) return;
      initExam();
    };

    init();
  }, [examId]);

  useEffect(() => {
    if (timeLeftRef.current <= 0 || !exam || hasAutoSubmitted.current) return;

    intervalRef.current = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleAutoSubmit('Exam auto-submitted: Time elapsed.');
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [exam, handleAutoSubmit]);

  const initExam = async () => {
    try {
      const examRes = await fetch(`${API_URL}/exams/${examId}`, { headers });
      if (!examRes.ok) throw new Error('Failed to fetch exam');
      const examJson = await examRes.json();
      const examData = examJson.data || examJson;
      const durationMinutes = Number(examData.duration_minutes) || 0;
      setExam({ ...examData, duration_minutes: durationMinutes });
      const totalSeconds = durationMinutes * 60;
      timeLeftRef.current = totalSeconds;
      setTimeLeft(totalSeconds);

      const attemptRes = await fetch(`${API_URL}/exams/${examId}/attempts`, {
        method: 'POST',
        headers,
      });
      if (!attemptRes.ok) throw new Error('Failed to start attempt');
      const attemptJson = await attemptRes.json();
      const attempt = attemptJson.data || attemptJson;
      setAttemptId(attempt.id);

      const questionsRes = await fetch(`${API_URL}/exams/${examId}/questions`, { headers });
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

  const saveAnswer = useCallback(async (questionId: number, value: { selected_option_id?: number; text_answer?: string }) => {
    if (!attemptId) return;
    try {
      await fetch(`${API_URL}/exams/${examId}/attempts/${attemptId}/answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question_id: questionId, ...value }),
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  }, [attemptId, examId, headers]);

  const handleAnswerChange = (
    questionId: number,
    value: { selected_option_id?: number; text_answer?: string }
  ) => {
    if (hasAutoSubmitted.current) return;

    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!attemptId) return;

    if (value.text_answer !== undefined) {
      pendingAnswerRef.current = { questionId, value };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        pendingAnswerRef.current = null;
        saveAnswer(questionId, value);
      }, 600);
    } else {
      saveAnswer(questionId, value);
    }
  };

  const flushPendingAnswer = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (pendingAnswerRef.current) {
      const { questionId, value } = pendingAnswerRef.current;
      pendingAnswerRef.current = null;
      await saveAnswer(questionId, value);
    }
  };

  const handleSubmitExam = async () => {
    if (submitting || !attemptId || hasAutoSubmitted.current) return;
    const confirmed = window.confirm('Are you sure you want to submit your exam?');
    if (!confirmed) return;

    setSubmitting(true);
    await flushPendingAnswer();

    try {
      const res = await fetch(
        `${API_URL}/exams/${examId}/attempts/${attemptId}/submit`,
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
          {warning}
          {violationCount > 0 && violationCount < VIOLATION_THRESHOLD && (
            <span className="violation-count"> ({violationCount}/{VIOLATION_THRESHOLD} violations)</span>
          )}
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
                onPaste={handlePaste}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
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
