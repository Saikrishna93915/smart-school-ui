import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  CalendarDays,
  ClipboardList,
  Plus,
  Save,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  RefreshCw,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Printer,
  Calendar,
  Award,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

type Exam = {
  id: string;
  academicYear: string;
  examType: string;
  examCode: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  maxMarksPerSubject: number;
  subjects: SubjectConfig[];
  totalStudents: number;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';
  progress: number;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  description?: string;
  instructions?: string;
  passingMarks?: number;
  gradingScheme?: 'standard' | 'custom';
  gradeScale?: GradeScale[];
  hasNegativeMarking?: boolean;
  negativeMarkPerQuestion?: number;
  isActive: boolean;
  resultPublished?: boolean;
  publishDate?: string;
};

type SubjectConfig = {
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  hasPractical: boolean;
  practicalMarks?: number;
  examDate?: string;
  examTime?: string;
  duration?: number;
  teacherId?: string;
  teacherName?: string;
};

type GradeScale = {
  min: number;
  max: number;
  grade: string;
  gradePoint: number;
  remark: string;
};

type ExamFormData = {
  academicYear: string;
  examType: string;
  customExamName: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  maxMarksPerSubject: string;
  passingMarks: string;
  description: string;
  instructions: string;
  hasNegativeMarking: boolean;
  negativeMarkPerQuestion: string;
  selectedSubjects: string[];
};

type ExamStats = {
  totalExams: number;
  draft: number;
  scheduled: number;
  ongoing: number;
  completed: number;
  published: number;
  totalStudents: number;
  totalSubjects: number;
  averageDuration: number;
};

const examTypes = [
  { value: 'unit-test-1', label: 'Unit Test 1', code: 'UT1', term: 'Term 1', weightage: 10 },
  { value: 'unit-test-2', label: 'Unit Test 2', code: 'UT2', term: 'Term 1', weightage: 10 },
  { value: 'quarterly', label: 'Quarterly Exam', code: 'QTR', term: 'Term 1', weightage: 20 },
  { value: 'unit-test-3', label: 'Unit Test 3', code: 'UT3', term: 'Term 2', weightage: 10 },
  { value: 'unit-test-4', label: 'Unit Test 4', code: 'UT4', term: 'Term 2', weightage: 10 },
  { value: 'half-yearly', label: 'Half Yearly Exam', code: 'HY', term: 'Term 2', weightage: 20 },
  { value: 'unit-test-5', label: 'Unit Test 5', code: 'UT5', term: 'Term 3', weightage: 10 },
  { value: 'unit-test-6', label: 'Unit Test 6', code: 'UT6', term: 'Term 3', weightage: 10 },
  { value: 'annual', label: 'Annual Exam', code: 'ANN', term: 'Term 3', weightage: 30 },
];

const academicYears = [
  { value: '2025-26', label: '2025-26', current: true },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
];

const classes = [
  { value: '6', label: 'Class 6', students: 42, sections: ['A', 'B', 'C'] },
  { value: '7', label: 'Class 7', students: 45, sections: ['A', 'B', 'C'] },
  { value: '8', label: 'Class 8', students: 39, sections: ['A', 'B', 'C'] },
  { value: '9', label: 'Class 9', students: 48, sections: ['A', 'B', 'C', 'D'] },
  { value: '10', label: 'Class 10', students: 52, sections: ['A', 'B', 'C', 'D'] },
  { value: '11', label: 'Class 11', students: 38, sections: ['A', 'B', 'C'] },
  { value: '12', label: 'Class 12', students: 41, sections: ['A', 'B', 'C'] },
];

const sections = ['A', 'B', 'C', 'D', 'E'];

