import React, { useEffect, useState } from 'react';
import '../../styles/ManageQuestions.css';

interface Option {
  text: string;
  is_correct: boolean;
  id?: number;
}

interface Question {
  id: number;
  text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  topic_tag: string;
  explanation: string;
  keywords?: string;  // ← ADDED
  created_at: string;
  options?: Option[];
}

const ManageQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    question_type: 'mcq' as 'mcq' | 'true_false' | 'short_answer' | 'essay',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topic_tag: '',
    explanation: '',
    keywords: '',  // ← ADDED
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ] as Option[],
  });

  const [editQuestion, setEditQuestion] = useState({
    id: 0,
    text: '',
    question_type: 'mcq' as 'mcq' | 'true_false' | 'short_answer' | 'essay',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topic_tag: '',
    explanation: '',
    keywords: '',  // ← ADDED
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ] as Option[],
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/questions', { headers });
      if (response.ok) {
        const json = await response.json();
        const questionsData = json.data || json.questions || json;
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetails = async (questionId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/questions/${questionId}`, { headers });
      if (response.ok) {
        const json = await response.json();
        const questionData = json.data || json;
        return questionData;
      }
    } catch (err) {
      console.error('Error fetching question details:', err);
    }
    return null;
  };

  const isTextQuestion = (type: string) => {
    return type === 'short_answer' || type === 'essay';
  };

  const handleAddQuestion = async () => {
    try {
      const payload: any = {
        text: newQuestion.text,
        question_type: newQuestion.question_type,
        difficulty: newQuestion.difficulty,
        topic_tag: newQuestion.topic_tag,
        explanation: newQuestion.explanation,
        options: isTextQuestion(newQuestion.question_type) ? [] : newQuestion.options,
      };

      // ← ADDED: include keywords for text questions
      if (isTextQuestion(newQuestion.question_type) && newQuestion.keywords) {
        payload.keywords = newQuestion.keywords;
      }

      const response = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchQuestions();
        setShowCreateModal(false);
        resetNewQuestionForm();
        alert('Question added successfully!');
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to add question');
      }
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      const payload: any = {
        text: editQuestion.text,
        question_type: editQuestion.question_type,
        difficulty: editQuestion.difficulty,
        topic_tag: editQuestion.topic_tag,
        explanation: editQuestion.explanation,
        options: isTextQuestion(editQuestion.question_type) ? [] : editQuestion.options,
      };

      // ← ADDED: include keywords for text questions
      if (isTextQuestion(editQuestion.question_type) && editQuestion.keywords) {
        payload.keywords = editQuestion.keywords;
      }

      const response = await fetch(`http://localhost:5000/api/questions/${editQuestion.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchQuestions();
        setShowEditModal(false);
        alert('Question updated successfully!');
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to update question');
      }
    } catch (err) {
      alert('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/questions/${questionId}`, {
          method: 'DELETE',
          headers,
        });
        if (response.ok) {
          fetchQuestions();
          alert('Question deleted successfully!');
        } else {
          alert('Failed to delete question');
        }
      } catch (err) {
        alert('Failed to delete question');
      }
    }
  };

  const handleViewQuestion = async (question: Question) => {
    const fullQuestion = await fetchQuestionDetails(question.id);
    setSelectedQuestion(fullQuestion || question);
    setShowViewModal(true);
  };

  const handleEditClick = async (question: Question) => {
    const fullQuestion = await fetchQuestionDetails(question.id);
    const questionData = fullQuestion || question;
    
    setEditQuestion({
      id: questionData.id,
      text: questionData.text,
      question_type: questionData.question_type,
      difficulty: questionData.difficulty,
      topic_tag: questionData.topic_tag || '',
      explanation: questionData.explanation || '',
      keywords: questionData.keywords || '',  // ← ADDED
      options: questionData.options && questionData.options.length > 0 
        ? questionData.options 
        : [
            { text: '', is_correct: true },
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false },
          ],
    });
    setShowEditModal(true);
  };

  const resetNewQuestionForm = () => {
    setNewQuestion({
      text: '',
      question_type: 'mcq',
      difficulty: 'medium',
      topic_tag: '',
      explanation: '',
      keywords: '',  // ← ADDED
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    });
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean, isEdit: boolean = false) => {
    if (isEdit) {
      const updated = [...editQuestion.options];
      if (field === 'is_correct') {
        updated.forEach((o, i) => (o.is_correct = i === index));
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      setEditQuestion({ ...editQuestion, options: updated });
    } else {
      const updated = [...newQuestion.options];
      if (field === 'is_correct') {
        updated.forEach((o, i) => (o.is_correct = i === index));
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      setNewQuestion({ ...newQuestion, options: updated });
    }
  };

  const formatType = (type: string) =>
    type === 'mcq' ? 'MCQ' : type === 'true_false' ? 'True/False' : 
    type === 'short_answer' ? 'Short Answer' : 'Essay';

  const formatDifficulty = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return ' Easy';
      case 'medium': return ' Medium';
      case 'hard': return ' Hard';
      default: return difficulty;
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading questions...</div>;

  return (
    <div className="manage-questions">
      <div className="page-header">
        <h1>Manage Questions</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Add New Question
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredQuestions.length === 0 ? (
        <p className="no-questions">No questions found</p>
      ) : (
        <div className="questions-list">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <h3>{question.text}</h3>
                <div className="question-badges">
                  <span className={`badge type-${question.question_type}`}>
                    {formatType(question.question_type)}
                  </span>
                  <span className={`badge difficulty-${question.difficulty}`}>
                    {formatDifficulty(question.difficulty)}
                  </span>
                </div>
              </div>

              <div className="question-meta">
                {question.topic_tag && (
                  <span className="meta-item"> {question.topic_tag}</span>
                )}
                {/* ← ADDED: display keywords for text questions */}
                {isTextQuestion(question.question_type) && question.keywords && (
                  <span className="meta-item">🔑 Keywords: {question.keywords}</span>
                )}
                {question.explanation && (
                  <span className="meta-item"> {question.explanation.substring(0, 50)}...</span>
                )}
                <span className="meta-item">
                  Added: {question.created_at?.slice(0, 10)}
                </span>
              </div>

              <div className="question-actions">
                <button 
                  onClick={() => handleViewQuestion(question)} 
                  className="btn-small btn-view"
                >
                  View
                </button>
                <button 
                  onClick={() => handleEditClick(question)} 
                  className="btn-small btn-edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="btn-small btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Add New Question</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Enter question text"
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newQuestion.question_type}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question_type: e.target.value as any,
                      })
                    }
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Topic Tag</label>
                <input
                  type="text"
                  value={newQuestion.topic_tag}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topic_tag: e.target.value })}
                  placeholder="e.g. python-basics, algorithms"
                />
              </div>

              <div className="form-group">
                <label>Explanation</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, explanation: e.target.value })
                  }
                  placeholder="Explain the correct answer"
                  rows={2}
                />
              </div>

              {/* ← ADDED: Keywords field for text questions */}
              {isTextQuestion(newQuestion.question_type) && (
                <div className="form-group">
                  <label>Grading Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={newQuestion.keywords}
                    onChange={(e) => setNewQuestion({ ...newQuestion, keywords: e.target.value })}
                    placeholder="e.g. python, loops, functions, variables"
                  />
                  <small>Keywords used for auto-grading short answer and essay questions</small>
                </div>
              )}

              {!isTextQuestion(newQuestion.question_type) && (
                <div className="form-group">
                  <label>
                    Options <small>(select the correct one)</small>
                  </label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="option-input">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={option.is_correct}
                        onChange={() => updateOption(index, 'is_correct', true, false)}
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value, false)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="option-text"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddQuestion} className="btn btn-primary">
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Edit Question</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={editQuestion.text}
                  onChange={(e) => setEditQuestion({ ...editQuestion, text: e.target.value })}
                  placeholder="Enter question text"
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={editQuestion.question_type}
                    onChange={(e) =>
                      setEditQuestion({
                        ...editQuestion,
                        question_type: e.target.value as any,
                      })
                    }
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={editQuestion.difficulty}
                    onChange={(e) =>
                      setEditQuestion({ ...editQuestion, difficulty: e.target.value as any })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Topic Tag</label>
                <input
                  type="text"
                  value={editQuestion.topic_tag}
                  onChange={(e) => setEditQuestion({ ...editQuestion, topic_tag: e.target.value })}
                  placeholder="e.g. python-basics, algorithms"
                />
              </div>

              <div className="form-group">
                <label>Explanation</label>
                <textarea
                  value={editQuestion.explanation}
                  onChange={(e) => setEditQuestion({ ...editQuestion, explanation: e.target.value })}
                  placeholder="Explain the correct answer"
                  rows={2}
                />
              </div>

              {/* ← ADDED: Keywords field for text questions */}
              {isTextQuestion(editQuestion.question_type) && (
                <div className="form-group">
                  <label>Grading Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={editQuestion.keywords}
                    onChange={(e) => setEditQuestion({ ...editQuestion, keywords: e.target.value })}
                    placeholder="e.g. python, loops, functions, variables"
                  />
                  <small>Keywords used for auto-grading short answer and essay questions</small>
                </div>
              )}

              {!isTextQuestion(editQuestion.question_type) && (
                <div className="form-group">
                  <label>
                    Options <small>(select the correct one)</small>
                  </label>
                  {editQuestion.options.map((option, index) => (
                    <div key={index} className="option-input">
                      <input
                        type="radio"
                        name="edit_correct_option"
                        checked={option.is_correct}
                        onChange={() => updateOption(index, 'is_correct', true, true)}
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value, true)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="option-text"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleUpdateQuestion} className="btn btn-primary">
                Update Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Question Modal */}
      {showViewModal && selectedQuestion && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Question Details</h2>
              <button onClick={() => setShowViewModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="view-details">
                <div className="detail-row">
                  <strong>Question:</strong>
                  <p>{selectedQuestion.text}</p>
                </div>
                
                <div className="detail-row">
                  <strong>Type:</strong>
                  <span className={`badge type-${selectedQuestion.question_type}`}>
                    {formatType(selectedQuestion.question_type)}
                  </span>
                </div>
                
                <div className="detail-row">
                  <strong>Difficulty:</strong>
                  <span className={`badge difficulty-${selectedQuestion.difficulty}`}>
                    {formatDifficulty(selectedQuestion.difficulty)}
                  </span>
                </div>
                
                {selectedQuestion.topic_tag && (
                  <div className="detail-row">
                    <strong>Topic Tag:</strong>
                    <code>{selectedQuestion.topic_tag}</code>
                  </div>
                )}
                
                {/* ← ADDED: display keywords in view modal */}
                {isTextQuestion(selectedQuestion.question_type) && selectedQuestion.keywords && (
                  <div className="detail-row">
                    <strong>Grading Keywords:</strong>
                    <code>{selectedQuestion.keywords}</code>
                  </div>
                )}
                
                {selectedQuestion.explanation && (
                  <div className="detail-row">
                    <strong>Explanation:</strong>
                    <p>{selectedQuestion.explanation}</p>
                  </div>
                )}
                
                {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                  <div className="detail-row">
                    <strong>Options:</strong>
                    <ul className="options-list">
                      {selectedQuestion.options.map((option, idx) => (
                        <li key={idx} className={option.is_correct ? 'correct-option' : ''}>
                          {option.is_correct && '✓ '}
                          {option.text || `Option ${String.fromCharCode(65 + idx)}`}
                          {option.is_correct && ' (Correct)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="detail-row">
                  <strong>Created At:</strong>
                  {new Date(selectedQuestion.created_at).toLocaleString()}
                </div>
                
                <div className="detail-row">
                  <strong>Question ID:</strong>
                  <code>#{selectedQuestion.id}</code>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedQuestion);
                }} 
                className="btn btn-primary"
              >
                Edit Question
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuestions;