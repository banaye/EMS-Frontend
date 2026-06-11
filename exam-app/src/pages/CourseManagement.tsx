import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import '../styles/CourseManagement.css';

interface CourseResource {
  id: number;
  title: string;
  resource_type: 'pdf' | 'link' | 'file' | 'video' | 'audio' | 'doc';
  url: string;
  file_size_kb?: number;
}

interface Course {
  id: number;
  title: string;
  short_description: string;
  level: string;
  price: number;
  is_published: boolean;
  duration_hours: number;
  rating: number;
  rating_count: number;
  enrolled_count: number;
  created_at: string;
  resources?: CourseResource[];
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const getToken = () => localStorage.getItem('token');
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  const getFileUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
    console.log('File URL:', fullUrl);
    return fullUrl;
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const json = await response.json();
      const coursesData = json.data || json.courses || json;
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setError('');
    } catch (err) {
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async (course: Course) => {
    setSelectedCourse(course);
    setResources([]);
    setResourcesLoading(true);
    setShowResourcesModal(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/courses/${course.id}/resources`,
        { headers: getHeaders() }
      );
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('You must be enrolled to access course materials.');
        }
        setResources([]);
        return;
      }

      const data = json.data || json;
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setResources([]);
    } finally {
      setResourcesLoading(false);
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
      window.open(fileUrl, '_blank');
    }
  };

  const handleEnrollCourse = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        { method: 'POST', headers: getHeaders() }
      );
      if (response.ok) {
        fetchCourses();
      } else {
        const json = await response.json();
        alert(json.message || 'Failed to enroll in course');
      }
    } catch {
      alert('Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const getResourceIcon = (type: string) => {
    if (type === 'pdf') return '📄';
    if (type === 'video') return '🎥';
    if (type === 'audio') return '🎵';
    if (type === 'link') return '🔗';
    return '📁';
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === 'free') return course.price === 0;
    if (filter === 'paid') return course.price > 0;
    return true;
  });

  if (loading) return <div className="loading">Loading courses...</div>;
  if (error && courses.length === 0) return <div className="error">{error}</div>;

  return (
    <div className="courses-container">
      <Navigation />
      <div className="courses-content">
        <div className="courses-header">
          <h1>Course Management</h1>
          <div className="filter-buttons">
            {(['all', 'free', 'paid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <p className="no-courses">No courses found</p>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className={`status-badge ${course.is_published ? 'available' : 'upcoming'}`}>
                    {course.is_published ? 'AVAILABLE' : 'UPCOMING'}
                  </span>
                </div>

                <p className="course-description">{course.short_description}</p>

                <div className="course-meta">
                  <span>{course.level}</span>
                  <span>⏱️ {course.duration_hours}hrs</span>
                  <span> {course.enrolled_count} students</span>
                  {course.rating > 0 && (
                    <span> {course.rating.toFixed(1)} ({course.rating_count})</span>
                  )}
                </div>

                <div className="course-price">
                  {course.price === 0 ? (
                    <span className="price-free">Free</span>
                  ) : (
                    <span className="price-paid">${course.price.toFixed(2)}</span>
                  )}
                </div>

                <div className="course-footer">
                  <button
                    onClick={() => handleEnrollCourse(course.id)}
                    className="enroll-btn"
                    disabled={enrollingId === course.id}
                  >
                    {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                  <button
                    onClick={() => fetchResources(course)}
                    className="download-btn-small"
                  >
                    📂 Materials
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources Modal */}
      {showResourcesModal && selectedCourse && (
        <div className="modal" onClick={() => setShowResourcesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📂 {selectedCourse.title} — Materials</h2>
              <button onClick={() => setShowResourcesModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              {resourcesLoading ? (
                <p>Loading materials...</p>
              ) : resources.length === 0 ? (
                <p className="no-resources">
                  No materials available. You may need to enroll first.
                </p>
              ) : (
                <div className="resources-list">
                  {resources.map((resource) => (
                    <div key={resource.id} className="resource-item-view">
                      <span className="resource-icon">
                        {getResourceIcon(resource.resource_type)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span className="resource-title">{resource.title}</span>
                        {resource.file_size_kb && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                            {resource.file_size_kb > 1024
                              ? `${(resource.file_size_kb / 1024).toFixed(1)} MB`
                              : `${resource.file_size_kb} KB`}
                          </span>
                        )}
                      </div>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowResourcesModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;