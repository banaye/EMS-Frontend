import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation.tsx';
import '../styles/StudentProfile.css';

interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
}

interface ExamAttempt {
  id: number;
  status: string;
  score: number;
  percentage: number;
  is_passed: boolean;
}

interface Course {
  id: number;
  title: string;
  level: string;
  is_published: boolean;
}

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    bio: '',
    avatar_url: '',
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchProfile();
    if (user?.role === 'student') fetchStudentStats();
    if (user?.role === 'instructor') fetchInstructorStats();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', { headers });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const json = await response.json();
      const data: Profile = json.data || json;
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      });
      setError('');
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exams', { headers });
      const json = await res.json();
      const exams = json.data || json.exams || json;
      if (Array.isArray(exams) && exams.length > 0) {
        const allAttempts: ExamAttempt[] = [];
        for (const exam of exams.slice(0, 5)) {
          const attRes = await fetch(
            `http://localhost:5000/api/exams/${exam.id}/attempts`,
            { headers }
          );
          const attJson = await attRes.json();
          const att = attJson.data || attJson;
          if (Array.isArray(att)) allAttempts.push(...att);
        }
        setAttempts(allAttempts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInstructorStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses', { headers });
      const json = await res.json();
      const data = json.data || json.courses || json;
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to save profile');
      const json = await response.json();
      const updated: Profile = json.data || json;
      setProfile(updated);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const [uploading, setUploading] = useState(false);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    setError('Please upload an image file.');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setError('Image must be under 2MB.');
    return;
  }

  setUploading(true);
  try {
    // Convert to base64 and use as avatar_url
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;

      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ avatar_url: base64 }),
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const json = await response.json();
      const updated: Profile = json.data || json;
      setProfile(updated);
      setFormData((prev) => ({ ...prev, avatar_url: base64 }));
      setError('');
    };
    reader.readAsDataURL(file);
  } catch (err) {
    setError('Failed to upload image. Please try again.');
  } finally {
    setUploading(false);
  }
};

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Administrator';
    if (role === 'instructor') return ' Instructor';
    return ' Student';
  };

  const getProfileTitle = (role: string) => {
    if (role === 'admin') return 'Admin Profile';
    if (role === 'instructor') return 'Instructor Profile';
    return 'Student Profile';
  };

  // Student stats
  const totalAttempts = attempts.length;
  const gradedAttempts = attempts.filter((a) => a.status === 'graded');
  const passedAttempts = gradedAttempts.filter((a) => a.is_passed);
  const avgScore = gradedAttempts.length
    ? Math.round(
        gradedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
          gradedAttempts.length
      )
    : 0;

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error && !profile) return <div className="error">{error}</div>;
  if (!profile) return <div className="error">Profile not found</div>;

  return (
    <div className="profile-container">
      <Navigation />

      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="avatar-circle">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" />
              ) : (
                <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
              )}
            </div>
            <div>
              <h1>{getProfileTitle(profile.role)}</h1>
              <p className="profile-welcome">
                Welcome back, {profile.first_name || profile.username}!
              </p>
              <span className="role-badge">{getRoleLabel(profile.role)}</span>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="edit-btn">
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-grid">
          {/* Personal Information */}
          <div className="profile-card">
            <h2>Personal Information</h2>

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter last name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                placeholder="Email address"
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                placeholder="Username"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>

            <div className="avatar-section">
  <div className="avatar-circle">
    {profile.avatar_url ? (
      <img src={profile.avatar_url} alt="avatar" />
    ) : (
      <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
    )}
  </div>
  <label className="avatar-upload-btn" title="Upload profile picture">
    {uploading ? 'Uploading...' : '📷 Change Photo'}
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      style={{ display: 'none' }}
      disabled={uploading}
    />
  </label>
</div>

            {isEditing && (
              <button
                onClick={handleSaveProfile}
                className="save-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Account Information */}
          <div className="profile-card">
            <h2>Account Information</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Role</span>
                <span className="stat-value">{getRoleLabel(profile.role)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className="stat-value">
                  {profile.is_active ? ' Active' : 'Inactive'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Verified</span>
                <span className="stat-value">
                  {profile.is_verified ? 'Yes' : ' No'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {profile.created_at?.slice(0, 10)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Login</span>
                <span className="stat-value">
                  {profile.last_login?.slice(0, 10)}
                </span>
              </div>
            </div>
          </div>

          {/* Student Stats */}
          {profile.role === 'student' && (
            <div className="profile-card">
              <h2> Academic Stats</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Attempts</span>
                  <span className="stat-value">{totalAttempts}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Passed</span>
                  <span className="stat-value">{passedAttempts.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Failed</span>
                  <span className="stat-value">
                    {gradedAttempts.length - passedAttempts.length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-value">{avgScore}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructor Stats */}
          {profile.role === 'instructor' && (
            <div className="profile-card">
              <h2> My Courses</h2>
              {courses.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>No courses created yet.</p>
              ) : (
                <div className="courses-list">
                  {courses.map((course) => (
                    <div key={course.id} className="course-item">
                      <span className="course-title">{course.title}</span>
                      <div className="course-meta">
                        <span className="badge">{course.level}</span>
                        <span className={`badge ${course.is_published ? 'published' : 'draft'}`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Stats */}
          {profile.role === 'admin' && (
            <div className="profile-card">
              <h2>🛡️ Admin Access</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Access Level</span>
                  <span className="stat-value">Full Access</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Permissions</span>
                  <span className="stat-value">All Roles</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  As an admin you have full access to manage users, courses, exams, and system settings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;