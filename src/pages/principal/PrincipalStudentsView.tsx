import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import principalService from "@/Services/principalService";
import { format, parseISO } from "date-fns";
import {
  Users,
  User,
  UserCheck,
  UserX,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Bus,
  Eye,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  FileText,
  School,
  Building,
  Home,
  Star,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Sparkles,
  Rocket,
  Zap,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  DoorOpen,
  DoorClosed,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cloud,
  CloudSun,
  CloudMoon,
  Cloudy,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type StudentPersonalInfo = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodGroup?: string;
  aadhaarNumber?: string;
  sssmId?: string;
  religion?: string;
  caste?: string;
  category?: "general" | "obc" | "sc" | "st";
  nationality?: string;
  motherTongue?: string;
};

type StudentAcademicInfo = {
  admissionNumber: string;
  rollNumber: string;
  class: string;
  section: string;
  previousSchool?: string;
  previousClass?: string;
  previousPercentage?: number;
  subjects?: string[];
};

type StudentContactInfo = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
};

type StudentParentInfo = {
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName: string;
  motherPhone: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
};

type StudentTransportInfo = {
  usesTransport: boolean;
  routeId?: string;
  routeName?: string;
  pickupPoint?: string;
  pickupTime?: string;
  dropPoint?: string;
  dropTime?: string;
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
};

type StudentFeeInfo = {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  feeStatus: "paid" | "partial" | "pending" | "overdue";
};

type StudentAttendanceSummary = {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  percentage: number;
};

type Student = {
  _id: string;
  personal: StudentPersonalInfo;
  academic: StudentAcademicInfo;
  contact: StudentContactInfo;
  parent: StudentParentInfo;
  transport: StudentTransportInfo;
  fee: StudentFeeInfo;
  attendance: StudentAttendanceSummary;
  status: "active" | "inactive" | "alumni" | "transferred";
  documents?: Array<{
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type ClassWiseCount = {
  class: string;
  sections: {
    section: string;
    count: number;
  }[];
  total: number;
};

type GenderStats = {
  male: number;
  female: number;
  other: number;
};

type StudentsOverviewStats = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  alumniStudents: number;
  transferredStudents: number;
  newAdmissionsThisMonth: number;
  classWise: ClassWiseCount[];
  genderStats: GenderStats;
  transportUsers: number;
  nonTransportUsers: number;
  feeDefaulters: number;
  lowAttendanceCount: number;
};

type StudentsResponse = {
  students: Student[];
  classWise: ClassWiseCount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), "dd MMM yyyy, hh:mm a");
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "inactive":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    case "alumni":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Alumni</Badge>;
    case "transferred":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Transferred</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getGenderColor = (gender: string) => {
  switch (gender) {
    case "male":
      return "text-blue-600";
    case "female":
      return "text-pink-600";
    default:
      return "text-purple-600";
  }
};

const getAttendanceColor = (percentage: number) => {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 80) return "text-blue-600";
  if (percentage >= 75) return "text-yellow-600";
  return "text-red-600";
};

const getFeeStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
    case "Paid":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
    case "partial":
    case "Partial":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
    case "pending":
    case "Pending":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
    case "due":
    case "Due":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Due</Badge>;
    case "overdue":
    case "Overdue":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
    default:
      return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
  }
};

// ==================== MOCK DATA ====================

