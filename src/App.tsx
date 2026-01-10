// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Students = lazy(() => import('@/pages/Students'));
const Teachers = lazy(() => import('@/pages/Teachers'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const Exams = lazy(() => import('@/pages/Exams'));
const AIInsights = lazy(() => import('@/pages/AIInsights'));
const Fees = lazy(() => import('@/pages/Fees'));
const Settings = lazy(() => import('@/pages/Settings'));
const Certificates = lazy(() => import('@/pages/Certificates'));
const Communication = lazy(() => import('@/pages/Communication'));
const Syllabus = lazy(() => import('@/pages/Syllabus'));
const Transport = lazy(() => import('@/pages/Transport'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Dashboard pages
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/dashboard/TeacherDashboard'));
const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard'));

// Exam-related components - REMOVED or COMMENTED OUT since they don't exist
// const TakeExam = lazy(() => import('@/components/dashboard/Exams/TakeExam'));
// const ExamResults = lazy(() => import('@/pages/dashboard/ExamResults'));
// const CreateExam = lazy(() => import('@/pages/dashboard/CreateExam'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Role-based Route Component
const RoleBasedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" />
            
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* ---------- PUBLIC ROUTES ---------- */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />

                {/* ---------- PROTECTED ROUTES ---------- */}
                <Route element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/admin" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <AdminDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/dashboard/teacher" element={
                    <RoleBasedRoute allowedRoles={['teacher']}>
                      <TeacherDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/dashboard/student" element={
                    <RoleBasedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </RoleBasedRoute>
                  } />

                  {/* Main Routes */}
                  <Route path="/students" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <Students />
                    </RoleBasedRoute>
                  } />
                  <Route path="/teachers" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <Teachers />
                    </RoleBasedRoute>
                  } />
                  <Route path="/attendance" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <Attendance />
                    </RoleBasedRoute>
                  } />
                  
                  {/* Exam Routes - Using the main Exams page for now */}
                  <Route path="/exams" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher', 'student']}>
                      <Exams />
                    </RoleBasedRoute>
                  } />
                  {/* Comment out non-existent routes for now */}
                  {/* 
                  <Route path="/exams/create" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <CreateExam />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/:examId/take" element={
                    <RoleBasedRoute allowedRoles={['student']}>
                      <TakeExam />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/results" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher', 'student', 'parent']}>
                      <ExamResults />
                    </RoleBasedRoute>
                  } />
                  */}

                  {/* Other Routes */}
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="/fees" element={<Fees />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/certificates" element={<Certificates />} />
                  <Route path="/communication" element={<Communication />} />
                  <Route path="/syllabus" element={<Syllabus />} />
                  <Route path="/transport" element={<Transport />} />
                </Route>

                {/* ---------- FALLBACK ---------- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;