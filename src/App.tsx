// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Students = lazy(() => import('@/pages/Students'));
const Teachers = lazy(() => import('@/pages/Teachers'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const StudentAttendance = lazy(() => import('@/pages/StudentAttendance'));
const ClassWiseAttendance = lazy(() => import('@/pages/ClassWiseAttendance'));
const Exams = lazy(() => import('@/pages/exam/Exams'));
const CreateExam = lazy(() => import('@/pages/exam/CreateExam'));
const TakeExam = lazy(() => import('@/pages/exam/TakeExam'));
const ExamResults = lazy(() => import('@/pages/exam/ExamResults'));
const ResultsDashboard = lazy(() => import('@/pages/exam/ResultsDashboard'));
const ExamCertificate = lazy(() => import('@/pages/exam/Certificate'));
const ExamsAnalytics = lazy(() => import('@/pages/exam/ExamsAnalytics'));
const ExamAnalyticsDetails = lazy(() => import('@/pages/ExamAnalyticsDetails'));
const AIInsights = lazy(() => import('@/pages/AIInsights'));
const Settings = lazy(() => import('@/pages/Settings'));
const Certificates = lazy(() => import('@/pages/Certificates'));
const Communication = lazy(() => import('@/pages/Communication'));
const Syllabus = lazy(() => import('@/pages/SyllabusNew'));
const SubjectsManagement = lazy(() => import('@/pages/SubjectsManagement'));
const Transport = lazy(() => import('@/pages/Transport'));
const TimetableManagement = lazy(() => import('@/pages/TimetableManagement'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const UserSettings = lazy(() => import('@/pages/UserSettings'));

// Progress Reports Module Pages
const ExamSetupPage = lazy(() => import('@/modules/progress-reports/ExamSetupPage'));
const MarksEntryPage = lazy(() => import('@/modules/progress-reports/MarksEntryPage'));
const ClassProgressPage = lazy(() => import('@/modules/progress-reports/ClassProgressPage'));
const StudentReportCardPage = lazy(() => import('@/modules/progress-reports/StudentReportCardPage'));
const PublishResultsPage = lazy(() => import('@/modules/progress-reports/PublishResultsPage'));
const ProgressAnalyticsPage = lazy(() => import('@/modules/progress-reports/ProgressAnalyticsPage'));

// Progress Report Module Pages
const ProgressAdminDashboard = lazy(() => import('@/pages/admin/dashboard/AdminDashboard'));
const ProgressTeacherEnterMarks = lazy(() => import('@/pages/teacher/marks/EnterMarks'));
const ProgressTeacherMySubjects = lazy(() => import('@/pages/teacher/marks/MySubjects'));
const ProgressTeacherMarksHistory = lazy(() => import('@/pages/teacher/marks/MarksHistory'));
const ProgressTeacherVerifyMarks = lazy(() => import('@/pages/teacher/class-teacher/VerifyMarks'));
const ProgressTeacherAddRemarks = lazy(() => import('@/pages/teacher/class-teacher/AddRemarks'));
const ProgressTeacherFinalReport = lazy(() => import('@/pages/teacher/class-teacher/FinalReport'));
const ProgressStudentDashboard = lazy(() => import('@/pages/student/dashboard/StudentDashboard'));
const ProgressStudentMyMarks = lazy(() => import('@/pages/student/performance/MyMarks'));
const ProgressStudentGraph = lazy(() => import('@/pages/student/performance/ProgressGraph'));
const ProgressStudentReportCard = lazy(() => import('@/pages/student/performance/ReportCard'));
const ProgressParentDashboard = lazy(() => import('@/pages/parent/ParentDashboard'));
const ProgressParentChildPerformance = lazy(() => import('@/pages/parent/child/ChildPerformance'));
const ProgressParentDownloadReport = lazy(() => import('@/pages/parent/child/DownloadReport'));
const ProgressParentComparison = lazy(() => import('@/pages/parent/child/Comparison'));

// Dashboard pages
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/dashboard/TeacherDashboard'));
const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard'));

// Cashier Pages
const CashierDashboard = lazy(() => import('./pages/cashier/CashierDashboard'));
const DailyCollectionReport = lazy(() => import('./pages/cashier/DailyCollectionReport'));
const CashierReceipts = lazy(() => import('./pages/cashier/CashierReceipts'));
const CashierAccountSettings = lazy(() => import('./pages/cashier/CashierAccountSettings'));
const CashierStatement = lazy(() => import('./pages/cashier/CashierStatement'));

// Principal Pages
const PrincipalDashboard = lazy(() => import('./pages/principal/PrincipalDashboard'));
const PrincipalStudentsView = lazy(() => import('./pages/principal/PrincipalStudentsView'));
const PrincipalTeachersView = lazy(() => import('./pages/principal/PrincipalTeachersView'));
const PrincipalAttendanceView = lazy(() => import('./pages/principal/PrincipalAttendanceView'));
const PrincipalFinanceView = lazy(() => import('./pages/principal/PrincipalFinanceView'));
const PrincipalExamsView = lazy(() => import('./pages/principal/PrincipalExamsView'));
const PrincipalTransportView = lazy(() => import('./pages/principal/PrincipalTransportView'));
const PrincipalAnnouncements = lazy(() => import('./pages/principal/PrincipalAnnouncements'));
const PrincipalReports = lazy(() => import('./pages/principal/PrincipalReports'));

// Driver Pages
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverSchedule = lazy(() => import('./pages/driver/DriverSchedule'));
const DriverStudentList = lazy(() => import('./pages/driver/DriverStudentList'));
const StartTrip = lazy(() => import('./pages/driver/StartTrip'));
const TripHistory = lazy(() => import('./pages/driver/TripHistory'));
const VehicleInfo = lazy(() => import('./pages/driver/VehicleInfo'));
const FuelLogPage = lazy(() => import('./pages/driver/FuelLogPage'));
const StudentAttendancePage = lazy(() => import('./pages/driver/StudentAttendancePage'));
const VehicleChecklistPage = lazy(() => import('./pages/driver/VehicleChecklistPage'));
const IncidentReportPage = lazy(() => import('./pages/driver/IncidentReportPage'));
const MaintenanceRequestPage = lazy(() => import('./pages/driver/MaintenanceRequestPage'));
const RouteMapView = lazy(() => import('./pages/driver/RouteMapView'));
const EmergencyContacts = lazy(() => import('./pages/driver/EmergencyContacts'));

// Finance Management Pages
const Collections = lazy(() => import('@/pages/finance/Collections'));
const PaymentHistory = lazy(() => import('@/pages/finance/PaymentHistory'));
const RecordPayment = lazy(() => import('@/pages/finance/RecordPayment'));
const FinancialReports = lazy(() => import('@/pages/finance/FinancialReports'));
const FeeDefaulters = lazy(() => import('@/pages/finance/FeeDefaulters'));
const ReceiptView = lazy(() => import('@/pages/finance/ReceiptView'));

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
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Role-based Route Component
const RoleBasedRoute = ({
  children,
  allowedRoles
}: {
  children?: React.ReactNode;
  allowedRoles: string[]
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to user's role-specific dashboard instead of generic /dashboard
    const roleDashboards: Record<string, string> = {
      admin: '/dashboard/admin',
      owner: '/dashboard',
      teacher: '/dashboard/teacher',
      student: '/dashboard/student',
      parent: '/dashboard',
      accountant: '/finance/collections',
      cashier: '/cashier/dashboard',
      principal: '/principal/dashboard',
      driver: '/driver/dashboard',
    };
    const redirectPath = user ? roleDashboards[user.role] || '/login' : '/login';
    return <Navigate to={redirectPath} replace />;
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
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
                  <Route path="/attendance/class-wise" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <ClassWiseAttendance />
                    </RoleBasedRoute>
                  } />
                  <Route path="/student/attendance" element={
                    <RoleBasedRoute allowedRoles={['student']}>
                      <StudentAttendance />
                    </RoleBasedRoute>
                  } />
                  <Route path="/my-attendance" element={
                    <RoleBasedRoute allowedRoles={['student']}>
                      <StudentAttendance />
                    </RoleBasedRoute>
                  } />
                  
                  {/* Exam Routes */}
                  <Route path="/exams" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher', 'student']}>
                      <Exams />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/create" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <CreateExam />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/analytics" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <ExamsAnalytics />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/analytics/:examId" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher']}>
                      <ExamAnalyticsDetails />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/:examId/take" element={
                    <RoleBasedRoute allowedRoles={['student']}>
                      <TakeExam />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/:examId/results" element={
                    <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin', 'owner']}>
                      <ExamResults />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/:examId/dashboard" element={
                    <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin', 'owner']}>
                      <ResultsDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/exams/:examId/certificate" element={
                    <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin', 'owner']}>
                      <ExamCertificate />
                    </RoleBasedRoute>
                  } />

                  {/* Progress Reports Routes (Independent from Exams & Results) */}
                  <Route path="/progress-reports/exam-setup" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <ExamSetupPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress-reports/marks-entry" element={
                    <RoleBasedRoute allowedRoles={['teacher']}>
                      <MarksEntryPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress-reports/class-progress" element={
                    <RoleBasedRoute allowedRoles={['teacher']}>
                      <ClassProgressPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress-reports/report-card" element={
                    <RoleBasedRoute allowedRoles={['admin', 'parent', 'student']}>
                      <StudentReportCardPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress-reports/publish-results" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <PublishResultsPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress-reports/analytics" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <ProgressAnalyticsPage />
                    </RoleBasedRoute>
                  } />

                  {/* ===== FINANCE MANAGEMENT ROUTES (Admin/Accountant/Owner) ===== */}
                  <Route path="/finance" element={
                    <RoleBasedRoute allowedRoles={['admin', 'accountant', 'owner']} />
                  }>
                    <Route index element={<Navigate to="collections" replace />} />
                    <Route path="collections" element={<Collections />} />
                    <Route path="payment-history" element={<PaymentHistory />} />
                    <Route path="receipt/:receiptNumber" element={<ReceiptView />} />
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
                  <Route path="/user-management" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <UserManagement />
                    </RoleBasedRoute>
                  } />
                  <Route path="/my-account" element={
                    <ProtectedRoute>
                      <UserSettings />
                    </ProtectedRoute>
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
                  <Route path="/subjects" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <SubjectsManagement />
                    </RoleBasedRoute>
                  } />
                  <Route path="/transport" element={
                    <RoleBasedRoute allowedRoles={['admin', 'parent', 'owner']}>
                      <Transport />
                    </RoleBasedRoute>
                  } />
                  <Route path="/timetable" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner', 'teacher', 'student']}>
                      <TimetableManagement />
                    </RoleBasedRoute>
                  } />

                  {/* Progress Report Routes */}
                  <Route path="/progress/admin" element={
                    <RoleBasedRoute allowedRoles={['admin', 'owner']}>
                      <ProgressAdminDashboard />
                    </RoleBasedRoute>
                  } />

                  <Route path="/progress/teacher/marks/enter" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherEnterMarks />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/teacher/marks/my-subjects" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherMySubjects />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/teacher/marks/history" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherMarksHistory />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/teacher/class-teacher/verify" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherVerifyMarks />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/teacher/class-teacher/remarks" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherAddRemarks />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/teacher/class-teacher/final-report" element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin', 'owner']}>
                      <ProgressTeacherFinalReport />
                    </RoleBasedRoute>
                  } />

                  <Route path="/progress/student" element={
                    <RoleBasedRoute allowedRoles={['student', 'admin', 'owner']}>
                      <ProgressStudentDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/student/marks" element={
                    <RoleBasedRoute allowedRoles={['student', 'admin', 'owner']}>
                      <ProgressStudentMyMarks />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/student/graph" element={
                    <RoleBasedRoute allowedRoles={['student', 'admin', 'owner']}>
                      <ProgressStudentGraph />
                    </RoleBasedRoute>
                  } />
                  <Route path="/progress/student/report-card" element={
                    <RoleBasedRoute allowedRoles={['student', 'admin', 'owner']}>
                      <ProgressStudentReportCard />
                    </RoleBasedRoute>
                  } />

                  {/* ===== PARENT ROUTES ===== */}
                  <Route path="/parent/dashboard" element={
                    <RoleBasedRoute allowedRoles={['parent', 'admin', 'owner']}>
                      <ProgressParentDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/parent/child-performance" element={
                    <RoleBasedRoute allowedRoles={['parent', 'admin', 'owner']}>
                      <ProgressParentChildPerformance />
                    </RoleBasedRoute>
                  } />
                  <Route path="/parent/download-report" element={
                    <RoleBasedRoute allowedRoles={['parent', 'admin', 'owner']}>
                      <ProgressParentDownloadReport />
                    </RoleBasedRoute>
                  } />
                  <Route path="/parent/comparison" element={
                    <RoleBasedRoute allowedRoles={['parent', 'admin', 'owner']}>
                      <ProgressParentComparison />
                    </RoleBasedRoute>
                  } />

                  {/* ===== PROGRESS PARENT ROUTES (legacy) ===== */}
                  <Route path="/cashier" element={<RoleBasedRoute allowedRoles={['cashier', 'admin', 'owner', 'accountant']} />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<CashierDashboard />} />
                    <Route path="my-account" element={<CashierAccountSettings />} />
                    <Route path="statement" element={<CashierStatement />} />
                    <Route path="daily-report" element={<DailyCollectionReport />} />
                    <Route path="receipts" element={<CashierReceipts />} />
                    <Route path="collect-fee" element={<RecordPayment />} />
                    <Route path="fee-defaulters" element={<FeeDefaulters />} />
                    <Route path="payment-history" element={<PaymentHistory />} />
                    <Route path="collections" element={<Collections />} />
                  </Route>

                  {/* ===== PRINCIPAL ROUTES ===== */}
                  <Route path="/principal" element={<RoleBasedRoute allowedRoles={['principal', 'admin', 'owner']} />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<PrincipalDashboard />} />
                    <Route path="students" element={<PrincipalStudentsView />} />
                    <Route path="teachers" element={<PrincipalTeachersView />} />
                    <Route path="attendance" element={<PrincipalAttendanceView />} />
                    <Route path="finance" element={<PrincipalFinanceView />} />
                    <Route path="exams" element={<PrincipalExamsView />} />
                    <Route path="transport" element={<PrincipalTransportView />} />
                    <Route path="announcements" element={<PrincipalAnnouncements />} />
                    <Route path="reports" element={<PrincipalReports />} />
                  </Route>

                  {/* ===== DRIVER ROUTES ===== */}
                  <Route path="/driver" element={<RoleBasedRoute allowedRoles={['driver', 'admin', 'owner']} />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DriverDashboard />} />
                    <Route path="my-schedule" element={<DriverSchedule />} />
                    <Route path="my-students" element={<DriverStudentList />} />
                    <Route path="start-trip" element={<StartTrip />} />
                    <Route path="trip-history" element={<TripHistory />} />
                    <Route path="my-vehicle" element={<VehicleInfo />} />
                    <Route path="fuel-log" element={<FuelLogPage />} />
                    <Route path="student-attendance" element={<StudentAttendancePage />} />
                    <Route path="vehicle-checklist" element={<VehicleChecklistPage />} />
                    <Route path="incident-report" element={<IncidentReportPage />} />
                    <Route path="maintenance" element={<MaintenanceRequestPage />} />
                    <Route path="route-map" element={<RouteMapView />} />
                    <Route path="emergency-contacts" element={<EmergencyContacts />} />
                  </Route>
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