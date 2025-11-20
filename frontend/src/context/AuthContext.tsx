import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('mzsa_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string) => {
    // Mock login - in a real app this would call an API
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        let role: UserRole = 'user';
        if (email.includes('admin')) role = 'admin';
        if (email.includes('manager')) role = 'manager';

        const mockUser: User = {
          id: '1',
          email,
          name: email.split('@')[0],
          role
        };
        setUser(mockUser);
        localStorage.setItem('mzsa_user', JSON.stringify(mockUser));
        resolve();
      }, 500);
    });
  };

  const register = async (email: string, name: string) => {
    // Mock registration
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name,
          role: 'user'
        };
        setUser(newUser);
        localStorage.setItem('mzsa_user', JSON.stringify(newUser));
        resolve();
      }, 500);
    });
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('mzsa_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
