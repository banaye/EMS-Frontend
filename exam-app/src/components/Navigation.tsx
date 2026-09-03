import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';
import { API_URL } from '../config';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch(`${API_URL}/notifications`, {
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
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
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
      const response = await fetch(`${API_URL}/notifications/read-all`, {
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
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (showNotifications) {
        const target = e.target as HTMLElement;
        if (!target.closest('.notification-container')) {
          setShowNotifications(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="app-navigation">
      <div className="nav-brand">
        <Link to="/dashboard" onClick={closeMobileMenu}><span>EMS</span></Link>
      </div>

      <button
        className={`hamburger-btn ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div ref={mobileMenuRef} className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/dashboard" onClick={closeMobileMenu}>DASHBOARD</Link>
        {(user?.role === 'hod' || user?.role === 'instructor') && (
          <Link to="/question-bank" onClick={closeMobileMenu}>QUESTION BANK</Link>
        )}
        <Link to="/courses" onClick={closeMobileMenu}>COURSES</Link>
        <Link to="/profile" onClick={closeMobileMenu}>PROFILE</Link>
        {(user?.role === 'hod' || user?.role === 'instructor') && (
          <Link to="/hod" onClick={closeMobileMenu}>
            {user?.role === 'hod' ? 'HOD' : 'INSTRUCTOR'}
          </Link>
        )}
        <div className="mobile-nav-footer">
          <span className="nav-user">{user?.first_name || user?.username || 'Guest'}</span>
          <button type="button" onClick={handleLogout} className="nav-logout">LOGOUT</button>
        </div>
      </div>

      <div className="nav-actions">
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
        
        <span className="nav-user desktop-only">
          {user?.first_name || user?.username || 'Guest'}
        </span>
        <button type="button" onClick={handleLogout} className="nav-logout desktop-only">
          LOGOUT
        </button>
      </div>
    </header>
  );
};

export default Navigation;
