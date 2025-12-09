import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AdminDashboard from './dashboard/AdminDashboard';
import OwnerDashboard from './dashboard/OwnerDashboard';
import TeacherDashboard from './dashboard/TeacherDashboard';
import ParentDashboard from './dashboard/ParentDashboard';
import StudentDashboard from './dashboard/StudentDashboard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const getDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'owner':
        return <OwnerDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return <DashboardLayout>{getDashboard()}</DashboardLayout>;
}
