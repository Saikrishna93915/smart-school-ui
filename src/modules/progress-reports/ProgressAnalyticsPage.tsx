import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  RefreshCw,
  X,
  FileText,
  Calendar,
  Target,
  Brain,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  CheckCircle,
  AlertCircle,
  Layers,
  Grid,
  List,
  Search,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';

// ==================== TYPES ====================

type SubjectTrend = {
  subject: string;
  unitTest1: number;
  unitTest2: number;
  quarterly: number;
  halfYearly: number;
  annual: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passRate: number;
  totalStudents: number;
};

type ClassComparison = {
  className: string;
  section: string;
  averageScore: number;
  passPercentage: number;
  topScore: number;
  lowestScore: number;
  studentCount: number;
  rank: number;
  growth: number;
  teacher: string;
  subjectAverages: Record<string, number>;
};

type TopPerformer = {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  section: string;
  averageScore: number;
  subjectScores: Record<string, number>;
  growth: number;
  rank: number;
  attendance: number;
  lastUpdated: string;
};

type BottomPerformer = {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  section: string;
  averageScore: number;
  subjectScores: Record<string, number>;
  growth: number;
  rank: number;
  attendance: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  weakSubjects: string[];
  lastUpdated: string;
};

type SubjectAnalysis = {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  aboveAverage: number;
  belowAverage: number;
  totalStudents: number;
  difficultyIndex: number;
  timeSpent: number;
  commonMistakes: string[];
};

// ==================== STATIC DATA ====================

const academicYears = [
  { value: '2025-26', label: '2025-26', current: true },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
];

const classOptions = [
  { value: 'all', label: 'All Classes' },
  { value: '10', label: 'Class 10' },
  { value: '9', label: 'Class 9' },
  { value: '8', label: 'Class 8' },
  { value: '7', label: 'Class 7' },
  { value: '6', label: 'Class 6' },
];

const sectionOptions = ['A', 'B', 'C', 'D'];

const examTypes = [
  { value: 'unit-test-1', label: 'Unit Test 1' },
  { value: 'unit-test-2', label: 'Unit Test 2' },
  { value: 'quarterly', label: 'Quarterly Exam' },
  { value: 'half-yearly', label: 'Half Yearly Exam' },
  { value: 'annual', label: 'Annual Exam' },
];

const subjectTrends: SubjectTrend[] = [
  { 
    subject: 'Mathematics', 
    unitTest1: 72, 
    unitTest2: 78, 
    quarterly: 81, 
    halfYearly: 79, 
    annual: 84,
    growth: 12, 
    trend: 'up',
    averageMarks: 78.5,
    highestMarks: 100,
    lowestMarks: 18,
    passRate: 82,
    totalStudents: 486
  },
  { 
    subject: 'Science', 
    unitTest1: 76, 
    unitTest2: 78, 
    quarterly: 79, 
    halfYearly: 82, 
    annual: 85,
    growth: 9, 
    trend: 'up',
    averageMarks: 80.2,
    highestMarks: 100,
    lowestMarks: 25,
    passRate: 86,
    totalStudents: 486
  },
  { 
    subject: 'English', 
    unitTest1: 81, 
    unitTest2: 83, 
    quarterly: 82, 
    halfYearly: 84, 
    annual: 86,
    growth: 5, 
    trend: 'up',
    averageMarks: 83.4,
    highestMarks: 99,
    lowestMarks: 32,
    passRate: 89,
    totalStudents: 486
  },
  { 
    subject: 'Social Studies', 
    unitTest1: 74, 
    unitTest2: 71, 
    quarterly: 72, 
    halfYearly: 70, 
    annual: 73,
    growth: -1, 
    trend: 'down',
    averageMarks: 72.1,
    highestMarks: 98,
    lowestMarks: 22,
    passRate: 78,
    totalStudents: 486
  },
  { 
    subject: 'Hindi', 
    unitTest1: 79, 
    unitTest2: 80, 
    quarterly: 82, 
    halfYearly: 83, 
    annual: 85,
    growth: 6, 
    trend: 'up',
    averageMarks: 81.8,
    highestMarks: 98,
    lowestMarks: 28,
    passRate: 84,
    totalStudents: 486
  },
];