const subjects: SubjectConfig[] = [
  { subjectId: 'eng', subjectName: 'English', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'math', subjectName: 'Mathematics', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'sci', subjectName: 'Science', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { subjectId: 'sst', subjectName: 'Social Studies', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'hin', subjectName: 'Hindi', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'phy', subjectName: 'Physics', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { subjectId: 'chem', subjectName: 'Chemistry', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { subjectId: 'bio', subjectName: 'Biology', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 20 },
  { subjectId: 'cs', subjectName: 'Computer Science', maxMarks: 100, passingMarks: 35, hasPractical: true, practicalMarks: 30 },
  { subjectId: 'eco', subjectName: 'Economics', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'acc', subjectName: 'Accountancy', maxMarks: 100, passingMarks: 35, hasPractical: false },
  { subjectId: 'bst', subjectName: 'Business Studies', maxMarks: 100, passingMarks: 35, hasPractical: false },
];

const defaultGradeScale: GradeScale[] = [
  { min: 91, max: 100, grade: 'A+', gradePoint: 10, remark: 'Outstanding' },
  { min: 81, max: 90, grade: 'A', gradePoint: 9, remark: 'Excellent' },
  { min: 71, max: 80, grade: 'B+', gradePoint: 8, remark: 'Very Good' },
  { min: 61, max: 70, grade: 'B', gradePoint: 7, remark: 'Good' },
  { min: 51, max: 60, grade: 'C+', gradePoint: 6, remark: 'Above Average' },
  { min: 41, max: 50, grade: 'C', gradePoint: 5, remark: 'Average' },
  { min: 35, max: 40, grade: 'D', gradePoint: 4, remark: 'Pass' },
  { min: 0, max: 34, grade: 'F', gradePoint: 0, remark: 'Fail' },
];

const generateInitialExams = (): Exam[] => {
  const exams: Exam[] = [];
  const now = new Date();

  for (let i = 1; i <= 12; i++) {
    const examType = examTypes[i % examTypes.length];
    const classObj = classes[i % classes.length];
    const section = sections[i % sections.length];
    const statuses: Exam['status'][] = ['draft', 'scheduled', 'ongoing', 'completed', 'published'];
    const status = statuses[i % statuses.length];

    const startDate = new Date(now);
    startDate.setDate(now.getDate() + i * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (30 + i));

    exams.push({
      id: `exam-${i}`,
      academicYear: academicYears[0].value,
      examType: examType.value,
      examCode: `${examType.code}-${classObj.value}${section}-${i}`,
      className: classObj.value,
      section,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      maxMarksPerSubject: 100,
      subjects: subjects.slice(0, 5).map((s) => ({
        ...s,
        maxMarks: 100,
        passingMarks: 35,
        examDate: startDate.toISOString().split('T')[0],
        examTime: '09:00',
        duration: 180,
        teacherId: `TCH${i}`,
        teacherName: `Teacher ${i}`,
      })),
      totalStudents: classObj.students,
      status,
      progress: status === 'completed' || status === 'published' ? 100 : status === 'ongoing' ? 60 : status === 'scheduled' ? 20 : 0,
      createdBy: 'Admin',
      createdAt: createdAt.toISOString(),
      lastModified: new Date().toISOString(),
      description: `${examType.label} for Class ${classObj.value}${section}`,
      instructions: 'Read all questions carefully before answering. Use black or blue pen only.',
      passingMarks: 35,
      gradingScheme: 'standard',
      gradeScale: defaultGradeScale,
      hasNegativeMarking: false,
      isActive: true,
      resultPublished: status === 'published',
      publishDate: status === 'published' ? new Date(endDate.getTime() + 7 * 86400000).toISOString().split('T')[0] : undefined,
    });
  }

  return exams;
};

const generateExamCode = (
  examType: string,
  className: string,
  section: string,
  existingCodes: string[]
): string => {
  const exam = examTypes.find((e) => e.value === examType);
  const baseCode = `${exam?.code || 'EXM'}-${className}${section}`;
  let counter = 1;
  let code = baseCode;

  while (existingCodes.includes(code)) {
    code = `${baseCode}-${counter}`;
    counter++;
  }

  return code;
};

const calculateStats = (exams: Exam[]): ExamStats => {
  if (!exams.length) {
    return {
      totalExams: 0,
      draft: 0,
      scheduled: 0,
      ongoing: 0,
      completed: 0,
      published: 0,
      totalStudents: 0,
      totalSubjects: 0,
      averageDuration: 0,
    };
  }

  return {
    totalExams: exams.length,
    draft: exams.filter((e) => e.status === 'draft').length,
    scheduled: exams.filter((e) => e.status === 'scheduled').length,
    ongoing: exams.filter((e) => e.status === 'ongoing').length,
    completed: exams.filter((e) => e.status === 'completed').length,
    published: exams.filter((e) => e.status === 'published').length,
    totalStudents: exams.reduce((sum, e) => sum + e.totalStudents, 0),
    totalSubjects: exams.reduce((sum, e) => sum + e.subjects.length, 0),
    averageDuration: Math.round(
      exams.reduce((sum, e) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        return sum + days;
      }, 0) / exams.length
    ),
  };
};

const getStatusBadge = (status: Exam['status'], published?: boolean) => {
  if (status === 'published' || published) {
    return (
      <Badge className="bg-green-600 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Published
      </Badge>
    );
  }
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-gray-600">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Calendar className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    case 'ongoing':
      return (
        <Badge className="bg-green-100 text-green-800">
          <Clock className="h-3 w-3 mr-1" />
          Ongoing
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function ExamSetupPage() {
  const [exams, setExams] = useState<Exam[]>(generateInitialExams);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);

  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isSubjectConfigOpen, setIsSubjectConfigOpen] = useState(false);
  const [isGradeScaleOpen, setIsGradeScaleOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState<ExamFormData>({
    academicYear: '2025-26',
    examType: '',
    customExamName: '',
    className: '',
    section: '',
    startDate: '',
    endDate: '',
    maxMarksPerSubject: '100',
    passingMarks: '35',
    description: '',
    instructions: '',
    hasNegativeMarking: false,
    negativeMarkPerQuestion: '0',
    selectedSubjects: ['eng', 'math', 'sci', 'sst', 'hin'],
  });

  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([]);
  const [gradeScale, setGradeScale] = useState<GradeScale[]>(defaultGradeScale);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = useMemo(() => calculateStats(exams), [exams]);
  const currentYearExams = useMemo(() => exams.filter((e) => e.academicYear === selectedYear), [exams, selectedYear]);

  useEffect(() => {
    let filtered = exams.filter((exam) => exam.academicYear === selectedYear);

    if (!showInactive) {
      filtered = filtered.filter((exam) => exam.isActive);
    }

    if (searchTerm) {
      filtered = filtered.filter((exam) => {
        const typeLabel = examTypes.find((t) => t.value === exam.examType)?.label || '';
        return (
          exam.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exam.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          typeLabel.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.status === statusFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.className === classFilter);
    }

    if (sectionFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.section === sectionFilter);
    }

    setFilteredExams(filtered);
    setCurrentPage(1);
  }, [exams, selectedYear, searchTerm, statusFilter, classFilter, sectionFilter, showInactive]);

  const uniqueClasses = useMemo(() => Array.from(new Set(exams.map((e) => e.className))).sort(), [exams]);

  const resetForm = () => {
    setFormData({
      academicYear: '2025-26',
      examType: '',
      customExamName: '',
      className: '',
      section: '',
      startDate: '',
      endDate: '',
      maxMarksPerSubject: '100',
      passingMarks: '35',
      description: '',
      instructions: '',
      hasNegativeMarking: false,
      negativeMarkPerQuestion: '0',
      selectedSubjects: ['eng', 'math', 'sci', 'sst', 'hin'],
    });
    setSubjectConfigs([]);
    setGradeScale(defaultGradeScale);
  };

  const handleCreateExam = () => {
    if (!formData.examType) return toast.error('Please select exam type');
    if (!formData.className) return toast.error('Please select class');
    if (!formData.section) return toast.error('Please select section');
    if (!formData.startDate) return toast.error('Please select start date');
    if (!formData.endDate) return toast.error('Please select end date');
    if (new Date(formData.startDate) > new Date(formData.endDate)) return toast.error('Start date cannot be after end date');
    if (formData.selectedSubjects.length === 0) return toast.error('Please select at least one subject');
    if (Number(formData.passingMarks) > Number(formData.maxMarksPerSubject)) return toast.error('Passing marks cannot exceed max marks');

    const examType = examTypes.find((t) => t.value === formData.examType);
    const classObj = classes.find((c) => c.value === formData.className);
    if (!examType || !classObj) return toast.error('Invalid exam configuration');

    const existingCodes = exams.map((e) => e.examCode);
    const examCode = generateExamCode(formData.examType, formData.className, formData.section, existingCodes);

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      academicYear: formData.academicYear,
      examType: formData.examType,
      examCode,
      className: formData.className,
      section: formData.section,
      startDate: formData.startDate,
      endDate: formData.endDate,
      maxMarksPerSubject: parseInt(formData.maxMarksPerSubject, 10),
      subjects: formData.selectedSubjects.map((subId) => {
        const subject = subjects.find((s) => s.subjectId === subId)!;
        return {
          ...subject,
          maxMarks: parseInt(formData.maxMarksPerSubject, 10),
          passingMarks: parseInt(formData.passingMarks, 10),
          examDate: formData.startDate,
          examTime: '09:00',
          duration: 180,
        };
      }),
      totalStudents: classObj.students,
      status: 'draft',
      progress: 0,
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      description:
        formData.description || `${examType.label} for Class ${formData.className}${formData.section}`,
      instructions: formData.instructions || 'Read all questions carefully before answering.',
      passingMarks: parseInt(formData.passingMarks, 10),
      gradingScheme: 'standard',
      gradeScale,
      hasNegativeMarking: formData.hasNegativeMarking,
      negativeMarkPerQuestion: parseFloat(formData.negativeMarkPerQuestion),
      isActive: true,
      resultPublished: false,
    };

    setExams([newExam, ...exams]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success(`Exam "${newExam.examCode}" created successfully`);
  };

  const handleEditExam = () => {
    if (!selectedExam) return;
    if (new Date(selectedExam.startDate) > new Date(selectedExam.endDate)) return toast.error('Start date cannot be after end date');
    if ((selectedExam.passingMarks || 0) > selectedExam.maxMarksPerSubject) return toast.error('Passing marks cannot exceed max marks');

    const updatedExams = exams.map((exam) =>
      exam.id === selectedExam.id ? { ...selectedExam, lastModified: new Date().toISOString() } : exam
    );

    setExams(updatedExams);
    setIsEditDialogOpen(false);
    setSelectedExam(null);
    toast.success('Exam updated successfully');
  };

  const handleDeleteExam = () => {
    if (!selectedExam) return;
    const code = selectedExam.examCode;
    setExams(exams.filter((exam) => exam.id !== selectedExam.id));
    setIsDeleteDialogOpen(false);
    setSelectedExam(null);
    toast.success(`Exam "${code}" deleted successfully`);
  };

  const handleDuplicateExam = () => {
    if (!selectedExam) return;

    const existingCodes = exams.map((e) => e.examCode);
    const newCode = generateExamCode(selectedExam.examType, selectedExam.className, selectedExam.section, existingCodes);

    const duplicatedExam: Exam = {
      ...selectedExam,
      id: `exam-${Date.now()}`,
      examCode: newCode,
      status: 'draft',
      progress: 0,
      resultPublished: false,
      publishDate: undefined,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setExams([duplicatedExam, ...exams]);
    setIsDuplicateDialogOpen(false);
    setSelectedExam(null);
    toast.success('Exam duplicated successfully');
  };

  const handlePublishResults = () => {
    if (!selectedExam) return;
    const code = selectedExam.examCode;

    const updatedExams: Exam[] = exams.map((exam) =>
      exam.id === selectedExam.id
        ? {
            ...exam,
            status: 'published' as const,
            resultPublished: true,
            publishDate: new Date().toISOString().split('T')[0],
            progress: 100,
            lastModified: new Date().toISOString(),
          }
        : exam
    );

    setExams(updatedExams);
    setIsPublishDialogOpen(false);
    setSelectedExam(null);
    toast.success(`Results published for "${code}"`);
  };

  const handleToggleActive = (exam: Exam) => {
    const updatedExams = exams.map((e) =>
      e.id === exam.id ? { ...e, isActive: !e.isActive, lastModified: new Date().toISOString() } : e
    );
    setExams(updatedExams);
    toast.success(`Exam ${exam.isActive ? 'deactivated' : 'activated'} successfully`);
  };

  const handleExportCSV = () => {
    const headers = ['Exam Code', 'Type', 'Class', 'Section', 'Start Date', 'End Date', 'Status', 'Progress', 'Students', 'Subjects', 'Published'];
    const rows = filteredExams.map((e) => {
      const examType = examTypes.find((t) => t.value === e.examType)?.label || e.examType;
      return [
        e.examCode,
        examType,
        e.className,
        e.section,
        e.startDate,
        e.endDate,
        e.status,
        `${e.progress}%`,
        e.totalStudents,
        e.subjects.length,
        e.resultPublished ? 'Yes' : 'No',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exams-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setIsExportDialogOpen(false);
    toast.success('CSV file downloaded successfully');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredExams, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exams-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
    toast.success('JSON file downloaded successfully');
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }

    const rows = filteredExams
      .map((e) => {
        const examType = examTypes.find((t) => t.value === e.examType)?.label || e.examType;
        return `<tr><td>${e.examCode}</td><td>${examType}</td><td>${e.className}</td><td>${e.section}</td><td>${e.startDate}</td><td>${e.endDate}</td><td>${e.status}</td><td>${e.progress}%</td></tr>`;
      })
      .join('');

    printWindow.document.write(`<!doctype html><html><head><title>Exam Report</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;font-size:12px;}th{background:#f3f4f6;text-align:left;}h1{margin:0 0 6px;}p{margin:0 0 12px;color:#555;}</style></head><body><h1>Exam Report</h1><p>Academic Year: ${selectedYear}</p><table><thead><tr><th>Code</th><th>Type</th><th>Class</th><th>Section</th><th>Start</th><th>End</th><th>Status</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();

    setIsExportDialogOpen(false);
    toast.success('Print dialog opened');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setClassFilter('all');
    setSectionFilter('all');
    setShowInactive(false);
    toast.success('Filters reset');
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Exam Setup & Management</h1>
        <p className="text-muted-foreground mt-1">
          Configure exam details before marks entry and publishing results.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="mt-1 bg-blue-50">
          <GraduationCap className="h-3 w-3 mr-1" />
          Progress Reports
        </Badge>
        <Button variant="outline" onClick={() => setIsGradeScaleOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Grade Scale
        </Button>
        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Exam
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
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-2xl font-bold">{stats.totalExams}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ongoing</p>
              <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-purple-600">{stats.published}</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
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
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label} {year.current ? '(Current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  Class {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger>
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((sec) => (
                <SelectItem key={sec} value={sec}>
                  Section {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch id="inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="inactive" className="text-sm">
              Show Inactive
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Badge variant="outline">
              {filteredExams.length} of {currentYearExams.length} exams
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 inline mr-1" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExamTable = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedExams = filteredExams.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(filteredExams.length / itemsPerPage));

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Exam Configurations
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50">
              Total: {filteredExams.length}
            </Badge>
          </div>
          <CardDescription>
            Total students: {stats.totalStudents} | Total configured subjects: {stats.totalSubjects} | Average duration: {stats.averageDuration} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No exams found. Click "Create New Exam" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExams.map((exam) => {
                      const examType = examTypes.find((t) => t.value === exam.examType);
                      return (
                        <TableRow key={exam.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm font-medium">{exam.examCode}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-50">
                              {examType?.label || exam.examType}
                            </Badge>
                          </TableCell>
                          <TableCell>{exam.className}</TableCell>
                          <TableCell>{exam.section}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(exam.startDate).toLocaleDateString()}</div>
                              <div className="text-muted-foreground text-xs">to {new Date(exam.endDate).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{exam.subjects.length} subjects</Badge>
                          </TableCell>
                          <TableCell>{exam.totalStudents}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={exam.progress} className="w-16 h-2" />
                              <span className="text-sm font-medium">{exam.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(exam.status, exam.resultPublished)}</TableCell>
                          <TableCell>
                            {exam.resultPublished ? <CheckCircle className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-300" />}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Details"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Duplicate"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsDuplicateDialogOpen(true);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {exam.status === 'completed' && !exam.resultPublished && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Publish Results"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setIsPublishDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Configure Subjects"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setSubjectConfigs(exam.subjects);
                                  setIsSubjectConfigOpen(true);
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title={exam.isActive ? 'Deactivate' : 'Activate'}
                                className={exam.isActive ? 'text-yellow-600' : 'text-green-600'}
                                onClick={() => handleToggleActive(exam)}
                              >
                                {exam.isActive ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          {filteredExams.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredExams.length)} of {filteredExams.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? 'bg-blue-600' : ''}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCreateDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>Configure exam details before marks entry and publishing results.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={formData.examType} onValueChange={(value) => setFormData({ ...formData, examType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((exam) => (
                      <SelectItem key={exam.value} value={exam.value}>
                        {exam.label} ({exam.term} - {exam.weightage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Exam Name (Optional)</Label>
              <Input
                placeholder="e.g., Mid-Term Assessment 2025"
                value={formData.customExamName}
                onChange={(e) => setFormData({ ...formData, customExamName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.className} onValueChange={(value) => setFormData({ ...formData, className: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label} ({cls.students} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section *</Label>
                <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Exam Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Subjects Configuration</h3>
            <div className="space-y-2">
              <Label>Select Subjects *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject.subjectId}
                    type="button"
                    variant={formData.selectedSubjects.includes(subject.subjectId) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newSubjects = formData.selectedSubjects.includes(subject.subjectId)
                        ? formData.selectedSubjects.filter((s) => s !== subject.subjectId)
                        : [...formData.selectedSubjects, subject.subjectId];
                      setFormData({ ...formData, selectedSubjects: newSubjects });
                    }}
                    className="w-full justify-start"
                  >
                    {subject.subjectName}
                    {subject.hasPractical && (
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600 text-[10px]">
                        Practical
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Marks per Subject *</Label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.maxMarksPerSubject}
                  onChange={(e) => setFormData({ ...formData, maxMarksPerSubject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Passing Marks *</Label>
                <Input
                  type="number"
                  min="1"
                  max={formData.maxMarksPerSubject}
                  value={formData.passingMarks}
                  onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Advanced Options</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="negative-marking">Enable Negative Marking</Label>
              <Switch
                id="negative-marking"
                checked={formData.hasNegativeMarking}
                onCheckedChange={(checked) => setFormData({ ...formData, hasNegativeMarking: checked })}
              />
            </div>
            {formData.hasNegativeMarking && (
              <div className="space-y-2">
                <Label>Negative Mark per Question</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  value={formData.negativeMarkPerQuestion}
                  onChange={(e) => setFormData({ ...formData, negativeMarkPerQuestion: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Additional Information</h3>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description about this exam"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions (Optional)</Label>
              <Textarea
                placeholder="Instructions for students..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateExam}>
            <Save className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderViewDialog = () => (
    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Exam Details</DialogTitle>
        </DialogHeader>

        {selectedExam && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exam Code</p>
                <p className="text-2xl font-mono font-bold">{selectedExam.examCode}</p>
              </div>
              {getStatusBadge(selectedExam.status, selectedExam.resultPublished)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Exam Type</p>
                <p className="font-medium">{examTypes.find((t) => t.value === selectedExam.examType)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="font-medium">{selectedExam.academicYear}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class & Section</p>
                <p className="font-medium">Class {selectedExam.className} - {selectedExam.section}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(selectedExam.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{new Date(selectedExam.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Max Marks</p>
                <p className="font-medium">{selectedExam.maxMarksPerSubject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passing Marks</p>
                <p className="font-medium">{selectedExam.passingMarks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="font-medium">{selectedExam.totalStudents}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Subjects ({selectedExam.subjects.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedExam.subjects.map((subject) => (
                  <Badge key={`${selectedExam.id}-${subject.subjectId}`} variant="outline" className="justify-start py-2">
                    {subject.subjectName}
                    {subject.hasPractical && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1 rounded">Practical: {subject.practicalMarks}</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Progress</p>
              <div className="flex items-center gap-4">
                <Progress value={selectedExam.progress} className="flex-1 h-2" />
                <span className="font-bold">{selectedExam.progress}%</span>
              </div>
            </div>

            {selectedExam.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="p-3 bg-gray-50 rounded-lg">{selectedExam.description}</p>
              </div>
            )}

            {selectedExam.instructions && (
              <div>
                <p className="text-sm text-muted-foreground">Instructions</p>
                <p className="p-3 bg-gray-50 rounded-lg">{selectedExam.instructions}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{selectedExam.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(selectedExam.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Modified</p>
                <p className="font-medium">{new Date(selectedExam.lastModified).toLocaleString()}</p>
              </div>
              {selectedExam.publishDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Published On</p>
                  <p className="font-medium">{new Date(selectedExam.publishDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsViewDialogOpen(false);
              setSelectedExam(null);
            }}
          >
            Close
          </Button>
          {selectedExam && selectedExam.status === 'completed' && !selectedExam.resultPublished && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setIsViewDialogOpen(false);
                setIsPublishDialogOpen(true);
              }}
            >
              Publish Results
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEditDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Update exam details. Changes will affect all associated data.</DialogDescription>
        </DialogHeader>

        {selectedExam && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Exam Name</Label>
              <Input value={selectedExam.examCode} onChange={(e) => setSelectedExam({ ...selectedExam, examCode: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={selectedExam.startDate}
                  onChange={(e) => setSelectedExam({ ...selectedExam, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={selectedExam.endDate}
                  onChange={(e) => setSelectedExam({ ...selectedExam, endDate: e.target.value })}
                  min={selectedExam.startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={selectedExam.description || ''}
                onChange={(e) => setSelectedExam({ ...selectedExam, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={selectedExam.instructions || ''}
                onChange={(e) => setSelectedExam({ ...selectedExam, instructions: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Marks per Subject</Label>
                <Input
                  type="number"
                  value={selectedExam.maxMarksPerSubject}
                  onChange={(e) =>
                    setSelectedExam({
                      ...selectedExam,
                      maxMarksPerSubject: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Passing Marks</Label>
                <Input
                  type="number"
                  value={selectedExam.passingMarks || 35}
                  onChange={(e) =>
                    setSelectedExam({
                      ...selectedExam,
                      passingMarks: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  max={selectedExam.maxMarksPerSubject}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-negative-marking">Negative Marking</Label>
              <Switch
                id="edit-negative-marking"
                checked={selectedExam.hasNegativeMarking || false}
                onCheckedChange={(checked) => setSelectedExam({ ...selectedExam, hasNegativeMarking: checked })}
              />
            </div>

            {selectedExam.hasNegativeMarking && (
              <div className="space-y-2">
                <Label>Negative Mark per Question</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={selectedExam.negativeMarkPerQuestion || 0}
                  onChange={(e) =>
                    setSelectedExam({
                      ...selectedExam,
                      negativeMarkPerQuestion: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedExam(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleEditExam}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderSubjectConfigDialog = () => (
    <Dialog open={isSubjectConfigOpen} onOpenChange={setIsSubjectConfigOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configure Subjects</DialogTitle>
          <DialogDescription>Set subject-specific exam details like dates, times, and teachers.</DialogDescription>
        </DialogHeader>

        {selectedExam && (
          <div className="space-y-4 py-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Passing</TableHead>
                    <TableHead>Teacher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectConfigs.map((subject, index) => (
                    <TableRow key={subject.subjectId}>
                      <TableCell className="font-medium">{subject.subjectName}</TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={subject.examDate || selectedExam.startDate}
                          onChange={(e) => {
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = { ...newConfigs[index], examDate: e.target.value };
                            setSubjectConfigs(newConfigs);
                          }}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={subject.examTime || '09:00'}
                          onChange={(e) => {
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = { ...newConfigs[index], examTime: e.target.value };
                            setSubjectConfigs(newConfigs);
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="30"
                          max="240"
                          step="30"
                          value={subject.duration || 180}
                          onChange={(e) => {
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = { ...newConfigs[index], duration: parseInt(e.target.value, 10) || 180 };
                            setSubjectConfigs(newConfigs);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={subject.maxMarks}
                          onChange={(e) => {
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = { ...newConfigs[index], maxMarks: parseInt(e.target.value, 10) || 0 };
                            setSubjectConfigs(newConfigs);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={subject.passingMarks}
                          onChange={(e) => {
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = { ...newConfigs[index], passingMarks: parseInt(e.target.value, 10) || 0 };
                            setSubjectConfigs(newConfigs);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={subject.teacherId || ''}
                          onValueChange={(value) => {
                            const teacherNameMap: Record<string, string> = {
                              TCH1: 'Mr. Sharma',
                              TCH2: 'Mrs. Gupta',
                              TCH3: 'Ms. Reddy',
                            };
                            const newConfigs = [...subjectConfigs];
                            newConfigs[index] = {
                              ...newConfigs[index],
                              teacherId: value,
                              teacherName: teacherNameMap[value] || value,
                            };
                            setSubjectConfigs(newConfigs);
                          }}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TCH1">Mr. Sharma</SelectItem>
                            <SelectItem value="TCH2">Mrs. Gupta</SelectItem>
                            <SelectItem value="TCH3">Ms. Reddy</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSubjectConfigOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!selectedExam) return;
              setExams(
                exams.map((e) =>
                  e.id === selectedExam.id ? { ...e, subjects: subjectConfigs, lastModified: new Date().toISOString() } : e
                )
              );
              setIsSubjectConfigOpen(false);
              toast.success('Subject configurations saved');
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configurations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderGradeScaleDialog = () => (
    <Dialog open={isGradeScaleOpen} onOpenChange={setIsGradeScaleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Grade Scale</DialogTitle>
          <DialogDescription>Define grade boundaries and remarks for result calculation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min Marks</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Grade Point</TableHead>
                  <TableHead>Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeScale.map((grade, index) => (
                  <TableRow key={`${grade.grade}-${index}`}>
                    <TableCell>
                      <Input
                        type="number"
                        value={grade.min}
                        onChange={(e) => {
                          const newScale = [...gradeScale];
                          newScale[index] = { ...newScale[index], min: parseInt(e.target.value, 10) || 0 };
                          setGradeScale(newScale);
                        }}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={grade.max}
                        onChange={(e) => {
                          const newScale = [...gradeScale];
                          newScale[index] = { ...newScale[index], max: parseInt(e.target.value, 10) || 0 };
                          setGradeScale(newScale);
                        }}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={grade.grade}
                        onChange={(e) => {
                          const newScale = [...gradeScale];
                          newScale[index] = { ...newScale[index], grade: e.target.value };
                          setGradeScale(newScale);
                        }}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={grade.gradePoint}
                        onChange={(e) => {
                          const newScale = [...gradeScale];
                          newScale[index] = { ...newScale[index], gradePoint: parseFloat(e.target.value) || 0 };
                          setGradeScale(newScale);
                        }}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={grade.remark}
                        onChange={(e) => {
                          const newScale = [...gradeScale];
                          newScale[index] = { ...newScale[index], remark: e.target.value };
                          setGradeScale(newScale);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsGradeScaleOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setIsGradeScaleOpen(false);
              toast.success('Grade scale saved');
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Grade Scale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the exam "{selectedExam?.examCode}" and all associated marks and data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedExam(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteExam} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderDuplicateDialog = () => (
    <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate Exam</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a copy of "{selectedExam?.examCode}" with a new exam code. All settings will be preserved but marks entry will start fresh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedExam(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDuplicateExam}>Duplicate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderPublishDialog = () => (
    <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Results</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to publish results for "{selectedExam?.examCode}"? Students and parents will be able to view the results immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedExam(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublishResults} className="bg-green-600 hover:bg-green-700">
            Publish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderExportDialog = () => (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Exams</DialogTitle>
          <DialogDescription>Choose export format for exam data</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button className="w-full justify-start" variant="outline" onClick={handleExportCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
          <Button className="w-full justify-start" variant="outline" onClick={handleExportJSON}>
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          <Button className="w-full justify-start" variant="outline" onClick={handlePrintReport}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
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

  const renderGuidelines = () => (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Important Guidelines</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Create exam structure before marks entry begins</li>
              <li>Configure subjects and passing marks for each exam</li>
              <li>Exam status flows from Draft to Scheduled to Ongoing to Completed to Published</li>
              <li>Results should be published only after all marks are verified</li>
              <li>Use Configure Subjects to set subject-specific dates and teachers</li>
              <li>Duplicate exam to quickly create similar exam structures</li>
              <li>Deactivate exams no longer in use instead of deleting</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}
      {renderExamTable()}
      {renderGuidelines()}

      {renderCreateDialog()}
      {renderViewDialog()}
      {renderEditDialog()}
      {renderSubjectConfigDialog()}
      {renderGradeScaleDialog()}
      {renderDeleteDialog()}
      {renderDuplicateDialog()}
      {renderPublishDialog()}
      {renderExportDialog()}
    </div>
  );
}
