import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ManageCourses.css';

interface CourseResource {
  id: number;
  title: string;
  resource_type: 'pdf' | 'link' | 'file' | 'video' | 'audio' | 'doc';
  url: string;
  file_size_kb?: number;
}

interface Course {
  id: string;
  title: string;
  short_description: string;
  description?: string;
  instructor_id: number;
  enrolled_count: number;
  is_published: boolean;
  level: string;
  created_at: string;
  duration_hours: number;
  duration_minutes?: number;
  resources?: CourseResource[];
}

const ManageCourses: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'instructor';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('file');
  const [uploading, setUploading] = useState(false);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    level: 'beginner',
    is_published: false,
  });

  const [editCourse, setEditCourse] = useState({
    id: '',
    title: '',
    description: '',
    duration_minutes: 60,
    level: 'beginner',
    is_published: false,
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const getFileUrl = (url: string) =>
    url.startsWith('http') ? url : `http://localhost:5000${url}`;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/courses', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        const coursesData = json.data || json.courses || json;
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseResources = async (course: Course) => {
    setResourcesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/courses/${course.id}/resources`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const resources = json.data || json;
      setSelectedCourse({
        ...course,
        resources: Array.isArray(resources) ? resources : [],
      });
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setSelectedCourse(course);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleViewCourse = async (course: Course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
    await fetchCourseResources(course);
  };

  const handleAddCourse = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCourse),
      });
      if (response.ok) {
        fetchCourses();
        setShowCreateModal(false);
        setNewCourse({ title: '', description: '', duration_minutes: 60, level: 'beginner', is_published: false });
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to create course');
      }
    } catch {
      alert('Failed to add course');
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${editCourse.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editCourse.title,
          description: editCourse.description,
          duration_minutes: editCourse.duration_minutes,
          level: editCourse.level,
          is_published: editCourse.is_published,
        }),
      });
      if (response.ok) {
        fetchCourses();
        setShowEditModal(false);
        setSelectedCourse(null);
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to update course');
      }
    } catch {
      alert('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        fetchCourses();
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to delete course');
      }
    } catch {
      alert('Failed to delete course');
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile || !selectedCourse) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', resourceTitle || uploadFile.name);
    formData.append('resource_type', resourceType);

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${selectedCourse.id}/upload-resource`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        }
      );
      if (response.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setResourceTitle('');
        setResourceType('file');
        // Refresh resources in view modal if open
        await fetchCourseResources(selectedCourse);
        fetchCourses();
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to upload file');
      }
    } catch {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/resources/${resourceId}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      if (response.ok && selectedCourse) {
        await fetchCourseResources(selectedCourse);
      }
    } catch {
      alert('Failed to delete resource');
    }
  };

  const handleDownload = async (resource: CourseResource) => {
    const fileUrl = getFileUrl(resource.url);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = resource.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback to direct link
      window.open(fileUrl, '_blank');
    }
  };

  const handleEditClick = (course: Course) => {
    setEditCourse({
      id: course.id,
      title: course.title,
      description: course.short_description || course.description || '',
      duration_minutes: course.duration_hours ? course.duration_hours * 60 : 60,
      level: course.level || 'beginner',
      is_published: course.is_published || false,
    });
    setShowEditModal(true);
  };

  const getResourceIcon = (type: string) => {
    if (type === 'pdf') return '📄';
    if (type === 'link') return '🔗';
    if (type === 'video') return '🎥';
    if (type === 'audio') return '🎵';
    return '📁';
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="manage-courses">
      <div className="page-header">
        <h1>Manage Courses</h1>
        {isStaff && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            + Create New Course
          </button>
        )}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="courses-table-container">
        <table className="courses-table">
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Level</th>
              <th>Duration (hrs)</th>
              <th>Students</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td className="title">{course.title}</td>
                <td>{course.level || '—'}</td>
                <td className="text-center">{course.duration_hours || 0}</td>
                <td className="text-center">{course.enrolled_count || 0}</td>
                <td>
                  <span className={`status-badge ${course.is_published ? 'active' : 'draft'}`}>
                    {course.is_published ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td>{course.created_at ? course.created_at.slice(0, 10) : '—'}</td>
                <td className="actions">
                  <button onClick={() => handleViewCourse(course)} className="btn-small btn-view">
                    View
                  </button>
                  {isStaff && (
                    <>
                      <button onClick={() => handleEditClick(course)} className="btn-small btn-edit">
                        Edit
                      </button>
                      <button
                        onClick={() => { setSelectedCourse(course); setShowUploadModal(true); }}
                        className="btn-small btn-upload"
                      >
                        Upload
                      </button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="btn-small btn-delete">
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCourses.length === 0 && (
          <div className="no-data">No courses found</div>
        )}
      </div>

      {/* View Course Modal */}
      {showViewModal && selectedCourse && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Course Details</h2>
              <button onClick={() => setShowViewModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="view-details">
                <div className="detail-row"><strong>Title:</strong> {selectedCourse.title}</div>
                <div className="detail-row">
                  <strong>Description:</strong>{' '}
                  {selectedCourse.short_description || selectedCourse.description || 'No description provided'}
                </div>
                <div className="detail-row">
                  <strong>Level:</strong>{' '}
                  {selectedCourse.level
                    ? selectedCourse.level.charAt(0).toUpperCase() + selectedCourse.level.slice(1)
                    : 'Not specified'}
                </div>
                <div className="detail-row">
                  <strong>Duration:</strong> {selectedCourse.duration_hours} hours
                </div>
                <div className="detail-row">
                  <strong>Enrolled Students:</strong> {selectedCourse.enrolled_count || 0}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge ${selectedCourse.is_published ? 'active' : 'draft'}`}>
                    {selectedCourse.is_published ? 'Active' : 'Draft'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Created At:</strong>{' '}
                  {selectedCourse.created_at
                    ? new Date(selectedCourse.created_at).toLocaleDateString()
                    : 'Not available'}
                </div>

                <div className="resources-section">
                  <h3>Course Materials</h3>
                  {resourcesLoading ? (
                    <p>Loading materials...</p>
                  ) : selectedCourse.resources && selectedCourse.resources.length > 0 ? (
                    <div className="resources-list">
                      {selectedCourse.resources.map((resource) => (
                        <div key={resource.id} className="resource-item-view">
                          <span className="resource-icon">{getResourceIcon(resource.resource_type)}</span>
                          <span className="resource-title">{resource.title}</span>
                          {resource.file_size_kb && (
                            <span className="resource-size" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {resource.file_size_kb > 1024
                                ? `${(resource.file_size_kb / 1024).toFixed(1)} MB`
                                : `${resource.file_size_kb} KB`}
                            </span>
                          )}
                          <div className="resource-actions">
                            <button
                              onClick={() => window.open(getFileUrl(resource.url), '_blank')}
                              className="btn-small btn-view"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => handleDownload(resource)}
                              className="btn-small btn-download"
                            >
                              Download
                            </button>
                            {isStaff && (
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="btn-small btn-delete"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-resources">No materials uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {isStaff && (
                <button
                  onClick={() => { setShowViewModal(false); setShowUploadModal(true); }}
                  className="btn btn-primary"
                >
                  Upload Material
                </button>
              )}
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedCourse && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Upload Material for: {selectedCourse.title}</h2>
              <button onClick={() => setShowUploadModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select File</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadFile(e.target.files[0]);
                      setResourceTitle(e.target.files[0].name);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.mp4,.mp3,.zip,.txt,.jpg,.png,.pptx,.xlsx"
                />
                <small>Allowed: PDF, DOC, MP4, MP3, ZIP, TXT, JPG, PNG, PPTX, XLSX (Max 50MB)</small>
              </div>
              <div className="form-group">
                <label>Title (optional)</label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>
              <div className="form-group">
                <label>Resource Type</label>
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                  <option value="file">File</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="link">Link</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowUploadModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={!uploadFile || uploading}
                className="btn btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Course Title *</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={newCourse.duration_minutes}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, duration_minutes: parseInt(e.target.value) })
                  }
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCourse.is_published}
                    onChange={(e) => setNewCourse({ ...newCourse, is_published: e.target.checked })}
                  />
                  Publish immediately
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddCourse} className="btn btn-primary">Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Course Title *</label>
                <input
                  type="text"
                  value={editCourse.title}
                  onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={editCourse.description}
                  onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select
                  value={editCourse.level}
                  onChange={(e) => setEditCourse({ ...editCourse, level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={editCourse.duration_minutes}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, duration_minutes: parseInt(e.target.value) })
                  }
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editCourse.is_published}
                    onChange={(e) => setEditCourse({ ...editCourse, is_published: e.target.checked })}
                  />
                  Published
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdateCourse} className="btn btn-primary">Update Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;