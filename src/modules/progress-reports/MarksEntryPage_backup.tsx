import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Save,
  Send,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Copy,
  Download,
  X,
  FileText,
  TrendingUp,
  Award,
  Clock,
  Calendar,
  Search,
  Info,
  Plus,
  Settings,
  FileSpreadsheet,
  FileJson,
  Grid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// ==================== TYPES ====================

type StudentMarksEntry = {
  studentId: string;
  rollNumber: string;
  studentName: string;
  marks: string;
  maxMarks: number;
  status: 'saved' | 'unsaved' | 'error' | 'pending';
  lastSaved?: string;
  remarks?: string;
  attendance?: number;
  previousMarks?: number;
  grade?: string;
  practicalMarks?: string;
};

type ClassInfo = {
  value: string;
  label: string;
  students: number;
  sections: string[];
  classTeacher: string;
};

type SubjectInfo = {
  value: string;
  label: string;
  code: string;
  maxMarks: number;
  passingMarks: number;
  hasPractical: boolean;
  practicalMarks?: number;
};

type ExamInfo = {
  value: string;
  label: string;
  date: string;
  term: string;
  weightage: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
};

type EntryStats = {
  totalStudents: number;
  completed: number;
  pending: number;
  errors: number;
  saved: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  totalMarksEntered: number;
  completionRate: number;
};

// ==================== STATIC DATA ====================

const academicYears = [
  { value: '2025-26', label: '2025-26', current: true },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
];

const examTypes: ExamInfo[] = [
  { value: 'unit-test-1', label: 'Unit Test 1', date: '2025-04-10', term: 'Term 1', weightage: 10, status: 'completed' },
  { value: 'unit-test-2', label: 'Unit Test 2', date: '2025-05-15', term: 'Term 1', weightage: 10, status: 'ongoing' },
  { value: 'quarterly', label: 'Quarterly Exam', date: '2025-06-05', term: 'Term 1', weightage: 20, status: 'upcoming' },
  { value: 'unit-test-3', label: 'Unit Test 3', date: '2025-07-10', term: 'Term 2', weightage: 10, status: 'upcoming' },
  { value: 'unit-test-4', label: 'Unit Test 4', date: '2025-08-15', term: 'Term 2', weightage: 10, status: 'upcoming' },
  { value: 'half-yearly', label: 'Half Yearly Exam', date: '2025-09-05', term: 'Term 2', weightage: 20, status: 'upcoming' },
  { value: 'unit-test-5', label: 'Unit Test 5', date: '2025-10-10', term: 'Term 3', weightage: 10, status: 'upcoming' },
  { value: 'unit-test-6', label: 'Unit Test 6', date: '2025-11-15', term: 'Term 3', weightage: 10, status: 'upcoming' },
  { value: 'annual', label: 'Annual Exam', date: '2025-12-05', term: 'Term 3', weightage: 30, status: 'upcoming' },
];

const classes: ClassInfo[] = [
  { value: '10A', label: 'Class 10 - A', students: 42, sections: ['A'], classTeacher: 'Mrs. Patel' },
  { value: '10B', label: 'Class 10 - B', students: 38, sections: ['B'], classTeacher: 'Mr. Sharma' },
  { value: '9A', label: 'Class 9 - A', students: 45, sections: ['A'], classTeacher: 'Mrs. Gupta' },
  { value: '9B', label: 'Class 9 - B', students: 41, sections: ['B'], classTeacher: 'Mr. Verma' },
  { value: '8A', label: 'Class 8 - A', students: 39, sections: ['A'], classTeacher: 'Ms. Reddy' },
  { value: '8B', label: 'Class 8 - B', students: 37, sections: ['B'], classTeacher: 'Mr. Singh' },
  { value: '7A', label: 'Class 7 - A', students: 43, sections: ['A'], classTeacher: 'Mrs. Rao' },
  { value: '7B', label: 'Class 7 - B', students: 40, sections: ['B'], classTeacher: 'Mr. Kumar' },
];

