import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FileText,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Users,
  UserCheck,
  Settings,
  Calendar,
  TrendingUp,
  AlertCircle,
  Download,
  Eye,
  Star,
  Clock,
  RefreshCw,
  Search,
  ClipboardCheck,
  Receipt,
  CalendarDays,
  Bus,
  Filter,
  Mail,
  Printer,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import principalService from "@/Services/principalService";

// ==================== TYPES ====================

type ReportCategory = {
  id: string;
  name: string;
  icon: any;
  color: string;
  reports: ReportDefinition[];
};

type ReportDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  hasDateRange: boolean;
  hasClassFilter: boolean;
  hasSectionFilter: boolean;
  hasStudentFilter: boolean;
  hasPaymentMethodFilter: boolean;
  exportFormats: ("pdf" | "excel" | "csv" | "email" | "print" | "whatsapp")[];
};

type ReportConfig = {
  reportId: string;
  dateRange: string;
  fromDate?: string;
  toDate?: string;
  startDate?: string;
  endDate?: string;
  class?: string;
  section?: string;
  department?: string;
  paymentMethod?: string;
  status?: string;
  exportFormats: string[];
  emailRecipients?: string;
};

type RecentReport = {
  id: string;
  reportName: string;
  generatedAt: string;
  format: string;
  category: string;
};

type QuickAccessReport = {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  lastGenerated?: string;
};

// ==================== CONSTANTS ====================

