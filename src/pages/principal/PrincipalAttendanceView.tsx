import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Bell,
  Eye,
  Download,
  Mail,
  Phone,
  LineChart,
  Target,
  School,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import principalService from "@/Services/principalService";


type ClassAttendance = {
  class: string;
  section: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
  teacher?: string;
  status: "excellent" | "good" | "average" | "poor";
};

type TeacherAttendance = {
  teacherId: string;
  name: string;
  department: string;
  status: "present" | "absent" | "late" | "leave";
  subject: string;
  checkInTime?: string;
};

type LowAttendanceStudent = {
  studentId: string;
  name: string;
  class: string;
  section: string;
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  parentPhone: string;
  parentEmail?: string;
  lastAttendance: string;
  trend: "improving" | "declining" | "stable";
};

type AttendanceOverviewData = {
  stats: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    percentage: number;
  };
  // For backward compatibility with mock data
  summary?: {
    today: {
      totalStudents: number;
      present: number;
      absent: number;
      late: number;
      leave: number;
      percentage: number;
      teacherPresent: number;
      teacherAbsent: number;
      teacherLate: number;
      teacherLeave: number;
    };
  };
  classWiseToday: ClassAttendance[];
  weeklyAttendance: {
    _id: string;
    present: number;
    total: number;
    percentage: number;
  }[];
  lowAttendance: LowAttendanceStudent[];
  teacherWise: TeacherAttendance[];
};

