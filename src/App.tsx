// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

// Finance Management Pages
const Collections = lazy(() => import('@/pages/finance/Collections'));
const PaymentHistory = lazy(() => import('@/pages/finance/PaymentHistory'));
const RecordPayment = lazy(() => import('@/pages/finance/RecordPayment'));
const FinancialReports = lazy(() => import('@/pages/finance/FinancialReports'));
const FeeDefaulters = lazy(() => import('@/pages/finance/FeeDefaulters'));

// Fee Management Pages (For Parents/Students)

const FeeStructure = lazy(() => import('@/pages/fees/Structure'));
const CurrentDues = lazy(() => import('@/pages/fees/Dues'));
const PaymentHistoryStudent = lazy(() => import('@/pages/fees/History'));
const PayOnline = lazy(() => import('@/pages/fees/Pay'));
const Receipts = lazy(() => import('@/pages/fees/Receipts'));

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
  children?: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If children are provided render them, otherwise render nested routes via Outlet
  return <>{children ?? <Outlet />}</>;
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
                  
                  {/* Exam Routes */}
                  <Route path="/exams" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher', 'student']}>
                      <Exams />
                    </RoleBasedRoute>
                  } />

                  {/* ===== FINANCE MANAGEMENT ROUTES (Admin/Accountant/Owner) ===== */}
                  <Route path="/finance" element={
                    <RoleBasedRoute allowedRoles={['admin', 'accountant', 'owner']} />
                  }>
                    <Route index element={<Navigate to="collections" replace />} />
                    <Route path="collections" element={<Collections />} />
                    <Route path="payment-history" element={<PaymentHistory />} />
                    <Route path="record-payment" element={<RecordPayment />} />
                    <Route path="reports" element={<FinancialReports />} />
                    <Route path="defaulters" element={<FeeDefaulters />} />
                  </Route>

                  {/* ===== MY FEES ROUTES (Parent/Student) ===== */}
                  <Route path="/fees" element={
                    <RoleBasedRoute allowedRoles={['parent', 'student']}>
                    
                    </RoleBasedRoute>
                  }>
                    <Route index element={<Navigate to="structure" replace />} />
                    <Route path="structure" element={<FeeStructure />} />
                    <Route path="dues" element={<CurrentDues />} />
                    <Route path="history" element={<PaymentHistoryStudent />} />
                    <Route path="pay" element={<PayOnline />} />
                    <Route path="receipts" element={<Receipts />} />
                  </Route>

                  {/* Other Routes */}
                  <Route path="/ai-insights" element={
                    <RoleBasedRoute allowedRoles={['admin', 'teacher', 'owner']}>
                      <AIInsights />
                    </RoleBasedRoute>
                  } />
                  <Route path="/settings" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <Settings />
                    </RoleBasedRoute>
                  } />
                  <Route path="/certificates" element={
                    <RoleBasedRoute allowedRoles={['admin', 'student']}>
                      <Certificates />
                    </RoleBasedRoute>
                  } />
                  <Route path="/communication" element={
                    <RoleBasedRoute allowedRoles={['admin', 'teacher', 'parent', 'owner']}>
                      <Communication />
                    </RoleBasedRoute>
                  } />
                  <Route path="/syllabus" element={
                    <RoleBasedRoute allowedRoles={['admin', 'teacher', 'student']}>
                      <Syllabus />
                    </RoleBasedRoute>
                  } />
                  <Route path="/transport" element={
                    <RoleBasedRoute allowedRoles={['admin', 'parent', 'owner']}>
                      <Transport />
                    </RoleBasedRoute>
                  } />
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