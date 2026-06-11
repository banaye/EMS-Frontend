import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation.tsx';
import '../styles/QuestionBank.css';

interface Option {
  id: number;
  text: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: number;
  text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  topic_tag: string;
  explanation: string;
  keywords?: string;  // ← ADDED: keywords for auto-grading
  options: Option[];
  created_at: string;
}

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchQuestions();
  }, [difficultyFilter, typeFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(
        `http://localhost:5000/api/questions?${params.toString()}`,
        { headers }
      );
      if (!response.ok) throw new Error('Failed to fetch questions');
      const json = await response.json();
      const questionsData = json.data || json.questions || json;
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      setError('');
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatType = (type: string) =>
    type === 'mcq' ? 'MCQ' : type === 'true_false' ? 'True/False' : 
    type === 'short_answer' ? 'Short Answer' : 'Essay';

  const isTextQuestion = (type: string) => {
    return type === 'short_answer' || type === 'essay';
  };

  if (loading) return <div className="loading">Loading question bank...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="question-bank-container">
      <Navigation />

      <div className="question-bank-content">
        <div className="question-bank-header">
          <h1>Question Bank</h1>
          <p>{filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <p className="no-questions">No questions found</p>
        ) : (
          <div className="questions-list">
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className={`question-item difficulty-${question.difficulty}`}
              >
                <div className="question-header">
                  <h3>Q{index + 1}: {question.text}</h3>
                  <div className="question-meta">
                    <span className="badge difficulty">{question.difficulty}</span>
                    <span className="badge type">{formatType(question.question_type)}</span>
                    {question.topic_tag && (
                      <span className="badge course">{question.topic_tag}</span>
                    )}
                  </div>
                </div>

                {/* ← ADDED: Display keywords for short answer/essay questions */}
                {isTextQuestion(question.question_type) && question.keywords && (
                  <div className="keywords-section">
                    <strong>🔑 Grading Keywords:</strong>
                    <span className="keywords-list">{question.keywords}</span>
                  </div>
                )}

                {question.options && question.options.length > 0 && (
                  <div className="options-list">
                    {question.options
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((option, optIndex) => (
                        <p
                          key={option.id}
                          className={`option ${option.is_correct ? 'correct-option' : ''}`}
                        >
                          {String.fromCharCode(65 + optIndex)}) {option.text}
                          {option.is_correct && ' ✓'}
                        </p>
                      ))}
                  </div>
                )}

                {question.explanation && (
                  <p className="correct-answer">
                      {question.explanation}
                  </p>
                )}

                <p className="question-date">
                  Added: {question.created_at?.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;