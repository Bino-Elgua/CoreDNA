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
    // Check local storage for mock session and ensure it's agency tier
    const storedUser = localStorage.getItem('core_dna_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Validate user object has required properties
        if (user && typeof user === 'object' && user.id && user.name && user.email && user.avatar) {
          // Ensure demo user always has agency tier
          if (user.id === 'user_123') {
            user.tier = 'agency';
          }
          setUser(user);
        } else {
          // Clear corrupted data
          localStorage.removeItem('core_dna_user');
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('core_dna_user');
      }
    } else {
      // Auto-login on first load if no user exists
      const mockUser: UserProfile = {
        id: 'user_123',
        name: 'Demo User',
        email: 'demo@coredna.ai',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=10B981&color=fff',
        tier: 'agency'
      };
      setUser(mockUser);
      localStorage.setItem('core_dna_user', JSON.stringify(mockUser));
    }
  }, []);

  const login = () => {
    // Clear old user data to force fresh agency tier login
    localStorage.removeItem('core_dna_user');
    
    const mockUser: UserProfile = {
      id: 'user_123',
      name: 'Demo User',
      email: 'demo@coredna.ai',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=10B981&color=fff',
      tier: 'agency' // Agency tier - full access to all features + white-label
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