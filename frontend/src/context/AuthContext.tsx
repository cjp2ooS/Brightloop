import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customerId?: string;
  customer?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password?: string) => {
    // Default demo passwords if not supplied
    let pwd = password;
    if (!pwd) {
      if (email.includes('admin')) pwd = 'Admin@Brightloop123!';
      else if (email.includes('ops') || email.includes('billing')) pwd = 'Staff@Brightloop123!';
      else pwd = 'Customer@Loopflow123!';
    }

    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pwd }),
    });

    setAuthToken(res.token);
    setUser(res.user);
  };

  const quickSwitchRole = async (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    setLoading(true);
    let targetEmail = 'admin@brightloop.io';
    let targetPwd = 'Admin@Brightloop123!';

    if (role === 'STAFF') {
      targetEmail = 'sarah.ops@brightloop.io';
      targetPwd = 'Staff@Brightloop123!';
    } else if (role === 'CUSTOMER') {
      targetEmail = 'alex@acmetech.io';
      targetPwd = 'Customer@Loopflow123!';
    }

    await login(targetEmail, targetPwd);
    setLoading(false);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
