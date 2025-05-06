
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'agent' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('pulseUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string, role: UserRole) => {
    // Mock login - in a real app, this would validate against a backend
    if (email && password && role) {
      const mockUser: User = {
        id: '1',
        name: role === 'admin' ? 'Admin User' : 'Agent User',
        email,
        role,
        avatar: '/placeholder.svg',
      };
      
      setUser(mockUser);
      localStorage.setItem('pulseUser', JSON.stringify(mockUser));
      navigate('/dashboard');
      console.log(`Logged in as ${role}`);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pulseUser');
    navigate('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isAgent,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
