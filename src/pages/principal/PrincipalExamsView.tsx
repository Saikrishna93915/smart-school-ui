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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  Users,
  School,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Loader2,
  RefreshCw,
  Download,
  Printer,
  Mail,
  Phone,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Filter,
  Search,
  X,
  Grid,
  List,
  ArrowUpDown,
  Star,
  Trophy,
  Medal,
  Bell,
  Send,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

import principalService from "@/Services/principalService";

// ==================== TYPES ====================

type ExamType = "unit-test" | "half-yearly" | "annual" | "quarterly" | "board" | "model";
type ExamStatus = "scheduled" | "ongoing" | "completed" | "results-published";

type ExamSubject = {
  subject: string;
  subjectCode: string;
  date: string;
  time: string;
  duration: number; // minutes
  room: string;
  teacher: string;
  teacherId: string;
  totalMarks: number;
  passingMarks: number;
  maxMarks: number;
};

type Exam = {
  id: string;
  name: string;
  type: ExamType;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  classes: string[];
  sections?: string[];
  subjects: ExamSubject[];
  description?: string;
  createdBy: string;
  createdAt: string;
  resultsPublishedAt?: string;
};

type ExamResult = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  admissionNumber: string;
  class: string;
  section: string;
  examId: string;
  examName: string;
  subjects: {
    subject: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    gradePoint: number;
    remarks?: string;
  }[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  rank: number;
  classRank: number;
  status: "pass" | "fail" | "compartment";
  attendance?: number;
  lastUpdated: string;
};

type ExamStats = {
  totalExams: number;
  scheduledExams: number;
  ongoingExams: number;
  completedExams: number;
  publishedExams: number;
  completionRate: number;
  averageSchoolPercentage: number;
  passPercentage: number;
  distinctionCount: number;
  firstClassCount: number;
  secondClassCount: number;
  passCount: number;
  failCount: number;
  totalStudents: number;
  improvementRate?: number;
};

type GradeDistribution = {
  grade: string;
  count: number;
  percentage: number;
  color: string;
};

type SubjectPerformance = {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  totalStudents: number;
};

type TeacherPerformance = {
  teacherId: string;
  teacherName: string;
  subject: string;
  classes: string[];
  averageMarks: number;
  passPercentage: number;
  totalStudents: number;
};

type TopPerformer = {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  percentage: number;
  rank: number;
  subjects: {
    subject: string;
    marks: number;
    grade: string;
  }[];
};

type LowPerformer = {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  percentage: number;
  failingSubjects: string[];
  parentPhone: string;
  parentEmail?: string;
  attendance?: number;
};

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "dd MMM yyyy");
  } catch (e) {
    return "Invalid Date";
  }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "dd MMM yyyy, hh:mm a");
  } catch (e) {
    return "Invalid Date";
  }
};

const formatTime = (timeString: string): string => {
  return timeString;
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-IN").format(num);
};

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// CBSE Grading System
const getGrade = (percentage: number): string => {
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E";
};

const getGradePoint = (percentage: number): number => {
  if (percentage >= 91) return 10;
  if (percentage >= 81) return 9;
  if (percentage >= 71) return 8;
  if (percentage >= 61) return 7;
  if (percentage >= 51) return 6;
  if (percentage >= 41) return 5;
  if (percentage >= 33) return 4;
  return 0;
};

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case "A1":
    case "A2":
      return "bg-green-100 text-green-800 border-green-200";
    case "B1":
    case "B2":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "C1":
    case "C2":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "D":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "E":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getExamTypeBadge = (type: ExamType) => {
  switch (type) {
    case "unit-test":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Unit Test</Badge>;
    case "quarterly":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Quarterly</Badge>;
    case "half-yearly":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Half Yearly</Badge>;
    case "annual":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Annual</Badge>;
    case "board":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Board</Badge>;
    case "model":
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Model</Badge>;
    default:
      return <Badge variant="outline">Exam</Badge>;
  }
};

