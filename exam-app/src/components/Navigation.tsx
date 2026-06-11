import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        const data = json.data || json.notifications || json;
        const notificationsList = Array.isArray(data) ? data : (data.items || []);
        setNotifications(notificationsList);
        const unread = notificationsList.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour ago`;
    return `${diffDays} day ago`;
  };

  return (
    <header className="app-navigation">
      <div className="nav-brand">
        <Link to="/dashboard"><span>EMS</span></Link>
      </div>
      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <Link to="/question-bank">Question Bank</Link>
        )}
        <Link to="/courses">Courses</Link>
        <Link to="/profile">Profile</Link>
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <Link to="/admin">
            {user?.role === 'admin' ? 'Admin' : 'Instructor Panel'}
          </Link>
        )}
      </nav>
      <div className="nav-actions">
        {/* Notification Bell */}
        <div className="notification-container">
          <button 
            className="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="mark-all-read">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notif.notification_type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{getTimeAgo(notif.created_at)}</div>
                      </div>
                      {!notif.is_read && <div className="unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <span className="nav-user">
          {user?.first_name || user?.username || 'Guest'}
        </span>
        <button type="button" onClick={handleLogout} className="nav-logout">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navigation;