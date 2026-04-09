import { useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Save,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Printer,
  FileText,
  TrendingUp,
  Award,
  Search,
  Settings,
  RotateCcw,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';

type AcademicYear = '2025-26' | '2024-25' | '2023-24';
type ExamType =
  | 'unit-test-1'
  | 'unit-test-2'
  | 'quarterly'
  | 'half-yearly'
  | 'annual';
type Section = 'A' | 'B' | 'C' | 'D';
type SubjectKey =
  | 'english'
  | 'mathematics'
  | 'science'
  | 'social-studies'
  | 'hindi'
  | 'computer-science';
type EntryStatus = 'saved' | 'unsaved' | 'error' | 'pending' | 'submitted' | 'published';
type ResultStatus = 'Pass' | 'Fail';

type SubjectInfo = {
  key: SubjectKey;
  label: string;
  code: string;
  maxMarks: number;
  passMarks: number;
};

type StudentRecord = {
  id: string;
  rollNumber: string;
  studentName: string;
  admissionNumber: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  attendance: number;
  marks: Record<SubjectKey, string>;
  remarks: string;
  status: EntryStatus;
  lastSavedAt?: string;
};

type StudentComputed = {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  finalGrade: string;
  result: ResultStatus;
  division: string;
  complete: boolean;
  hasErrors: boolean;
  subjectBreakdown: Record<
    SubjectKey,
    {
      obtained: number;
      max: number;
      percentage: number;
      grade: string;
      valid: boolean;
    }
  >;
};

type DashboardStats = {
  totalStudents: number;
  completedEntries: number;
  averagePercentage: number;
  passPercentage: number;
  unsavedEntries: number;
  errorEntries: number;
};

const academicYears: AcademicYear[] = ['2025-26', '2024-25', '2023-24'];

const examTypes: Array<{ value: ExamType; label: string }> = [
  { value: 'unit-test-1', label: 'Unit Test 1' },
  { value: 'unit-test-2', label: 'Unit Test 2' },
  { value: 'quarterly', label: 'Quarterly Exam' },
  { value: 'half-yearly', label: 'Half Yearly Exam' },
  { value: 'annual', label: 'Annual Exam' },
];

const classes = [
  { value: '6', label: 'Class 6', sections: ['A', 'B', 'C'] as Section[], studentCount: 32 },
  { value: '7', label: 'Class 7', sections: ['A', 'B', 'C'] as Section[], studentCount: 36 },
  { value: '8', label: 'Class 8', sections: ['A', 'B', 'C'] as Section[], studentCount: 40 },
  { value: '9', label: 'Class 9', sections: ['A', 'B', 'C', 'D'] as Section[], studentCount: 42 },
  { value: '10', label: 'Class 10', sections: ['A', 'B', 'C', 'D'] as Section[], studentCount: 45 },
];

const subjectCatalog: SubjectInfo[] = [
  { key: 'english', label: 'English', code: 'ENG', maxMarks: 100, passMarks: 35 },
  { key: 'mathematics', label: 'Mathematics', code: 'MATH', maxMarks: 100, passMarks: 35 },
  { key: 'science', label: 'Science', code: 'SCI', maxMarks: 100, passMarks: 35 },
  { key: 'social-studies', label: 'Social Studies', code: 'SST', maxMarks: 100, passMarks: 35 },
  { key: 'hindi', label: 'Hindi', code: 'HIN', maxMarks: 100, passMarks: 35 },
  { key: 'computer-science', label: 'Computer Science', code: 'CS', maxMarks: 100, passMarks: 35 },
];

const getGradeFromPercentage = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 35) return 'C';
  return 'F';
};

const getDivisionFromPercentage = (percentage: number): string => {
  if (percentage >= 75) return 'Distinction';
  if (percentage >= 60) return 'First Division';
  if (percentage >= 50) return 'Second Division';
  if (percentage >= 35) return 'Third Division';
  return 'Fail';
};