const getExamStatusBadge = (status: ExamStatus) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>;
    case "ongoing":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Ongoing</Badge>;
    case "completed":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Completed</Badge>;
    case "results-published":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Results Published</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getResultStatusBadge = (status: string) => {
  switch (status) {
    case "pass":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pass</Badge>;
    case "fail":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Fail</Badge>;
    case "compartment":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Compartment</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getTrendIcon = (value: number, previousValue: number) => {
  if (value > previousValue) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (value < previousValue) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return null;
};

// ==================== MOCK DATA ====================

const mockExams: Exam[] = [
  {
    id: "exam-001",
    name: "Unit Test 1",
    type: "unit-test",
    status: "completed",
    startDate: "2026-04-10",
    endDate: "2026-04-15",
    classes: ["6", "7", "8", "9", "10"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2026-04-10",
        time: "09:00 AM - 11:00 AM",
        duration: 120,
        room: "101-105",
        teacher: "Mr. Sharma",
        teacherId: "T001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2026-04-11",
        time: "09:00 AM - 11:00 AM",
        duration: 120,
        room: "101-105",
        teacher: "Mrs. Gupta",
        teacherId: "T002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-03-01T10:00:00",
    resultsPublishedAt: "2026-04-20",
  },
  {
    id: "exam-002",
    name: "Unit Test 2",
    type: "unit-test",
    status: "completed",
    startDate: "2026-05-15",
    endDate: "2026-05-20",
    classes: ["6", "7", "8", "9", "10"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2026-05-15",
        time: "09:00 AM - 11:00 AM",
        duration: 120,
        room: "101-105",
        teacher: "Mr. Sharma",
        teacherId: "T001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2026-05-16",
        time: "09:00 AM - 11:00 AM",
        duration: 120,
        room: "101-105",
        teacher: "Mrs. Gupta",
        teacherId: "T002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-04-01T10:00:00",
    resultsPublishedAt: "2026-05-25",
  },
  {
    id: "exam-003",
    name: "Quarterly Exam",
    type: "quarterly",
    status: "completed",
    startDate: "2026-07-01",
    endDate: "2026-07-10",
    classes: ["6", "7", "8", "9", "10", "11", "12"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2026-07-01",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mr. Sharma",
        teacherId: "T001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2026-07-02",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mrs. Gupta",
        teacherId: "T002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "English",
        subjectCode: "ENG",
        date: "2026-07-03",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Ms. Reddy",
        teacherId: "T003",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Hindi",
        subjectCode: "HIN",
        date: "2026-07-04",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mr. Verma",
        teacherId: "T004",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Social Studies",
        subjectCode: "SST",
        date: "2026-07-05",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mrs. Singh",
        teacherId: "T005",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-05-15T10:00:00",
    resultsPublishedAt: "2026-07-15",
  },
  {
    id: "exam-004",
    name: "Half Yearly Exam",
    type: "half-yearly",
    status: "ongoing",
    startDate: "2026-09-15",
    endDate: "2026-09-25",
    classes: ["6", "7", "8", "9", "10", "11", "12"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2026-09-15",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mr. Sharma",
        teacherId: "T001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2026-09-16",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mrs. Gupta",
        teacherId: "T002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-08-01T10:00:00",
  },
  {
    id: "exam-005",
    name: "Annual Exam",
    type: "annual",
    status: "scheduled",
    startDate: "2026-12-01",
    endDate: "2026-12-15",
    classes: ["6", "7", "8", "9", "10", "11", "12"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2026-12-01",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mr. Sharma",
        teacherId: "T001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2026-12-02",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "101-110",
        teacher: "Mrs. Gupta",
        teacherId: "T002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-10-01T10:00:00",
  },
  {
    id: "exam-006",
    name: "Board Exam - Class 10",
    type: "board",
    status: "scheduled",
    startDate: "2027-02-15",
    endDate: "2027-03-10",
    classes: ["10"],
    subjects: [
      {
        subject: "Mathematics",
        subjectCode: "MATH",
        date: "2027-02-15",
        time: "10:30 AM - 01:30 PM",
        duration: 180,
        room: "Main Hall",
        teacher: "External",
        teacherId: "EXT001",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Science",
        subjectCode: "SCI",
        date: "2027-02-18",
        time: "10:30 AM - 01:30 PM",
        duration: 180,
        room: "Main Hall",
        teacher: "External",
        teacherId: "EXT002",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Board",
    createdAt: "2026-11-01T10:00:00",
  },
  {
    id: "exam-007",
    name: "Model Exam - Class 12",
    type: "model",
    status: "scheduled",
    startDate: "2027-01-05",
    endDate: "2027-01-15",
    classes: ["12"],
    subjects: [
      {
        subject: "Physics",
        subjectCode: "PHY",
        date: "2027-01-05",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "Science Block",
        teacher: "Dr. Kumar",
        teacherId: "T006",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Chemistry",
        subjectCode: "CHEM",
        date: "2027-01-06",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "Science Block",
        teacher: "Dr. Singh",
        teacherId: "T007",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
      {
        subject: "Biology",
        subjectCode: "BIO",
        date: "2027-01-07",
        time: "09:00 AM - 12:00 PM",
        duration: 180,
        room: "Science Block",
        teacher: "Dr. Reddy",
        teacherId: "T008",
        totalMarks: 100,
        passingMarks: 35,
        maxMarks: 100,
      },
    ],
    createdBy: "Admin",
    createdAt: "2026-11-15T10:00:00",
  },
];

const mockResults: ExamResult[] = [
  {
    studentId: "S001",
    studentName: "Aarav Kumar",
    rollNumber: "10A-01",
    admissionNumber: "ADM2024001",
    class: "10",
    section: "A",
    examId: "exam-001",
    examName: "Unit Test 1",
    subjects: [
      { subject: "Mathematics", marksObtained: 85, totalMarks: 100, percentage: 85, grade: "A2", gradePoint: 9 },
      { subject: "Science", marksObtained: 78, totalMarks: 100, percentage: 78, grade: "B1", gradePoint: 8 },
      { subject: "English", marksObtained: 92, totalMarks: 100, percentage: 92, grade: "A1", gradePoint: 10 },
      { subject: "Hindi", marksObtained: 88, totalMarks: 100, percentage: 88, grade: "A2", gradePoint: 9 },
      { subject: "Social Studies", marksObtained: 82, totalMarks: 100, percentage: 82, grade: "A2", gradePoint: 9 },
    ],
    totalMarks: 425,
    totalMaxMarks: 500,
    percentage: 85,
    grade: "A2",
    gradePoint: 9,
    rank: 1,
    classRank: 1,
    status: "pass",
    attendance: 98,
    lastUpdated: "2026-04-20T10:00:00",
  },
  {
    studentId: "S002",
    studentName: "Sneha Reddy",
    rollNumber: "10A-02",
    admissionNumber: "ADM2024002",
    class: "10",
    section: "A",
    examId: "exam-001",
    examName: "Unit Test 1",
    subjects: [
      { subject: "Mathematics", marksObtained: 78, totalMarks: 100, percentage: 78, grade: "B1", gradePoint: 8 },
      { subject: "Science", marksObtained: 85, totalMarks: 100, percentage: 85, grade: "A2", gradePoint: 9 },
      { subject: "English", marksObtained: 88, totalMarks: 100, percentage: 88, grade: "A2", gradePoint: 9 },
      { subject: "Hindi", marksObtained: 82, totalMarks: 100, percentage: 82, grade: "A2", gradePoint: 9 },
      { subject: "Social Studies", marksObtained: 79, totalMarks: 100, percentage: 79, grade: "B1", gradePoint: 8 },
    ],
    totalMarks: 412,
    totalMaxMarks: 500,
    percentage: 82.4,
    grade: "A2",
    gradePoint: 9,
    rank: 2,
    classRank: 2,
    status: "pass",
    attendance: 96,
    lastUpdated: "2026-04-20T10:00:00",
  },
  {
    studentId: "S003",
    studentName: "Rahul Verma",
    rollNumber: "10B-01",
    admissionNumber: "ADM2024003",
    class: "10",
    section: "B",
    examId: "exam-001",
    examName: "Unit Test 1",
    subjects: [
      { subject: "Mathematics", marksObtained: 45, totalMarks: 100, percentage: 45, grade: "C2", gradePoint: 5 },
      { subject: "Science", marksObtained: 52, totalMarks: 100, percentage: 52, grade: "C1", gradePoint: 6 },
      { subject: "English", marksObtained: 48, totalMarks: 100, percentage: 48, grade: "C2", gradePoint: 5 },
      { subject: "Hindi", marksObtained: 55, totalMarks: 100, percentage: 55, grade: "C1", gradePoint: 6 },
      { subject: "Social Studies", marksObtained: 38, totalMarks: 100, percentage: 38, grade: "D", gradePoint: 4 },
    ],
    totalMarks: 238,
    totalMaxMarks: 500,
    percentage: 47.6,
    grade: "C2",
    gradePoint: 5,
    rank: 98,
    classRank: 42,
    status: "pass",
    attendance: 72,
    lastUpdated: "2026-04-20T10:00:00",
  },
  {
    studentId: "S004",
    studentName: "Priya Sharma",
    rollNumber: "9A-01",
    admissionNumber: "ADM2024004",
    class: "9",
    section: "A",
    examId: "exam-002",
    examName: "Unit Test 2",
    subjects: [
      { subject: "Mathematics", marksObtained: 92, totalMarks: 100, percentage: 92, grade: "A1", gradePoint: 10 },
      { subject: "Science", marksObtained: 95, totalMarks: 100, percentage: 95, grade: "A1", gradePoint: 10 },
      { subject: "English", marksObtained: 89, totalMarks: 100, percentage: 89, grade: "A2", gradePoint: 9 },
      { subject: "Hindi", marksObtained: 88, totalMarks: 100, percentage: 88, grade: "A2", gradePoint: 9 },
      { subject: "Social Studies", marksObtained: 91, totalMarks: 100, percentage: 91, grade: "A1", gradePoint: 10 },
    ],
    totalMarks: 455,
    totalMaxMarks: 500,
    percentage: 91,
    grade: "A1",
    gradePoint: 10,
    rank: 1,
    classRank: 1,
    status: "pass",
    attendance: 99,
    lastUpdated: "2026-05-25T10:00:00",
  },
  {
    studentId: "S005",
    studentName: "Anjali Gupta",
    rollNumber: "9B-01",
    admissionNumber: "ADM2024005",
    class: "9",
    section: "B",
    examId: "exam-002",
    examName: "Unit Test 2",
    subjects: [
      { subject: "Mathematics", marksObtained: 32, totalMarks: 100, percentage: 32, grade: "E", gradePoint: 0 },
      { subject: "Science", marksObtained: 28, totalMarks: 100, percentage: 28, grade: "E", gradePoint: 0 },
      { subject: "English", marksObtained: 45, totalMarks: 100, percentage: 45, grade: "C2", gradePoint: 5 },
      { subject: "Hindi", marksObtained: 52, totalMarks: 100, percentage: 52, grade: "C1", gradePoint: 6 },
      { subject: "Social Studies", marksObtained: 35, totalMarks: 100, percentage: 35, grade: "D", gradePoint: 4 },
    ],
    totalMarks: 192,
    totalMaxMarks: 500,
    percentage: 38.4,
    grade: "D",
    gradePoint: 4,
    rank: 120,
    classRank: 45,
    status: "fail",
    attendance: 65,
    lastUpdated: "2026-05-25T10:00:00",
  },
];

// Generate more mock results for variety
const generateMoreResults = () => {
  const results = [...mockResults];
  const names = [
    "Vikram Singh", "Divya Nair", "Arjun Reddy", "Kavita Sharma", "Ravi Kumar",
    "Neha Gupta", "Amit Patel", "Pooja Singh", "Sanjay Verma", "Meera Nair",
    "Rajesh Kumar", "Sunita Reddy", "Deepak Sharma", "Anjali Gupta", "Suresh Singh"
  ];
  
  for (let i = 6; i <= 30; i++) {
    const percentage = Math.floor(Math.random() * 60) + 30; // 30-90%
    const passStatus = percentage >= 33 ? "pass" : (percentage >= 25 ? "compartment" : "fail");
    
    results.push({
      studentId: `S${String(i).padStart(3, "0")}`,
      studentName: names[i % names.length],
      rollNumber: `10A-${String(i).padStart(2, "0")}`,
      admissionNumber: `ADM2024${String(i).padStart(3, "0")}`,
      class: "10",
      section: i % 2 === 0 ? "A" : "B",
      examId: "exam-001",
      examName: "Unit Test 1",
      subjects: [
        { subject: "Mathematics", marksObtained: Math.floor(Math.random() * 70) + 30, totalMarks: 100, percentage: Math.floor(Math.random() * 70) + 30, grade: getGrade(percentage), gradePoint: getGradePoint(percentage) },
        { subject: "Science", marksObtained: Math.floor(Math.random() * 70) + 30, totalMarks: 100, percentage: Math.floor(Math.random() * 70) + 30, grade: getGrade(percentage), gradePoint: getGradePoint(percentage) },
        { subject: "English", marksObtained: Math.floor(Math.random() * 70) + 30, totalMarks: 100, percentage: Math.floor(Math.random() * 70) + 30, grade: getGrade(percentage), gradePoint: getGradePoint(percentage) },
        { subject: "Hindi", marksObtained: Math.floor(Math.random() * 70) + 30, totalMarks: 100, percentage: Math.floor(Math.random() * 70) + 30, grade: getGrade(percentage), gradePoint: getGradePoint(percentage) },
        { subject: "Social Studies", marksObtained: Math.floor(Math.random() * 70) + 30, totalMarks: 100, percentage: Math.floor(Math.random() * 70) + 30, grade: getGrade(percentage), gradePoint: getGradePoint(percentage) },
      ],
      totalMarks: Math.floor(Math.random() * 350) + 150,
      totalMaxMarks: 500,
      percentage: percentage,
      grade: getGrade(percentage),
      gradePoint: getGradePoint(percentage),
      rank: i + 10,
      classRank: i % 40 + 1,
      status: passStatus as "pass" | "fail" | "compartment",
      attendance: Math.floor(Math.random() * 30) + 70,
      lastUpdated: "2026-04-20T10:00:00",
    });
  }
  
  return results;
};

const allMockResults = [...mockResults, ...generateMoreResults()];

// ==================== MAIN COMPONENT ====================

export default function PrincipalExamsView() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [examTypeFilter, setExamTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedExamForResults, setSelectedExamForResults] = useState<string>("all");

  // ==================== DATA LOADING ====================

  const loadExamsData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Call actual API
      const params: any = {};
      if (examTypeFilter !== "all") params.type = examTypeFilter;
      if (classFilter !== "all") params.class = classFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await principalService.getExamResults(params);
      const apiData = response.data?.data || [];

      // Transform API data to match frontend format
      const transformedExams = apiData.map((exam: any) => ({
        id: exam._id,
        name: exam.name,
        type: exam.type || "unit-test",
        classes: exam.classes || (exam.class ? [exam.class] : []),
        sections: exam.sections || (exam.section ? [exam.section] : []),
        startDate: exam.startDate || exam.date,
        endDate: exam.endDate || exam.date,
        startTime: exam.startTime || "09:00",
        endTime: exam.endTime || "12:00",
        duration: exam.duration || 120,
        totalMarks: exam.totalMarks || 100,
        status: exam.status || "scheduled",
        subjects: exam.subjects || [],
        createdBy: exam.createdBy,
        createdAt: exam.createdAt,
      }));

      setExams(transformedExams);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading exams data:", error);
      toast.error("Failed to load exams data");
      setLoading(false);
      setRefreshing(false);
    }
  }, [examTypeFilter, classFilter, statusFilter]);

  useEffect(() => {
    loadExamsData();
  }, [loadExamsData]);

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo((): ExamStats => {
    const totalExams = exams.length;
    const scheduledExams = exams.filter(e => e.status === "scheduled").length;
    const ongoingExams = exams.filter(e => e.status === "ongoing").length;
    const completedExams = exams.filter(e => e.status === "completed").length;
    const publishedExams = exams.filter(e => e.status === "results-published").length;
    
    const completionRate = totalExams > 0 ? ((completedExams + publishedExams) / totalExams) * 100 : 0;
    
    const averagePercentage = results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0;
    
    const passCount = results.filter(r => r.status === "pass").length;
    const totalResults = results.length;
    const passPercentage = totalResults > 0 ? (passCount / totalResults) * 100 : 0;
    
    const distinctionCount = results.filter(r => r.percentage >= 75).length;
    const firstClassCount = results.filter(r => r.percentage >= 60 && r.percentage < 75).length;
    const secondClassCount = results.filter(r => r.percentage >= 45 && r.percentage < 60).length;
    
    return {
      totalExams,
      scheduledExams,
      ongoingExams,
      completedExams,
      publishedExams,
      completionRate,
      averageSchoolPercentage: averagePercentage,
      passPercentage,
      distinctionCount,
      firstClassCount,
      secondClassCount,
      passCount,
      failCount: totalResults - passCount,
      totalStudents: totalResults,
      improvementRate: 2.5, // Mock improvement rate
    };
  }, [exams, results]);

  const filteredExams = useMemo(() => {
    let filtered = [...exams];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        e => e.name.toLowerCase().includes(term) ||
             e.type.toLowerCase().includes(term) ||
             e.classes.some(c => c.includes(term))
      );
    }

    if (examTypeFilter !== "all") {
      filtered = filtered.filter(e => e.type === examTypeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    return filtered;
  }, [exams, searchTerm, examTypeFilter, statusFilter]);

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (selectedExamForResults !== "all") {
      filtered = filtered.filter(r => r.examId === selectedExamForResults);
    }

    if (classFilter !== "all") {
      filtered = filtered.filter(r => r.class === classFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r => r.studentName.toLowerCase().includes(term) ||
             r.rollNumber.toLowerCase().includes(term) ||
             r.admissionNumber.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [results, selectedExamForResults, classFilter, searchTerm]);

  const gradeDistribution = useMemo((): GradeDistribution[] => {
    const distribution: Record<string, number> = {
      "A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0, "D": 0, "E": 0
    };
    
    results.forEach(r => {
      if (distribution[r.grade] !== undefined) {
        distribution[r.grade]++;
      }
    });
    
    const total = results.length;
    
    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: getGradeColor(grade),
    }));
  }, [results]);

  const subjectPerformance = useMemo((): SubjectPerformance[] => {
    const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies"];
    
    return subjects.map(subject => {
      const subjectMarks = results
        .flatMap(r => r.subjects.filter(s => s.subject === subject))
        .map(s => s.marksObtained);
      
      const totalStudents = subjectMarks.length;
      const average = totalStudents > 0
        ? subjectMarks.reduce((sum, m) => sum + m, 0) / totalStudents
        : 0;
      
      const highest = totalStudents > 0 ? Math.max(...subjectMarks) : 0;
      const lowest = totalStudents > 0 ? Math.min(...subjectMarks) : 0;
      
      const passCount = subjectMarks.filter(m => m >= 33).length;
      const passPercentage = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;
      
      return {
        subject,
        average,
        highest,
        lowest,
        passCount,
        failCount: totalStudents - passCount,
        passPercentage,
        totalStudents,
      };
    });
  }, [results]);

  const topPerformers = useMemo((): TopPerformer[] => {
    return [...results]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)
      .map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        class: r.class,
        section: r.section,
        percentage: r.percentage,
        rank: r.rank,
        subjects: r.subjects.map(s => ({
          subject: s.subject,
          marks: s.marksObtained,
          grade: s.grade,
        })),
      }));
  }, [results]);

  const lowPerformers = useMemo((): LowPerformer[] => {
    return results
      .filter(r => r.status === "fail")
      .map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        class: r.class,
        section: r.section,
        percentage: r.percentage,
        failingSubjects: r.subjects.filter(s => s.marksObtained < 33).map(s => s.subject),
        parentPhone: "9876543210", // Mock phone
        parentEmail: "parent@example.com",
        attendance: r.attendance,
      }))
      .slice(0, 10);
  }, [results]);

  const availableExamsForFilter = useMemo(() => {
    const examMap = new Map();
    results.forEach(r => {
      if (!examMap.has(r.examId)) {
        examMap.set(r.examId, r.examName);
      }
    });
    return Array.from(examMap.entries()).map(([id, name]) => ({ id, name }));
  }, [results]);

  const availableClasses = useMemo(() => {
    const classes = new Set(results.map(r => r.class));
    return Array.from(classes).sort();
  }, [results]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadExamsData(true);
    toast.success("Data refreshed");
  };

  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowExamDialog(true);
  };

  const handleViewResult = (result: ExamResult) => {
    setSelectedResult(result);
    setShowResultDialog(true);
  };

  const handlePublishResults = (exam: Exam) => {
    setSelectedExam(exam);
    setShowPublishDialog(true);
  };

  const confirmPublishResults = () => {
    if (!selectedExam) return;
    
    setExams(prev => prev.map(e =>
      e.id === selectedExam.id
        ? { ...e, status: "results-published", resultsPublishedAt: new Date().toISOString() }
        : e
    ));
    
    setShowPublishDialog(false);
    toast.success(`Results published for ${selectedExam.name}`);
  };

  const handleExportCSV = () => {
    const headers = [
      "Student Name", "Roll No", "Admission No", "Class", "Section",
      "Mathematics", "Science", "English", "Hindi", "Social Studies",
      "Total", "Percentage", "Grade", "Status"
    ];
    
    const rows = filteredResults.map(r => [
      r.studentName,
      r.rollNumber,
      r.admissionNumber,
      r.class,
      r.section,
      r.subjects.find(s => s.subject === "Mathematics")?.marksObtained || 0,
      r.subjects.find(s => s.subject === "Science")?.marksObtained || 0,
      r.subjects.find(s => s.subject === "English")?.marksObtained || 0,
      r.subjects.find(s => s.subject === "Hindi")?.marksObtained || 0,
      r.subjects.find(s => s.subject === "Social Studies")?.marksObtained || 0,
      r.totalMarks,
      r.percentage.toFixed(1),
      r.grade,
      r.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    toast.success("Results exported successfully");
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
    setShowExportDialog(false);
  };

  const handleSendNotifications = () => {
    toast.success("Notifications sent to parents");
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exams and results...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Exams & Results</h1>
        <p className="text-muted-foreground mt-1">
          Monitor exam schedules, results, and student performance
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm" onClick={handleSendNotifications}>
          <Bell className="h-4 w-4 mr-2" />
          Notify Parents
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
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-2xl font-bold">{stats.totalExams}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  {stats.completedExams + stats.publishedExams} Completed
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  <Clock className="h-3 w-3 mr-1 text-blue-600" />
                  {stats.scheduledExams} Upcoming
                </Badge>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completionRate.toFixed(1)}%
              </p>
              {stats.improvementRate && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{stats.improvementRate}% vs last year</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <Progress value={stats.completionRate} className="h-1.5 mt-3" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">School Average</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.averageSchoolPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pass Rate: {stats.passPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Results</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.completedExams}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.publishedExams} published
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exams, students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="unit-test">Unit Test</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="half-yearly">Half Yearly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="model">Model</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="results-published">Published</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gradeDistribution.slice(0, 4).map((g) => (
                <div key={g.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Grade {g.grade}</span>
                    <span className="font-medium">{g.count} students ({g.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={g.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjectPerformance.map((s) => (
                <div key={s.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.subject}</span>
                    <span className="font-medium">{s.average.toFixed(1)}%</span>
                  </div>
                  <Progress value={s.average} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pass/Fail Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Passed
                  </span>
                  <span className="font-medium">{stats.passCount}</span>
                </div>
                <Progress value={(stats.passCount / stats.totalStudents) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Failed
                  </span>
                  <span className="font-medium">{stats.failCount}</span>
                </div>
                <Progress value={(stats.failCount / stats.totalStudents) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top 10 Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((student, index) => (
                  <TableRow key={`${student.studentId}-${index}`}>
                    <TableCell>
                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                      {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                      {index > 2 && <span>#{index + 1}</span>}
                    </TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell>{student.class}-{student.section}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600 text-white">{student.percentage.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>{getGrade(student.percentage)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const result = results.find(r => r.studentId === student.studentId);
                          if (result) handleViewResult(result);
                        }}
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
        </CardContent>
      </Card>

      {/* Low Performers Alert */}
      {lowPerformers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Students Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowPerformers.map((student, idx) => (
                <div key={`${student.studentId}-${idx}`} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{student.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      Class {student.class}-{student.section} • {student.percentage}%
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.failingSubjects.map((sub) => (
                        <Badge key={sub} variant="outline" className="bg-red-50 text-red-700">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white">
                      <Phone className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {filteredExams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No exams found</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {getExamTypeBadge(exam.type)}
                        {getExamStatusBadge(exam.status)}
                      </div>
                      <h3 className="font-semibold mt-2">{exam.name}</h3>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(exam.startDate)} - {formatDate(exam.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>Classes: {exam.classes.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.subjects.length} subjects</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                    <Button size="sm" variant="ghost" onClick={() => handleViewExam(exam)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {exam.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => handlePublishResults(exam)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{getExamTypeBadge(exam.type)}</TableCell>
                      <TableCell>
                        {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                      </TableCell>
                      <TableCell>{exam.classes.join(", ")}</TableCell>
                      <TableCell>{exam.subjects.length}</TableCell>
                      <TableCell>{getExamStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewExam(exam)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {exam.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => handlePublishResults(exam)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Exam Results</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedExamForResults} onValueChange={setSelectedExamForResults}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {availableExamsForFilter.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.slice(0, 20).map((result, index) => (
                  <TableRow key={`${result.examId || 'exam'}-${result.studentId}-${index}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell>{result.rollNumber}</TableCell>
                    <TableCell>{result.class}-{result.section}</TableCell>
                    <TableCell>{result.totalMarks}/{result.totalMaxMarks}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={result.percentage} className="w-16 h-2" />
                        <span className="text-sm font-medium">{result.percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                    </TableCell>
                    <TableCell>#{result.rank}</TableCell>
                    <TableCell>{getResultStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleViewResult(result)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredResults.length > 20 && (
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => setActiveTab("analytics")}>
                View all {filteredResults.length} results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeDistribution.map((g) => (
                <div key={g.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Grade {g.grade}</span>
                    <span>{g.count} students ({g.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={g.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Subject-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectPerformance.map((s) => (
                <div key={s.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.subject}</span>
                    <div className="flex items-center gap-2">
                      <span>Avg: {s.average.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground">
                        Pass: {s.passPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={s.average} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Class-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableClasses.slice(0, 5).map((cls) => {
                const classResults = results.filter(r => r.class === cls);
                const avgPercentage = classResults.length > 0
                  ? classResults.reduce((sum, r) => sum + r.percentage, 0) / classResults.length
                  : 0;
                
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Class {cls}</span>
                      <span>{avgPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={avgPercentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Total Students</span>
                <span className="font-bold">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Passed</span>
                <span className="font-bold text-green-600">{stats.passCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Failed</span>
                <span className="font-bold text-red-600">{stats.failCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Distinction (75%+)</span>
                <span className="font-bold text-purple-600">{stats.distinctionCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>First Class (60-74%)</span>
                <span className="font-bold text-blue-600">{stats.firstClassCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Second Class (45-59%)</span>
                <span className="font-bold text-yellow-600">{stats.secondClassCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-dashed hover:border-blue-500 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedExamForResults("all");
                  setShowExportDialog(true);
                }}>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Export All Results</h3>
              <p className="text-sm text-muted-foreground">
                Download complete result data as CSV or Excel
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed hover:border-green-500 cursor-pointer transition-colors"
                onClick={() => {
                  toast.info("Generate mark sheets for all students");
                }}>
            <CardContent className="p-6 text-center">
              <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Print Mark Sheets</h3>
              <p className="text-sm text-muted-foreground">
                Generate and print individual mark sheets
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed hover:border-purple-500 cursor-pointer transition-colors"
                onClick={() => {
                  toast.info("Send results to parents via email/SMS");
                }}>
            <CardContent className="p-6 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Results to Parents</h3>
              <p className="text-sm text-muted-foreground">
                Send individual result reports via email
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed hover:border-orange-500 cursor-pointer transition-colors"
                onClick={() => {
                  toast.info("Generate class performance summary");
                }}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Class Performance Report</h3>
              <p className="text-sm text-muted-foreground">
                Generate class-wise performance analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderExamDialog = () => (
    <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Exam Details
          </DialogTitle>
        </DialogHeader>
        {selectedExam && (
          <div className="space-y-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedExam.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getExamTypeBadge(selectedExam.type)}
                  {getExamStatusBadge(selectedExam.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(selectedExam.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(selectedExam.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="font-medium">{selectedExam.classes.join(", ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="font-medium">{selectedExam.subjects.length}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Subject Schedule</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedExam.subjects.map((subject, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{subject.subject}</TableCell>
                        <TableCell>{formatDate(subject.date)}</TableCell>
                        <TableCell>{subject.time}</TableCell>
                        <TableCell>{subject.room}</TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selectedExam.resultsPublishedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Results Published</p>
                <p className="font-medium">{formatDateTime(selectedExam.resultsPublishedAt)}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowExamDialog(false)}>
            Close
          </Button>
          {selectedExam && selectedExam.status === "completed" && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowExamDialog(false);
                handlePublishResults(selectedExam);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish Results
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderResultDialog = () => (
    <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Student Result Details
          </DialogTitle>
        </DialogHeader>
        {selectedResult && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(selectedResult.studentName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedResult.studentName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedResult.class}-{selectedResult.section} • Roll: {selectedResult.rollNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Exam</p>
                <p className="font-medium">{selectedResult.examName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div>{getResultStatusBadge(selectedResult.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="font-medium">{selectedResult.totalMarks} / {selectedResult.totalMaxMarks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="font-medium text-green-600">{selectedResult.percentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <Badge className={getGradeColor(selectedResult.grade)}>{selectedResult.grade}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="font-medium">#{selectedResult.rank}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Subject-wise Marks</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedResult.subjects.map((subject) => (
                      <TableRow key={subject.subject}>
                        <TableCell className="font-medium">{subject.subject}</TableCell>
                        <TableCell>{subject.marksObtained} / {subject.totalMarks}</TableCell>
                        <TableCell>{subject.percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selectedResult.attendance && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Attendance</span>
                <span className="font-medium">{selectedResult.attendance}%</span>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowResultDialog(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => toast.info("Download mark sheet")}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderPublishDialog = () => (
    <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Results</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to publish results for "{selectedExam?.name}"? 
            This will make results visible to students and parents.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowPublishDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmPublishResults} className="bg-green-600 hover:bg-green-700">
            Publish Results
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderExportDialog = () => (
    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Results</DialogTitle>
          <DialogDescription>
            Choose export format and options
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportCSV}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV (Excel)
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportPDF}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          <div className="space-y-2">
            <Label>Include in export</Label>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Switch id="include-rank" defaultChecked />
                <Label htmlFor="include-rank">Include rank</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="include-grade" defaultChecked />
                <Label htmlFor="include-grade">Include grade</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="include-parent" />
                <Label htmlFor="include-parent">Include parent contact</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowExportDialog(false)}>
            Cancel
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
        <TabsContent value="schedule">{renderScheduleTab()}</TabsContent>
        <TabsContent value="results">{renderResultsTab()}</TabsContent>
        <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>
        <TabsContent value="reports">{renderReportsTab()}</TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderExamDialog()}
      {renderResultDialog()}
      {renderPublishDialog()}
      {renderExportDialog()}
    </div>
  );
}