const reportCategories: ReportCategory[] = [
  {
    id: "academic",
    name: "Academic Reports",
    icon: GraduationCap,
    color: "text-blue-600",
    reports: [
      {
        id: "student-performance",
        name: "Student Performance Report",
        description: "Class-wise, section-wise, subject-wise performance analysis",
        category: "academic",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "email", "print"],
      },
      {
        id: "exam-result-analysis",
        name: "Exam Result Analysis",
        description: "Pass percentage, grade distribution, toppers list",
        category: "academic",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "print"],
      },
      {
        id: "attendance-report",
        name: "Attendance Report",
        description: "Daily, monthly, yearly attendance with defaulter list",
        category: "academic",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: true,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "email", "print"],
      },
      {
        id: "syllabus-completion",
        name: "Syllabus Completion Status",
        description: "Track syllabus coverage across classes",
        category: "academic",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "teacher-performance",
        name: "Teacher Performance Report",
        description: "Based on student results and class performance",
        category: "academic",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
  {
    id: "financial",
    name: "Financial Reports",
    icon: IndianRupee,
    color: "text-green-600",
    reports: [
      {
        id: "fee-collection",
        name: "Fee Collection Report",
        description: "Daily, monthly, annual fee collection summary",
        category: "financial",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: false,
        hasPaymentMethodFilter: true,
        exportFormats: ["pdf", "excel", "print"],
      },
      {
        id: "defaulters-list",
        name: "Defaulters List",
        description: "Students with pending fees and contact details",
        category: "financial",
        hasDateRange: false,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "email", "whatsapp"],
      },
      {
        id: "cashier-performance",
        name: "Cashier Performance Report",
        description: "Cashier-wise collection and transaction details",
        category: "financial",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "payment-method-analysis",
        name: "Payment Method Analysis",
        description: "Cash vs Online vs UPI vs Cheque breakdown",
        category: "financial",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "outstanding-fees",
        name: "Outstanding Fees Report",
        description: "Total pending fees with days overdue",
        category: "financial",
        hasDateRange: false,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "email"],
      },
      {
        id: "discount-scholarship",
        name: "Discount/Scholarship Report",
        description: "All discounts and scholarships applied",
        category: "financial",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
  {
    id: "student",
    name: "Student Reports",
    icon: Users,
    color: "text-purple-600",
    reports: [
      {
        id: "student-master-list",
        name: "Student Master List",
        description: "Complete student database with contact details",
        category: "student",
        hasDateRange: false,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: true,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "csv"],
      },
      {
        id: "student-attendance-history",
        name: "Student Attendance History",
        description: "Individual student attendance record",
        category: "student",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: true,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "email"],
      },
      {
        id: "student-fee-history",
        name: "Student Fee Payment History",
        description: "Complete fee payment record per student",
        category: "student",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: true,
        hasStudentFilter: true,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel", "print"],
      },
      {
        id: "new-admissions",
        name: "New Admissions Report",
        description: "Students admitted in selected period",
        category: "student",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "students-transferred",
        name: "Students Transferred/Left Report",
        description: "Students who left or transferred schools",
        category: "student",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
  {
    id: "staff",
    name: "Staff Reports",
    icon: UserCheck,
    color: "text-orange-600",
    reports: [
      {
        id: "teacher-attendance",
        name: "Teacher Attendance Report",
        description: "Daily teacher attendance and absences",
        category: "staff",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "teacher-leave",
        name: "Teacher Leave Report",
        description: "Leave applications and approvals",
        category: "staff",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "teacher-workload",
        name: "Teacher Workload Report",
        description: "Classes and subjects handled by each teacher",
        category: "staff",
        hasDateRange: false,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
  {
    id: "operational",
    name: "Operational Reports",
    icon: Settings,
    color: "text-indigo-600",
    reports: [
      {
        id: "transport-report",
        name: "Transport Report",
        description: "Bus-wise students, routes, fee collection",
        category: "operational",
        hasDateRange: false,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "library-usage",
        name: "Library Usage Report",
        description: "Books issued, returns, overdue books",
        category: "operational",
        hasDateRange: true,
        hasClassFilter: true,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "inventory-report",
        name: "Inventory Report",
        description: "School assets and supplies tracking",
        category: "operational",
        hasDateRange: false,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "announcement-reach",
        name: "Announcement Reach Report",
        description: "Who viewed school announcements",
        category: "operational",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance Reports",
    icon: ClipboardCheck,
    color: "text-red-600",
    reports: [
      {
        id: "enrollment-statistics",
        name: "Enrollment Statistics",
        description: "For board submission and government records",
        category: "compliance",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "attendance-compliance",
        name: "Attendance Compliance Report",
        description: "For government requirements",
        category: "compliance",
        hasDateRange: true,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
      {
        id: "scholarship-reservation",
        name: "Scholarship/Reservation Report",
        description: "SC/ST/OBC/EWS scholarship details",
        category: "compliance",
        hasDateRange: false,
        hasClassFilter: false,
        hasSectionFilter: false,
        hasStudentFilter: false,
        hasPaymentMethodFilter: false,
        exportFormats: ["pdf", "excel"],
      },
    ],
  },
];

const quickAccessReports: QuickAccessReport[] = [
  { id: "fee-collection", name: "Fee Collection", category: "financial", icon: Receipt, color: "text-green-600", lastGenerated: "Today" },
  { id: "attendance-report", name: "Attendance", category: "academic", icon: CalendarDays, color: "text-blue-600", lastGenerated: "Today" },
  { id: "exam-result-analysis", name: "Result Analysis", category: "academic", icon: GraduationCap, color: "text-purple-600", lastGenerated: "Yesterday" },
  { id: "defaulters-list", name: "Defaulters", category: "financial", icon: AlertCircle, color: "text-red-600", lastGenerated: "2 days ago" },
  { id: "student-master-list", name: "Student List", category: "student", icon: Users, color: "text-indigo-600", lastGenerated: "3 days ago" },
  { id: "cashier-performance", name: "Cashier Report", category: "financial", icon: UserCheck, color: "text-orange-600", lastGenerated: "Today" },
  { id: "transport-report", name: "Transport", category: "operational", icon: Bus, color: "text-cyan-600" },
  { id: "teacher-attendance", name: "Teacher Attendance", category: "staff", icon: UserCheck, color: "text-pink-600" },
];

const mockRecentReports: RecentReport[] = [
  { id: "1", reportName: "Fee Collection Report", generatedAt: "2026-03-16T10:30:00", format: "PDF", category: "financial" },
  { id: "2", reportName: "Class 10 Attendance Report", generatedAt: "2026-03-15T14:20:00", format: "Excel", category: "academic" },
  { id: "3", reportName: "Monthly Defaulters List", generatedAt: "2026-03-14T09:15:00", format: "PDF", category: "financial" },
  { id: "4", reportName: "Student Master List", generatedAt: "2026-03-13T11:45:00", format: "Excel", category: "student" },
  { id: "5", reportName: "Cashier Performance Report", generatedAt: "2026-03-12T16:30:00", format: "PDF", category: "financial" },
];

// Mock data for report preview
const mockFeeCollectionData = {
  summary: {
    totalExpected: 2500000,
    totalCollected: 1850000,
    pending: 650000,
    collectionRate: 74,
  },
  data: [
    { date: "2026-03-01", receiptNumber: "REC-001", student: "Rohan Kumar", class: "5th-A", amount: 25000, method: "Cash", cashier: "Nagendra", status: "Completed" },
    { date: "2026-03-02", receiptNumber: "REC-002", student: "Priya Singh", class: "7th-B", amount: 28000, method: "Online", cashier: "Nagendra", status: "Completed" },
    { date: "2026-03-05", receiptNumber: "REC-003", student: "Arjun Reddy", class: "9th-C", amount: 32000, method: "UPI", cashier: "Cashier User", status: "Completed" },
    { date: "2026-03-08", receiptNumber: "REC-004", student: "Sneha Sharma", class: "6th-A", amount: 26000, method: "Cheque", cashier: "Nagendra", status: "Completed" },
    { date: "2026-03-10", receiptNumber: "REC-005", student: "Vikram Patel", class: "8th-D", amount: 30000, method: "Cash", cashier: "Nagendra", status: "Completed" },
  ],
};

const mockAttendanceData = {
  summary: {
    totalStudents: 1250,
    present: 1140,
    absent: 85,
    onLeave: 25,
    percentage: 91.2,
  },
  data: [
    { admissionNumber: "5-A-001", student: "Rohan Kumar", class: "5th-A", presentDays: 145, totalDays: 160, percentage: 90.6 },
    { admissionNumber: "7-B-015", student: "Priya Singh", class: "7th-B", presentDays: 152, totalDays: 160, percentage: 95.0 },
    { admissionNumber: "9-C-023", student: "Arjun Reddy", class: "9th-C", presentDays: 138, totalDays: 160, percentage: 86.3 },
    { admissionNumber: "6-A-008", student: "Sneha Sharma", class: "6th-A", presentDays: 155, totalDays: 160, percentage: 96.9 },
    { admissionNumber: "8-D-012", student: "Vikram Patel", class: "8th-D", presentDays: 148, totalDays: 160, percentage: 92.5 },
  ],
};

const mockExamResultData = {
  summary: {
    totalStudents: 1250,
    passed: 1180,
    failed: 45,
    compartment: 25,
    passPercentage: 94.4,
    schoolAverage: 78.5,
  },
  gradeDistribution: [
    { grade: "A1", count: 125, percentage: 10 },
    { grade: "A2", count: 250, percentage: 20 },
    { grade: "B1", count: 312, percentage: 25 },
    { grade: "B2", count: 250, percentage: 20 },
    { grade: "C1", count: 188, percentage: 15 },
    { grade: "C2", count: 125, percentage: 10 },
    { grade: "D", count: 62, percentage: 5 },
    { grade: "E", count: 38, percentage: 3 },
  ],
  classWisePassPercentage: [
    { class: "LKG", passPercentage: 100 },
    { class: "UKG", passPercentage: 100 },
    { class: "1st", passPercentage: 98 },
    { class: "2nd", passPercentage: 97 },
    { class: "3rd", passPercentage: 96 },
    { class: "4th", passPercentage: 95 },
    { class: "5th", passPercentage: 94 },
    { class: "6th", passPercentage: 93 },
    { class: "7th", passPercentage: 92 },
    { class: "8th", passPercentage: 91 },
    { class: "9th", passPercentage: 90 },
    { class: "10th", passPercentage: 95 },
  ],
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount}`;
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

// ==================== MAIN COMPONENT ====================

export default function PrincipalReports() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportId: "",
    dateRange: "thisMonth",
    class: "all",
    section: "all",
    paymentMethod: "all",
    status: "all",
    exportFormats: ["pdf", "excel"],
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>(mockRecentReports);
  const [favoriteReports, setFavoriteReports] = useState<string[]>(["fee-collection", "attendance-report"]);

  const handleGenerateReport = async (report: ReportDefinition) => {
    setSelectedReport(report);
    setGeneratingReport(true);
    
    try {
      const response = await principalService.generateReport({
        reportType: report.id,
        startDate: reportConfig.startDate,
        endDate: reportConfig.endDate,
        class: reportConfig.class,
        section: reportConfig.section,
        department: reportConfig.department,
      });
      
      const reportData = response.data?.data;
      
      if (reportData) {
        setGeneratedReport(reportData);
        setReportConfig({
          ...reportConfig,
          reportId: report.id,
          exportFormats: ["csv", "json"],
        });
        setShowConfigDialog(true);
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePreview = () => {
    setShowConfigDialog(false);
    setShowPreviewDialog(true);
  };

  const handleExport = async (format: string) => {
    try {
      if (format === "csv") {
        const response = await principalService.exportReportCSV({
          headers: generatedReport.headers,
          rows: generatedReport.rows,
        });
        
        // Download CSV file
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${generatedReport.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === "json") {
        const response = await principalService.exportReportJSON({
          title: generatedReport.title,
          headers: generatedReport.headers,
          rows: generatedReport.rows,
        });
        
        // Download JSON file
        const blob = new Blob([response.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${generatedReport.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      const newReport: RecentReport = {
        id: Date.now().toString(),
        reportName: generatedReport.title || selectedReport?.name || "Report",
        generatedAt: new Date().toISOString(),
        format: format.toUpperCase(),
        category: selectedReport?.category || "academic",
      };
      setRecentReports([newReport, ...recentReports.slice(0, 9)]);
      toast.success(`Report exported as ${format.toUpperCase()}`);
      setShowConfigDialog(false);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const handleScheduleReport = () => {
    toast.success("Report scheduled successfully");
    setShowConfigDialog(false);
  };

  const handleToggleFavorite = (reportId: string) => {
    if (favoriteReports.includes(reportId)) {
      setFavoriteReports(favoriteReports.filter((id) => id !== reportId));
    } else {
      setFavoriteReports([...favoriteReports, reportId]);
    }
  };

  const filteredReports = useMemo(() => {
    let reports: ReportDefinition[] = [];
    
    if (activeTab === "all") {
      reports = reportCategories.flatMap((cat) => cat.reports);
    } else if (activeTab === "favorites") {
      reports = reportCategories
        .flatMap((cat) => cat.reports)
        .filter((r) => favoriteReports.includes(r.id));
    } else {
      const category = reportCategories.find((cat) => cat.id === activeTab);
      reports = category?.reports || [];
    }

    if (searchTerm) {
      reports = reports.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return reports;
  }, [activeTab, searchTerm, favoriteReports]);

  const getReportPreviewData = () => {
    switch (selectedReport?.id) {
      case "fee-collection":
        return { type: "Fee Collection Report", data: mockFeeCollectionData };
      case "attendance-report":
        return { type: "Attendance Report", data: mockAttendanceData };
      case "exam-result-analysis":
        return { type: "Exam Result Analysis", data: mockExamResultData };
      default:
        return { type: "Report Preview", data: null };
    }
  };

  const previewData = getReportPreviewData();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📊 Reports Center</h1>
          <p className="text-muted-foreground mt-1">
            Generate, view, and export comprehensive school reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold mb-4">⚡ Quick Access (Most Used)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccessReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  const cat = reportCategories.find((c) => c.id === report.category);
                  const rep = cat?.reports.find((r) => r.id === report.id);
                  if (rep) handleGenerateReport(rep);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${report.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        {report.lastGenerated && (
                          <p className="text-xs text-muted-foreground">{report.lastGenerated}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(report.id);
                      }}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favoriteReports.includes(report.id)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Reports (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.reportName}</TableCell>
                  <TableCell>{formatDateTime(report.generatedAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.format}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{report.category}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Categories Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">⭐ Favorites</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => {
            const category = reportCategories.find((c) => c.id === report.category);
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                      {category && <category.icon className={`h-5 w-5 ${category.color}`} />}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFavorite(report.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favoriteReports.includes(report.id)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-3">{report.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    {report.hasDateRange && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Date Range
                      </Badge>
                    )}
                    {report.hasClassFilter && (
                      <Badge variant="outline" className="text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        Class Filter
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleGenerateReport(report)}>
                      Generate
                    </Button>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">No reports found matching your search</p>
          </div>
        )}
      </div>

      {/* Report Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.name} - {selectedReport?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Range */}
            {selectedReport?.hasDateRange && (
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={reportConfig.dateRange}
                  onValueChange={(value) =>
                    setReportConfig({ ...reportConfig, dateRange: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="thisQuarter">This Quarter</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {reportConfig.dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input type="date" value={reportConfig.fromDate} onChange={(e) => setReportConfig({ ...reportConfig, fromDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input type="date" value={reportConfig.toDate} onChange={(e) => setReportConfig({ ...reportConfig, toDate: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Class Filter */}
            {selectedReport?.hasClassFilter && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={reportConfig.class} onValueChange={(value) => setReportConfig({ ...reportConfig, class: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="LKG">LKG</SelectItem>
                      <SelectItem value="UKG">UKG</SelectItem>
                      <SelectItem value="1st">1st</SelectItem>
                      <SelectItem value="2nd">2nd</SelectItem>
                      <SelectItem value="3rd">3rd</SelectItem>
                      <SelectItem value="4th">4th</SelectItem>
                      <SelectItem value="5th">5th</SelectItem>
                      <SelectItem value="6th">6th</SelectItem>
                      <SelectItem value="7th">7th</SelectItem>
                      <SelectItem value="8th">8th</SelectItem>
                      <SelectItem value="9th">9th</SelectItem>
                      <SelectItem value="10th">10th</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={reportConfig.section} onValueChange={(value) => setReportConfig({ ...reportConfig, section: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Payment Method Filter */}
            {selectedReport?.hasPaymentMethodFilter && (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={reportConfig.paymentMethod} onValueChange={(value) => setReportConfig({ ...reportConfig, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="dd">DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Export Formats */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "pdf", label: "PDF", icon: FileText },
                  { id: "excel", label: "Excel", icon: FileSpreadsheet },
                  { id: "csv", label: "CSV", icon: FileSpreadsheet },
                  { id: "email", label: "Email", icon: Mail },
                  { id: "print", label: "Print", icon: Printer },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  const isSelected = reportConfig.exportFormats.includes(fmt.id);
                  return (
                    <Button
                      key={fmt.id}
                      variant={isSelected ? "default" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => {
                        if (isSelected) {
                          setReportConfig({
                            ...reportConfig,
                            exportFormats: reportConfig.exportFormats.filter((f) => f !== fmt.id),
                          });
                        } else {
                          setReportConfig({
                            ...reportConfig,
                            exportFormats: [...reportConfig.exportFormats, fmt.id],
                          });
                        }
                      }}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{fmt.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Email Recipients */}
            {reportConfig.exportFormats.includes("email") && (
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input
                  placeholder="management@school.com, accounts@school.com"
                  value={reportConfig.emailRecipients || ""}
                  onChange={(e) => setReportConfig({ ...reportConfig, emailRecipients: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleScheduleReport}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={handlePreview} disabled={generatingReport}>
              {generatingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            <Button onClick={() => handleExport(reportConfig.exportFormats[0] || "pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewData.type}</DialogTitle>
            <DialogDescription>
              Generated on {formatDate(new Date().toISOString())}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary Cards */}
            {previewData.data && 'summary' in previewData.data && previewData.data.summary && (
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(previewData.data.summary).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="text-2xl font-bold">
                        {typeof value === "number"
                          ? key.includes("amount") || key.includes("fee")
                            ? formatCurrencyCompact(value)
                            : `${value}%`
                          : value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Charts */}
            {previewData.data && 'gradeDistribution' in previewData.data && previewData.data.gradeDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={previewData.data.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ grade, percentage }: any) => `${grade}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {previewData.data.gradeDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#eab308', '#ef4444', '#dc2626', '#991b1b'][index % 8]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {previewData.data &&
              'classWisePassPercentage' in previewData.data &&
              previewData.data.classWisePassPercentage && (
              <Card>
                <CardHeader>
                  <CardTitle>Class-wise Pass Percentage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={previewData.data.classWisePassPercentage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="passPercentage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            {previewData.data &&
              'data' in previewData.data &&
              previewData.data.data &&
              Array.isArray(previewData.data.data) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData.data.data[0]).map((key) => (
                            <TableHead key={key} className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.data.data.map((row: any, index: number) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, i: number) => (
                              <TableCell key={i}>
                                {typeof value === "number" && (value > 1000 || value.toString().includes("2026"))
                                  ? typeof value === "number" && value > 1000
                                    ? formatCurrency(value)
                                    : value
                                  : value}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => handleExport("print")}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