const validateMark = (value: string, maxMarks: number): { valid: boolean; error?: string } => {
  if (value.trim() === '') return { valid: true };
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return { valid: false, error: 'Invalid number' };
  if (numeric < 0) return { valid: false, error: 'Cannot be negative' };
  if (numeric > maxMarks) return { valid: false, error: `Cannot exceed ${maxMarks}` };
  return { valid: true };
};

const names = [
  'Aarav Kumar',
  'Sneha Reddy',
  'Rohan Singh',
  'Priya Sharma',
  'Rahul Verma',
  'Ananya Gupta',
  'Arjun Nair',
  'Kavya Patel',
  'Vikram Joshi',
  'Divya Malhotra',
  'Ishaan Kapoor',
  'Meera Saxena',
  'Ritika Chawla',
  'Aditya Desai',
  'Tanvi Rao',
  'Nikhil Goyal',
  'Suhani Jain',
  'Pranav Bhat',
  'Aditi Menon',
  'Harshita Sinha',
];

const makeEmptyMarks = (): Record<SubjectKey, string> => ({
  english: '',
  mathematics: '',
  science: '',
  'social-studies': '',
  hindi: '',
  'computer-science': '',
});

const generateStudents = (className: string, section: Section, count: number): StudentRecord[] => {
  return Array.from({ length: count }, (_, index) => {
    const name = names[index % names.length];
    return {
      id: `${className}${section}-${String(index + 1).padStart(3, '0')}`,
      rollNumber: `${className}${section}-${String(index + 1).padStart(2, '0')}`,
      studentName: name,
      admissionNumber: `ADM${className}${section}${String(index + 1).padStart(4, '0')}`,
      dateOfBirth: `201${index % 5}-0${(index % 8) + 1}-1${index % 9}`,
      fatherName: `Mr. ${name.split(' ')[0]} Kumar`,
      motherName: `Mrs. ${name.split(' ')[0]} Devi`,
      attendance: 80 + (index % 20),
      marks: makeEmptyMarks(),
      remarks: '',
      status: 'unsaved',
      lastSavedAt: undefined,
    };
  });
};

const computeStudent = (student: StudentRecord): StudentComputed => {
  let totalObtained = 0;
  let totalMax = 0;
  let complete = true;
  let hasErrors = false;

  const subjectBreakdown = subjectCatalog.reduce((acc, subject) => {
    const raw = student.marks[subject.key];
    const validation = validateMark(raw, subject.maxMarks);
    const obtained = raw.trim() === '' ? 0 : Number(raw);
    if (!validation.valid) hasErrors = true;
    if (raw.trim() === '') complete = false;
    if (validation.valid && raw.trim() !== '') {
      totalObtained += obtained;
      totalMax += subject.maxMarks;
    } else {
      totalMax += subject.maxMarks;
    }

    const pct = subject.maxMarks > 0 ? Number(((obtained / subject.maxMarks) * 100).toFixed(2)) : 0;
    acc[subject.key] = {
      obtained,
      max: subject.maxMarks,
      percentage: pct,
      grade: getGradeFromPercentage(pct),
      valid: validation.valid,
    };
    return acc;
  }, {} as StudentComputed['subjectBreakdown']);

  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const hasSubjectFail = subjectCatalog.some((subject) => {
    const raw = student.marks[subject.key];
    if (raw.trim() === '') return true;
    return Number(raw) < subject.passMarks;
  });

  return {
    totalObtained,
    totalMax,
    percentage,
    finalGrade: getGradeFromPercentage(percentage),
    result: hasSubjectFail ? 'Fail' : 'Pass',
    division: getDivisionFromPercentage(percentage),
    complete,
    hasErrors,
    subjectBreakdown,
  };
};

