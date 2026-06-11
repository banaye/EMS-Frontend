import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      scheduleTokenRefresh(token);
    }
    setLoading(false);
  }, []);

  const getTokenExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch {
      return 0;
    }
  };

  const scheduleTokenRefresh = (token: string) => {
    const expiry = getTokenExpiry(token);
    const now = Date.now();
    const refreshIn = expiry - now - 60000;

    if (refreshIn <= 0) {
      doRefreshToken();
      return;
    }

    const timeout = setTimeout(() => {
      doRefreshToken();
    }, refreshIn);

    return () => clearTimeout(timeout);
  };

  const doRefreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      logout();
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refresh}`,
        },
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      const newToken = data.data?.access_token || data.access_token;
      localStorage.setItem('token', newToken);
      scheduleTokenRefresh(newToken);
    } catch {
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      const userData = data.data?.user || data.user;
      const token = data.data?.access_token || data.access_token;
      const refresh = data.data?.refresh_token || data.refresh_token;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh);

      scheduleTokenRefresh(token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};