// ==================== UTILITY FUNCTIONS ====================

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd MMM yyyy");
  } catch {
    return "-";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "excellent":
      return "text-green-600";
    case "good":
      return "text-blue-600";
    case "average":
      return "text-yellow-600";
    case "poor":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "excellent":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    case "good":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
    case "average":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Average</Badge>;
    case "poor":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Improvement</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getTeacherStatusBadge = (status: string) => {
  switch (status) {
    case "present":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
    case "absent":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
    case "late":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Late</Badge>;
    case "leave":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">On Leave</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};


// ==================== MOCK DATA ====================

const mockAttendanceData: AttendanceOverviewData = {
  stats: {
    totalStudents: 1250,
    presentToday: 1140,
    absentToday: 85,
    onLeaveToday: 25,
    percentage: 91.2,
  },
  classWiseToday: [
    { class: "6", section: "A", total: 42, present: 39, absent: 2, late: 1, leave: 0, percentage: 92.9, teacher: "Mrs. Sharma", status: "excellent" },
    { class: "6", section: "B", total: 40, present: 37, absent: 2, late: 1, leave: 0, percentage: 92.5, teacher: "Mr. Verma", status: "excellent" },
    { class: "7", section: "A", total: 45, present: 41, absent: 3, late: 1, leave: 0, percentage: 91.1, teacher: "Ms. Reddy", status: "good" },
    { class: "7", section: "B", total: 43, present: 39, absent: 2, late: 1, leave: 1, percentage: 90.7, teacher: "Mr. Singh", status: "good" },
    { class: "8", section: "A", total: 44, present: 40, absent: 3, late: 1, leave: 0, percentage: 90.9, teacher: "Mrs. Gupta", status: "good" },
    { class: "8", section: "B", total: 42, present: 37, absent: 4, late: 0, leave: 1, percentage: 88.1, teacher: "Mr. Kumar", status: "average" },
    { class: "9", section: "A", total: 46, present: 42, absent: 3, late: 1, leave: 0, percentage: 91.3, teacher: "Ms. Patel", status: "good" },
    { class: "9", section: "B", total: 44, present: 38, absent: 4, late: 2, leave: 0, percentage: 86.4, teacher: "Mr. Reddy", status: "average" },
    { class: "10", section: "A", total: 48, present: 45, absent: 2, late: 1, leave: 0, percentage: 93.8, teacher: "Mrs. Singh", status: "excellent" },
    { class: "10", section: "B", total: 46, present: 42, absent: 3, late: 0, leave: 1, percentage: 91.3, teacher: "Mr. Sharma", status: "good" },
    { class: "11", section: "A", total: 38, present: 35, absent: 2, late: 1, leave: 0, percentage: 92.1, teacher: "Ms. Gupta", status: "excellent" },
    { class: "11", section: "B", total: 36, present: 32, absent: 3, late: 1, leave: 0, percentage: 88.9, teacher: "Mr. Verma", status: "average" },
    { class: "12", section: "A", total: 32, present: 30, absent: 1, late: 1, leave: 0, percentage: 93.8, teacher: "Mrs. Reddy", status: "excellent" },
    { class: "12", section: "B", total: 30, present: 27, absent: 2, late: 0, leave: 1, percentage: 90.0, teacher: "Mr. Kumar", status: "good" },
  ],
  teacherWise: [
    { teacherId: "T001", name: "Mrs. Sharma", department: "Mathematics", status: "present", subject: "Mathematics", checkInTime: "08:45 AM" },
    { teacherId: "T002", name: "Mr. Verma", department: "Science", status: "present", subject: "Physics", checkInTime: "08:50 AM" },
    { teacherId: "T003", name: "Ms. Reddy", department: "English", status: "late", subject: "English", checkInTime: "09:30 AM" },
    { teacherId: "T004", name: "Mr. Singh", department: "Social Studies", status: "present", subject: "History", checkInTime: "08:55 AM" },
    { teacherId: "T005", name: "Mrs. Gupta", department: "Science", status: "absent", subject: "Chemistry" },
    { teacherId: "T006", name: "Mr. Kumar", department: "Mathematics", status: "present", subject: "Algebra", checkInTime: "08:40 AM" },
    { teacherId: "T007", name: "Ms. Patel", department: "Hindi", status: "leave", subject: "Hindi" },
    { teacherId: "T008", name: "Mr. Reddy", department: "Physical Education", status: "present", subject: "Sports", checkInTime: "08:30 AM" },
    { teacherId: "T009", name: "Mrs. Singh", department: "Science", status: "present", subject: "Biology", checkInTime: "08:35 AM" },
    { teacherId: "T010", name: "Mr. Sharma", department: "Computer Science", status: "present", subject: "Programming", checkInTime: "08:45 AM" },
  ],
  weeklyAttendance: [
    { _id: "2026-03-10", present: 1120, total: 1250, percentage: 89.6 },
    { _id: "2026-03-11", present: 1135, total: 1250, percentage: 90.8 },
    { _id: "2026-03-12", present: 1145, total: 1250, percentage: 91.6 },
    { _id: "2026-03-13", present: 1130, total: 1250, percentage: 90.4 },
    { _id: "2026-03-14", present: 1110, total: 1250, percentage: 88.8 },
    { _id: "2026-03-15", present: 1125, total: 1250, percentage: 90.0 },
    { _id: "2026-03-16", present: 1140, total: 1250, percentage: 91.2 },
  ],
  lowAttendance: [
    { studentId: "S001", name: "Rohan Sharma", class: "8", section: "B", attendanceRate: 68.5, totalDays: 22, presentDays: 15, absentDays: 7, lastAttendance: "2026-03-14", trend: "declining", parentPhone: "9876543210" },
    { studentId: "S002", name: "Priya Singh", class: "9", section: "B", attendanceRate: 71.2, totalDays: 22, presentDays: 16, absentDays: 6, lastAttendance: "2026-03-15", trend: "stable", parentPhone: "9876543211" },
    { studentId: "S003", name: "Arjun Verma", class: "7", section: "A", attendanceRate: 72.8, totalDays: 22, presentDays: 16, absentDays: 6, lastAttendance: "2026-03-13", trend: "declining", parentPhone: "9876543212" },
  ],
};

// ==================== MAIN COMPONENT ====================

export default function PrincipalAttendanceView() {
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"summary" | "classes" | "teachers" | "students">("summary");
  const [showStudentDetailsDialog, setShowStudentDetailsDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LowAttendanceStudent | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // ==================== DATA LOADING ====================

  const loadAttendanceData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Call actual API
      const params: any = {};
      if (selectedDate) params.date = format(selectedDate, "yyyy-MM-dd");
      if (selectedClass !== "all") params.class = selectedClass;
      if (selectedSection !== "all") params.section = selectedSection;

      const response = await principalService.getAttendanceOverview();
      const apiData = response.data?.data || null;

      // Transform API data to match frontend format
      if (apiData) {
        setData({
          stats: apiData.stats || {
            totalStudents: 0,
            presentToday: 0,
            absentToday: 0,
            onLeaveToday: 0,
            percentage: 0,
          },
          classWiseToday: apiData.classWiseToday?.map((c: any) => ({
            class: c._id?.class || "",
            section: c._id?.section || "",
            total: c.total || 0,
            present: c.present || 0,
            absent: c.absent || 0,
            late: 0,
            leave: 0,
            percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
            teacher: "",
            status: "good",
          })) || [],
          teacherWise: apiData.teacherWise || [],
          weeklyAttendance: apiData.weeklyAttendance?.map((w: any) => ({
            _id: w._id || "",
            present: w.present || 0,
            total: w.total || 0,
            percentage: w.percentage || 0,
          })) || [],
          lowAttendance: apiData.lowAttendance?.map((s: any) => ({
            studentId: s._id || "",
            name: s.name || "",
            class: s.class || "",
            section: s.section || "",
            attendanceRate: Math.round(s.attendanceRate),
            totalDays: s.total || 0,
            presentDays: s.present || 0,
            parentPhone: s.parentPhone || "",
          })) || [],
        });
      } else {
        setData(mockAttendanceData);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedClass, selectedSection]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // ==================== COMPUTED VALUES ====================

  const filteredClasses = useMemo(() => {
    if (!data) return [];

    let filtered = [...(data.classWiseToday || [])];

    if (selectedClass !== "all") {
      filtered = filtered.filter((c) => c.class === selectedClass);
    }

    if (selectedSection !== "all") {
      filtered = filtered.filter((c) => c.section === selectedSection);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.teacher?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, selectedClass, selectedSection, searchTerm]);

  const filteredTeachers = useMemo(() => {
    if (!data) return [];

    let filtered = [...data.teacherWise];

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, filterStatus, searchTerm]);

  const filteredLowAttendance = useMemo(() => {
    if (!data) return [];

    let filtered = [...(data.lowAttendance || [])];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.parentPhone && s.parentPhone.includes(searchTerm))
      );
    }

    return filtered;
  }, [data, searchTerm]);

  const availableClasses = useMemo(() => {
    if (!data) return [];
    const classes = new Set(data.classWiseToday?.map((c) => c.class) || []);
    return Array.from(classes).sort();
  }, [data]);

  const availableSections = useMemo(() => {
    if (!data || selectedClass === "all") return [];
    const sections = new Set(
      data.classWiseToday?.filter((c) => c.class === selectedClass).map((c) => c.section) || []
    );
    return Array.from(sections).sort();
  }, [data, selectedClass]);

  const overallAttendanceRate = data?.stats?.percentage || 0;
  const attendanceColor = overallAttendanceRate >= 90 ? "text-green-600" : overallAttendanceRate >= 80 ? "text-yellow-600" : "text-red-600";

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadAttendanceData(true);
    toast.success("Attendance data refreshed");
  };

  const handleClassSelect = (value: string) => {
    setSelectedClass(value);
    setSelectedSection("all");
  };

  const handleViewClassDetails = (className: string, section: string) => {
    // Navigate to class details page
    navigate(`/principal/attendance/class/${className}/${section}`);
  };

  const handleViewStudentDetails = (student: LowAttendanceStudent) => {
    setSelectedStudent(student);
    setShowStudentDetailsDialog(true);
  };

  const handleContactParent = (phone: string, email?: string) => {
    // In production, integrate with communication service
    toast.success(`Contact options for parent: ${phone}${email ? `, ${email}` : ""}`);
  };

  const handleSendNotification = () => {
    toast.success("Notification sent to parents of low attendance students");
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = ["Class", "Section", "Total", "Present", "Absent", "Late", "Leave", "Percentage", "Status"];
    const rows = filteredClasses.map((c) => [
      c.class,
      c.section,
      c.total,
      c.present,
      c.absent,
      c.late,
      c.leave,
      c.percentage.toFixed(1),
      c.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Attendance data exported");
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Attendance Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor student and teacher attendance in real-time
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {format(selectedDate, "dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                  loadAttendanceData();
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderAlerts = () => {
    // Alerts are optional - backend may not always return them
    return null;
  };

  const renderSummaryCards = () => {
    if (!data) return null;

    // Support both new API structure and old mock data structure
    const stats = data.stats || data.summary?.today || {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      percentage: 0,
    };

    const today = {
      percentage: stats.percentage || 0,
      present: stats.presentToday || 0,
      absent: stats.absentToday || 0,
      late: 0,
      leave: stats.onLeaveToday || 0,
      teacherPresent: 0,
      teacherAbsent: 0,
      teacherLate: 0,
      teacherLeave: 0,
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Attendance</p>
                <p className={`text-2xl font-bold ${attendanceColor}`}>
                  {formatPercentage(today.percentage)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-center p-1 bg-green-50 rounded">
                <p className="text-xs text-green-600">Present</p>
                <p className="font-bold text-green-700">{today.present}</p>
              </div>
              <div className="text-center p-1 bg-red-50 rounded">
                <p className="text-xs text-red-600">Absent</p>
                <p className="font-bold text-red-700">{today.absent}</p>
              </div>
              <div className="text-center p-1 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-600">Late</p>
                <p className="font-bold text-yellow-700">{today.late}</p>
              </div>
              <div className="text-center p-1 bg-purple-50 rounded">
                <p className="text-xs text-purple-600">Leave</p>
                <p className="font-bold text-purple-700">{today.leave}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teacher Attendance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {today.teacherPresent}/{today.teacherPresent + today.teacherAbsent + today.teacherLeave}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-1 bg-green-50 rounded">
                <p className="text-xs text-green-600">Present</p>
                <p className="font-bold text-green-700">{today.teacherPresent}</p>
              </div>
              <div className="text-center p-1 bg-red-50 rounded">
                <p className="text-xs text-red-600">Absent</p>
                <p className="font-bold text-red-700">{today.teacherAbsent}</p>
              </div>
              <div className="text-center p-1 bg-purple-50 rounded">
                <p className="text-xs text-purple-600">Leave</p>
                <p className="font-bold text-purple-700">{today.teacherLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Average</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.weeklyAttendance && data.weeklyAttendance.length > 0 
                    ? (data.weeklyAttendance.reduce((sum, d) => sum + d.percentage, 0) / data.weeklyAttendance.length).toFixed(1) + '%'
                    : '0%'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days average
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <LineChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Target</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.stats?.percentage ? data.stats.percentage.toFixed(1) : '0'}% / 90%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={(data.stats?.percentage || 0) / 90 * 100} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeeklyTrend = () => {
    if (!data?.weeklyAttendance || data.weeklyAttendance.length === 0) return null;

    const maxPercentage = Math.max(...data.weeklyAttendance.map((d) => d.percentage), 1);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Weekly Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-2">
            {data.weeklyAttendance.map((day, index) => {
              const height = (day.percentage / maxPercentage) * 100;
              const dayName = day._id ? (() => {
                try {
                  return format(new Date(day._id + "T00:00:00"), "EEE");
                } catch {
                  return "Unknown";
                }
              })() : "";
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t ${
                        day.percentage >= 90
                          ? "bg-green-500"
                          : day.percentage >= 80
                          ? "bg-blue-500"
                          : day.percentage >= 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ height: `${Math.max(height, 20)}px` }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {dayName}: {day.percentage.toFixed(1)}% ({day.present}/{day.total})
                      </div>
                    </div>
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{dayName.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderClassWiseTable = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            Class-wise Attendance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={handleClassSelect}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {availableClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    Class {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
              disabled={selectedClass === "all"}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredClasses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <School className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No classes found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((row) => (
                  <TableRow key={`${row.class}-${row.section}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">Class {row.class}</TableCell>
                    <TableCell>{row.section}</TableCell>
                    <TableCell>{row.teacher || "-"}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell className="text-green-600 font-medium">{row.present}</TableCell>
                    <TableCell className="text-red-600 font-medium">{row.absent}</TableCell>
                    <TableCell className="text-yellow-600">{row.late}</TableCell>
                    <TableCell className="text-purple-600">{row.leave}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={row.percentage} className="w-16 h-2" />
                        <span className={getStatusColor(row.status)}>
                          {row.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewClassDetails(row.class, row.section)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTeacherAttendance = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            Teacher Attendance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No teachers found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.teacherId}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{getTeacherStatusBadge(teacher.status)}</TableCell>
                    <TableCell>{teacher.checkInTime || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderLowAttendance = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Low Attendance Students (&lt;75%)
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSendNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Notify Parents
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLowAttendance.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p>No students with low attendance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLowAttendance.map((student) => (
              <div
                key={student.studentId}
                className="p-3 border rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                onClick={() => handleViewStudentDetails(student)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-red-600 text-white">
                          {student.name
                            ? student.name.split(" ").map((n) => n[0]).join("")
                            : "NA"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Class {student.class}-{student.section} • Last: {formatDate(student.lastAttendance)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="ml-1 font-bold text-red-600">
                          {student.attendanceRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Present:</span>
                        <span className="ml-1 font-medium">{student.presentDays}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Absent:</span>
                        <span className="ml-1 font-medium">{student.absentDays}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactParent(student.parentPhone, student.parentEmail);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewStudentDetails(student);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStudentDetailsDialog = () => (
    <Dialog open={showStudentDetailsDialog} onOpenChange={setShowStudentDetailsDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Student Attendance Details</DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-red-600 text-white">
                  {selectedStudent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedStudent.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Class {selectedStudent.class}-{selectedStudent.section}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold text-red-600">{selectedStudent.attendanceRate}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Days</p>
                <p className="text-2xl font-bold">{selectedStudent.totalDays}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Present</p>
                <p className="text-xl font-bold text-green-700">{selectedStudent.presentDays}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">Absent</p>
                <p className="text-xl font-bold text-red-700">{selectedStudent.absentDays}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Parent Contact</p>
              <div className="flex items-center gap-2 p-2 border rounded">
                <Phone className="h-4 w-4 text-gray-600" />
                <span className="text-sm">{selectedStudent.parentPhone}</span>
              </div>
              {selectedStudent.parentEmail && (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{selectedStudent.parentEmail}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  handleContactParent(selectedStudent.parentPhone, selectedStudent.parentEmail);
                  setShowStudentDetailsDialog(false);
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Parent
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  toast.success("Notification sent");
                  setShowStudentDetailsDialog(false);
                }}
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderAlerts()}
      {renderSummaryCards()}
      {renderWeeklyTrend()}

      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes">Class-wise</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Attendance</TabsTrigger>
          <TabsTrigger value="students">Low Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">{renderClassWiseTable()}</TabsContent>
        <TabsContent value="teachers">{renderTeacherAttendance()}</TabsContent>
        <TabsContent value="students">{renderLowAttendance()}</TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
    </div>
  );
}