const generateMockStudents = (count: number): Student[] => {
  const students: Student[] = [];
  const firstNames = [
    "Aarav", "Sneha", "Rohan", "Priya", "Rahul", "Ananya", "Vikram", "Divya", "Arjun", "Kavita",
    "Ravi", "Neha", "Amit", "Pooja", "Sanjay", "Meera", "Rajesh", "Sunita", "Deepak", "Anjali",
    "Suresh", "Lata", "Mohan", "Geeta", "Krishna", "Radha", "Gopal", "Sita", "Ram", "Lakshmi",
    "Aditya", "Shreya", "Manish", "Pallavi", "Nitin", "Jyoti", "Harsh", "Richa", "Gaurav", "Swati"
  ];
  
  const lastNames = [
    "Kumar", "Reddy", "Singh", "Sharma", "Verma", "Gupta", "Nair", "Patel", "Rao", "Joshi",
    "Malhotra", "Mehta", "Choudhary", "Kapoor", "Saxena", "Trivedi", "Bhatt", "Menon", "Iyer", "Pillai"
  ];
  
  const classes = ["6", "7", "8", "9", "10", "11", "12"];
  const sections = ["A", "B", "C", "D"];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const className = classes[Math.floor(Math.random() * classes.length)];
    const section = sections[Math.floor(Math.random() * sections.length)];
    const gender = Math.random() > 0.5 ? "male" : "female";
    const status = Math.random() > 0.1 ? "active" : (Math.random() > 0.5 ? "inactive" : "alumni");
    const usesTransport = Math.random() > 0.4;
    const totalFee = 50000 + Math.floor(Math.random() * 50000);
    const paidAmount = status === "active" ? Math.floor(Math.random() * totalFee) : totalFee;
    const pendingAmount = totalFee - paidAmount;
    let feeStatus: "paid" | "partial" | "pending" | "overdue" = "paid";
    if (pendingAmount === 0) feeStatus = "paid";
    else if (pendingAmount > 0 && pendingAmount < totalFee) feeStatus = "partial";
    else if (pendingAmount === totalFee) feeStatus = "pending";
    else feeStatus = "overdue";
    
    const totalDays = 120;
    const presentDays = Math.floor(Math.random() * 40) + 80; // 80-120
    const absentDays = totalDays - presentDays - Math.floor(Math.random() * 5);
    const leaveDays = Math.floor(Math.random() * 5);
    const lateDays = Math.floor(Math.random() * 10);
    const attendancePercentage = (presentDays / totalDays) * 100;

    students.push({
      _id: `STU${String(i).padStart(4, "0")}`,
      personal: {
        firstName,
        lastName,
        dateOfBirth: `2010-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        gender: gender as "male" | "female" | "other",
        bloodGroup: ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"][Math.floor(Math.random() * 8)],
        aadhaarNumber: `${Math.floor(Math.random() * 1000000000000)}`,
        sssmId: `SSSM${Math.floor(Math.random() * 100000)}`,
        religion: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist"][Math.floor(Math.random() * 5)],
        category: ["general", "obc", "sc", "st"][Math.floor(Math.random() * 4)] as any,
        nationality: "Indian",
        motherTongue: ["Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali"][Math.floor(Math.random() * 6)],
      },
      academic: {
        admissionNumber: `ADM${2024000 + i}`,
        rollNumber: `${className}${section}-${String(i).padStart(2, "0")}`,
        class: className,
        section: section,
        previousSchool: "ABC Public School",
        previousClass: String(parseInt(className) - 1),
        previousPercentage: Math.floor(Math.random() * 30) + 70,
      },
      contact: {
        address: `${Math.floor(Math.random() * 999)} Main Street`,
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        phone: `987654${String(i).padStart(4, "0")}`,
        alternatePhone: `987654${String(i + 1000).padStart(4, "0")}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        emergencyContact: `987654${String(i + 2000).padStart(4, "0")}`,
        emergencyPhone: `987654${String(i + 3000).padStart(4, "0")}`,
      },
      parent: {
        fatherName: `${["Rajesh", "Suresh", "Ramesh", "Mahesh", "Dinesh"][Math.floor(Math.random() * 5)]} ${lastName}`,
        fatherPhone: `987654${String(i + 4000).padStart(4, "0")}`,
        fatherEmail: `father.${lastName.toLowerCase()}@example.com`,
        fatherOccupation: ["Engineer", "Doctor", "Teacher", "Business", "Government"][Math.floor(Math.random() * 5)],
        motherName: `${["Sunita", "Anita", "Geeta", "Kavita", "Sarita"][Math.floor(Math.random() * 5)]} ${lastName}`,
        motherPhone: `987654${String(i + 5000).padStart(4, "0")}`,
        motherEmail: `mother.${lastName.toLowerCase()}@example.com`,
        motherOccupation: ["Housewife", "Teacher", "Nurse", "Business", "Government"][Math.floor(Math.random() * 5)],
      },
      transport: {
        usesTransport,
        routeId: usesTransport ? `RTE${Math.floor(Math.random() * 10) + 1}` : undefined,
        routeName: usesTransport ? `Route ${Math.floor(Math.random() * 10) + 1}` : undefined,
        pickupPoint: usesTransport ? `Stop ${Math.floor(Math.random() * 10) + 1}` : undefined,
        pickupTime: usesTransport ? "07:30 AM" : undefined,
        dropPoint: usesTransport ? `Stop ${Math.floor(Math.random() * 10) + 1}` : undefined,
        dropTime: usesTransport ? "03:30 PM" : undefined,
        busNumber: usesTransport ? `TS-07-${Math.floor(Math.random() * 1000)}` : undefined,
        driverName: usesTransport ? `Driver ${Math.floor(Math.random() * 10) + 1}` : undefined,
        driverPhone: usesTransport ? `987654321${Math.floor(Math.random() * 10)}` : undefined,
      },
      fee: {
        totalFee,
        paidAmount,
        pendingAmount,
        lastPaymentDate: paidAmount > 0 ? new Date().toISOString() : undefined,
        lastPaymentAmount: paidAmount > 0 ? Math.min(paidAmount, 25000) : undefined,
        feeStatus,
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        percentage: attendancePercentage,
      },
      status: status as "active" | "inactive" | "alumni" | "transferred",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return students;
};

const mockStudents = generateMockStudents(150);

const mockStats: StudentsOverviewStats = {
  totalStudents: mockStudents.length,
  activeStudents: mockStudents.filter(s => s.status === "active").length,
  inactiveStudents: mockStudents.filter(s => s.status === "inactive").length,
  alumniStudents: mockStudents.filter(s => s.status === "alumni").length,
  transferredStudents: mockStudents.filter(s => s.status === "transferred").length,
  newAdmissionsThisMonth: 24,
  classWise: [
    { class: "6", sections: [
      { section: "A", count: 22 }, { section: "B", count: 20 }, { section: "C", count: 18 }
    ], total: 60 },
    { class: "7", sections: [
      { section: "A", count: 24 }, { section: "B", count: 22 }, { section: "C", count: 20 }
    ], total: 66 },
    { class: "8", sections: [
      { section: "A", count: 25 }, { section: "B", count: 23 }, { section: "C", count: 21 }
    ], total: 69 },
    { class: "9", sections: [
      { section: "A", count: 26 }, { section: "B", count: 24 }, { section: "C", count: 22 }, { section: "D", count: 20 }
    ], total: 92 },
    { class: "10", sections: [
      { section: "A", count: 28 }, { section: "B", count: 26 }, { section: "C", count: 24 }, { section: "D", count: 22 }
    ], total: 100 },
    { class: "11", sections: [
      { section: "A", count: 20 }, { section: "B", count: 18 }, { section: "C", count: 16 }
    ], total: 54 },
    { class: "12", sections: [
      { section: "A", count: 18 }, { section: "B", count: 16 }, { section: "C", count: 14 }
    ], total: 48 },
  ],
  genderStats: {
    male: mockStudents.filter(s => s.personal.gender === "male").length,
    female: mockStudents.filter(s => s.personal.gender === "female").length,
    other: mockStudents.filter(s => s.personal.gender === "other").length,
  },
  transportUsers: mockStudents.filter(s => s.transport.usesTransport).length,
  nonTransportUsers: mockStudents.filter(s => !s.transport.usesTransport).length,
  feeDefaulters: mockStudents.filter(s => s.fee.feeStatus === "overdue" || s.fee.feeStatus === "pending").length,
  lowAttendanceCount: mockStudents.filter(s => s.attendance.percentage < 75).length,
};

// ==================== MAIN COMPONENT ====================

export default function PrincipalStudentsView() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentsOverviewStats>(mockStats);
  const [classWise, setClassWise] = useState<ClassWiseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transportFilter, setTransportFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ==================== DATA LOADING ====================

  const loadStudents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Call actual API
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (classFilter !== "all") params.class = classFilter;
      if (sectionFilter !== "all") params.section = sectionFilter;

      const response = await principalService.getStudentsSummary(params);
      const studentsData = response.data?.data?.students || [];
      const classWiseData = response.data?.data?.classWise || [];
      const pagination = response.data?.data?.pagination || { pages: 1, total: 0 };

      // Transform backend data to match frontend format
      const transformedStudents = studentsData.map((student: any) => ({
        _id: student._id,
        personal: student.student || { firstName: "", lastName: "", gender: "Male" },
        academic: {
          class: student.class?.className || "",
          section: student.class?.section || "",
          admissionNumber: student.admissionNumber || "",
          rollNumber: "N/A",
        },
        parent: {
          fatherName: student.parents?.father?.name || "",
          motherName: student.parents?.mother?.name || "",
          phone: student.parents?.father?.phone || student.parents?.mother?.phone || "",
          email: student.parents?.father?.email || "",
        },
        transport: {
          usesTransport: student.transport === "yes",
        },
        status: student.status || "active",
        attendance: {
          percentage: student.attendance?.percentage || 0,
          present: student.attendance?.present || 0,
          total: student.attendance?.total || 0,
        },
        fee: {
          feeStatus: student.fee?.feeStatus || (student.fee?.balance > 0 ? "Due" : "Paid"),
          balance: student.fee?.balance || 0,
        },
        address: student.address || { street: "" },
      }));

      setStudents(transformedStudents);
      setClassWise(classWiseData);
      setTotalPages(pagination.pages || 1);
      setTotalRecords(pagination.total || 0);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, classFilter, sectionFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ==================== COMPUTED VALUES ====================

  const availableClasses = useMemo(() => {
    const classes = new Set(mockStudents.map(s => s.academic.class));
    return Array.from(classes).sort();
  }, []);

  const availableSections = useMemo(() => {
    if (classFilter === "all") return [];
    const sections = new Set(
      mockStudents.filter(s => s.academic.class === classFilter).map(s => s.academic.section)
    );
    return Array.from(sections).sort();
  }, [classFilter]);

  const filteredCounts = useMemo(() => {
    let filtered = [...mockStudents];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        `${s.personal.firstName} ${s.personal.lastName}`.toLowerCase().includes(term) ||
        s.academic.admissionNumber.toLowerCase().includes(term)
      );
    }
    
    return {
      total: mockStudents.length,
      filtered: filtered.length,
      active: filtered.filter(s => s.status === "active").length,
      inactive: filtered.filter(s => s.status === "inactive").length,
    };
  }, [searchTerm]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadStudents(true);
    toast.success("Student data refreshed");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadStudents();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
    setTransportFilter("all");
    setGenderFilter("all");
    setCurrentPage(1);
    toast.success("Filters reset");
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDialog(true);
  };

  const handleContactParent = (student: Student) => {
    const phone = student.parent?.fatherPhone || student.parent?.motherPhone || "N/A";
    toast.info(`Contact options for ${student.parent?.fatherName || "Parent"} (${phone})`);
    // In production: Open phone dialer or contact dialog
    if (phone !== "N/A") {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleViewAttendance = (student: Student) => {
    navigate(`/principal/attendance?student=${student._id}`);
  };

  const handleViewFees = (student: Student) => {
    navigate(`/principal/finance?student=${student._id}`);
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = [
      "Admission No", "Roll No", "Student Name", "Class", "Section",
      "Father's Name", "Mother's Name", "Phone", "Email", "Address",
      "Status", "Attendance %", "Fee Status", "Transport"
    ];
    
    const rows = students.map(s => [
      s.academic.admissionNumber,
      s.academic.rollNumber,
      `${s.personal.firstName} ${s.personal.lastName}`,
      s.academic.class,
      s.academic.section,
      s.parent.fatherName,
      s.parent.motherName,
      s.contact.phone,
      s.contact.email || "-",
      s.contact.address,
      s.status,
      s.attendance.percentage.toFixed(1),
      s.fee.feeStatus,
      s.transport.usesTransport ? "Yes" : "No",
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Student data exported");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==================== LOADING STATE ====================

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading student data...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Students Overview</h1>
        <p className="text-muted-foreground mt-1">
          View and monitor all student information (Read-only)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowStatsDialog(true)}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistics
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  {stats.activeStudents} Active
                </Badge>
                <Badge variant="outline" className="bg-yellow-50">
                  <UserX className="h-3 w-3 mr-1 text-yellow-600" />
                  {stats.inactiveStudents} Inactive
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
              <p className="text-sm text-muted-foreground">Gender Ratio</p>
              <p className="text-2xl font-bold">
                {stats.genderStats.male} / {stats.genderStats.female}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-blue-50">
                  <span className="text-blue-600">♂ {stats.genderStats.male}</span>
                </Badge>
                <Badge variant="outline" className="bg-pink-50">
                  <span className="text-pink-600">♀ {stats.genderStats.female}</span>
                </Badge>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Transport Users</p>
              <p className="text-2xl font-bold">{stats.transportUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.nonTransportUsers} non-transport
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Bus className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Need Attention</p>
              <p className="text-2xl font-bold text-orange-600">{stats.feeDefaulters}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fee Defaulters
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <School className="h-4 w-4 mr-2" />
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
            value={sectionFilter}
            onValueChange={setSectionFilter}
            disabled={classFilter === "all"}
          >
            <SelectTrigger>
              <Building className="h-4 w-4 mr-2" />
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <UserCheck className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={transportFilter} onValueChange={setTransportFilter}>
              <SelectTrigger className="w-[150px]">
                <Bus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Transport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="yes">Uses Transport</SelectItem>
                <SelectItem value="no">No Transport</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[150px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>

            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {students.length} of {filteredCounts.filtered} students
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Student List
            <Badge variant="outline" className="ml-2">
              {totalRecords} total
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No students found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs font-medium">
                        {student.academic.admissionNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`bg-blue-600 text-white text-xs ${getGenderColor(student.personal.gender)}`}>
                              {getInitials(student.personal.firstName, student.personal.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {student.personal.firstName} {student.personal.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Roll: {student.academic.rollNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.academic.class}</TableCell>
                      <TableCell>{student.academic.section}</TableCell>
                      <TableCell>{student.parent?.fatherName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{student.parent?.fatherPhone || student.parent?.motherPhone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.attendance.percentage} className="w-16 h-2" />
                          <span className={`text-sm font-medium ${getAttendanceColor(student.attendance.percentage)}`}>
                            {student.attendance.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFeeStatusBadge(student.fee.feeStatus)}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewStudent(student)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleContactParent(student)}
                            title="Contact Parent"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAttendance(student)}
                            title="View Attendance"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderStudentDetailsDialog = () => (
    <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Student Details
          </DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            {/* Header with Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(selectedStudent.personal.firstName, selectedStudent.personal.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedStudent.personal.firstName} {selectedStudent.personal.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedStudent.academic.admissionNumber}</Badge>
                  {getStatusBadge(selectedStudent.status)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm">{formatDate(selectedStudent.personal.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm capitalize">{selectedStudent.personal.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-sm">{selectedStudent.personal.bloodGroup || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                  <p className="text-sm">{selectedStudent.personal.aadhaarNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SSSM ID</p>
                  <p className="text-sm">{selectedStudent.personal.sssmId || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm capitalize">{selectedStudent.personal.category || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Religion</p>
                  <p className="text-sm">{selectedStudent.personal.religion || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mother Tongue</p>
                  <p className="text-sm">{selectedStudent.personal.motherTongue || "-"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Academic Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Admission Number</p>
                  <p className="text-sm font-mono">{selectedStudent.academic.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="text-sm">{selectedStudent.academic.rollNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="text-sm">Class {selectedStudent.academic.class}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Section</p>
                  <p className="text-sm">Section {selectedStudent.academic.section}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous School</p>
                  <p className="text-sm">{selectedStudent.academic.previousSchool || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous Class</p>
                  <p className="text-sm">{selectedStudent.academic.previousClass || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous Percentage</p>
                  <p className="text-sm">
                    {selectedStudent.academic.previousPercentage ? `${selectedStudent.academic.previousPercentage}%` : "-"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Parent Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Father's Name</p>
                  <p className="text-sm font-medium">{selectedStudent.parent?.fatherName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father's Phone</p>
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedStudent.parent?.fatherPhone || selectedStudent.parent?.motherPhone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mother's Name</p>
                  <p className="text-sm font-medium">{selectedStudent.parent?.motherName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Email</p>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedStudent.parent?.fatherEmail || selectedStudent.parent?.motherEmail || "-"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Address Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {selectedStudent.contact?.address || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Parent Phone</p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedStudent.parent?.fatherPhone || selectedStudent.parent?.motherPhone || selectedStudent.parent?.guardianPhone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parent Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedStudent.parent?.fatherEmail || selectedStudent.parent?.motherEmail || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Transport Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bus className="h-4 w-4 text-orange-600" />
                Transport Information
              </h3>
              {selectedStudent.transport.usesTransport ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Route Name</p>
                    <p className="text-sm">{selectedStudent.transport.routeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bus Number</p>
                    <p className="text-sm">{selectedStudent.transport.busNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup Point</p>
                    <p className="text-sm">{selectedStudent.transport.pickupPoint}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup Time</p>
                    <p className="text-sm">{selectedStudent.transport.pickupTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Drop Point</p>
                    <p className="text-sm">{selectedStudent.transport.dropPoint}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Drop Time</p>
                    <p className="text-sm">{selectedStudent.transport.dropTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Driver Name</p>
                    <p className="text-sm">{selectedStudent.transport.driverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Driver Phone</p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedStudent.transport.driverPhone}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Student does not use transport</p>
              )}
            </div>

            <Separator />

            {/* Fee Summary */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                Fee Summary
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">Total Fee</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedStudent.fee.totalFee)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-xs text-green-600">Paid</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(selectedStudent.fee.paidAmount)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-xs text-red-600">Pending</p>
                  <p className="text-lg font-bold text-red-700">{formatCurrency(selectedStudent.fee.pendingAmount)}</p>
                </div>
              </div>
              {selectedStudent.fee.lastPaymentDate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Last payment: {formatCurrency(selectedStudent.fee.lastPaymentAmount || 0)} on {formatDate(selectedStudent.fee.lastPaymentDate)}
                </div>
              )}
            </div>

            <Separator />

            {/* Attendance Summary */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Attendance Summary
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{selectedStudent.attendance.totalDays}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-xs text-green-600">Present</p>
                  <p className="text-lg font-bold text-green-700">{selectedStudent.attendance.presentDays}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-xs text-red-600">Absent</p>
                  <p className="text-lg font-bold text-red-700">{selectedStudent.attendance.absentDays}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600">%</p>
                  <p className="text-lg font-bold text-blue-700">{selectedStudent.attendance.percentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStudentDialog(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => handleContactParent(selectedStudent!)}>
            <Phone className="h-4 w-4 mr-2" />
            Contact Parent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderStatsDialog = () => (
    <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Student Statistics
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Class-wise Distribution */}
          <div>
            <h3 className="font-semibold mb-3">Class-wise Distribution</h3>
            <div className="space-y-3">
              {stats.classWise.map((cls) => (
                <div key={cls.class} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Class {cls.class}</span>
                    <span>{cls.total} students</span>
                  </div>
                  <Progress value={(cls.total / stats.totalStudents) * 100} className="h-2" />
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {cls.sections.map((sec) => (
                      <span key={sec.section}>
                        Sec {sec.section}: {sec.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gender Distribution */}
          <div>
            <h3 className="font-semibold mb-3">Gender Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">Male</p>
                <p className="text-2xl font-bold text-blue-700">{stats.genderStats.male}</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.genderStats.male / stats.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded">
                <p className="text-xs text-pink-600">Female</p>
                <p className="text-2xl font-bold text-pink-700">{stats.genderStats.female}</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.genderStats.female / stats.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <p className="text-xs text-purple-600">Other</p>
                <p className="text-2xl font-bold text-purple-700">{stats.genderStats.other}</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.genderStats.other / stats.totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Distribution */}
          <div>
            <h3 className="font-semibold mb-3">Status Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-700">{stats.activeStudents}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-600">Inactive</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.inactiveStudents}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-xs text-purple-600">Alumni</p>
                <p className="text-2xl font-bold text-purple-700">{stats.alumniStudents}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">Transferred</p>
                <p className="text-2xl font-bold text-blue-700">{stats.transferredStudents}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transport Summary */}
          <div>
            <h3 className="font-semibold mb-3">Transport Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-xs text-orange-600">Using Transport</p>
                <p className="text-2xl font-bold text-orange-700">{stats.transportUsers}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Not Using Transport</p>
                <p className="text-2xl font-bold">{stats.nonTransportUsers}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alerts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Fee Defaulters
              </p>
              <p className="text-2xl font-bold text-red-700">{stats.feeDefaulters}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Low Attendance (&lt;75%)
              </p>
              <p className="text-2xl font-bold text-yellow-700">{stats.lowAttendanceCount}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStatsDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}
      {renderStudentTable()}

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
      {renderStatsDialog()}
    </div>
  );
}