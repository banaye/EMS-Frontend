import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ManageUsers.css';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

const ManageUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'student',
    password: 'Temp123!@#',
  });

  const [editUser, setEditUser] = useState<Partial<User>>({});

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers,
      });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
      const json = await response.json();
      const data = json.data || json.users || json;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add user');
      }
      await fetchUsers();
      setShowCreateModal(false);
      setNewUser({ username: '', first_name: '', last_name: '', email: '', role: 'student', password: 'Temp123!@#' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editUser),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update user');
      }
      await fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${user.id}/toggle-active`,
        { method: 'PATCH', headers }
      );
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    if (role === 'admin') return '#dc2626';
    if (role === 'instructor') return '#059669';
    return '#3b82f6';
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="manage-users">
      <div className="page-header">
        <h1>Manage Users</h1>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            + Add New User
          </button>
        )}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="name">
                  <div className="user-info">
                    <div
                      className="user-avatar"
                      style={{ backgroundColor: getRoleColor(u.role) }}
                    >
                      {u.first_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                    </div>
                    <span>{u.first_name} {u.last_name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </td>
                <td>
                  {isAdmin ? (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`status-toggle ${u.is_active ? 'active' : 'inactive'}`}
                    >
                      <span className="status-dot"></span>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  ) : (
                    <span className={`status-toggle ${u.is_active ? 'active' : 'inactive'}`}>
                      <span className="status-dot"></span>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="text-center">
                  {u.is_verified ? '✅' : '❌'}
                </td>
                <td className="date">{u.created_at?.slice(0, 10)}</td>
                <td className="actions">
                  <button
                    onClick={() => { setSelectedUser(u); setShowViewModal(true); }}
                    className="btn-small btn-view"
                  >
                      View
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEditClick(u)}
                        className="btn-small btn-edit"
                      >
                          Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn-small btn-delete"
                      >
                          Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="no-data">No users found</div>
        )}
      </div>

      {/* Create Modal — admin only */}
      {showCreateModal && isAdmin && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Temporary Password</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Temporary password"
                />
                <small className="hint">User should change this on first login</small>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddUser} className="btn btn-primary">Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal — admin only */}
      {showEditModal && isAdmin && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={editUser.first_name || ''}
                  onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editUser.last_name || ''}
                  onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editUser.role || 'student'}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editUser.is_active ? 'true' : 'false'}
                  onChange={(e) => setEditUser({ ...editUser, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdateUser} className="btn btn-primary">Update User</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal — all roles */}
      {showViewModal && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>User Details</h2>
              <button onClick={() => setShowViewModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="user-profile-header">
                <div
                  className="user-avatar-large"
                  style={{ backgroundColor: getRoleColor(selectedUser.role) }}
                >
                  {selectedUser.first_name?.[0]?.toUpperCase()}
                </div>
                <h3>{selectedUser.first_name} {selectedUser.last_name}</h3>
                <span className={`role-badge ${selectedUser.role}`}>
                  {selectedUser.role.toUpperCase()}
                </span>
              </div>
              <div className="detail-row"><strong>Username:</strong> {selectedUser.username}</div>
              <div className="detail-row"><strong>Email:</strong> {selectedUser.email}</div>
              <div className="detail-row">
                <strong>Status:</strong> {selectedUser.is_active ? 'Active' : ' Inactive'}
              </div>
              <div className="detail-row">
                <strong>Verified:</strong> {selectedUser.is_verified ? ' Yes' : ' No'}
              </div>
              <div className="detail-row">
                <strong>Joined:</strong> {selectedUser.created_at?.slice(0, 10)}
              </div>
              <div className="detail-row">
                <strong>Last Login:</strong> {selectedUser.last_login?.slice(0, 10) || 'Never'}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">Close</button>
              {isAdmin && (
                <button
                  onClick={() => { setShowViewModal(false); handleEditClick(selectedUser); }}
                  className="btn btn-primary"
                >
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;