const getStatusBadge = (status: EntryStatus) => {
  if (status === 'saved') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" /> Saved
      </Badge>
    );
  }
  if (status === 'error') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <AlertCircle className="h-3 w-3 mr-1" /> Error
      </Badge>
    );
  }
  if (status === 'pending') {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <RefreshCw className="h-3 w-3 mr-1" /> Pending
      </Badge>
    );
  }
  if (status === 'submitted') {
    return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Submitted</Badge>;
  }
  if (status === 'published') {
    return <Badge className="bg-green-600 text-white">Published</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Unsaved</Badge>;
};

export default function MarksEntryPage() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2025-26');
  const [selectedExam, setSelectedExam] = useState<ExamType>('unit-test-2');
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState<Section>('A');
  const [selectedSubjectForBulk, setSelectedSubjectForBulk] = useState<SubjectKey>('english');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [showOnlyPass, setShowOnlyPass] = useState(false);
  const [showOnlyFail, setShowOnlyFail] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report-cards'>('entry');

  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'percentage' | 'status'>('roll');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentClassInfo = classes.find((entry) => entry.value === selectedClass) ?? classes[0];

  const [students, setStudents] = useState<StudentRecord[]>(() =>
    generateStudents('10', 'A', currentClassInfo.studentCount)
  );

  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [bulkRemark, setBulkRemark] = useState('');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [remarkStudentId, setRemarkStudentId] = useState<string | null>(null);

  useEffect(() => {
    const nextCount = currentClassInfo.studentCount;
    setStudents(generateStudents(selectedClass, selectedSection, nextCount));
    setSearchTerm('');
    toast.info(`Loaded ${nextCount} students for Class ${selectedClass}-${selectedSection}`);
  }, [selectedClass, selectedSection, currentClassInfo.studentCount]);

  const computedMap = useMemo(() => {
    return students.reduce<Record<string, StudentComputed>>((acc, student) => {
      acc[student.id] = computeStudent(student);
      return acc;
    }, {});
  }, [students]);

  const stats = useMemo<DashboardStats>(() => {
    const totalStudents = students.length;
    const completedEntries = students.filter((student) => computedMap[student.id]?.complete).length;
    const errorEntries = students.filter((student) => computedMap[student.id]?.hasErrors).length;
    const unsavedEntries = students.filter((student) => student.status === 'unsaved').length;
    const percentages = students
      .filter((student) => computedMap[student.id]?.complete)
      .map((student) => computedMap[student.id].percentage);
    const averagePercentage = percentages.length
      ? Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(2))
      : 0;
    const passCount = students.filter((student) => computedMap[student.id]?.result === 'Pass').length;
    const passPercentage = totalStudents
      ? Number(((passCount / totalStudents) * 100).toFixed(2))
      : 0;

    return {
      totalStudents,
      completedEntries,
      averagePercentage,
      passPercentage,
      unsavedEntries,
      errorEntries,
    };
  }, [students, computedMap]);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !normalized ||
        student.studentName.toLowerCase().includes(normalized) ||
        student.rollNumber.toLowerCase().includes(normalized)
      const matchesPending = !showOnlyPending || student.status === 'unsaved';
      const matchesErrors = !showOnlyErrors || student.status === 'error';
      const matchesPass = !showOnlyPass || computedMap[student.id]?.result === 'Pass';
      const matchesFail = !showOnlyFail || computedMap[student.id]?.result === 'Fail';

      return matchesSearch && matchesPending && matchesErrors && matchesPass && matchesFail;
    });
  }, [students, searchTerm, showOnlyPending, showOnlyErrors, showOnlyPass, showOnlyFail, computedMap]);

  const sortedStudents = useMemo(() => {
    const rows = [...filteredStudents];
    rows.sort((left, right) => {
      let base = 0;
      if (sortBy === 'roll') base = left.rollNumber.localeCompare(right.rollNumber);
      if (sortBy === 'name') base = left.studentName.localeCompare(right.studentName);
      if (sortBy === 'percentage') {
        base = (computedMap[left.id]?.percentage ?? 0) - (computedMap[right.id]?.percentage ?? 0);
      }
      if (sortBy === 'status') base = left.status.localeCompare(right.status);
      return sortOrder === 'asc' ? base : -base;
    });
    return rows;
  }, [filteredStudents, sortBy, sortOrder, computedMap]);

  const previewStudent = useMemo(
    () => students.find((student) => student.id === previewStudentId) ?? null,
    [previewStudentId, students]
  );
  const remarkStudent = useMemo(
    () => students.find((student) => student.id === remarkStudentId) ?? null,
    [remarkStudentId, students]
  );

  const saveStatusFromStudent = (student: StudentRecord): EntryStatus => {
    const computed = computeStudent(student);
    if (computed.hasErrors) return 'error';
    if (computed.complete) return 'saved';
    return 'unsaved';
  };

  const updateMark = (studentId: string, subjectKey: SubjectKey, value: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const next = {
          ...student,
          marks: {
            ...student.marks,
            [subjectKey]: value,
          },
          status: 'unsaved' as EntryStatus,
        };
        const computed = computeStudent(next);
        return {
          ...next,
          status: computed.hasErrors ? 'error' : 'unsaved',
        };
      })
    );
  };

  const handleSaveAll = () => {
    const hasErrors = students.some((student) => computeStudent(student).hasErrors);
    if (hasErrors) {
      toast.error('Fix invalid marks before saving.');
      return;
    }

    const now = new Date().toLocaleTimeString();
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        status: saveStatusFromStudent(student),
        lastSavedAt: now,
      }))
    );
    setLastAutoSave(new Date());
    toast.success('All entries saved successfully.');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasUnsaved = students.some((student) => student.status === 'unsaved');
      if (!hasUnsaved) return;

      const now = new Date().toLocaleTimeString();
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          status: saveStatusFromStudent(student),
          lastSavedAt: now,
        }))
      );
      setLastAutoSave(new Date());
      toast.info('Auto-saved marks entries.');
    }, 30000);

    return () => clearTimeout(timer);
  }, [students]);

  const handleSubmitForReview = () => {
    const incomplete = students.filter((student) => !computedMap[student.id]?.complete).length;
    const errors = students.filter((student) => computedMap[student.id]?.hasErrors).length;
    if (incomplete > 0 || errors > 0) {
      toast.error('Complete all marks and fix errors before submit.');
      return;
    }

    setStudents((prev) => prev.map((student) => ({ ...student, status: 'submitted' })));
    toast.success('Submitted successfully for review and approval.');
  };

  const handlePublishResults = () => {
    const submittedCount = students.filter((student) => student.status === 'submitted').length;
    if (submittedCount === 0) {
      toast.error('No submitted records found to publish.');
      return;
    }
    setStudents((prev) =>
      prev.map((student) =>
        student.status === 'submitted' ? { ...student, status: 'published' } : student
      )
    );
    setIsPublishDialogOpen(false);
    toast.success(`Published ${submittedCount} report cards.`);
  };

  const confirmResetUnsaved = () => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.status === 'saved' || student.status === 'pending') return student;
        return {
          ...student,
          marks: makeEmptyMarks(),
          remarks: '',
          status: 'unsaved',
          lastSavedAt: undefined,
        };
      })
    );
    setIsResetDialogOpen(false);
    toast.success('Unsaved rows reset.');
  };

  const applyBulkMarks = () => {
    const subject = subjectCatalog.find((item) => item.key === selectedSubjectForBulk);
    if (!subject) return;

    const validation = validateMark(bulkValue, subject.maxMarks);
    if (!validation.valid || bulkValue.trim() === '') {
      toast.error(validation.error ?? 'Please enter valid marks for bulk fill.');
      return;
    }

    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        marks: {
          ...student.marks,
          [selectedSubjectForBulk]: bulkValue,
        },
        remarks: bulkRemark ? bulkRemark : student.remarks,
        status: 'unsaved',
      }))
    );

    setBulkValue('');
    setBulkRemark('');
    setIsBulkDialogOpen(false);
    toast.success(`Bulk marks applied for ${subject.label}.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Roll No',
      'Student Name',
      ...subjectCatalog.map((subject) => `${subject.label} (${subject.maxMarks})`),
      'Total Obtained',
      'Total Max',
      'Percentage',
      'Grade',
      'Division',
      'Result',
      'Status',
      'Remarks',
    ];

    const lines = sortedStudents.map((student) => {
      const computed = computedMap[student.id];
      return [
        student.rollNumber,
        student.studentName,
        ...subjectCatalog.map((subject) => student.marks[subject.key] || '-'),
        computed.totalObtained.toString(),
        computed.totalMax.toString(),
        computed.percentage.toString(),
        computed.finalGrade,
        computed.division,
        computed.result,
        student.status,
        student.remarks,
      ];
    });

    const csv = [headers.join(','), ...lines.map((line) => line.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `marks-entry-${selectedClass}-${selectedSection}-${selectedExam}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
    toast.success('CSV exported successfully.');
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups for PDF/print export.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Marks Entry Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { margin: 0; }
          .muted { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #111827; color: #fff; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Corporate Marks Entry Report</h1>
        <p class="muted">Academic Year: ${selectedYear} | Exam: ${examTypes.find((entry) => entry.value === selectedExam)?.label} | Class: ${selectedClass}-${selectedSection}</p>
        <p class="muted">Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Roll</th>
              <th>Name</th>
              ${subjectCatalog.map((subject) => `<th>${subject.code}</th>`).join('')}
              <th>Total</th>
              <th>%</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${sortedStudents
              .map((student) => {
                const computed = computedMap[student.id];
                return `
                  <tr>
                    <td>${student.rollNumber}</td>
                    <td>${student.studentName}</td>
                    ${subjectCatalog.map((subject) => `<td class="right">${student.marks[subject.key] || '-'}</td>`).join('')}
                    <td class="right">${computed.totalObtained}/${computed.totalMax}</td>
                    <td class="right">${computed.percentage}%</td>
                    <td>${computed.finalGrade}</td>
                    <td>${computed.result}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    setIsExportDialogOpen(false);
    toast.success('Printable PDF view generated.');
  };

  const handlePrintReportCard = (student: StudentRecord) => {
    const computed = computedMap[student.id];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups for report card print.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Progress Report Card</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          .card { border: 2px solid #222; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #222; margin-bottom: 12px; padding-bottom: 8px; }
          .school { font-size: 22px; font-weight: bold; }
          .meta { font-size: 12px; color: #555; }
          .student-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #666; padding: 8px; font-size: 12px; }
          th { background: #f1f5f9; }
          .summary { margin-top: 12px; border: 1px solid #666; padding: 10px; }
          .sign { margin-top: 32px; display: flex; justify-content: space-between; }
          .line { border-top: 1px solid #111; width: 200px; text-align: center; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="school">PMC Tech School</div>
            <div class="meta">Hosur - Krishnagiri Highways, Nallaganakothapalli, Tamil Nadu - 635 117</div>
            <div class="meta">Progress Report Card | ${examTypes.find((entry) => entry.value === selectedExam)?.label} | ${selectedYear}</div>
          </div>

          <div class="student-grid">
            <div><strong>Student Name:</strong> ${student.studentName}</div>
            <div><strong>Roll Number:</strong> ${student.rollNumber}</div>
            <div><strong>Class:</strong> ${selectedClass}-${selectedSection}</div>
            <div><strong>Admission No:</strong> ${student.admissionNumber}</div>
            <div><strong>Date of Birth:</strong> ${student.dateOfBirth}</div>
            <div><strong>Attendance:</strong> ${student.attendance}%</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Max</th>
                <th>Obtained</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectCatalog
                .map((subject) => {
                  const row = computed.subjectBreakdown[subject.key];
                  return `<tr><td>${subject.label}</td><td>${row.max}</td><td>${row.obtained}</td><td>${row.percentage}%</td><td>${row.grade}</td></tr>`;
                })
                .join('')}
            </tbody>
          </table>

          <div class="summary">
            <div><strong>Total:</strong> ${computed.totalObtained} / ${computed.totalMax}</div>
            <div><strong>Percentage:</strong> ${computed.percentage}%</div>
            <div><strong>Final Grade:</strong> ${computed.finalGrade}</div>
            <div><strong>Division:</strong> ${computed.division}</div>
            <div><strong>Result:</strong> ${computed.result}</div>
            <div><strong>Teacher Remarks:</strong> ${student.remarks || 'Student shows good academic performance and should continue consistent efforts.'}</div>
          </div>

          <div class="sign">
            <div class="line">Class Teacher Signature</div>
            <div class="line">Principal Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleSort = (field: 'roll' | 'name' | 'percentage' | 'status') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

  const renderSortIcon = (field: 'roll' | 'name' | 'percentage' | 'status') => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corporate Marks Entry Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatic total, percentage, grade, division, and report card generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={handleSaveAll}>
            <Save className="h-4 w-4 mr-2" /> Save All
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitForReview}>
            <Send className="h-4 w-4 mr-2" /> Submit for Review
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsPublishDialogOpen(true)}>
            <CheckCircle className="h-4 w-4 mr-2" /> Publish Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <Users className="h-9 w-9 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Entries</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedEntries}</p>
              </div>
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <Progress value={(stats.completedEntries / Math.max(stats.totalStudents, 1)) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Percentage</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.averagePercentage}%</p>
            </div>
            <TrendingUp className="h-9 w-9 text-indigo-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pass Percentage</p>
              <p className="text-2xl font-bold text-amber-600">{stats.passPercentage}%</p>
            </div>
            <Award className="h-9 w-9 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <Select value={selectedYear} onValueChange={(value: AcademicYear) => setSelectedYear(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedExam} onValueChange={(value: ExamType) => setSelectedExam(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((exam) => (
                  <SelectItem key={exam.value} value={exam.value}>{exam.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSection}
              onValueChange={(value: Section) => setSelectedSection(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {currentClassInfo.sections.map((section) => (
                  <SelectItem key={section} value={section}>Section {section}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSubjectForBulk}
              onValueChange={(value: SubjectKey) => setSelectedSubjectForBulk(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectCatalog.map((subject) => (
                  <SelectItem key={subject.key} value={subject.key}>{subject.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
              <Layers className="h-4 w-4 mr-2" /> Bulk Fill
            </Button>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset Unsaved
            </Button>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-2" /> Publish Results
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <Switch checked={showOnlyPending} onCheckedChange={setShowOnlyPending} />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnlyErrors} onCheckedChange={setShowOnlyErrors} />
              <span className="text-xs text-muted-foreground">Errors</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnlyPass} onCheckedChange={setShowOnlyPass} />
              <span className="text-xs text-muted-foreground">Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnlyFail} onCheckedChange={setShowOnlyFail} />
              <span className="text-xs text-muted-foreground">Fail</span>
            </div>
            <Badge variant="outline">Unsaved: {stats.unsavedEntries}</Badge>
            <Badge variant="outline">Errors: {stats.errorEntries}</Badge>
            {lastAutoSave ? (
              <span className="text-xs text-muted-foreground ml-auto">Last auto-save: {lastAutoSave.toLocaleTimeString()}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'entry' | 'report-cards')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entry">Marks Entry</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <Card className="shadow-sm mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Marks Entry Table</span>
                <span className="text-sm text-muted-foreground">{sortedStudents.length} students</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1400px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('roll')}>
                          Roll {renderSortIcon('roll')}
                        </Button>
                      </th>
                      <th className="text-left px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('name')}>
                          Student {renderSortIcon('name')}
                        </Button>
                      </th>
                      {subjectCatalog.map((subject) => (
                        <th key={subject.key} className="text-left px-3 py-2">{subject.code} / {subject.maxMarks}</th>
                      ))}
                      <th className="text-left px-3 py-2">Total</th>
                      <th className="text-left px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('percentage')}>
                          % {renderSortIcon('percentage')}
                        </Button>
                      </th>
                      <th className="text-left px-3 py-2">Grade</th>
                      <th className="text-left px-3 py-2">Division</th>
                      <th className="text-left px-3 py-2">Result</th>
                      <th className="text-left px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('status')}>
                          Status {renderSortIcon('status')}
                        </Button>
                      </th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => {
                      const computed = computedMap[student.id];
                      return (
                        <tr key={student.id} className="border-b hover:bg-slate-50/80 align-top">
                          <td className="px-3 py-2 font-medium">{student.rollNumber}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-xs text-muted-foreground">{student.admissionNumber}</div>
                          </td>
                          {subjectCatalog.map((subject) => {
                            const validation = validateMark(student.marks[subject.key], subject.maxMarks);
                            return (
                              <td key={subject.key} className="px-3 py-2">
                                <Input
                                  value={student.marks[subject.key]}
                                  onChange={(event) => updateMark(student.id, subject.key, event.target.value)}
                                  className={`w-20 ${!validation.valid ? 'border-red-500' : ''}`}
                                  placeholder="0"
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 font-semibold">{computed.totalObtained}/{computed.totalMax}</td>
                          <td className="px-3 py-2">
                            <span className={computed.percentage >= 35 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                              {computed.percentage}%
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{computed.finalGrade}</Badge>
                          </td>
                          <td className="px-3 py-2 text-sm">{computed.division}</td>
                          <td className="px-3 py-2">
                            <Badge className={computed.result === 'Pass' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                              {computed.result}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">{getStatusBadge(student.status)}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setPreviewStudentId(student.id)}>
                                <Eye className="h-4 w-4 mr-1" /> Preview
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setRemarkStudentId(student.id)}>
                                Remarks
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report-cards">
          <Card className="shadow-sm mt-4">
            <CardHeader>
              <CardTitle className="text-base">Published / Preview Report Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {sortedStudents.map((student) => {
                  const computed = computedMap[student.id];
                  return (
                    <div key={student.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">{computed.finalGrade}</Badge>
                          <Badge className={computed.result === 'Pass' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {computed.result}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewStudentId(student.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrintReportCard(student)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
        <CardContent className="p-4 text-sm text-yellow-900 space-y-1">
          <p>1. Percentage = TotalObtained / TotalMax * 100 (auto-calculated).</p>
          <p>2. Grade rule: A+ (90+), A (80+), B+ (70+), B (60+), C+ (50+), C (35+), F (&lt;35).</p>
          <p>3. Division: Distinction (75+), First (60+), Second (50+), Third (35+), Fail (&lt;35).</p>
          <p>4. Use Preview to open a report card styled output and print/download as PDF.</p>
        </CardContent>
      </Card>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Fill Subject Marks</DialogTitle>
            <DialogDescription>
              Apply same marks for all students in {subjectCatalog.find((subject) => subject.key === selectedSubjectForBulk)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Marks</Label>
              <Input value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} placeholder="Enter marks" />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={bulkRemark}
                onChange={(event) => setBulkRemark(event.target.value)}
                placeholder="Optional common remark"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={applyBulkMarks}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>
              Export marks register in professional formats.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Button variant="outline" className="justify-start" onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" className="justify-start" onClick={handleExportPDF}>
              <Printer className="h-4 w-4 mr-2" /> Export PDF / Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset unsaved marks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear marks only for unsaved/error rows. Saved and submitted rows remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmResetUnsaved}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marks Entry Settings</DialogTitle>
            <DialogDescription>
              Auto-save is currently enabled every 30 seconds for enterprise reliability.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish all submitted results?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all `submitted` records as `published` and make report cards final for export.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={handlePublishResults}>
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(remarkStudent)} onOpenChange={(open) => !open && setRemarkStudentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher Remark</DialogTitle>
            <DialogDescription>
              {remarkStudent ? `${remarkStudent.studentName} (${remarkStudent.rollNumber})` : ''}
            </DialogDescription>
          </DialogHeader>
          {remarkStudent ? (
            <div className="space-y-2 py-2">
              <Label>Remark</Label>
              <Textarea
                value={remarkStudent.remarks}
                onChange={(event) => {
                  const next = event.target.value;
                  setStudents((prev) =>
                    prev.map((student) =>
                      student.id === remarkStudent.id
                        ? { ...student, remarks: next, status: 'unsaved' }
                        : student
                    )
                  );
                }}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkStudentId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewStudent)} onOpenChange={(open) => !open && setPreviewStudentId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Progress Report Card Preview</DialogTitle>
            <DialogDescription>
              Professional A4 style report card output.
            </DialogDescription>
          </DialogHeader>
          {previewStudent ? (
            <div className="space-y-4 py-2">
              <div className="text-center border-b pb-3">
                <h2 className="text-2xl font-bold">PMC Tech School</h2>
                <p className="text-sm text-muted-foreground">Hosur - Krishnagiri Highways, Nallaganakothapalli, Tamil Nadu - 635 117</p>
                <p className="text-sm text-muted-foreground">
                  {examTypes.find((entry) => entry.value === selectedExam)?.label} | Academic Year {selectedYear}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Student:</span> {previewStudent.studentName}</div>
                <div><span className="font-medium">Roll No:</span> {previewStudent.rollNumber}</div>
                <div><span className="font-medium">Class:</span> {selectedClass}-{selectedSection}</div>
                <div><span className="font-medium">Admission:</span> {previewStudent.admissionNumber}</div>
                <div><span className="font-medium">Date of Birth:</span> {previewStudent.dateOfBirth}</div>
                <div><span className="font-medium">Attendance:</span> {previewStudent.attendance}%</div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Subject</th>
                      <th className="px-3 py-2 text-left">Max</th>
                      <th className="px-3 py-2 text-left">Obtained</th>
                      <th className="px-3 py-2 text-left">%</th>
                      <th className="px-3 py-2 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectCatalog.map((subject) => {
                      const item = computedMap[previewStudent.id].subjectBreakdown[subject.key];
                      return (
                        <tr key={subject.key} className="border-b">
                          <td className="px-3 py-2">{subject.label}</td>
                          <td className="px-3 py-2">{item.max}</td>
                          <td className="px-3 py-2">{item.obtained}</td>
                          <td className="px-3 py-2">{item.percentage}%</td>
                          <td className="px-3 py-2">{item.grade}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-sm space-y-1">
                    <p><span className="font-medium">Total:</span> {computedMap[previewStudent.id].totalObtained}/{computedMap[previewStudent.id].totalMax}</p>
                    <p><span className="font-medium">Percentage:</span> {computedMap[previewStudent.id].percentage}%</p>
                    <p><span className="font-medium">Final Grade:</span> {computedMap[previewStudent.id].finalGrade}</p>
                    <p><span className="font-medium">Result:</span> {computedMap[previewStudent.id].result}</p>
                    <p><span className="font-medium">Division:</span> {computedMap[previewStudent.id].division}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-sm space-y-2">
                    <p className="font-medium">Teacher Remarks</p>
                    <p className="text-muted-foreground">
                      {previewStudent.remarks ||
                        'Student shows good academic performance and should continue consistent efforts.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewStudentId(null)}>Close</Button>
            {previewStudent ? (
              <Button onClick={() => handlePrintReportCard(previewStudent)}>
                <Printer className="h-4 w-4 mr-2" /> Print / PDF
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
