import React, { useEffect, useState } from 'react';
import '../../styles/ManageExams.css';

interface Question {
  id: number;
  text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  difficulty: string;
  topic_tag: string;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  question_count: number;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  is_published: boolean;
  created_at: string;
  questions?: Question[];
}

const ManageExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Questions from question bank
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [addingQuestions, setAddingQuestions] = useState(false);
  
  // Filters for question bank
  const [topicFilter, setTopicFilter] = useState('all');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  
  // Form states
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    passing_marks: 40,
    total_marks: 100,
  });

  const [editExam, setEditExam] = useState({
    id: 0,
    title: '',
    description: '',
    duration_minutes: 60,
    passing_marks: 40,
    total_marks: 100,
    is_published: false,
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchExams();
    fetchAvailableQuestions();
    fetchTopics();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exams', { headers });
      if (response.ok) {
        const json = await response.json();
        const examsData = json.data || json.exams || json;
        setExams(Array.isArray(examsData) ? examsData : []);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/questions', { headers });
      if (response.ok) {
        const json = await response.json();
        const questionsData = json.data || json.questions || json;
        const questions = Array.isArray(questionsData) ? questionsData : [];
        const topics = [...new Set(questions.map((q: Question) => q.topic_tag).filter(Boolean))];
        setAvailableTopics(topics);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchAvailableQuestions = async () => {
    try {
      let url = 'http://localhost:5000/api/questions';
      const params = new URLSearchParams();
      if (topicFilter !== 'all') params.append('topic', topicFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const json = await response.json();
        const questionsData = json.data || json.questions || json;
        setAvailableQuestions(Array.isArray(questionsData) ? questionsData : []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const fetchExamQuestions = async (examId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}/questions`, { headers });
      if (response.ok) {
        const json = await response.json();
        const questions = json.data || json.questions || json;
        setSelectedQuestions(questions.map((q: any) => q.id));
      }
    } catch (err) {
      console.error('Error fetching exam questions:', err);
    }
  };

  // Refresh questions when topic filter changes
  useEffect(() => {
    if (showQuestionsModal) {
      fetchAvailableQuestions();
    }
  }, [topicFilter]);

  const handleAddQuestionToExam = async (questionId: number) => {
    if (!selectedExam) return;
    
    setAddingQuestions(true);
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${selectedExam.id}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question_id: questionId }),
      });
      
      if (response.ok) {
        setSelectedQuestions([...selectedQuestions, questionId]);
        fetchExams();
        alert('Question added to exam successfully!');
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to add question');
      }
    } catch (err) {
      alert('Failed to add question');
    } finally {
      setAddingQuestions(false);
    }
  };

  const handleRemoveQuestionFromExam = async (questionId: number) => {
    if (!selectedExam) return;
    
    if (!window.confirm('Remove this question from the exam?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${selectedExam.id}/questions/${questionId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
        fetchExams();
        alert('Question removed from exam!');
      } else {
        alert('Failed to remove question');
      }
    } catch (err) {
      alert('Failed to remove question');
    }
  };

  const handleAddExam = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers,
        body: JSON.stringify(newExam),
      });
      if (response.ok) {
        fetchExams();
        setShowCreateModal(false);
        setNewExam({
          title: '',
          description: '',
          duration_minutes: 60,
          passing_marks: 40,
          total_marks: 100,
        });
        alert('Exam created successfully!');
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to create exam');
      }
    } catch (err) {
      alert('Failed to add exam');
    }
  };

  const handleUpdateExam = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${editExam.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: editExam.title,
          description: editExam.description,
          duration_minutes: editExam.duration_minutes,
          total_marks: editExam.total_marks,
          passing_marks: editExam.passing_marks,
          is_published: editExam.is_published,
        }),
      });
      if (response.ok) {
        fetchExams();
        setShowEditModal(false);
        setSelectedExam(null);
        alert('Exam updated successfully!');
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to update exam');
      }
    } catch (err) {
      alert('Failed to update exam');
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
          method: 'DELETE',
          headers,
        });
        if (response.ok) {
          fetchExams();
          alert('Exam deleted successfully!');
        }
      } catch (err) {
        alert('Failed to delete exam');
      }
    }
  };

  const handleViewExam = async (exam: Exam) => {
    setSelectedExam(exam);
    await fetchExamQuestions(exam.id);
    setShowViewModal(true);
  };

  const handleManageQuestions = async (exam: Exam) => {
    setSelectedExam(exam);
    await fetchExamQuestions(exam.id);
    setTopicFilter('all');
    setShowQuestionsModal(true);
  };

  const handleEditClick = (exam: Exam) => {
    setEditExam({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration_minutes: exam.duration_minutes,
      passing_marks: exam.passing_marks,
      total_marks: exam.total_marks,
      is_published: exam.is_published,
    });
    setShowEditModal(true);
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && exam.is_published) ||
      (statusFilter === 'draft' && !exam.is_published);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="loading">Loading exams...</div>;

  return (
    <div className="manage-exams">
      <div className="page-header">
        <h1>Manage Exams</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Create New Exam
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search exams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {filteredExams.length === 0 ? (
        <p className="no-exams">No exams found</p>
      ) : (
        <div className="exams-cards">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={`exam-card status-${exam.is_published ? 'active' : 'draft'}`}
            >
              <div className="exam-header">
                <h3>{exam.title}</h3>
                <span className={`status-badge ${exam.is_published ? 'active' : 'draft'}`}>
                  {exam.is_published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              <p className="description">{exam.description}</p>

              <div className="exam-details">
                <div className="detail-item">
                  <span className="label">Questions:</span>
                  <span className="value">{exam.question_count ?? 0}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">{exam.duration_minutes} mins</span>
                </div>
                <div className="detail-item">
                  <span className="label">Passing Marks:</span>
                  <span className="value">{exam.passing_marks}/{exam.total_marks}</span>
                </div>
              </div>

              <div className="created-info">
                <small>Created: {exam.created_at?.slice(0, 10)}</small>
              </div>

              <div className="actions">
                <button 
                  onClick={() => handleEditClick(exam)} 
                  className="btn-small btn-edit"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleViewExam(exam)} 
                  className="btn-small btn-view"
                >
                  View
                </button>
                <button
                  onClick={() => handleManageQuestions(exam)}
                  className="btn-small btn-questions"
                >
                  Questions
                </button>
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="btn-small btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Questions Modal - Add/Remove Questions from Question Bank */}
      {showQuestionsModal && selectedExam && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Manage Questions for: {selectedExam.title}</h2>
              <button onClick={() => setShowQuestionsModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="questions-layout">
                <div className="available-questions">
                  <h3>Question Bank</h3>
                  
                  {/* Filter by Topic Tag */}
                  <div className="filter-section">
                    <select
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Topics</option>
                      {availableTopics.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div className="questions-list">
                    {availableQuestions.map((q) => (
                      <div key={q.id} className="question-item">
                        <div className="question-text">{q.text}</div>
                        <div className="question-meta">
                          <span className="badge type">{q.question_type}</span>
                          <span className="badge difficulty">{q.difficulty}</span>
                          {q.topic_tag && <span className="badge topic">{q.topic_tag}</span>}
                        </div>
                        {selectedQuestions.includes(q.id) ? (
                          <button 
                            onClick={() => handleRemoveQuestionFromExam(q.id)}
                            className="btn-remove"
                            disabled={addingQuestions}
                          >
                            Remove
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAddQuestionToExam(q.id)}
                            className="btn-add"
                            disabled={addingQuestions}
                          >
                            Add to Exam
                          </button>
                        )}
                      </div>
                    ))}
                    {availableQuestions.length === 0 && (
                      <p className="no-data">No questions found for this topic</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowQuestionsModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Exam</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Exam Title</label>
                <input
                  type="text"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="Enter exam title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newExam.description}
                  onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  placeholder="Enter exam description"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={newExam.duration_minutes}
                    onChange={(e) =>
                      setNewExam({ ...newExam, duration_minutes: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    value={newExam.total_marks}
                    onChange={(e) =>
                      setNewExam({ ...newExam, total_marks: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    value={newExam.passing_marks}
                    onChange={(e) =>
                      setNewExam({ ...newExam, passing_marks: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddExam} className="btn btn-primary">
                Create Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Exam</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Exam Title</label>
                <input
                  type="text"
                  value={editExam.title}
                  onChange={(e) => setEditExam({ ...editExam, title: e.target.value })}
                  placeholder="Enter exam title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editExam.description}
                  onChange={(e) => setEditExam({ ...editExam, description: e.target.value })}
                  placeholder="Enter exam description"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={editExam.duration_minutes}
                    onChange={(e) =>
                      setEditExam({ ...editExam, duration_minutes: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    value={editExam.total_marks}
                    onChange={(e) =>
                      setEditExam({ ...editExam, total_marks: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    value={editExam.passing_marks}
                    onChange={(e) =>
                      setEditExam({ ...editExam, passing_marks: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editExam.is_published}
                    onChange={(e) => setEditExam({ ...editExam, is_published: e.target.checked })}
                  />
                  Publish Exam
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleUpdateExam} className="btn btn-primary">
                Update Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {showViewModal && selectedExam && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Exam Details</h2>
              <button onClick={() => setShowViewModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="view-details">
                <div className="detail-row">
                  <strong>Title:</strong> {selectedExam.title}
                </div>
                <div className="detail-row">
                  <strong>Description:</strong> {selectedExam.description}
                </div>
                <div className="detail-row">
                  <strong>Duration:</strong> {selectedExam.duration_minutes} minutes
                </div>
                <div className="detail-row">
                  <strong>Total Marks:</strong> {selectedExam.total_marks}
                </div>
                <div className="detail-row">
                  <strong>Passing Marks:</strong> {selectedExam.passing_marks}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${selectedExam.is_published ? 'active' : 'draft'}`}>
                    {selectedExam.is_published ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Questions:</strong> {selectedExam.question_count ?? 0}
                </div>
                <div className="detail-row">
                  <strong>Created At:</strong> {selectedExam.created_at?.slice(0, 10)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
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

export default ManageExams;