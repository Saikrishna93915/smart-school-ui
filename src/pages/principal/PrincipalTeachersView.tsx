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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BookOpen,
  Award,
  Star,
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
  Eye,
  Download,
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
  Clock,
  Briefcase,
  GraduationCap as GraduationCapIcon,
  BookMarked,
  Globe,
  Globe2,
  Languages,
  Calculator,
  Microscope,
  Atom,
  Beaker,
  TestTube,
  FlaskConical,
  Dna,
  Brain,
  Code,
  Smartphone,
  Laptop,
  Palette,
  Music,
  Theater,
  Dumbbell,
  Heart,
  Stethoscope,
  Syringe,
  Pill,
  Users2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundCog,
  UserRoundPlus,
  UserRoundMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type TeacherPersonalInfo = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodGroup?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  religion?: string;
  nationality?: string;
  motherTongue?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
};

type TeacherProfessionalInfo = {
  employeeId: string;
  designation: string;
  department: string;
  qualification: string;
  specialization: string[];
  experience: {
    total: number; // years
    current: number; // years at current school
    previous?: string[];
  };
  subjects: string[];
  classes: {
    class: string;
    section: string;
    subject: string;
  }[];
  joiningDate: string;
  contractType: "permanent" | "contract" | "probation" | "intern";
  salary?: number;
  bankAccount?: string;
  ifscCode?: string;
  pfNumber?: string;
  esiNumber?: string;
};

type TeacherContactInfo = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
};

type TeacherAttendanceSummary = {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  percentage: number;
};

type TeacherPerformance = {
  studentResults: {
    averageMarks: number;
    passPercentage: number;
    distinctionCount: number;
  };
  feedback: {
    studentRating?: number;
    parentRating?: number;
    peerRating?: number;
  };
  achievements?: string[];
  trainings?: {
    name: string;
    date: string;
    provider: string;
    certificate?: string;
  }[];
};