const subjects: SubjectInfo[] = [
  { value: 'english', label: 'English', code: 'ENG', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { value: 'mathematics', label: 'Mathematics', code: 'MATH', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { value: 'science', label: 'Science', code: 'SCI', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { value: 'social', label: 'Social Studies', code: 'SST', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { value: 'hindi', label: 'Hindi', code: 'HIN', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { value: 'computer', label: 'Computer Science', code: 'CS', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 30 },
  { value: 'physics', label: 'Physics', code: 'PHY', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { value: 'chemistry', label: 'Chemistry', code: 'CHEM', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { value: 'biology', label: 'Biology', code: 'BIO', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { value: 'sanskrit', label: 'Sanskrit', code: 'SAN', maxMarks: 100, passingMarks: 35, hasPractical: false },
];

// ==================== UTILITY FUNCTIONS ====================

const generateStudentData = (classValue: string, count: number): StudentMarksEntry[] => {
  const students: StudentMarksEntry[] = [];
  const firstNames = [
    'Aarav', 'Sneha', 'Rohan', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Divya', 'Arjun', 'Kavita',
    'Ravi', 'Neha', 'Amit', 'Pooja', 'Sanjay', 'Meera', 'Rajesh', 'Sunita', 'Deepak', 'Anjali',
    'Suresh', 'Lata', 'Mohan', 'Geeta', 'Krishna', 'Radha', 'Gopal', 'Sita', 'Ram', 'Lakshmi',
    'Aditya', 'Shreya', 'Manish', 'Pallavi', 'Nitin', 'Jyoti', 'Harsh', 'Richa', 'Gaurav', 'Swati',
    'Tarun', 'Kiran', 'Vivek', 'Rekha', 'Ashish', 'Shilpa', 'Naveen', 'Alka', 'Pankaj', 'Sarika'
  ];
  
  const lastNames = ['Kumar', 'Reddy', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Nair', 'Patel', 'Rao', 'Joshi'];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    
    const saved = Math.random() > 0.4; // 60% chance of being saved
    const marksValue = saved ? (Math.floor(Math.random() * 100) + 1).toString() : '';
    const hasError = !saved && Math.random() > 0.7; // 30% chance of error for unsaved
    
    students.push({
      studentId: `S${i.toString().padStart(3, '0')}`,
      rollNumber: `${classValue}-${i.toString().padStart(2, '0')}`,
      studentName: fullName,
      marks: marksValue,
      maxMarks: 100,
      status: hasError ? 'error' : (saved ? 'saved' : 'unsaved'),
      lastSaved: saved ? new Date().toLocaleTimeString() : undefined,
      remarks: saved ? 'Auto-saved' : undefined,
      attendance: Math.floor(Math.random() * 20) + 75, // 75-95%
      previousMarks: Math.floor(Math.random() * 100),
      practicalMarks: '',
    });
  }
  return students;
};

const calculateStats = (data: StudentMarksEntry[], subject: SubjectInfo): EntryStats => {
  const totalStudents = data.length;
  const completed = data.filter(s => s.marks !== '' && s.status !== 'error').length;
  const pending = data.filter(s => s.marks === '').length;
  const errors = data.filter(s => s.status === 'error').length;
  const saved = data.filter(s => s.status === 'saved').length;
  
  const marks = data
    .filter(s => s.marks !== '' && !isNaN(parseFloat(s.marks)))
    .map(s => parseFloat(s.marks));
  
  const averageMarks = marks.length > 0 
    ? marks.reduce((a, b) => a + b, 0) / marks.length 
    : 0;
  
  const highestMarks = marks.length > 0 ? Math.max(...marks) : 0;
  const lowestMarks = marks.length > 0 ? Math.min(...marks) : 0;
  
  const passCount = marks.filter(m => m >= subject.passingMarks).length;
  const failCount = marks.length - passCount;
  const passPercentage = marks.length > 0 ? (passCount / marks.length) * 100 : 0;
  
  const totalMarksEntered = marks.reduce((a, b) => a + b, 0);
  const completionRate = (completed / totalStudents) * 100;

  return {
    totalStudents,
    completed,
    pending,
    errors,
    saved,
    averageMarks,
    highestMarks,
    lowestMarks,
    passCount,
    failCount,
    passPercentage,
    totalMarksEntered,
    completionRate,
  };
};

const validateMarks = (value: string, maxMarks: number): { isValid: boolean; error?: string } => {
  if (value === '') {
    return { isValid: true };
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (numValue < 0) {
    return { isValid: false, error: 'Marks cannot be negative' };
  }
  
  if (numValue > maxMarks) {
    return { isValid: false, error: `Marks cannot exceed ${maxMarks}` };
  }
  
  if (value.includes('.') && value.split('.')[1].length > 1) {
    return { isValid: false, error: 'Only one decimal place allowed' };
  }
  
  return { isValid: true };
};

const getGradeFromMarks = (marks: number): string => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C+';
  if (marks >= 35) return 'C';
  return 'F';
};

const getStatusBadge = (status: 'saved' | 'unsaved' | 'error' | 'pending') => {
  switch (status) {
    case 'saved':
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Saved</Badge>;
    case 'unsaved':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Unsaved</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
    case 'pending':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><RefreshCw className="h-3 w-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getMarkColor = (mark: number, passingMarks: number) => {
  if (mark >= 90) return 'text-green-700 font-bold';
  if (mark >= 75) return 'text-blue-700 font-semibold';
  if (mark >= passingMarks) return 'text-gray-900';
  return 'text-red-700 font-semibold';
};

// ==================== MAIN COMPONENT ====================

export default function MarksEntryPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [selectedExam, setSelectedExam] = useState('unit-test-2');
  const [selectedClass, setSelectedClass] = useState('10A');
  const [selectedSubject, setSelectedSubject] = useState('english');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'marks' | 'status'>('roll');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Data states
  const [studentMarks, setStudentMarks] = useState<StudentMarksEntry[]>(() => 
    generateStudentData(selectedClass, classes.find(c => c.value === selectedClass)?.students || 42)
  );
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Dialog states
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isStudentDetailsDialogOpen, setIsStudentDetailsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentMarksEntry | null>(null);
  
  // Bulk edit state
  const [bulkMarksValue, setBulkMarksValue] = useState('');
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [bulkApplyToAll, setBulkApplyToAll] = useState(false);
  
  // Practical marks state
  const [showPractical, setShowPractical] = useState(false);
  const [practicalMarks, setPracticalMarks] = useState<Record<string, string>>({});
  
  // Settings state
  const [settings, setSettings] = useState({
    autoSaveInterval: 30,
    confirmBeforeBulkActions: true,
    playSoundOnSave: false,
    defaultSortBy: 'roll',
    highlightPassFail: true,
    showRemarksColumn: true,
  });

  // ==================== COMPUTED VALUES ====================

  const currentSubject = subjects.find(s => s.value === selectedSubject)!;
  const currentClass = classes.find(c => c.value === selectedClass)!;
  const currentExam = examTypes.find(e => e.value === selectedExam)!;

  const stats = useMemo(() => calculateStats(studentMarks, currentSubject), [studentMarks, currentSubject]);

  const filteredStudents = useMemo(() => {
    return studentMarks.filter(student => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Pending filter
      const matchesPending = !showOnlyPending || student.marks === '';
      
      // Error filter
      const matchesErrors = !showOnlyErrors || student.status === 'error';
      
      return matchesSearch && matchesPending && matchesErrors;
    });
  }, [studentMarks, searchTerm, showOnlyPending, showOnlyErrors]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'roll':
          comparison = a.rollNumber.localeCompare(b.rollNumber);
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'marks':
          const marksA = parseFloat(a.marks) || 0;
          const marksB = parseFloat(b.marks) || 0;
          comparison = marksA - marksB;
          break;
        case 'status':
          const statusOrder = { saved: 0, unsaved: 1, pending: 2, error: 3 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortBy, sortOrder]);

  // ==================== AUTO-SAVE EFFECT ====================

  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const timer = setTimeout(() => {
      const unsavedCount = studentMarks.filter(s => s.status === 'unsaved' && s.marks !== '').length;
      if (unsavedCount > 0) {
        handleAutoSave();
      }
    }, settings.autoSaveInterval * 1000);

    return () => clearTimeout(timer);
  }, [studentMarks, autoSaveEnabled, settings.autoSaveInterval]);

  // Update data when class changes
  useEffect(() => {
    setStudentMarks(generateStudentData(selectedClass, currentClass.students));
    setSearchTerm('');
    setShowOnlyPending(false);
    setShowOnlyErrors(false);
    toast.info(`Loaded ${currentClass.students} students for ${currentClass.label}`);
  }, [selectedClass, currentClass]);

  // ==================== HANDLER FUNCTIONS ====================

  const handleMarksChange = (studentId: string, value: string) => {
    const validation = validateMarks(value, currentSubject.maxMarks);
    
    let status: 'saved' | 'unsaved' | 'error' = 'unsaved';
    if (!validation.isValid) {
      status = 'error';
    } else if (value === '') {
      status = 'unsaved';
    }

    setStudentMarks(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, marks: value, status }
          : student
      )
    );
  };

  const handlePracticalMarksChange = (studentId: string, value: string) => {
    setPracticalMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSaveAll = () => {
    // Validate all marks before saving
    const hasErrors = studentMarks.some(s => s.status === 'error');
    if (hasErrors) {
      toast.error('Please fix validation errors before saving!');
      return;
    }

    // Mark all non-empty as saved
    setStudentMarks(prev =>
      prev.map(student =>
        student.marks !== '' && student.status !== 'error'
          ? { 
              ...student, 
              status: 'saved', 
              lastSaved: new Date().toLocaleTimeString(),
              grade: getGradeFromMarks(parseFloat(student.marks))
            }
          : student
      )
    );
    
    setLastAutoSave(new Date());
    toast.success(`Saved ${stats.completed} entries successfully!`);
    
    if (settings.playSoundOnSave) {
      // Play sound logic here
      new Audio('/sounds/save.mp3').play().catch(() => {});
    }
  };

  const handleAutoSave = () => {
    const unsavedStudents = studentMarks.filter(s => s.status === 'unsaved' && s.marks !== '');
    
    if (unsavedStudents.length === 0) return;

    setStudentMarks(prev =>
      prev.map(student =>
        student.status === 'unsaved' && student.marks !== ''
          ? { 
              ...student, 
              status: 'saved', 
              lastSaved: new Date().toLocaleTimeString(),
              grade: getGradeFromMarks(parseFloat(student.marks))
            }
          : student
      )
    );
    
    setLastAutoSave(new Date());
    toast.info(`Auto-saved ${unsavedStudents.length} entries`);
  };

  const handleSubmitForReview = () => {
    const unsavedCount = studentMarks.filter(s => s.marks === '').length;
    if (unsavedCount > 0) {
      toast.error(`${unsavedCount} students have no marks entered. Please complete all entries before submitting.`);
      return;
    }

    const hasErrors = studentMarks.some(s => s.status === 'error');
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting!');
      return;
    }

    // Mark all as pending review
    setStudentMarks(prev =>
      prev.map(student => ({
        ...student,
        status: 'pending' as const
      }))
    );
    
    toast.success(`Marks submitted for review! Class teacher will be notified for verification.`);
  };

  const handleResetUnsaved = () => {
    if (settings.confirmBeforeBulkActions) {
      setIsResetConfirmOpen(true);
    } else {
      confirmResetUnsaved();
    }
  };

  const confirmResetUnsaved = () => {
    setStudentMarks(prev =>
      prev.map(s => 
        s.status !== 'saved' 
          ? { ...s, marks: '', status: 'unsaved', lastSaved: undefined, grade: undefined, practicalMarks: '' }
          : s
      )
    );
    setIsResetConfirmOpen(false);
    toast.success('All unsaved entries have been reset');
  };

  const handleBulkFill = () => {
    setIsBulkEditDialogOpen(true);
  };

  const confirmBulkFill = () => {
    const value = parseFloat(bulkMarksValue);
    if (isNaN(value) || value < 0 || value > currentSubject.maxMarks) {
      toast.error(`Invalid marks value! Please enter a number between 0 and ${currentSubject.maxMarks}`);
      return;
    }

    setStudentMarks(prev =>
      prev.map(s => {
        if (bulkApplyToAll || s.marks === '' || s.status === 'unsaved') {
          return {
            ...s,
            marks: bulkMarksValue,
            status: 'unsaved',
            remarks: bulkRemarks || s.remarks
          };
        }
        return s;
      })
    );
    
    setIsBulkEditDialogOpen(false);
    setBulkMarksValue('');
    setBulkRemarks('');
    toast.success(`Bulk filled ${studentMarks.filter(s => s.marks === '').length} entries`);
  };

  const handleCopyPreviousMarks = () => {
    setStudentMarks(prev =>
      prev.map(s => {
        if (s.marks === '' && s.previousMarks !== undefined) {
          return {
            ...s,
            marks: s.previousMarks.toString(),
            status: 'unsaved'
          };
        }
        return s;
      })
    );
    toast.success('Copied previous exam marks where available');
  };

  const handleVerifyStudent = (studentId: string) => {
    setStudentMarks(prev =>
      prev.map(student => 
        student.studentId === studentId ? { ...student, status: 'saved' as const } : student
      )
    );
    toast.success('Student marks verified');
  };

  const handleAddRemarks = (student: StudentMarksEntry) => {
    setSelectedStudent(student);
    setIsRemarksDialogOpen(true);
  };

  const handleViewStudent = (student: StudentMarksEntry) => {
    setSelectedStudent(student);
    setIsStudentDetailsDialogOpen(true);
  };

  const saveRemarks = () => {
    if (!selectedStudent) return;
    
    setStudentMarks(prev =>
      prev.map(s =>
        s.studentId === selectedStudent.studentId
          ? { ...s, remarks: selectedStudent.remarks }
          : s
      )
    );
    
    setIsRemarksDialogOpen(false);
    setSelectedStudent(null);
    toast.success('Remarks saved successfully');
  };

  const handleSort = (field: 'roll' | 'name' | 'marks' | 'status') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'roll' | 'name' | 'marks' | 'status') => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Roll No', 'Student Name', 'Marks', 'Max Marks', 'Percentage', 'Grade', 'Status', 'Remarks', 'Attendance', 'Previous Marks'];
    const rows = studentMarks.map(s => {
      const marksNum = parseFloat(s.marks);
      const percentage = !isNaN(marksNum) ? ((marksNum / s.maxMarks) * 100).toFixed(1) : '-';
      const grade = !isNaN(marksNum) ? getGradeFromMarks(marksNum) : '-';
      
      return [
        s.rollNumber,
        s.studentName,
        s.marks || '-',
        s.maxMarks,
        percentage,
        grade,
        s.status,
        s.remarks || '',
        s.attendance || '-',
        s.previousMarks || '-'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-${selectedClass}-${selectedSubject}-${selectedExam}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExportDialogOpen(false);
    toast.success('CSV file downloaded successfully');
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
        <title>Marks Entry - ${selectedClass} - ${currentSubject.label}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header p { margin: 5px 0; color: #666; }
          .stats { display: flex; gap: 20px; margin: 30px 0; flex-wrap: wrap; }
          .stat-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; background: #f9f9f9; }
          .stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .stat-card p { margin: 0; font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 12px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .saved { color: #059669; font-weight: 500; }
          .unsaved { color: #d97706; font-weight: 500; }
          .error { color: #dc2626; font-weight: 500; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .pass { color: #059669; font-weight: bold; }
          .fail { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Marks Entry Report</h1>
          <p>Class: ${currentClass.label} | Subject: ${currentSubject.label} | Exam: ${currentExam.label}</p>
          <p>Academic Year: ${selectedYear} | Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Total Students</h3>
            <p>${stats.totalStudents}</p>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <p style="color: #059669;">${stats.completed}</p>
          </div>
          <div class="stat-card">
            <h3>Average Marks</h3>
            <p>${stats.averageMarks.toFixed(1)}</p>
          </div>
          <div class="stat-card">
            <h3>Pass Rate</h3>
            <p style="color: ${stats.passPercentage >= 75 ? '#059669' : '#d97706'};">${stats.passPercentage.toFixed(1)}%</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Marks</th>
              <th>Max</th>
              <th>%</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${studentMarks.map(s => {
              const marksNum = parseFloat(s.marks);
              const percentage = !isNaN(marksNum) ? ((marksNum / s.maxMarks) * 100).toFixed(1) : '-';
              const grade = !isNaN(marksNum) ? getGradeFromMarks(marksNum) : '-';
              const statusClass = s.status === 'saved' ? 'saved' : s.status === 'error' ? 'error' : 'unsaved';
              
              return `
                <tr>
                  <td>${s.rollNumber}</td>
                  <td>${s.studentName}</td>
                  <td class="${!isNaN(marksNum) && marksNum >= currentSubject.passingMarks ? 'pass' : 'fail'}">${s.marks || '-'}</td>
                  <td>${s.maxMarks}</td>
                  <td>${percentage}%</td>
                  <td>${grade}</td>
                  <td class="${statusClass}">${s.status}</td>
                  <td>${s.remarks || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated by School ERP System | Total Pages: 1</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    setIsExportDialogOpen(false);
    toast.success('PDF generated successfully');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setShowOnlyPending(false);
    setShowOnlyErrors(false);
    setSortBy('roll');
    setSortOrder('asc');
    toast.success('Filters reset');
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Marks Entry</h1>
        <p className="text-muted-foreground mt-1">
          Enter offline exam marks by class, subject, and exam cycle. Auto-saves every {settings.autoSaveInterval} seconds.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleAutoSave} title="Manual Save">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button onClick={handleSubmitForReview} className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4 mr-2" />
          Submit for Review
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
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <Progress value={stats.completionRate} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Marks</p>
              <p className="text-2xl font-bold">{stats.averageMarks.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Highest: {stats.highestMarks} | Lowest: {stats.lowestMarks}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold text-green-600">{stats.passPercentage.toFixed(1)}%</p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pass: {stats.passCount} | Fail: {stats.failCount}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending/Errors</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending + stats.errors}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pending: {stats.pending} | Errors: {stats.errors}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger>
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exam" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map((exam) => (
                <SelectItem key={exam.value} value={exam.value}>
                  {exam.label} ({exam.term})
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
              {classes.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label} ({cls.students} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label} {subject.hasPractical && '(P)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
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
                id="pending-filter"
                checked={showOnlyPending}
                onCheckedChange={setShowOnlyPending}
              />
              <Label htmlFor="pending-filter" className="text-sm cursor-pointer">
                Show only pending
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="errors-filter"
                checked={showOnlyErrors}
                onCheckedChange={setShowOnlyErrors}
              />
              <Label htmlFor="errors-filter" className="text-sm cursor-pointer">
                Show only errors
              </Label>
            </div>

            {currentSubject.hasPractical && (
              <div className="flex items-center gap-2">
                <Switch
                  id="practical"
                  checked={showPractical}
                  onCheckedChange={setShowPractical}
                />
                <Label htmlFor="practical" className="text-sm cursor-pointer">
                  Show practical marks
                </Label>
              </div>
            )}

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
                <Table className="h-4 w-4" />
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

            <Badge variant="outline" className="px-3 py-1">
              {filteredStudents.length} of {studentMarks.length} students
            </Badge>
          </div>
        </div>

        {lastAutoSave && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last auto-save: {lastAutoSave.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Info className="h-4 w-4" />
            <span>
              <strong>{stats.completed}/{stats.totalStudents}</strong> entries completed. 
              {stats.pending > 0 && (
                <span className="ml-1">({stats.pending} pending, {stats.errors} errors)</span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetUnsaved}
              disabled={stats.pending === 0 && stats.errors === 0}
              className="bg-white hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Unsaved
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkFill}
              className="bg-white hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Bulk Fill
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPreviousMarks}
              className="bg-white hover:bg-gray-100"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Previous
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
              className="bg-white hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMarksTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {currentSubject.label} - {currentExam.label}
            <Badge variant="outline" className="ml-2 bg-gray-100">
              Max: {currentSubject.maxMarks} | Pass: {currentSubject.passingMarks}
            </Badge>
            {currentExam.status && (
              <Badge className={
                currentExam.status === 'completed' ? 'bg-green-100 text-green-800' :
                currentExam.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {currentExam.status}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveAll}>
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('roll')}>
                    <div className="flex items-center">
                      Roll No {getSortIcon('roll')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Student Name {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('marks')}>
                    <div className="flex items-center">
                      Marks {getSortIcon('marks')}
                    </div>
                  </TableHead>
                  {showPractical && currentSubject.hasPractical && (
                    <TableHead>Practical</TableHead>
                  )}
                  <TableHead>Max</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </TableHead>
                  {settings.showRemarksColumn && <TableHead>Remarks</TableHead>}
                  <TableHead>Last Saved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={settings.showRemarksColumn ? 11 : 10} className="text-center py-8 text-muted-foreground">
                      No students found matching the filters
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student) => {
                    const marksNum = parseFloat(student.marks);
                    const percentage = !isNaN(marksNum) ? ((marksNum / student.maxMarks) * 100).toFixed(1) : '-';
                    const grade = !isNaN(marksNum) ? getGradeFromMarks(marksNum) : '-';
                    const isPassing = !isNaN(marksNum) && marksNum >= currentSubject.passingMarks;
                    
                    return (
                      <TableRow key={student.studentId} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={student.maxMarks}
                              step="0.5"
                              value={student.marks}
                              onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                              placeholder="0-100"
                              className={`w-20 ${
                                student.status === 'error'
                                  ? 'border-red-500 focus:border-red-500'
                                  : student.status === 'saved'
                                  ? 'border-green-500 bg-green-50'
                                  : ''
                              }`}
                            />
                            {student.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-red-600" aria-label="Invalid marks" />
                            )}
                          </div>
                        </TableCell>
                        {showPractical && currentSubject.hasPractical && (
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={currentSubject.practicalMarks || 20}
                              step="0.5"
                              value={practicalMarks[student.studentId] || ''}
                              onChange={(e) => handlePracticalMarksChange(student.studentId, e.target.value)}
                              placeholder={`0-${currentSubject.practicalMarks}`}
                              className="w-16"
                            />
                          </TableCell>
                        )}
                        <TableCell>{student.maxMarks}</TableCell>
                        <TableCell>
                          {percentage !== '-' ? (
                            <span className={isPassing ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {percentage}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade !== '-' ? (
                            <Badge variant="outline" className={
                              grade.startsWith('A') ? 'bg-green-100 text-green-800 border-green-200' :
                              grade.startsWith('B') ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.status)}
                        </TableCell>
                        {settings.showRemarksColumn && (
                          <TableCell className="max-w-[150px] truncate" title={student.remarks}>
                            {student.remarks || '-'}
                          </TableCell>
                        )}
                        <TableCell className="text-sm text-muted-foreground">
                          {student.lastSaved || '-'}
                        </TableCell>
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
                              onClick={() => handleAddRemarks(student)}
                              title="Add Remarks"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {student.status !== 'saved' && student.marks !== '' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleVerifyStudent(student.studentId)}
                                title="Verify"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedStudents.map((student) => {
        const marksNum = parseFloat(student.marks);
        const percentage = !isNaN(marksNum) ? ((marksNum / student.maxMarks) * 100).toFixed(1) : '-';
        const grade = !isNaN(marksNum) ? getGradeFromMarks(marksNum) : '-';
        const isPassing = !isNaN(marksNum) && marksNum >= currentSubject.passingMarks;
        
        return (
          <Card key={student.studentId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                  <p className="font-semibold">{student.studentName}</p>
                </div>
                {getStatusBadge(student.status)}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Marks</span>
                    <Input
                      type="number"
                      min="0"
                      max={student.maxMarks}
                      step="0.5"
                      value={student.marks}
                      onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                      placeholder="0-100"
                      className={`w-20 text-right ${
                        student.status === 'error'
                          ? 'border-red-500 focus:border-red-500'
                          : student.status === 'saved'
                          ? 'border-green-500 bg-green-50'
                          : ''
                      }`}
                    />
                  </div>
                  {student.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      Invalid marks (0-{student.maxMarks})
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Max</p>
                    <p className="font-medium">{student.maxMarks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">%</p>
                    {percentage !== '-' ? (
                      <p className={`font-medium ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                        {percentage}%
                      </p>
                    ) : (
                      <p className="text-muted-foreground">-</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Grade</p>
                    {grade !== '-' ? (
                      <Badge variant="outline" className={
                        grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                        grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {grade}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saved</p>
                    <p className="text-xs">{student.lastSaved || '-'}</p>
                  </div>
                </div>

                {settings.showRemarksColumn && student.remarks && (
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    <span className="text-muted-foreground">Remarks:</span> {student.remarks}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewStudent(student)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddRemarks(student)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Remarks
                  </Button>
                  {student.status !== 'saved' && student.marks !== '' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleVerifyStudent(student.studentId)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderStudentDetailsDialog = () => (
    <Dialog open={isStudentDetailsDialogOpen} onOpenChange={setIsStudentDetailsDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-medium">{selectedStudent.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{selectedStudent.rollNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marks</p>
                <p className={`font-bold text-lg ${getMarkColor(parseFloat(selectedStudent.marks) || 0, currentSubject.passingMarks)}`}>
                  {selectedStudent.marks || '-'} / {selectedStudent.maxMarks}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="font-bold text-lg">
                  {selectedStudent.marks ? ((parseFloat(selectedStudent.marks) / selectedStudent.maxMarks) * 100).toFixed(1) : '-'}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="font-medium">
                  {selectedStudent.marks ? getGradeFromMarks(parseFloat(selectedStudent.marks)) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div>{getStatusBadge(selectedStudent.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="font-medium">{selectedStudent.attendance || '-'}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previous Marks</p>
                <p className="font-medium">{selectedStudent.previousMarks || '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Remarks</p>
              <p className="p-3 bg-gray-50 rounded-lg">{selectedStudent.remarks || 'No remarks'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Last Saved</p>
              <p className="font-medium">{selectedStudent.lastSaved || 'Not saved yet'}</p>
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

  const renderBulkEditDialog = () => (
    <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Fill Marks</DialogTitle>
          <DialogDescription>
            Apply the same marks to multiple students
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Marks Value</Label>
            <Input
              type="number"
              min="0"
              max={currentSubject.maxMarks}
              step="0.5"
              value={bulkMarksValue}
              onChange={(e) => setBulkMarksValue(e.target.value)}
              placeholder={`Enter marks (0-${currentSubject.maxMarks})`}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Input
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
              placeholder="Enter common remarks"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="apply-to-all"
              checked={bulkApplyToAll}
              onCheckedChange={setBulkApplyToAll}
            />
            <Label htmlFor="apply-to-all">Apply to all students (including saved)</Label>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              This will apply to {bulkApplyToAll ? studentMarks.length : studentMarks.filter(s => s.marks === '').length} students
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmBulkFill}>
            Apply to {bulkApplyToAll ? 'All' : 'Pending'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderRemarksDialog = () => (
    <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Remarks</DialogTitle>
          <DialogDescription>
            Add remarks for {selectedStudent?.studentName}
          </DialogDescription>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={selectedStudent.remarks || ''}
                onChange={(e) => setSelectedStudent({
                  ...selectedStudent,
                  remarks: e.target.value
                })}
                placeholder="Enter remarks about the student's performance..."
                className="min-h-[120px]"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRemarksDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveRemarks}>
            <Save className="h-4 w-4 mr-2" />
            Save Remarks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderResetConfirmDialog = () => (
    <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Unsaved Entries?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all unsaved marks for {stats.pending + stats.errors} students.
            Saved entries will remain unchanged. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsResetConfirmOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmResetUnsaved} className="bg-red-600 hover:bg-red-700">
            Reset All Unsaved
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderExportDialog = () => (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Marks</DialogTitle>
          <DialogDescription>
            Choose export format for {currentClass.label} - {currentSubject.label}
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

  const renderSettingsDialog = () => (
    <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Marks Entry Settings</DialogTitle>
          <DialogDescription>
            Configure your marks entry preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Auto-Save Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save">Enable Auto-Save</Label>
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Auto-Save Interval (seconds)</Label>
                <Select
                  value={settings.autoSaveInterval.toString()}
                  onValueChange={(value) => setSettings({...settings, autoSaveInterval: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Display Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-remarks">Show Remarks Column</Label>
                <Switch
                  id="show-remarks"
                  checked={settings.showRemarksColumn}
                  onCheckedChange={(checked) => setSettings({...settings, showRemarksColumn: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="highlight">Highlight Pass/Fail</Label>
                <Switch
                  id="highlight"
                  checked={settings.highlightPassFail}
                  onCheckedChange={(checked) => setSettings({...settings, highlightPassFail: checked})}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Sort By</Label>
                <Select
                  value={settings.defaultSortBy}
                  onValueChange={(value: any) => setSettings({...settings, defaultSortBy: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roll">Roll Number</SelectItem>
                    <SelectItem value="name">Student Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Play sound on save</Label>
                <Switch
                  id="sound"
                  checked={settings.playSoundOnSave}
                  onCheckedChange={(checked) => setSettings({...settings, playSoundOnSave: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="confirm">Confirm before bulk actions</Label>
                <Switch
                  id="confirm"
                  checked={settings.confirmBeforeBulkActions}
                  onCheckedChange={(checked) => setSettings({...settings, confirmBeforeBulkActions: checked})}
                />
              </div>
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

  const renderGuidelines = () => (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">Important Guidelines</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
              <li>Enter marks between 0 and {currentSubject.maxMarks}. Decimal values allowed (e.g., 85.5)</li>
              <li>Passing marks: {currentSubject.passingMarks} | Grade is calculated automatically</li>
              <li>Marks are auto-saved every {settings.autoSaveInterval} seconds</li>
              <li>Green border = Saved | Yellow = Unsaved | Red = Error</li>
              <li>Use "Bulk Fill" to apply same marks to multiple students</li>
              <li>Click "Submit for Review" when all entries are complete</li>
              <li>Export data as CSV for Excel or PDF for printing</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}
      {renderQuickActions()}

      {viewMode === 'table' ? renderMarksTable() : renderCardsView()}

      {renderGuidelines()}

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
      {renderBulkEditDialog()}
      {renderRemarksDialog()}
      {renderResetConfirmDialog()}
      {renderExportDialog()}
      {renderSettingsDialog()}
    </div>
  );
}