const classComparisons: ClassComparison[] = [
  { 
    className: '10', 
    section: 'A', 
    averageScore: 82.4, 
    passPercentage: 95, 
    topScore: 98, 
    lowestScore: 42,
    studentCount: 48, 
    rank: 1,
    growth: 8.2,
    teacher: 'Mrs. Patel',
    subjectAverages: { math: 84, science: 86, english: 88, hindi: 82, sst: 80 }
  },
  { 
    className: '10', 
    section: 'B', 
    averageScore: 78.6, 
    passPercentage: 91, 
    topScore: 96, 
    lowestScore: 38,
    studentCount: 45, 
    rank: 2,
    growth: 5.4,
    teacher: 'Mr. Sharma',
    subjectAverages: { math: 80, science: 82, english: 84, hindi: 78, sst: 76 }
  },
  { 
    className: '9', 
    section: 'A', 
    averageScore: 76.2, 
    passPercentage: 88, 
    topScore: 94, 
    lowestScore: 35,
    studentCount: 42, 
    rank: 3,
    growth: 4.8,
    teacher: 'Mrs. Gupta',
    subjectAverages: { math: 78, science: 80, english: 82, hindi: 76, sst: 74 }
  },
  { 
    className: '9', 
    section: 'B', 
    averageScore: 73.8, 
    passPercentage: 85, 
    topScore: 92, 
    lowestScore: 32,
    studentCount: 40, 
    rank: 4,
    growth: 3.2,
    teacher: 'Mr. Verma',
    subjectAverages: { math: 75, science: 77, english: 79, hindi: 73, sst: 71 }
  },
  { 
    className: '8', 
    section: 'A', 
    averageScore: 71.5, 
    passPercentage: 83, 
    topScore: 91, 
    lowestScore: 30,
    studentCount: 43, 
    rank: 5,
    growth: 2.1,
    teacher: 'Ms. Reddy',
    subjectAverages: { math: 73, science: 75, english: 77, hindi: 71, sst: 69 }
  },
  { 
    className: '8', 
    section: 'B', 
    averageScore: 68.9, 
    passPercentage: 79, 
    topScore: 89, 
    lowestScore: 28,
    studentCount: 41, 
    rank: 6,
    growth: 1.5,
    teacher: 'Mr. Singh',
    subjectAverages: { math: 70, science: 72, english: 74, hindi: 68, sst: 66 }
  },
];

const topPerformers: TopPerformer[] = [
  { 
    id: 'S001',
    name: 'Aarav Sharma', 
    rollNumber: '10A-05', 
    className: '10', 
    section: 'A',
    averageScore: 98.2, 
    subjectScores: { math: 99, science: 98, english: 97, hindi: 98, sst: 99 },
    growth: 8.5, 
    rank: 1,
    attendance: 98,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S002',
    name: 'Sneha Reddy', 
    rollNumber: '10A-12', 
    className: '10', 
    section: 'A',
    averageScore: 97.8, 
    subjectScores: { math: 98, science: 98, english: 97, hindi: 97, sst: 99 },
    growth: 6.2, 
    rank: 2,
    attendance: 97,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S003',
    name: 'Rohan Kumar', 
    rollNumber: '10B-08', 
    className: '10', 
    section: 'B',
    averageScore: 96.4, 
    subjectScores: { math: 97, science: 96, english: 96, hindi: 96, sst: 97 },
    growth: 7.1, 
    rank: 3,
    attendance: 96,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S004',
    name: 'Priya Singh', 
    rollNumber: '9A-15', 
    className: '9', 
    section: 'A',
    averageScore: 94.7, 
    subjectScores: { math: 95, science: 95, english: 94, hindi: 94, sst: 95 },
    growth: 9.3, 
    rank: 4,
    attendance: 99,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S005',
    name: 'Arjun Patel', 
    rollNumber: '10A-20', 
    className: '10', 
    section: 'A',
    averageScore: 93.9, 
    subjectScores: { math: 94, science: 94, english: 93, hindi: 93, sst: 95 },
    growth: 5.8, 
    rank: 5,
    attendance: 95,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S006',
    name: 'Kavita Sharma', 
    rollNumber: '9B-07', 
    className: '9', 
    section: 'B',
    averageScore: 92.8, 
    subjectScores: { math: 93, science: 93, english: 92, hindi: 92, sst: 93 },
    growth: 7.2, 
    rank: 6,
    attendance: 96,
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S007',
    name: 'Vikram Singh', 
    rollNumber: '8A-12', 
    className: '8', 
    section: 'A',
    averageScore: 91.5, 
    subjectScores: { math: 92, science: 91, english: 91, hindi: 91, sst: 92 },
    growth: 6.8, 
    rank: 7,
    attendance: 94,
    lastUpdated: '2025-03-15'
  },
];

