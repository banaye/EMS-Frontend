import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const destination = user ? '/dashboard' : '/login';
    navigate(destination, { replace: true });
  }, [user, loading, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f5f5f5',
      color: '#374151',
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p>Redirecting you...</p>
    </div>
  );
};

export default NotFound;
