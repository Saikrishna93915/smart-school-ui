export type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'School Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  owner: 'School Owner',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  teacher: 'bg-secondary text-secondary-foreground',
  parent: 'bg-accent text-accent-foreground',
  student: 'bg-success text-success-foreground',
  owner: 'bg-warning text-warning-foreground',
};
