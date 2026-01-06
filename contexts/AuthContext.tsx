import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Check local storage for mock session
    const storedUser = localStorage.getItem('core_dna_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = () => {
    const mockUser: UserProfile = {
      id: 'user_123',
      name: 'Demo User',
      email: 'demo@coredna.ai',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=8b5cf6&color=fff',
      tier: 'pro' // Enable Pro features by default for demo
    };
    setUser(mockUser);
    localStorage.setItem('core_dna_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('core_dna_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};