const bottomPerformers: BottomPerformer[] = [
  { 
    id: 'S101',
    name: 'Rahul Verma', 
    rollNumber: '9B-18', 
    className: '9', 
    section: 'B',
    averageScore: 48.6, 
    subjectScores: { math: 38, science: 42, english: 45, hindi: 52, sst: 46 },
    growth: -3.2, 
    rank: 386,
    attendance: 68,
    riskLevel: 'critical',
    weakSubjects: ['Mathematics', 'Science'],
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S102',
    name: 'Anjali Gupta', 
    rollNumber: '8A-22', 
    className: '8', 
    section: 'A',
    averageScore: 51.3, 
    subjectScores: { math: 45, science: 48, english: 52, hindi: 55, sst: 56 },
    growth: -1.8, 
    rank: 372,
    attendance: 72,
    riskLevel: 'high',
    weakSubjects: ['Mathematics'],
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S103',
    name: 'Karan Mehta', 
    rollNumber: '9A-11', 
    className: '9', 
    section: 'A',
    averageScore: 53.7, 
    subjectScores: { math: 48, science: 51, english: 54, hindi: 58, sst: 57 },
    growth: 2.1, 
    rank: 358,
    attendance: 75,
    riskLevel: 'medium',
    weakSubjects: ['Mathematics', 'Science'],
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S104',
    name: 'Pooja Nair', 
    rollNumber: '8B-09', 
    className: '8', 
    section: 'B',
    averageScore: 55.4, 
    subjectScores: { math: 52, science: 54, english: 56, hindi: 58, sst: 57 },
    growth: 0.5, 
    rank: 342,
    attendance: 78,
    riskLevel: 'low',
    weakSubjects: ['Science'],
    lastUpdated: '2025-03-15'
  },
  { 
    id: 'S105',
    name: 'Vikram Joshi', 
    rollNumber: '9B-25', 
    className: '9', 
    section: 'B',
    averageScore: 56.8, 
    subjectScores: { math: 52, science: 54, english: 57, hindi: 59, sst: 58 },
    growth: 1.3, 
    rank: 334,
    attendance: 80,
    riskLevel: 'medium',
    weakSubjects: ['Mathematics', 'Science'],
    lastUpdated: '2025-03-15'
  },
];

const subjectAnalysis: SubjectAnalysis[] = [
  {
    subject: 'Mathematics',
    average: 78.5,
    highest: 100,
    lowest: 18,
    passRate: 82,
    aboveAverage: 248,
    belowAverage: 238,
    totalStudents: 486,
    difficultyIndex: 0.75,
    timeSpent: 45,
    commonMistakes: ['Algebra', 'Geometry proofs', 'Word problems']
  },
  {
    subject: 'Science',
    average: 80.2,
    highest: 100,
    lowest: 25,
    passRate: 86,
    aboveAverage: 265,
    belowAverage: 221,
    totalStudents: 486,
    difficultyIndex: 0.68,
    timeSpent: 42,
    commonMistakes: ['Chemical equations', 'Physics formulas', 'Diagrams']
  },
  {
    subject: 'English',
    average: 83.4,
    highest: 99,
    lowest: 32,
    passRate: 89,
    aboveAverage: 289,
    belowAverage: 197,
    totalStudents: 486,
    difficultyIndex: 0.62,
    timeSpent: 38,
    commonMistakes: ['Grammar', 'Comprehension', 'Writing skills']
  },
  {
    subject: 'Social Studies',
    average: 72.1,
    highest: 98,
    lowest: 22,
    passRate: 78,
    aboveAverage: 215,
    belowAverage: 271,
    totalStudents: 486,
    difficultyIndex: 0.72,
    timeSpent: 40,
    commonMistakes: ['Dates', 'Map work', 'Long answers']
  },
  {
    subject: 'Hindi',
    average: 81.8,
    highest: 98,
    lowest: 28,
    passRate: 84,
    aboveAverage: 256,
    belowAverage: 230,
    totalStudents: 486,
    difficultyIndex: 0.65,
    timeSpent: 35,
    commonMistakes: ['Grammar', 'Essay writing', 'Comprehension']
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-600" />;
};

const getGrowthBadge = (growth: number) => {
  if (growth > 10) return <Badge className="bg-green-600 text-white">+{growth}% ↑↑</Badge>;
  if (growth > 5) return <Badge className="bg-green-500 text-white">+{growth}% ↑</Badge>;
  if (growth > 0) return <Badge className="bg-blue-500 text-white">+{growth}% ↗</Badge>;
  if (growth < -10) return <Badge className="bg-red-600 text-white">{growth}% ↓↓</Badge>;
  if (growth < -5) return <Badge className="bg-red-500 text-white">{growth}% ↓</Badge>;
  if (growth < 0) return <Badge className="bg-orange-500 text-white">{growth}% ↘</Badge>;
  return <Badge variant="outline">{growth}% →</Badge>;
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🥇 1st</Badge>;
  if (rank === 2) return <Badge className="bg-gray-100 text-gray-800 border-gray-200">🥈 2nd</Badge>;
  if (rank === 3) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">🥉 3rd</Badge>;
  return <Badge variant="outline">#{rank}</Badge>;
};

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case 'critical':
      return <Badge className="bg-red-600 text-white">Critical Risk</Badge>;
    case 'high':
      return <Badge className="bg-orange-500 text-white">High Risk</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500 text-white">Medium Risk</Badge>;
    case 'low':
      return <Badge className="bg-blue-500 text-white">Low Risk</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-700 font-bold';
  if (score >= 75) return 'text-blue-700 font-bold';
  if (score >= 60) return 'text-gray-900 font-medium';
  if (score >= 35) return 'text-orange-600 font-medium';
  return 'text-red-600 font-bold';
};

