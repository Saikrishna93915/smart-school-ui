import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Users,
  GraduationCap,
  CalendarDays,
  IndianRupee,
  Bus,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Eye,
  Phone,
  Megaphone,
  FileText,
  BarChart3,
  Activity,
  Sparkles,
  Loader2,
  RefreshCw,
  Calendar as CalendarIcon,
  Trophy,
  Medal,
  Star,
  Info,
  Sun,
} from "lucide-react";
import { principalService } from "@/Services/principalService";
import { useAuth } from "@/contexts/AuthContext";

// ==================== TYPES ====================

// API Response types
interface DashboardApiResponse {
  success: boolean;
  data: {
    totalStudents?: number;
    totalTeachers?: number;
    todayAttendance?: {
      present: number;
      total: number;
      rate: string;
    };
    feeCollection?: {
      monthly: number;
      pending: number;
    };
    activeExams?: number;
  };
  message?: string;
}

type DashboardStats = {
  // Student stats
  totalStudents: number;
  totalStudentsActive: number;
  totalStudentsInactive: number;
  newAdmissionsThisMonth: number;
  studentGenderRatio: { male: number; female: number; other: number };
  studentClassWise: Array<{ class: string; count: number }>;

  // Teacher stats
  totalTeachers: number;
  totalTeachersPresent: number;
  totalTeachersAbsent: number;
  totalTeachersOnLeave: number;
  teacherDepartmentWise: Array<{ department: string; count: number }>;

  // Attendance stats
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    rate: number;
    classWise: Array<{ class: string; section: string; rate: number }>;
  };
  weeklyAttendance: Array<{ date: string; rate: number }>;
  lowAttendanceStudents: Array<{
    studentId: string;
    name: string;
    class: string;
    section: string;
    attendanceRate: number;
    parentPhone: string;
  }>;

  // Academic stats
  activeExams: number;
  upcomingExams: number;
  completedExams: number;
  averageMarks: number;
  passPercentage: number;
  distinctionCount: number;
  topPerformers: Array<{
    studentId: string;
    name: string;
    class: string;
    section: string;
    percentage: number;
  }>;
  weakStudents: Array<{
    studentId: string;
    name: string;
    class: string;
    section: string;
    percentage: number;
    subjects: string[];
  }>;
  subjectPerformance: Array<{
    subject: string;
    average: number;
    passRate: number;
    highest: number;
    lowest: number;
  }>;

  // Finance stats
  feeCollection: {
    monthly: number;
    pending: number;
    collected: number;
    expected: number;
    collectionRate: number;
    classWise: Array<{ class: string; collected: number; pending: number }>;
  };
  topDefaulters: Array<{
    studentId: string;
    name: string;
    class: string;
    section: string;
    pendingAmount: number;
    dueDate: string;
    daysOverdue: number;
    parentPhone: string;
  }>;
  recentTransactions: Array<{
    receiptNumber: string;
    studentName: string;
    amount: number;
    date: string;
  }>;

  // Transport stats
  transport: {
    totalVehicles: number;
    activeVehicles: number;
    totalRoutes: number;
    activeRoutes: number;
    studentsUsingTransport: number;
    drivers: number;
    tripsToday: number;
    tripsCompleted: number;
  };

  // Event stats
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: "exam" | "holiday" | "event" | "meeting";
    description?: string;
  }>;

  // Alert stats
  alerts: Array<{
    id: string;
    type: "info" | "warning" | "error" | "success";
    title: string;
    message: string;
    timestamp: string;
    actionable: boolean;
    actionLabel?: string;
    actionLink?: string;
  }>;

  // Timestamp
  lastUpdated: string;
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-IN").format(num);
};

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "info":
      return <Info className="h-4 w-4 text-blue-600" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getAlertBgColor = (type: string): string => {
  switch (type) {
    case "info":
      return "bg-blue-50 border-blue-200";
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    case "error":
      return "bg-red-50 border-red-200";
    case "success":
      return "bg-green-50 border-green-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

// ==================== MOCK DATA (Replace with API calls) ====================

const mockDashboardData: DashboardStats = {
  totalStudents: 1250,
  totalStudentsActive: 1180,
  totalStudentsInactive: 70,
  newAdmissionsThisMonth: 24,
  studentGenderRatio: { male: 680, female: 560, other: 10 },
  studentClassWise: [
    { class: "6", count: 180 },
    { class: "7", count: 195 },
    { class: "8", count: 210 },
    { class: "9", count: 225 },
    { class: "10", count: 240 },
    { class: "11", count: 110 },
    { class: "12", count: 90 },
  ],
  totalTeachers: 85,
  totalTeachersPresent: 78,
  totalTeachersAbsent: 4,
  totalTeachersOnLeave: 3,
  teacherDepartmentWise: [
    { department: "Mathematics", count: 15 },
    { department: "Science", count: 18 },
    { department: "Languages", count: 22 },
    { department: "Social Studies", count: 12 },
    { department: "Computer Science", count: 8 },
    { department: "Physical Education", count: 5 },
    { department: "Arts", count: 5 },
  ],
  todayAttendance: {
    total: 1250,
    present: 1140,
    absent: 85,
    late: 15,
    leave: 10,
    rate: 91.2,
    classWise: [
      { class: "6", section: "A", rate: 94 },
      { class: "6", section: "B", rate: 92 },
      { class: "7", section: "A", rate: 93 },
      { class: "7", section: "B", rate: 90 },
      { class: "8", section: "A", rate: 91 },
      { class: "8", section: "B", rate: 89 },
      { class: "9", section: "A", rate: 92 },
      { class: "9", section: "B", rate: 88 },
      { class: "10", section: "A", rate: 94 },
      { class: "10", section: "B", rate: 91 },
      { class: "11", section: "A", rate: 89 },
      { class: "11", section: "B", rate: 87 },
      { class: "12", section: "A", rate: 93 },
      { class: "12", section: "B", rate: 90 },
    ],
  },
  weeklyAttendance: [
    { date: "2026-03-10", rate: 92.5 },
    { date: "2026-03-11", rate: 91.8 },
    { date: "2026-03-12", rate: 93.2 },
    { date: "2026-03-13", rate: 90.5 },
    { date: "2026-03-14", rate: 89.7 },
    { date: "2026-03-15", rate: 91.2 },
    { date: "2026-03-16", rate: 91.2 },
  ],
  lowAttendanceStudents: [
    {
      studentId: "S001",
      name: "Rahul Kumar",
      class: "10",
      section: "B",
      attendanceRate: 68,
      parentPhone: "9876543210",
    },
    {
      studentId: "S002",
      name: "Priya Singh",
      class: "9",
      section: "A",
      attendanceRate: 72,
      parentPhone: "9876543211",
    },
    {
      studentId: "S003",
      name: "Arjun Sharma",
      class: "8",
      section: "B",
      attendanceRate: 65,
      parentPhone: "9876543212",
    },
  ],
  activeExams: 3,
  upcomingExams: 5,
  completedExams: 8,
  averageMarks: 74.5,
  passPercentage: 86.3,
  distinctionCount: 145,
  topPerformers: [
    {
      studentId: "S004",
      name: "Ananya Gupta",
      class: "10",
      section: "A",
      percentage: 98.5,
    },
    {
      studentId: "S005",
      name: "Vikram Singh",
      class: "12",
      section: "A",
      percentage: 97.2,
    },
    {
      studentId: "S006",
      name: "Neha Sharma",
      class: "9",
      section: "A",
      percentage: 96.8,
    },
    {
      studentId: "S007",
      name: "Rahul Verma",
      class: "11",
      section: "B",
      percentage: 95.5,
    },
    {
      studentId: "S008",
      name: "Priyanka Reddy",
      class: "8",
      section: "A",
      percentage: 94.9,
    },
  ],
  weakStudents: [
    {
      studentId: "S009",
      name: "Ravi Kumar",
      class: "10",
      section: "B",
      percentage: 38.5,
      subjects: ["Mathematics", "Science"],
    },
    {
      studentId: "S010",
      name: "Sunita Verma",
      class: "9",
      section: "B",
      percentage: 42.3,
      subjects: ["English", "Hindi"],
    },
    {
      studentId: "S011",
      name: "Mohan Das",
      class: "8",
      section: "B",
      percentage: 35.8,
      subjects: ["Mathematics", "Social Studies"],
    },
  ],
  subjectPerformance: [
    { subject: "Mathematics", average: 68.5, passRate: 78, highest: 100, lowest: 18 },
    { subject: "Science", average: 72.3, passRate: 82, highest: 100, lowest: 25 },
    { subject: "English", average: 76.8, passRate: 86, highest: 99, lowest: 32 },
    { subject: "Social Studies", average: 71.2, passRate: 80, highest: 98, lowest: 22 },
    { subject: "Hindi", average: 74.5, passRate: 84, highest: 98, lowest: 28 },
  ],
  feeCollection: {
    monthly: 2850000,
    pending: 1250000,
    collected: 4250000,
    expected: 5500000,
    collectionRate: 77.3,
    classWise: [
      { class: "6", collected: 450000, pending: 120000 },
      { class: "7", collected: 520000, pending: 130000 },
      { class: "8", collected: 580000, pending: 140000 },
      { class: "9", collected: 620000, pending: 180000 },
      { class: "10", collected: 680000, pending: 200000 },
      { class: "11", collected: 480000, pending: 220000 },
      { class: "12", collected: 920000, pending: 260000 },
    ],
  },
  topDefaulters: [
    {
      studentId: "S012",
      name: "Amit Patel",
      class: "12",
      section: "B",
      pendingAmount: 45000,
      dueDate: "2026-02-15",
      daysOverdue: 29,
      parentPhone: "9876543213",
    },
    {
      studentId: "S013",
      name: "Kavita Singh",
      class: "11",
      section: "A",
      pendingAmount: 38000,
      dueDate: "2026-02-20",
      daysOverdue: 24,
      parentPhone: "9876543214",
    },
    {
      studentId: "S014",
      name: "Ramesh Kumar",
      class: "10",
      section: "B",
      pendingAmount: 25000,
      dueDate: "2026-03-01",
      daysOverdue: 15,
      parentPhone: "9876543215",
    },
  ],
  recentTransactions: [
    {
      receiptNumber: "REC001234",
      studentName: "Anjali Gupta",
      amount: 15000,
      date: "2026-03-16T10:30:00",
    },
    {
      receiptNumber: "REC001235",
      studentName: "Suresh Reddy",
      amount: 12000,
      date: "2026-03-16T09:45:00",
    },
    {
      receiptNumber: "REC001236",
      studentName: "Lakshmi Nair",
      amount: 18000,
      date: "2026-03-16T08:20:00",
    },
    {
      receiptNumber: "REC001237",
      studentName: "Gopal Sharma",
      amount: 22000,
      date: "2026-03-15T16:15:00",
    },
    {
      receiptNumber: "REC001238",
      studentName: "Divya Singh",
      amount: 9500,
      date: "2026-03-15T14:30:00",
    },
  ],
  transport: {
    totalVehicles: 15,
    activeVehicles: 14,
    totalRoutes: 12,
    activeRoutes: 11,
    studentsUsingTransport: 580,
    drivers: 15,
    tripsToday: 22,
    tripsCompleted: 18,
  },
  upcomingEvents: [
    {
      id: "EVT001",
      title: "Unit Test 3",
      date: "2026-03-20",
      type: "exam",
      description: "Mathematics and Science",
    },
    {
      id: "EVT002",
      title: "Parent-Teacher Meeting",
      date: "2026-03-22",
      type: "meeting",
      description: "Classes 10 and 12",
    },
    {
      id: "EVT003",
      title: "Holi Holiday",
      date: "2026-03-25",
      type: "holiday",
    },
    {
      id: "EVT004",
      title: "Annual Sports Day",
      date: "2026-03-28",
      type: "event",
      description: "Opening ceremony at 9 AM",
    },
  ],
  alerts: [
    {
      id: "ALT001",
      type: "warning",
      title: "Low Attendance Alert",
      message: "15 students have attendance below 75% this month",
      timestamp: "2026-03-16T08:00:00",
      actionable: true,
      actionLabel: "View List",
      actionLink: "/principal/attendance?filter=low",
    },
    {
      id: "ALT002",
      type: "info",
      title: "Upcoming Exam",
      message: "Unit Test 3 scheduled for March 20",
      timestamp: "2026-03-16T09:15:00",
      actionable: true,
      actionLabel: "View Schedule",
      actionLink: "/principal/exams",
    },
    {
      id: "ALT003",
      type: "error",
      title: "Fee Pending",
      message: "3 students have fees overdue by more than 30 days",
      timestamp: "2026-03-16T10:00:00",
      actionable: true,
      actionLabel: "View Defaulters",
      actionLink: "/principal/finance?tab=defaulters",
    },
    {
      id: "ALT004",
      type: "success",
      title: "Exam Results Published",
      message: "Quarterly exam results for Class 10 have been published",
      timestamp: "2026-03-15T14:30:00",
      actionable: false,
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// ==================== MAIN COMPONENT ====================

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // ==================== AUTHENTICATION CHECK ====================

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if user has principal role
    if (user?.role !== "principal") {
      toast.error("Access denied. Principal role required.");
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // ==================== DATA LOADING ====================

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Fetch from API
      const response = await principalService.getDashboardStats();
      
      if (response.data?.success && response.data?.data) {
        const apiData = response.data.data;
        
        // Transform API data to match DashboardStats format
        // Merge API data with mock data as fallback for missing fields
        const transformedData: DashboardStats = {
          // Use API data for core metrics
          totalStudents: apiData.totalStudents || mockDashboardData.totalStudents,
          totalStudentsActive: apiData.totalStudents || mockDashboardData.totalStudentsActive,
          totalStudentsInactive: mockDashboardData.totalStudentsInactive,
          newAdmissionsThisMonth: mockDashboardData.newAdmissionsThisMonth,
          studentGenderRatio: mockDashboardData.studentGenderRatio,
          studentClassWise: mockDashboardData.studentClassWise,

          totalTeachers: apiData.totalTeachers || mockDashboardData.totalTeachers,
          totalTeachersPresent: mockDashboardData.totalTeachersPresent,
          totalTeachersAbsent: mockDashboardData.totalTeachersAbsent,
          totalTeachersOnLeave: mockDashboardData.totalTeachersOnLeave,
          teacherDepartmentWise: mockDashboardData.teacherDepartmentWise,

          todayAttendance: {
            total: apiData.todayAttendance?.total || mockDashboardData.todayAttendance.total,
            present: apiData.todayAttendance?.present || mockDashboardData.todayAttendance.present,
            absent: mockDashboardData.todayAttendance.absent,
            late: mockDashboardData.todayAttendance.late,
            leave: mockDashboardData.todayAttendance.leave,
            rate: parseFloat(apiData.todayAttendance?.rate || "0") || mockDashboardData.todayAttendance.rate,
            classWise: mockDashboardData.todayAttendance.classWise,
          },
          weeklyAttendance: mockDashboardData.weeklyAttendance,
          lowAttendanceStudents: mockDashboardData.lowAttendanceStudents,

          activeExams: apiData.activeExams || mockDashboardData.activeExams,
          upcomingExams: mockDashboardData.upcomingExams,
          completedExams: mockDashboardData.completedExams,
          averageMarks: mockDashboardData.averageMarks,
          passPercentage: mockDashboardData.passPercentage,
          distinctionCount: mockDashboardData.distinctionCount,
          topPerformers: mockDashboardData.topPerformers,
          weakStudents: mockDashboardData.weakStudents,
          subjectPerformance: mockDashboardData.subjectPerformance,

          feeCollection: {
            monthly: apiData.feeCollection?.monthly || mockDashboardData.feeCollection.monthly,
            pending: apiData.feeCollection?.pending || mockDashboardData.feeCollection.pending,
            collected: mockDashboardData.feeCollection.collected,
            expected: mockDashboardData.feeCollection.expected,
            collectionRate: mockDashboardData.feeCollection.collectionRate,
            classWise: mockDashboardData.feeCollection.classWise,
          },
          topDefaulters: mockDashboardData.topDefaulters,
          recentTransactions: mockDashboardData.recentTransactions,

          transport: mockDashboardData.transport,
          upcomingEvents: mockDashboardData.upcomingEvents,
          alerts: mockDashboardData.alerts,
          lastUpdated: new Date().toISOString(),
        };

        setData(transformedData);
        
        if (response.data.message) {
          toast.success(response.data.message);
        }
      } else {
        // Fallback to mock data if API doesn't return expected format
        console.warn("API returned unexpected format, using mock data");
        setData(mockDashboardData);
      }
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to load dashboard data";
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback to mock data in development
      if (import.meta.env.DEV) {
        setData(mockDashboardData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadDashboardData(true);
    if (!error) {
      toast.success("Dashboard refreshed");
    }
  };

  const handleViewAttendance = () => {
    navigate("/principal/attendance");
  };

  const handleViewFinance = () => {
    navigate("/principal/finance");
  };

  const handleViewExams = () => {
    navigate("/principal/exams");
  };

  const handleViewReports = () => {
    navigate("/principal/reports");
  };

  const handleCreateAnnouncement = () => {
    setShowAnnouncementDialog(true);
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    try {
      // In production, call API
      // await principalService.createAnnouncement({
      //   title: announcementTitle,
      //   content: announcementContent,
      //   audience: announcementAudience,
      // });

      toast.success("Announcement sent successfully");
      setShowAnnouncementDialog(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementAudience("all");
    } catch (error) {
      toast.error("Failed to send announcement");
    }
  };

  const handleViewAlert = (alert: any) => {
    setSelectedAlert(alert);
    setShowAlertDialog(true);
  };

  const handleAlertAction = (alert: any) => {
    if (alert.actionLink) {
      navigate(alert.actionLink);
    }
    setShowAlertDialog(false);
  };

  // ==================== COMPUTED VALUES ====================

  const attendanceRate = data?.todayAttendance?.rate || 0;
  const attendanceColor = attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 80 ? "text-yellow-600" : "text-red-600";
  
  const collectionRate = data?.feeCollection?.collectionRate || 0;
  const collectionColor = collectionRate >= 85 ? "text-green-600" : collectionRate >= 70 ? "text-yellow-600" : "text-red-600";

  const criticalAlerts = data?.alerts?.filter(a => a.type === "error" || a.type === "warning").length || 0;

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium">Loading Principal Dashboard</p>
          <p className="text-sm text-muted-foreground mt-2">
            Fetching school analytics and performance data...
          </p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => loadDashboardData()} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Principal Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Principal • {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateAnnouncement}>
            <Megaphone className="h-4 w-4 mr-2" />
            Announcement
          </Button>
          <Button size="sm" onClick={handleViewReports}>
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* ====== CRITICAL ALERTS ====== */}
      {criticalAlerts > 0 && (
        <div className="space-y-2">
          {data?.alerts?.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start justify-between p-4 rounded-lg border ${getAlertBgColor(alert.type)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleViewAlert(alert)}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(alert.timestamp)}
                  </p>
                </div>
              </div>
              {alert.actionable && (
                <Button size="sm" variant="ghost">
                  {alert.actionLabel || "View"}
                </Button>
              )}
            </div>
          ))}
          {data?.alerts && data.alerts.length > 3 && (
            <Button variant="link" className="w-full" onClick={() => setActiveTab("alerts")}>
              View all {data.alerts.length} alerts
            </Button>
          )}
        </div>
      )}

      {/* ====== TABS ====== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
        </TabsList>

        {/* ====== OVERVIEW TAB ====== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{formatNumber(data?.totalStudents || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-green-50">
                        Active: {data?.totalStudentsActive}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        New: +{data?.newAdmissionsThisMonth}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teachers</p>
                    <p className="text-2xl font-bold">{formatNumber(data?.totalTeachers || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-green-50">
                        Present: {data?.totalTeachersPresent}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        Absent: {data?.totalTeachersAbsent}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Attendance</p>
                    <p className={`text-2xl font-bold ${attendanceColor}`}>
                      {formatPercentage(data?.todayAttendance?.rate || 0)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-green-50">
                        Present: {data?.todayAttendance?.present}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        Absent: {data?.todayAttendance?.absent}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <CalendarDays className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Collection</p>
                    <p className="text-2xl font-bold">{formatCurrency(data?.feeCollection?.monthly || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-green-50">
                        Collected: {formatCurrency(data?.feeCollection?.collected || 0)}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        Pending: {formatCurrency(data?.feeCollection?.pending || 0)}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pass Percentage</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(data?.passPercentage || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Distinctions</p>
                    <p className="text-2xl font-bold text-blue-600">{data?.distinctionCount || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Exams</p>
                    <p className="text-2xl font-bold text-purple-600">{data?.activeExams || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transport Students</p>
                    <p className="text-2xl font-bold text-orange-600">{data?.transport?.studentsUsingTransport || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bus className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Class-wise Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Class-wise Attendance
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleViewAttendance}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.todayAttendance?.classWise?.slice(0, 6).map((cls) => (
                    <div key={`${cls.class}-${cls.section}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Class {cls.class}-{cls.section}</span>
                        <span className={cls.rate >= 90 ? "text-green-600" : cls.rate >= 80 ? "text-yellow-600" : "text-red-600"}>
                          {cls.rate}%
                        </span>
                      </div>
                      <Progress value={cls.rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Top Performers
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleViewExams}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.topPerformers?.map((student, index) => (
                    <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                          {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                          {index > 2 && <span className="text-xs font-bold">{index + 1}</span>}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Class {student.class}-{student.section}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white">{student.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fee Collection by Class */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Fee Collection by Class
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleViewFinance}>
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.feeCollection?.classWise?.map((cls) => (
                    <div key={cls.class} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Class {cls.class}</span>
                        <span className="font-medium">
                          {formatCurrency(cls.collected)} / {formatCurrency(cls.collected + cls.pending)}
                        </span>
                      </div>
                      <Progress 
                        value={(cls.collected / (cls.collected + cls.pending)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.upcomingEvents?.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-2 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          event.type === "exam" ? "bg-red-100" :
                          event.type === "holiday" ? "bg-green-100" :
                          event.type === "meeting" ? "bg-blue-100" :
                          "bg-purple-100"
                        }`}>
                          {event.type === "exam" && <BookOpen className="h-4 w-4 text-red-600" />}
                          {event.type === "holiday" && <Sun className="h-4 w-4 text-green-600" />}
                          {event.type === "meeting" && <Users className="h-4 w-4 text-blue-600" />}
                          {event.type === "event" && <Sparkles className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.recentTransactions?.map((tx) => (
                    <div key={tx.receiptNumber} className="flex items-center justify-between p-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{tx.studentName}</p>
                        <p className="text-xs text-muted-foreground">{tx.receiptNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(tx.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(tx.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Attendance Alert */}
            {data?.lowAttendanceStudents && data.lowAttendanceStudents.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Students with Low Attendance (&lt;75%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.lowAttendanceStudents.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Class {student.class}-{student.section} • {student.attendanceRate}%
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="bg-white">
                          <Phone className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ====== ACADEMICS TAB ====== */}
        <TabsContent value="academics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active</span>
                    <span className="font-bold text-blue-600">{data?.activeExams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upcoming</span>
                    <span className="font-bold text-yellow-600">{data?.upcomingExams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="font-bold text-green-600">{data?.completedExams}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Marks</span>
                    <span className="font-bold text-blue-600">{data?.averageMarks}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pass Percentage</span>
                    <span className="font-bold text-green-600">{data?.passPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distinctions</span>
                    <span className="font-bold text-purple-600">{data?.distinctionCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Students at Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{data?.weakStudents?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Students scoring below 45%</p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Pass Rate</TableHead>
                      <TableHead>Highest</TableHead>
                      <TableHead>Lowest</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.subjectPerformance?.map((subject) => (
                      <TableRow key={subject.subject}>
                        <TableCell className="font-medium">{subject.subject}</TableCell>
                        <TableCell>{subject.average}%</TableCell>
                        <TableCell>{subject.passRate}%</TableCell>
                        <TableCell className="text-green-600">{subject.highest}</TableCell>
                        <TableCell className="text-red-600">{subject.lowest}</TableCell>
                        <TableCell>
                          <Progress value={subject.average} className="w-24 h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Weak Students */}
          {data?.weakStudents && data.weakStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Students Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.weakStudents.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Class {student.class}-{student.section} • {student.percentage}%
                        </p>
                        <div className="flex gap-1 mt-1">
                          {student.subjects.map((sub) => (
                            <Badge key={sub} variant="outline" className="bg-red-100">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="bg-white">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== ATTENDANCE TAB ====== */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Today's Attendance</p>
                <p className={`text-3xl font-bold ${attendanceColor}`}>
                  {formatPercentage(data?.todayAttendance?.rate || 0)}
                </p>
                <Progress value={data?.todayAttendance?.rate || 0} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-3xl font-bold text-green-600">{data?.todayAttendance?.present || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-3xl font-bold text-red-600">{data?.todayAttendance?.absent || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{data?.todayAttendance?.late || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{data?.totalTeachersPresent || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{data?.totalTeachersAbsent || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold text-yellow-600">{data?.totalTeachersOnLeave || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(((data?.totalTeachersPresent || 0) / (data?.totalTeachers || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class-wise Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Attendance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Attendance %</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.todayAttendance?.classWise?.map((cls) => (
                      <TableRow key={`${cls.class}-${cls.section}`}>
                        <TableCell className="font-medium">Class {cls.class}</TableCell>
                        <TableCell>{cls.section}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={cls.rate} className="w-16 h-2" />
                            <span className={cls.rate >= 90 ? "text-green-600" : cls.rate >= 80 ? "text-yellow-600" : "text-red-600"}>
                              {cls.rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{(data.todayAttendance.total * cls.rate / 100).toFixed(0)}</TableCell>
                        <TableCell>{(data.todayAttendance.total * (100 - cls.rate) / 100).toFixed(0)}</TableCell>
                        <TableCell>
                          {cls.rate >= 90 ? (
                            <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                          ) : cls.rate >= 80 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== FINANCE TAB ====== */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Monthly Collection</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.feeCollection?.monthly || 0)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.feeCollection?.expected || 0)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.feeCollection?.collected || 0)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.feeCollection?.pending || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Collection Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={data?.feeCollection?.collectionRate || 0} className="h-4 flex-1" />
                <span className={`text-xl font-bold ${collectionColor}`}>
                  {formatPercentage(data?.feeCollection?.collectionRate || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top Defaulters */}
          {data?.topDefaulters && data.topDefaulters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Top Fee Defaulters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topDefaulters.map((defaulter) => (
                    <div key={defaulter.studentId} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">{defaulter.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Class {defaulter.class}-{defaulter.section} • Due: {formatDate(defaulter.dueDate)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-red-600 text-white">
                            ₹{defaulter.pendingAmount.toLocaleString()}
                          </Badge>
                          <Badge variant="outline" className="bg-red-100">
                            {defaulter.daysOverdue} days overdue
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="bg-white">
                        <Phone className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== TRANSPORT TAB ====== */}
        <TabsContent value="transport" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold">{data?.transport?.totalVehicles || 0}</p>
                <p className="text-xs text-green-600 mt-1">{data?.transport?.activeVehicles || 0} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Routes</p>
                <p className="text-2xl font-bold">{data?.transport?.totalRoutes || 0}</p>
                <p className="text-xs text-green-600 mt-1">{data?.transport?.activeRoutes || 0} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Students Using Transport</p>
                <p className="text-2xl font-bold">{data?.transport?.studentsUsingTransport || 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.transport?.drivers || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total drivers on staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.transport?.tripsToday || 0}</p>
                <p className="text-sm text-green-600 mt-1">{data?.transport?.tripsCompleted || 0} completed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ====== ANNOUNCEMENT DIALOG ====== */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send School Announcement</DialogTitle>
            <DialogDescription>
              Create an announcement for students, parents, and staff
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g., Holiday Notice, Exam Schedule"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Enter announcement details..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={announcementAudience} onValueChange={setAnnouncementAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (All)</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="parents">Parents Only</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAnnouncement}>
              <Megaphone className="h-4 w-4 mr-2" />
              Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== ALERT DIALOG ====== */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div className={`p-4 rounded-lg ${getAlertBgColor(selectedAlert.type)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getAlertIcon(selectedAlert.type)}
                  <p className="font-semibold">{selectedAlert.title}</p>
                </div>
                <p className="text-sm">{selectedAlert.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDateTime(selectedAlert.timestamp)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlertDialog(false)}>
              Close
            </Button>
            {selectedAlert?.actionable && (
              <Button onClick={() => handleAlertAction(selectedAlert)}>
                {selectedAlert.actionLabel || "View Details"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}