import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'admin@aischool.edu',
    role: 'admin',
    avatar: undefined,
    schoolId: 'SCH001',
  },
  teacher: {
    id: '2',
    name: 'Priya Sharma',
    email: 'teacher@aischool.edu',
    role: 'teacher',
    avatar: undefined,
    schoolId: 'SCH001',
  },
  parent: {
    id: '3',
    name: 'Anil Verma',
    email: 'parent@email.com',
    role: 'parent',
    avatar: undefined,
    schoolId: 'SCH001',
  },
  student: {
    id: '4',
    name: 'Arjun Verma',
    email: 'student@aischool.edu',
    role: 'student',
    avatar: undefined,
    schoolId: 'SCH001',
  },
  owner: {
    id: '5',
    name: 'Vikram Singh',
    email: 'owner@aischool.edu',
    role: 'owner',
    avatar: undefined,
    schoolId: 'SCH001',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = (email: string, password: string, role: UserRole) => {
    const user = mockUsers[role];
    setAuthState({
      user: { ...user, email },
      isAuthenticated: true,
    });
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
  };

  const switchRole = (role: UserRole) => {
    const user = mockUsers[role];
    setAuthState({
      user,
      isAuthenticated: true,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