// ==================== MAIN COMPONENT ====================

export default function ProgressAnalyticsPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'growth' | 'name'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);
  
  // Dialog states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isInsightDialogOpen, setIsInsightDialogOpen] = useState(false);
  const [isStudentDetailsDialogOpen, setIsStudentDetailsDialogOpen] = useState(false);
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TopPerformer | BottomPerformer | null>(null);
  const [selectedClassForComparison, setSelectedClassForComparison] = useState<ClassComparison | null>(null);
  
  // Data states
  const [filteredTopPerformers, setFilteredTopPerformers] = useState<TopPerformer[]>(topPerformers);
  const [filteredBottomPerformers, setFilteredBottomPerformers] = useState<BottomPerformer[]>(bottomPerformers);
  const [filteredClassComparisons, setFilteredClassComparisons] = useState<ClassComparison[]>(classComparisons);
  
  // Settings
  const [settings, setSettings] = useState({
    showGrowthIndicators: true,
    showRiskLevels: true,
    showAttendance: true,
    showSubjectBreakdown: true,
    autoRefresh: true,
    refreshInterval: 30,
  });

  // ==================== COMPUTED VALUES ====================

  const overallStats = useMemo(() => {
    const avgGrowth = subjectTrends.reduce((sum, s) => sum + s.growth, 0) / subjectTrends.length;
    const improvingSubjects = subjectTrends.filter(s => s.trend === 'up').length;
    const decliningSubjects = subjectTrends.filter(s => s.trend === 'down').length;
    const totalStudents = classComparisons.reduce((sum, c) => sum + c.studentCount, 0);
    const avgPassRate = classComparisons.reduce((sum, c) => sum + c.passPercentage, 0) / classComparisons.length;
    
    const topPerformer = topPerformers[0];
    const bottomPerformer = bottomPerformers[0];
    
    const studentsAtRisk = bottomPerformers.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length;
    
    return {
      avgGrowth: avgGrowth.toFixed(1),
      improvingSubjects,
      decliningSubjects,
      totalStudents,
      avgPassRate: avgPassRate.toFixed(1),
      topPerformer: topPerformer.name,
      topScore: topPerformer.averageScore,
      bottomPerformer: bottomPerformer.name,
      bottomScore: bottomPerformer.averageScore,
      totalExams: 9,
      totalSubjects: subjectTrends.length,
      totalClasses: classComparisons.length,
      averageAttendance: 87,
      studentsAtRisk,
    };
  }, []);

  // Filter classes based on selections
  useEffect(() => {
    let filtered = [...classComparisons];
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(c => c.className === selectedClass);
    }
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter(c => c.section === selectedSection);
    }
    
    setFilteredClassComparisons(filtered);
    
    // Also filter performers
    if (selectedClass !== 'all' || selectedSection !== 'all') {
      setFilteredTopPerformers(
        topPerformers.filter(p => 
          (selectedClass === 'all' || p.className === selectedClass) &&
          (selectedSection === 'all' || p.section === selectedSection)
        )
      );
      
      setFilteredBottomPerformers(
        bottomPerformers.filter(p => 
          (selectedClass === 'all' || p.className === selectedClass) &&
          (selectedSection === 'all' || p.section === selectedSection) &&
          (!showOnlyAtRisk || p.riskLevel === 'critical' || p.riskLevel === 'high')
        )
      );
    } else {
      setFilteredTopPerformers(topPerformers);
      setFilteredBottomPerformers(
        showOnlyAtRisk 
          ? bottomPerformers.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high')
          : bottomPerformers
      );
    }
  }, [selectedClass, selectedSection, showOnlyAtRisk]);

  // Sort performers
  useEffect(() => {
    const sortedTop = [...filteredTopPerformers].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'score':
          comparison = b.averageScore - a.averageScore;
          break;
        case 'growth':
          comparison = b.growth - a.growth;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    const sortedBottom = [...filteredBottomPerformers].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'score':
          comparison = a.averageScore - b.averageScore;
          break;
        case 'growth':
          comparison = a.growth - b.growth;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTopPerformers(sortedTop);
    setFilteredBottomPerformers(sortedBottom);
  }, [sortBy, sortOrder]);

  // ==================== HANDLER FUNCTIONS ====================

  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Overall', 'Average Growth', `${overallStats.avgGrowth}%`],
      ['Overall', 'Improving Subjects', overallStats.improvingSubjects.toString()],
      ['Overall', 'Total Students', overallStats.totalStudents.toString()],
      ['Overall', 'Average Pass Rate', `${overallStats.avgPassRate}%`],
      ['Overall', 'Students at Risk', overallStats.studentsAtRisk.toString()],
      ...subjectTrends.map(s => ['Subject', s.subject, `${s.averageMarks}%`]),
      ...classComparisons.map(c => ['Class', c.className + c.section, `${c.averageScore}%`]),
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-analytics-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExportDialogOpen(false);
    toast.success('Analytics report exported successfully');
  };

  const handleExportPDF = () => {
    // Create printable HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Progress Analytics Report - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h1 { color: #2563eb; text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: flex; gap: 20px; margin: 30px 0; flex-wrap: wrap; }
          .stat-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; background: #f9f9f9; }
          .stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .stat-card p { margin: 0; font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .section-title { font-size: 20px; font-weight: bold; margin: 30px 0 15px 0; color: #2563eb; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Progress Analytics Report</h1>
          <p>Academic Year: ${selectedYear} | Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Average Growth</h3>
            <p>${overallStats.avgGrowth}%</p>
          </div>
          <div class="stat-card">
            <h3>Improving Subjects</h3>
            <p>${overallStats.improvingSubjects}</p>
          </div>
          <div class="stat-card">
            <h3>Total Students</h3>
            <p>${overallStats.totalStudents}</p>
          </div>
          <div class="stat-card">
            <h3>Pass Rate</h3>
            <p>${overallStats.avgPassRate}%</p>
          </div>
        </div>
        
        <div class="section-title">Subject Trends</div>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Unit Test 1</th>
              <th>Unit Test 2</th>
              <th>Quarterly</th>
              <th>Half Yearly</th>
              <th>Annual</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            ${subjectTrends.map(s => `
              <tr>
                <td>${s.subject}</td>
                <td>${s.unitTest1}%</td>
                <td>${s.unitTest2}%</td>
                <td>${s.quarterly}%</td>
                <td>${s.halfYearly}%</td>
                <td>${s.annual}%</td>
                <td>${s.growth > 0 ? '+' : ''}${s.growth}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="section-title">Class Performance</div>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Students</th>
              <th>Avg Score</th>
              <th>Pass %</th>
              <th>Top Score</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            ${classComparisons.map(c => `
              <tr>
                <td>${c.className}${c.section}</td>
                <td>${c.studentCount}</td>
                <td>${c.averageScore}%</td>
                <td>${c.passPercentage}%</td>
                <td>${c.topScore}%</td>
                <td>${c.rank}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated by School ERP System</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    setIsExportDialogOpen(false);
    toast.success('PDF report generated successfully');
  };

  const handleRefresh = () => {
    toast.success('Analytics data refreshed');
  };

  const handleViewStudent = (student: TopPerformer | BottomPerformer) => {
    setSelectedStudent(student);
    setIsStudentDetailsDialogOpen(true);
  };

  const handleViewClass = (cls: ClassComparison) => {
    setSelectedClassForComparison(cls);
    setIsComparisonDialogOpen(true);
  };

const resetFilters = () => {
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedExam('all');
    setSearchTerm('');
    setShowOnlyAtRisk(false);
    toast.success('Filters reset');
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Progress Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep dive into subject performance trends, class comparisons, and student growth patterns.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" onClick={() => setIsInsightDialogOpen(true)}>
          <Brain className="h-4 w-4 mr-2" />
          AI Insights
        </Button>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Growth Rate</p>
              <p className="text-2xl font-bold">{overallStats.avgGrowth}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Improving Subjects</p>
              <p className="text-2xl font-bold">{overallStats.improvingSubjects}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Declining: {overallStats.decliningSubjects}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{overallStats.totalStudents}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
              <p className="text-2xl font-bold">{overallStats.avgPassRate}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Students at Risk</p>
              <p className="text-2xl font-bold text-red-600">{overallStats.studentsAtRisk}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label} {year.current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger>
              <Layers className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sectionOptions.map((sec) => (
                <SelectItem key={sec} value={sec}>
                  Section {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger>
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {examTypes.map((exam) => (
                <SelectItem key={exam.value} value={exam.value}>
                  {exam.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="at-risk"
                checked={showOnlyAtRisk}
                onCheckedChange={setShowOnlyAtRisk}
              />
              <Label htmlFor="at-risk" className="text-sm cursor-pointer">
                Show only at-risk students
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="growth-indicators"
                checked={settings.showGrowthIndicators}
                onCheckedChange={(checked) => setSettings({...settings, showGrowthIndicators: checked})}
              />
              <Label htmlFor="growth-indicators" className="text-sm cursor-pointer">
                Show growth indicators
              </Label>
            </div>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[130px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSubjectTrendsTab = () => (
    <TabsContent value="subject-trends" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Subject-wise Performance Trends
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50">
              {subjectTrends.length} Subjects
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>UT1</TableHead>
                    <TableHead>UT2</TableHead>
                    <TableHead>QTR</TableHead>
                    <TableHead>HY</TableHead>
                    <TableHead>Annual</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Avg</TableHead>
                    <TableHead>Highest</TableHead>
                    <TableHead>Lowest</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectTrends.map((subject) => (
                    <TableRow key={subject.subject} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{subject.subject}</TableCell>
                      <TableCell>{subject.unitTest1}%</TableCell>
                      <TableCell>{subject.unitTest2}%</TableCell>
                      <TableCell>{subject.quarterly}%</TableCell>
                      <TableCell>{subject.halfYearly}%</TableCell>
                      <TableCell>{subject.annual}%</TableCell>
                      <TableCell>
                        {settings.showGrowthIndicators 
                          ? getGrowthBadge(subject.growth)
                          : <span>{subject.growth > 0 ? '+' : ''}{subject.growth}%</span>
                        }
                      </TableCell>
                      <TableCell>{getTrendIcon(subject.trend)}</TableCell>
                      <TableCell className="font-semibold">{subject.averageMarks}%</TableCell>
                      <TableCell className="text-green-600 font-bold">{subject.highestMarks}</TableCell>
                      <TableCell className="text-red-600 font-bold">{subject.lowestMarks}</TableCell>
                      <TableCell>
                        <Badge className={subject.passRate >= 85 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {subject.passRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={subject.averageMarks} className="w-20 h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-800">Best Performing Subject</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {subjectTrends.reduce((best, current) => 
                current.averageMarks > best.averageMarks ? current : best
              ).subject}
            </p>
            <p className="text-sm text-green-700 mt-1">
              Avg: {subjectTrends.reduce((best, current) => 
                current.averageMarks > best.averageMarks ? current : best
              ).averageMarks}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              <p className="font-semibold text-yellow-800">Needs Attention</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {subjectTrends.reduce((worst, current) => 
                current.averageMarks < worst.averageMarks ? current : worst
              ).subject}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Avg: {subjectTrends.reduce((worst, current) => 
                current.averageMarks < worst.averageMarks ? current : worst
              ).averageMarks}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <p className="font-semibold text-blue-800">Most Improved</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {subjectTrends.reduce((best, current) => 
                current.growth > best.growth ? current : best
              ).subject}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Growth: +{subjectTrends.reduce((best, current) => 
                current.growth > best.growth ? current : best
              ).growth}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectAnalysis.map((analysis) => (
          <Card key={analysis.subject}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{analysis.subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-xl font-bold">{analysis.average}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="text-xl font-bold text-green-600">{analysis.highest}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                  <p className="text-xl font-bold text-red-600">{analysis.lowest}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Above/Below Average</span>
                  <span>
                    <span className="text-green-600 font-medium">{analysis.aboveAverage}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-600 font-medium">{analysis.belowAverage}</span>
                  </span>
                </div>
                <Progress 
                  value={(analysis.aboveAverage / analysis.totalStudents) * 100} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Common Mistakes:</span> {analysis.commonMistakes.join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );

  const renderClassComparisonTab = () => (
    <TabsContent value="class-comparison" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Class-wise Performance Rankings
            </CardTitle>
            <Badge variant="outline" className="bg-indigo-50">
              {filteredClassComparisons.length} Classes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Pass %</TableHead>
                    <TableHead>Top Score</TableHead>
                    <TableHead>Lowest</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassComparisons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No classes found matching the filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClassComparisons.map((cls) => (
                      <TableRow key={`${cls.className}${cls.section}`} className="hover:bg-gray-50">
                        <TableCell>{getRankBadge(cls.rank)}</TableCell>
                        <TableCell className="font-medium">{cls.className}{cls.section}</TableCell>
                        <TableCell>{cls.teacher}</TableCell>
                        <TableCell>{cls.studentCount}</TableCell>
                        <TableCell className="font-semibold">{cls.averageScore}%</TableCell>
                        <TableCell>
                          <Badge className={cls.passPercentage >= 90 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {cls.passPercentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-bold">{cls.topScore}%</TableCell>
                        <TableCell className="text-red-600 font-bold">{cls.lowestScore}%</TableCell>
                        <TableCell>
                          {settings.showGrowthIndicators 
                            ? getGrowthBadge(cls.growth)
                            : <span>{cls.growth > 0 ? '+' : ''}{cls.growth}%</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Progress value={cls.averageScore} className="w-20 h-2" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewClass(cls)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <p className="font-semibold text-yellow-800">Top Performing Class</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {classComparisons[0].className}{classComparisons[0].section}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Avg: {classComparisons[0].averageScore}% | Pass: {classComparisons[0].passPercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Highest Pass Rate</p>
            <p className="text-2xl font-bold">
              {Math.max(...classComparisons.map(c => c.passPercentage))}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {classComparisons.find(c => c.passPercentage === Math.max(...classComparisons.map(x => x.passPercentage)))?.className}
              {classComparisons.find(c => c.passPercentage === Math.max(...classComparisons.map(x => x.passPercentage)))?.section}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Best Top Score</p>
            <p className="text-2xl font-bold">
              {Math.max(...classComparisons.map(c => c.topScore))}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {classComparisons.find(c => c.topScore === Math.max(...classComparisons.map(x => x.topScore)))?.className}
              {classComparisons.find(c => c.topScore === Math.max(...classComparisons.map(x => x.topScore)))?.section}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Most Improved Class</p>
            <p className="text-2xl font-bold">
              +{Math.max(...classComparisons.map(c => c.growth))}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {classComparisons.find(c => c.growth === Math.max(...classComparisons.map(x => x.growth)))?.className}
              {classComparisons.find(c => c.growth === Math.max(...classComparisons.map(x => x.growth)))?.section}
            </p>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );

  const renderStudentInsightsTab = () => (
    <TabsContent value="student-insights" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Trophy className="h-5 w-5" />
                Top {filteredTopPerformers.length} Performers
              </CardTitle>
              <Badge className="bg-green-100 text-green-800">
                Avg: {(filteredTopPerformers.reduce((sum, s) => sum + s.averageScore, 0) / filteredTopPerformers.length).toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopPerformers.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            #{student.rank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{student.className}{student.section}</TableCell>
                        <TableCell className="text-muted-foreground">{student.rollNumber}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{student.averageScore}%</Badge>
                        </TableCell>
                        <TableCell>
                          {settings.showGrowthIndicators 
                            ? getGrowthBadge(student.growth)
                            : <span>{student.growth > 0 ? '+' : ''}{student.growth}%</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            student.attendance >= 95 ? 'bg-green-100 text-green-800' :
                            student.attendance >= 85 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {student.attendance}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTopPerformers.map((student) => (
                  <Card key={student.id} className="border-green-200 bg-green-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100">
                              #{student.rank}
                            </Badge>
                            <p className="font-semibold">{student.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {student.className}{student.section} • {student.rollNumber}
                          </p>
                        </div>
                        <Badge className="bg-green-600 text-white">{student.averageScore}%</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span>Growth: {student.growth > 0 ? '+' : ''}{student.growth}%</span>
                        <span>Attendance: {student.attendance}%</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Flame className="h-5 w-5" />
                Students Needing Support
                {showOnlyAtRisk && <Badge className="bg-red-600 text-white ml-2">At Risk</Badge>}
              </CardTitle>
              <Badge className="bg-red-100 text-red-800">
                {filteredBottomPerformers.length} students
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Weak Subjects</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBottomPerformers.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{student.className}{student.section}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">{student.averageScore}%</Badge>
                        </TableCell>
                        <TableCell>
                          {settings.showGrowthIndicators 
                            ? getGrowthBadge(student.growth)
                            : <span>{student.growth > 0 ? '+' : ''}{student.growth}%</span>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {student.weakSubjects.map((sub, idx) => (
                              <Badge key={idx} variant="outline" className="bg-red-50 text-red-700">
                                {sub}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getRiskBadge(student.riskLevel)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredBottomPerformers.map((student) => (
                  <Card key={student.id} className="border-red-200 bg-red-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.className}{student.section} • {student.rollNumber}
                          </p>
                        </div>
                        {getRiskBadge(student.riskLevel)}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span>Score: {student.averageScore}%</span>
                        <span>Growth: {student.growth > 0 ? '+' : ''}{student.growth}%</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Weak subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {student.weakSubjects.map((sub, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800">AI-Powered Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Performance Patterns:</span>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Top 5 students show consistent growth (avg +7.4%) across all subjects</li>
                    <li>Students needing support require focused intervention in Mathematics and Science</li>
                    <li>Class 10A demonstrates the strongest overall performance with 95% pass rate</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Recommendations:</span>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Extra revision sessions for Social Studies (declining trend)</li>
                    <li>Focus on 12 at-risk students for Mathematics remediation</li>
                    <li>Consider peer tutoring program for weak performers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderStudentDetailsDialog = () => (
    <Dialog open={isStudentDetailsDialogOpen} onOpenChange={setIsStudentDetailsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Student Performance Details</DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-medium">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{selectedStudent.rollNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{selectedStudent.className}{selectedStudent.section}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className={`font-bold text-lg ${getScoreColor(selectedStudent.averageScore)}`}>
                  {selectedStudent.averageScore}%
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Subject-wise Performance</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selectedStudent.subjectScores).map(([subject, score]) => (
                  <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="capitalize">{subject}:</span>
                    <span className={getScoreColor(score)}>{score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {'riskLevel' in selectedStudent && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <div className="mt-1">{getRiskBadge(selectedStudent.riskLevel)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weak Subjects</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedStudent.weakSubjects.map((sub, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className={`font-medium ${selectedStudent.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStudent.growth > 0 ? '+' : ''}{selectedStudent.growth}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="font-medium">{selectedStudent.attendance}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(selectedStudent.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsStudentDetailsDialogOpen(false);
            setSelectedStudent(null);
          }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderClassComparisonDialog = () => (
    <Dialog open={isComparisonDialogOpen} onOpenChange={setIsComparisonDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Class Performance Details</DialogTitle>
        </DialogHeader>
        {selectedClassForComparison && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{selectedClassForComparison.className}{selectedClassForComparison.section}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Teacher</p>
                <p className="font-medium">{selectedClassForComparison.teacher}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="font-medium">{selectedClassForComparison.studentCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="font-medium">#{selectedClassForComparison.rank}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-xl font-bold text-blue-600">{selectedClassForComparison.averageScore}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="text-xl font-bold text-green-600">{selectedClassForComparison.topScore}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Lowest</p>
                  <p className="text-xl font-bold text-red-600">{selectedClassForComparison.lowestScore}%</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Subject-wise Averages</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selectedClassForComparison.subjectAverages).map(([subject, score]) => (
                  <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="capitalize">{subject}:</span>
                    <span className="font-semibold">{score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pass Percentage</p>
                <p className="font-medium text-green-600">{selectedClassForComparison.passPercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className={`font-medium ${selectedClassForComparison.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedClassForComparison.growth > 0 ? '+' : ''}{selectedClassForComparison.growth}%
                </p>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsComparisonDialogOpen(false);
            setSelectedClassForComparison(null);
          }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderExportDialog = () => (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Analytics Report</DialogTitle>
          <DialogDescription>
            Choose export format for the progress analytics data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV (Excel)
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportPDF}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF (Print)
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              toast.info('JSON export coming soon');
              setIsExportDialogOpen(false);
            }}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInsightDialog = () => (
    <Dialog open={isInsightDialogOpen} onOpenChange={setIsInsightDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Generated Insights
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Positive Trends
              </h4>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                  <span>Mathematics scores improved by 12% from Unit Test 1 to Annual Exam</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                  <span>Class 10A has shown consistent growth (+8.2%) across all subjects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                  <span>Top 10 students maintained average above 95% throughout the year</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                Areas of Concern
              </h4>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>Social Studies shows declining trend (-1%) - needs immediate attention</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>8 students have attendance below 75% affecting their performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>Mathematics has highest failure rate (18%) among all subjects</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5" />
                  <span>Conduct extra revision sessions for Social Studies before next exam</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5" />
                  <span>Focus on 12 at-risk students with personalized Mathematics coaching</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5" />
                  <span>Implement peer tutoring program pairing top performers with struggling students</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5" />
                  <span>Send attendance alerts to parents of students below 80% attendance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsInsightDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderSettingsDialog = () => (
    <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Analytics Settings</DialogTitle>
          <DialogDescription>
            Configure your analytics preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Display Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-growth">Show Growth Indicators</Label>
                <Switch
                  id="show-growth"
                  checked={settings.showGrowthIndicators}
                  onCheckedChange={(checked) => setSettings({...settings, showGrowthIndicators: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-risk">Show Risk Levels</Label>
                <Switch
                  id="show-risk"
                  checked={settings.showRiskLevels}
                  onCheckedChange={(checked) => setSettings({...settings, showRiskLevels: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-attendance">Show Attendance</Label>
                <Switch
                  id="show-attendance"
                  checked={settings.showAttendance}
                  onCheckedChange={(checked) => setSettings({...settings, showAttendance: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-subject">Show Subject Breakdown</Label>
                <Switch
                  id="show-subject"
                  checked={settings.showSubjectBreakdown}
                  onCheckedChange={(checked) => setSettings({...settings, showSubjectBreakdown: checked})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Auto-Refresh</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Enable Auto-Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => setSettings({...settings, autoRefresh: checked})}
                />
              </div>
              {settings.autoRefresh && (
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => setSettings({...settings, refreshInterval: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setIsSettingsDialogOpen(false);
            toast.success('Settings saved');
          }}>
            Save Settings
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

      <Tabs defaultValue="subject-trends" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="subject-trends">Subject Trends</TabsTrigger>
          <TabsTrigger value="class-comparison">Class Comparison</TabsTrigger>
          <TabsTrigger value="student-insights">Student Insights</TabsTrigger>
        </TabsList>

        {renderSubjectTrendsTab()}
        {renderClassComparisonTab()}
        {renderStudentInsightsTab()}
      </Tabs>

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
      {renderClassComparisonDialog()}
      {renderExportDialog()}
      {renderInsightDialog()}
      {renderSettingsDialog()}
    </div>
  );
}