type Teacher = {
  _id: string;
  user?: {
    _id: string;
    email: string;
    phone: string;
    role: string;
  };
  personal: TeacherPersonalInfo;
  professional: TeacherProfessionalInfo;
  contact: TeacherContactInfo;
  attendance: TeacherAttendanceSummary;
  performance: TeacherPerformance;
  status: "active" | "inactive" | "on_leave" | "resigned" | "retired";
  documents?: Array<{
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type DepartmentWiseCount = {
  department: string;
  count: number;
  percentage: number;
};

type QualificationStats = {
  phd: number;
  masters: number;
  bachelors: number;
  diploma: number;
  others: number;
};

type TeacherStats = {
  totalTeachers: number;
  activeTeachers: number;
  onLeaveTeachers: number;
  inactiveTeachers: number;
  resignedTeachers: number;
  retiredTeachers: number;
  departmentWise: DepartmentWiseCount[];
  qualificationStats: QualificationStats;
  genderStats: {
    male: number;
    female: number;
    other: number;
  };
  averageExperience: number;
  newJoineesThisMonth: number;
  teacherStudentRatio: number;
};

type TeachersResponse = {
  teachers: Teacher[];
  departmentWise: DepartmentWiseCount[];
  total: number;
};

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), "dd MMM yyyy");
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
    case "on_leave":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">On Leave</Badge>;
    case "resigned":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Resigned</Badge>;
    case "retired":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Retired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getContractTypeBadge = (type: string) => {
  switch (type) {
    case "permanent":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Permanent</Badge>;
    case "contract":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Contract</Badge>;
    case "probation":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Probation</Badge>;
    case "intern":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Intern</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getDepartmentIcon = (department: string) => {
  switch (department.toLowerCase()) {
    case "mathematics":
      return <Calculator className="h-4 w-4 text-blue-600" />;
    case "science":
      return <Microscope className="h-4 w-4 text-green-600" />;
    case "physics":
      return <Atom className="h-4 w-4 text-purple-600" />;
    case "chemistry":
      return <Beaker className="h-4 w-4 text-orange-600" />;
    case "biology":
      return <Dna className="h-4 w-4 text-red-600" />;
    case "computer science":
      return <Code className="h-4 w-4 text-indigo-600" />;
    case "english":
      return <BookMarked className="h-4 w-4 text-yellow-600" />;
    case "hindi":
      return <Languages className="h-4 w-4 text-pink-600" />;
    case "social studies":
      return <Globe className="h-4 w-4 text-teal-600" />;
    case "physical education":
      return <Dumbbell className="h-4 w-4 text-orange-600" />;
    case "arts":
      return <Palette className="h-4 w-4 text-purple-600" />;
    case "music":
      return <Music className="h-4 w-4 text-indigo-600" />;
    default:
      return <BookOpen className="h-4 w-4 text-gray-600" />;
  }
};

// ==================== MOCK DATA ====================

const generateMockTeachers = (count: number): Teacher[] => {
  const teachers: Teacher[] = [];
  const firstNames = [
    "Rajesh", "Sunita", "Priya", "Suresh", "Anita", "Vikram", "Kavita", "Deepak", "Geeta", "Ramesh",
    "Neha", "Sanjay", "Pooja", "Amit", "Meena", "Ravi", "Anjali", "Mohan", "Shanti", "Prakash",
    "Lata", "Gopal", "Radha", "Krishna", "Sita", "Ram", "Lakshmi", "Narayan", "Uma", "Shankar"
  ];
  
  const lastNames = [
    "Sharma", "Verma", "Gupta", "Singh", "Reddy", "Patel", "Kumar", "Joshi", "Nair", "Rao",
    "Malhotra", "Mehta", "Choudhary", "Kapoor", "Saxena", "Trivedi", "Bhatt", "Menon", "Iyer", "Pillai"
  ];
  
  const departments = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "English", "Hindi", "Social Studies", "Physical Education", "Arts", "Music"
  ];
  
  const subjects = {
    "Mathematics": ["Algebra", "Geometry", "Calculus", "Trigonometry", "Statistics"],
    "Physics": ["Mechanics", "Optics", "Electromagnetism", "Thermodynamics", "Quantum Physics"],
    "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Biochemistry"],
    "Biology": ["Botany", "Zoology", "Genetics", "Microbiology", "Biotechnology"],
    "Computer Science": ["Programming", "Data Structures", "Algorithms", "Database", "Networking"],
    "English": ["Grammar", "Literature", "Creative Writing", "Communication Skills"],
    "Hindi": ["Grammar", "Literature", "Poetry", "Drama"],
    "Social Studies": ["History", "Geography", "Political Science", "Economics"],
    "Physical Education": ["Sports", "Yoga", "Health Education", "Athletics"],
    "Arts": ["Drawing", "Painting", "Sculpture", "Art History"],
    "Music": ["Vocal", "Instrumental", "Music Theory", "Composition"]
  };

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const subjectList = subjects[department as keyof typeof subjects] || [department];
    const gender = firstName.endsWith("a") ? "female" : "male";
    const status = Math.random() > 0.85 ? "on_leave" : (Math.random() > 0.9 ? "inactive" : "active");
    const contractType = Math.random() > 0.7 ? "permanent" : (Math.random() > 0.5 ? "contract" : "probation");
    const totalExperience = Math.floor(Math.random() * 25) + 2;
    const currentExperience = Math.floor(Math.random() * totalExperience) + 1;
    
    const totalDays = 120;
    const presentDays = Math.floor(Math.random() * 30) + 90; // 90-120
    const absentDays = Math.floor(Math.random() * 10);
    const leaveDays = Math.floor(Math.random() * 10);
    const lateDays = Math.floor(Math.random() * 5);
    const attendancePercentage = (presentDays / totalDays) * 100;

    teachers.push({
      _id: `TCH${String(i).padStart(4, "0")}`,
      user: {
        _id: `USR${String(i).padStart(4, "0")}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
        phone: `987654${String(i).padStart(4, "0")}`,
        role: "teacher",
      },
      personal: {
        firstName,
        lastName,
        dateOfBirth: `1980-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        gender: gender as "male" | "female" | "other",
        bloodGroup: ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"][Math.floor(Math.random() * 8)],
        aadhaarNumber: `${Math.floor(Math.random() * 1000000000000)}`,
        panNumber: `ABCDE${String(i).padStart(4, "0")}F`,
        religion: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist"][Math.floor(Math.random() * 5)],
        nationality: "Indian",
        motherTongue: ["Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali"][Math.floor(Math.random() * 6)],
        maritalStatus: Math.random() > 0.4 ? "married" : "single",
      },
      professional: {
        employeeId: `EMP${String(i).padStart(4, "0")}`,
        designation: Math.random() > 0.8 ? "Senior Teacher" : "Teacher",
        department,
        qualification: Math.random() > 0.7 ? "M.Ed" : (Math.random() > 0.5 ? "M.Sc" : "B.Ed"),
        specialization: subjectList.slice(0, Math.floor(Math.random() * 3) + 1),
        experience: {
          total: totalExperience,
          current: currentExperience,
          previous: totalExperience > currentExperience ? ["Previous School"] : undefined,
        },
        subjects: subjectList.slice(0, Math.floor(Math.random() * 3) + 1),
        classes: [
          { class: "10", section: "A", subject: subjectList[0] },
          { class: "10", section: "B", subject: subjectList[0] },
          { class: "9", section: "A", subject: subjectList[1] || subjectList[0] },
        ],
        joiningDate: new Date(2020 - currentExperience, 3, 1).toISOString(),
        contractType: contractType as any,
        salary: 50000 + Math.floor(Math.random() * 50000),
        bankAccount: `123456${String(i).padStart(6, "0")}`,
        ifscCode: "SBIN0012345",
        pfNumber: `PF/${String(i).padStart(6, "0")}`,
        esiNumber: `ESI/${String(i).padStart(6, "0")}`,
      },
      contact: {
        address: `${Math.floor(Math.random() * 999)} Teachers Colony`,
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        phone: `987654${String(i).padStart(4, "0")}`,
        alternatePhone: `987654${String(i + 1000).padStart(4, "0")}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
        emergencyContact: `987654${String(i + 2000).padStart(4, "0")}`,
        emergencyPhone: `987654${String(i + 3000).padStart(4, "0")}`,
        emergencyRelation: ["Spouse", "Parent", "Sibling"][Math.floor(Math.random() * 3)],
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        percentage: attendancePercentage,
      },
      performance: {
        studentResults: {
          averageMarks: 65 + Math.floor(Math.random() * 25),
          passPercentage: 75 + Math.floor(Math.random() * 20),
          distinctionCount: Math.floor(Math.random() * 15),
        },
        feedback: {
          studentRating: 3.5 + Math.random() * 1.5,
          parentRating: 3.5 + Math.random() * 1.5,
          peerRating: 3.5 + Math.random() * 1.5,
        },
        achievements: Math.random() > 0.7 ? ["Best Teacher Award 2025", "Research Publication"] : undefined,
        trainings: Math.random() > 0.6 ? [
          { name: "Pedagogy Training", date: "2025-01-15", provider: "CBSE" },
          { name: "Digital Classroom", date: "2024-11-20", provider: "Microsoft" },
        ] : undefined,
      },
      status: status as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return teachers;
};

const mockTeachers = generateMockTeachers(75);

const calculateTeacherStats = (teachers: Teacher[]): TeacherStats => {
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === "active").length;
  const onLeaveTeachers = teachers.filter(t => t.status === "on_leave").length;
  const inactiveTeachers = teachers.filter(t => t.status === "inactive").length;
  const resignedTeachers = teachers.filter(t => t.status === "resigned").length;
  const retiredTeachers = teachers.filter(t => t.status === "retired").length;

  // Department-wise
  const deptMap = new Map<string, number>();
  teachers.forEach(t => {
    const dept = t.professional.department;
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  
  const departmentWise: DepartmentWiseCount[] = Array.from(deptMap.entries()).map(([department, count]) => ({
    department,
    count,
    percentage: (count / totalTeachers) * 100,
  })).sort((a, b) => b.count - a.count);

  // Qualification stats
  const qualificationStats: QualificationStats = {
    phd: teachers.filter(t => t.professional.qualification.includes("Ph.D") || t.professional.qualification.includes("PhD")).length,
    masters: teachers.filter(t => t.professional.qualification.includes("M.") || t.professional.qualification.includes("Post Graduate")).length,
    bachelors: teachers.filter(t => t.professional.qualification.includes("B.") || t.professional.qualification.includes("Graduate")).length,
    diploma: teachers.filter(t => t.professional.qualification.includes("Diploma")).length,
    others: teachers.filter(t => !t.professional.qualification.match(/[MB]\.|Diploma|Ph\.?D/i)).length,
  };

  // Gender stats
  const genderStats = {
    male: teachers.filter(t => t.personal.gender === "male").length,
    female: teachers.filter(t => t.personal.gender === "female").length,
    other: teachers.filter(t => t.personal.gender === "other").length,
  };

  // Average experience
  const totalExperience = teachers.reduce((sum, t) => sum + t.professional.experience.total, 0);
  const averageExperience = totalTeachers > 0 ? totalExperience / totalTeachers : 0;

  // New joinees this month (mock)
  const newJoineesThisMonth = 3;

  // Teacher-student ratio (mock - assuming 1250 students)
  const teacherStudentRatio = 1250 / activeTeachers;

  return {
    totalTeachers,
    activeTeachers,
    onLeaveTeachers,
    inactiveTeachers,
    resignedTeachers,
    retiredTeachers,
    departmentWise,
    qualificationStats,
    genderStats,
    averageExperience,
    newJoineesThisMonth,
    teacherStudentRatio,
  };
};

const mockStats = calculateTeacherStats(mockTeachers);

// ==================== MAIN COMPONENT ====================

export default function PrincipalTeachersView() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherStats>(mockStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qualificationFilter, setQualificationFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ==================== DATA LOADING ====================

  const loadTeachers = useCallback(async (showRefreshing = false) => {
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
      if (departmentFilter !== "all") params.department = departmentFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await principalService.getTeachersSummary();
      const teachersData = response.data?.data?.teachers || [];
      const statsData = response.data?.data?.stats || { total: 0, active: 0, onLeave: 0 };
      const pagination = response.data?.data?.pagination || { pages: 1, total: 0 };

      setTeachers(teachersData);
      setStats({
        totalTeachers: statsData.total || teachersData.length,
        activeTeachers: statsData.active || 0,
        onLeaveTeachers: statsData.onLeave || 0,
        inactiveTeachers: statsData.inactive || teachersData.filter((t: any) => t.status === "inactive").length,
        resignedTeachers: statsData.resigned || teachersData.filter((t: any) => t.status === "resigned").length,
        retiredTeachers: statsData.retired || teachersData.filter((t: any) => t.status === "retired").length,
        departmentWise: statsData.departmentWise || (() => {
          const deptMap = new Map<string, number>();
          teachersData.forEach((t: any) => {
            const dept = t.professional?.department || "Unknown";
            deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
          });
          return Array.from(deptMap.entries()).map(([department, count]) => ({
            department,
            count,
            percentage: teachersData.length > 0 ? (count / teachersData.length) * 100 : 0,
          }));
        })(),
        qualificationStats: statsData.qualificationStats || {
          phd: teachersData.filter((t: any) => t.professional?.qualification?.toLowerCase().includes("phd")).length,
          masters: teachersData.filter((t: any) => t.professional?.qualification?.toLowerCase().includes("m.")).length,
          bachelors: teachersData.filter((t: any) => t.professional?.qualification?.toLowerCase().includes("b.")).length,
          diploma: teachersData.filter((t: any) => t.professional?.qualification?.toLowerCase().includes("diploma")).length,
          others: teachersData.filter((t: any) => {
            const q = t.professional?.qualification?.toLowerCase() || "";
            return !q.match(/phd|m\.|b\.|diploma/);
          }).length,
        },
        genderStats: statsData.genderStats || {
          male: teachersData.filter((t: any) => t.personal?.gender?.toLowerCase() === "male").length,
          female: teachersData.filter((t: any) => t.personal?.gender?.toLowerCase() === "female").length,
          other: teachersData.filter((t: any) => t.personal?.gender?.toLowerCase() === "other").length,
        },
        teacherStudentRatio: teachersData.length > 0 ? 1250 / teachersData.length : 0,
        averageExperience: teachersData.length > 0
          ? teachersData.reduce((sum: number, t: any) => sum + (t.professional?.experience?.total || 0), 0) / teachersData.length
          : 0,
        newJoineesThisMonth: statsData.newJoineesThisMonth || 0,
      });
      setTotalPages(pagination.pages || 1);
      setTotalRecords(pagination.total || 0);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load teachers");
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, departmentFilter, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // ==================== COMPUTED VALUES ====================

  const departments = useMemo(() => {
    const depts = new Set(mockTeachers.map(t => t.professional.department));
    return Array.from(depts).sort();
  }, []);

  const filteredCounts = useMemo(() => {
    let filtered = [...mockTeachers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        `${t.personal.firstName} ${t.personal.lastName}`.toLowerCase().includes(term) ||
        t.professional.employeeId.toLowerCase().includes(term)
      );
    }
    
    return {
      total: mockTeachers.length,
      filtered: filtered.length,
      active: filtered.filter(t => t.status === "active").length,
      onLeave: filtered.filter(t => t.status === "on_leave").length,
    };
  }, [searchTerm]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadTeachers(true);
    toast.success("Teacher data refreshed");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTeachers();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setQualificationFilter("all");
    setCurrentPage(1);
    toast.success("Filters reset");
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDialog(true);
  };

  const handleContactTeacher = (teacher: Teacher) => {
    toast.info(`Contact options for ${teacher.personal.firstName} ${teacher.personal.lastName}`);
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = [
      "Employee ID", "Name", "Department", "Designation", "Qualification",
      "Phone", "Email", "Status", "Experience", "Subjects"
    ];
    
    const rows = teachers.map(t => [
      t.professional.employeeId,
      `${t.personal.firstName} ${t.personal.lastName}`,
      t.professional.department,
      t.professional.designation,
      t.professional.qualification,
      t.contact.phone,
      t.contact.email,
      t.status,
      `${t.professional.experience.total} years`,
      t.professional.subjects.join(", "),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Teacher data exported");
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
          <p className="text-muted-foreground">Loading teacher data...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Teachers Overview</h1>
        <p className="text-muted-foreground mt-1">
          View and monitor all teacher information (Read-only)
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
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  {stats.activeTeachers} Active
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  <Clock className="h-3 w-3 mr-1 text-blue-600" />
                  {stats.onLeaveTeachers} On Leave
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
              <p className="text-sm text-muted-foreground">Teacher-Student Ratio</p>
              <p className="text-2xl font-bold">1:{stats.teacherStudentRatio.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeTeachers} teachers / 1250 students
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Experience</p>
              <p className="text-2xl font-bold">{stats.averageExperience.toFixed(1)} years</p>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.newJoineesThisMonth} new this month
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gender Ratio</p>
              <p className="text-2xl font-bold">{stats.genderStats.male} / {stats.genderStats.female}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-blue-50">
                  <span className="text-blue-600">♂ {stats.genderStats.male}</span>
                </Badge>
                <Badge variant="outline" className="bg-pink-50">
                  <span className="text-pink-600">♀ {stats.genderStats.female}</span>
                </Badge>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
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
              placeholder="Search by name, ID, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <Building className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
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
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
            <SelectTrigger>
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Qualifications</SelectItem>
              <SelectItem value="phd">Ph.D</SelectItem>
              <SelectItem value="masters">Masters</SelectItem>
              <SelectItem value="bachelors">Bachelors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
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
            Showing {teachers.length} of {filteredCounts.filtered} teachers
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTeacherTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Teacher List
            <Badge variant="outline" className="ml-2">
              {totalRecords} total
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {teachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No teachers found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher._id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs font-medium">
                        {teacher.professional?.employeeId || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`bg-blue-600 text-white text-xs`}>
                              {getInitials(teacher.personal?.firstName || "", teacher.personal?.lastName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {teacher.personal?.firstName || ""} {teacher.personal?.lastName || ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.professional?.subjects?.slice(0, 2).join(", ") || "All Subjects"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDepartmentIcon(teacher.professional?.department || "")}
                          <span>{teacher.professional?.department || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.professional?.designation || "Teacher"}</TableCell>
                      <TableCell>{teacher.professional?.qualification || "-"}</TableCell>
                      <TableCell>{teacher.professional?.experience?.total ?? 0} years</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{teacher.contact?.phone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(teacher.status || "active")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewTeacher(teacher)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleContactTeacher(teacher)}
                            title="Contact"
                          >
                            <Phone className="h-4 w-4" />
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

  const renderTeacherDetailsDialog = () => (
    <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Teacher Details
          </DialogTitle>
        </DialogHeader>
        {selectedTeacher && (
          <div className="space-y-4 py-4">
            {/* Header with Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(selectedTeacher.personal.firstName, selectedTeacher.personal.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedTeacher.personal.firstName} {selectedTeacher.personal.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedTeacher.professional.employeeId}</Badge>
                  {getStatusBadge(selectedTeacher.status)}
                  {getContractTypeBadge(selectedTeacher.professional.contractType)}
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
                  <p className="text-sm">{formatDate(selectedTeacher.personal.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm capitalize">{selectedTeacher.personal.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-sm">{selectedTeacher.personal.bloodGroup || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                  <p className="text-sm">{selectedTeacher.personal.aadhaarNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PAN Number</p>
                  <p className="text-sm">{selectedTeacher.personal.panNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marital Status</p>
                  <p className="text-sm capitalize">{selectedTeacher.personal.maritalStatus || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Religion</p>
                  <p className="text-sm">{selectedTeacher.personal.religion || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mother Tongue</p>
                  <p className="text-sm">{selectedTeacher.personal.motherTongue || "-"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-green-600" />
                Professional Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{selectedTeacher.professional.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Designation</p>
                  <p className="text-sm">{selectedTeacher.professional.designation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Qualification</p>
                  <p className="text-sm">{selectedTeacher.professional.qualification}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Specialization</p>
                  <p className="text-sm">{selectedTeacher.professional.specialization.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience (Total)</p>
                  <p className="text-sm">{selectedTeacher.professional.experience.total} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience (Current)</p>
                  <p className="text-sm">{selectedTeacher.professional.experience.current} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joining Date</p>
                  <p className="text-sm">{formatDate(selectedTeacher.professional.joiningDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subjects Taught</p>
                  <p className="text-sm">{selectedTeacher.professional.subjects.join(", ")}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Classes Assigned */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <School className="h-4 w-4 text-purple-600" />
                Classes Assigned
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTeacher.professional.classes.map((cls, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{cls.class}</TableCell>
                        <TableCell>{cls.section}</TableCell>
                        <TableCell>{cls.subject}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Contact Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {selectedTeacher.contact.address}, {selectedTeacher.contact.city}, {selectedTeacher.contact.state} - {selectedTeacher.contact.pincode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedTeacher.contact.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alternate Phone</p>
                    <p className="text-sm">{selectedTeacher.contact.alternatePhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedTeacher.contact.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="text-sm">{selectedTeacher.contact.emergencyContact || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">Avg Student Marks</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedTeacher.performance.studentResults.averageMarks}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">Pass Percentage</p>
                  <p className="text-xl font-bold text-green-600">
                    {selectedTeacher.performance.studentResults.passPercentage}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">Distinctions</p>
                  <p className="text-xl font-bold text-purple-600">
                    {selectedTeacher.performance.studentResults.distinctionCount}
                  </p>
                </div>
              </div>

              {selectedTeacher.performance.feedback && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student Rating</p>
                    <p className="text-lg font-medium">{selectedTeacher.performance.feedback.studentRating?.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parent Rating</p>
                    <p className="text-lg font-medium">{selectedTeacher.performance.feedback.parentRating?.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peer Rating</p>
                    <p className="text-lg font-medium">{selectedTeacher.performance.feedback.peerRating?.toFixed(1)}/5</p>
                  </div>
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
                  <p className="text-lg font-bold">{selectedTeacher.attendance.totalDays}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-xs text-green-600">Present</p>
                  <p className="text-lg font-bold text-green-700">{selectedTeacher.attendance.presentDays}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-xs text-red-600">Absent</p>
                  <p className="text-lg font-bold text-red-700">{selectedTeacher.attendance.absentDays}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600">%</p>
                  <p className="text-lg font-bold text-blue-700">{selectedTeacher.attendance.percentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTeacherDialog(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => handleContactTeacher(selectedTeacher!)}>
            <Phone className="h-4 w-4 mr-2" />
            Contact
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
            Teacher Statistics
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Department-wise Distribution */}
          <div>
            <h3 className="font-semibold mb-3">Department-wise Distribution</h3>
            <div className="space-y-3">
              {stats.departmentWise.slice(0, 8).map((dept) => (
                <div key={dept.department} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1">
                      {getDepartmentIcon(dept.department)}
                      {dept.department}
                    </span>
                    <span>{dept.count} teachers ({dept.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Qualification Stats */}
          <div>
            <h3 className="font-semibold mb-3">Qualification Breakdown</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-xs text-purple-600">Ph.D</p>
                <p className="text-xl font-bold text-purple-700">{stats.qualificationStats.phd}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">Masters</p>
                <p className="text-xl font-bold text-blue-700">{stats.qualificationStats.masters}</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-green-600">Bachelors</p>
                <p className="text-xl font-bold text-green-700">{stats.qualificationStats.bachelors}</p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-600">Diploma</p>
                <p className="text-xl font-bold text-yellow-700">{stats.qualificationStats.diploma}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Others</p>
                <p className="text-xl font-bold">{stats.qualificationStats.others}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Distribution */}
          <div>
            <h3 className="font-semibold mb-3">Status Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-700">{stats.activeTeachers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">On Leave</p>
                <p className="text-2xl font-bold text-blue-700">{stats.onLeaveTeachers}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-600">Inactive</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.inactiveTeachers}</p>
              </div>
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
      {renderTeacherTable()}

      {/* Dialogs */}
      {renderTeacherDetailsDialog()}
      {renderStatsDialog()}
    </div>
  );
}