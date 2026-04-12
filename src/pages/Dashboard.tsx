import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

import AdminDashboard from "./dashboard/AdminDashboard";
import OwnerDashboard from "./dashboard/OwnerDashboard";
import TeacherDashboard from "./dashboard/TeacherDashboard";
import ParentDashboard from "./parent/ParentDashboard";
import StudentDashboard from "./dashboard/StudentDashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  // Auth safety (optional – layout already protects, but safe)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;

    case "owner":
      return <OwnerDashboard />;

    case "teacher":
      return <TeacherDashboard />;

    case "parent":
      return <ParentDashboard />;

    case "student":
      return <StudentDashboard />;

    default:
      return <AdminDashboard />;
  }
}
