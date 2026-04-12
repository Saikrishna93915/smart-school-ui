import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Save,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Users,
  BookOpen,
  ClipboardList,
  Award,
} from 'lucide-react';
import apiClient from '@/Services/apiClient';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

/* ─── Types ─── */
interface ExamCycle {
  _id: string;
  examName: string;
  examCode: string;
  examType: string;
  academicYear: string;
  isPublished: boolean;
  isActive: boolean;
}

interface SubjectDoc {
  _id: string;
  subjectName: string;
  subjectCode: string;
  className?: string;
  totalMarks?: number;
  passingMarks?: number;
}

interface ClassDoc {
  _id: string;
  className: string;
  sections?: string[];
}

interface StudentDoc {
  _id: string;
  studentName: string;
  admissionNo?: string;
  class?: { _id: string; className: string; section?: string; academicYear?: string };
  className?: string;
  section?: string;
}

interface MarkEntry {
  _id?: string;
  studentId: string;
  subjectId: string;
  examCycleId: string;
  className: string;
  section: string;
  theoryMarks?: number;
  practicalMarks?: number;
  maxMarks?: number;
  passingMarks?: number;
  isAbsent?: boolean;
  submit?: boolean;
}

interface StudentMarkRow {
  student: StudentDoc;
  marks: Record<string, MarkEntry>; // subjectId -> mark entry
  totalMarks: number;
  maxPossible: number;
  percentage: number;
}

/* ─── Component ─── */
export default function MarksEntryPage() {
  // Dynamic data
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Student marks editing
  const [editingMarks, setEditingMarks] = useState<Record<string, Record<string, string>>>({}); // studentId -> subjectId -> value
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  /* ─── Fetch initial data ─── */
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesRes, subjectsRes, classesRes] = await Promise.all([
        apiClient.get('/progress-reports/exam-cycles'),
        apiClient.get('/subjects'),
        apiClient.get('/timetable/classes'),
      ]);

      setExamCycles(ensureArray<ExamCycle>(cyclesRes.data?.data || cyclesRes.data));
      setSubjects(ensureArray<SubjectDoc>(subjectsRes.data?.data || subjectsRes.data));
      setClasses(ensureArray<ClassDoc>(classesRes.data?.data || classesRes.data));
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load marks entry data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  /* ─── Fetch students when class/section changes ─── */
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    try {
      const res = await apiClient.get('/students', {
        params: selectedSection ? { className: selectedClass, section: selectedSection } : { className: selectedClass }
      });
      const data = ensureArray<StudentDoc>(res.data?.data || res.data);
      setStudents(data);

      // Initialize editing marks
      const initial: Record<string, Record<string, string>> = {};
      data.forEach(s => {
        initial[s._id] = {};
        subjects.forEach(sub => { initial[s._id][sub._id] = ''; });
      });
      setEditingMarks(initial);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    }
  }, [selectedClass, selectedSection, subjects]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  /* ─── Fetch existing marks when cycle/class/subject changes ─── */
  const fetchExistingMarks = useCallback(async () => {
    if (!selectedCycle || !selectedClass) {
      setMarkEntries([]);
      return;
    }
    try {
      // Use class summary endpoint to get marks data
      const params: Record<string, string> = {
        examCycleId: selectedCycle,
        className: selectedClass
      };
      if (selectedSection) params.section = selectedSection;
      const res = await apiClient.get('/progress-reports/class-summary', { params });
      const data = res.data?.data || res.data;
      // The class summary returns student-level data; we use it to populate existing marks
      const studentsWithData = ensureArray<any>(data?.students || []);
      setMarkEntries([]); // Individual marks are handled via upsert API
    } catch (err) {
      setMarkEntries([]);
    }
  }, [selectedCycle, selectedClass, selectedSection]);

  useEffect(() => { fetchExistingMarks(); }, [fetchExistingMarks]);

  /* ─── Derived data ─── */
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    return subjects.filter(s => !s.className || s.className === selectedClass);
  }, [subjects, selectedClass]);

  const sections = useMemo(() => {
    const cls = classes.find(c => c._id === selectedClass || c.className === selectedClass);
    return cls?.sections || ['A', 'B', 'C', 'D'];
  }, [classes, selectedClass]);

  /* ─── Build student mark rows ─── */
  const studentRows = useMemo((): StudentMarkRow[] => {
    return students.map(student => {
      const marks: Record<string, MarkEntry> = {};
      let totalMarks = 0;
      let maxPossible = 0;

      filteredSubjects.forEach(subject => {
        const key = `${student._id}-${subject._id}`;
        const rawValue = editingMarks[student._id]?.[subject._id] || '';
        const parsed = parseFloat(rawValue);
        const maxM = subject.totalMarks || 100;

        marks[subject._id] = {
          studentId: student._id,
          subjectId: subject._id,
          examCycleId: selectedCycle,
          className: student.className || selectedClass,
          section: student.section || selectedSection,
          theoryMarks: isNaN(parsed) ? undefined : parsed,
          maxMarks: maxM,
          passingMarks: subject.passingMarks || 35,
        };

        if (!isNaN(parsed)) {
          totalMarks += parsed;
        }
        maxPossible += maxM;
      });

      const percentage = maxPossible > 0 ? (totalMarks / maxPossible) * 100 : 0;

      return { student, marks, totalMarks, maxPossible, percentage };
    });
  }, [students, filteredSubjects, editingMarks, selectedCycle, selectedClass, selectedSection]);

  /* ─── Actions ─── */
  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    // Validate: only allow numbers
    if (value !== '' && isNaN(parseFloat(value))) return;
    const subject = subjects.find(s => s._id === subjectId);
    const maxM = subject?.totalMarks || 100;
    if (value !== '' && parseFloat(value) > maxM) {
      toast.error(`Marks cannot exceed ${maxM}`);
      return;
    }

    setEditingMarks(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subjectId]: value }
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedCycle || !selectedClass) {
      return toast.error('Please select exam cycle and class');
    }

    setSaving(true);
    try {
      let savedCount = 0;
      for (const row of studentRows) {
        for (const subjectId of Object.keys(row.marks)) {
          const entry = row.marks[subjectId];
          if (entry.theoryMarks !== undefined && entry.theoryMarks !== null) {
            await apiClient.post('/progress-reports/marks/upsert', entry);
            savedCount++;
          }
        }
      }
      toast.success(`Saved ${savedCount} mark entries successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedCycle || !selectedClass) {
      return toast.error('Please select exam cycle and class');
    }
    try {
      await apiClient.post('/progress-reports/marks/verify', {
        examCycleId: selectedCycle,
        className: selectedClass,
        section: selectedSection,
      });
      toast.success('Marks submitted for review successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit for review');
    }
  };

  const handleExportCSV = () => {
    if (studentRows.length === 0) return toast.error('No data to export');
    const headers = ['Student Name', 'Admission No', ...filteredSubjects.map(s => s.subjectName), 'Total', 'Max', '%'];
    const rows = studentRows.map(row => [
      row.student.studentName,
      row.student.admissionNo || '—',
      ...filteredSubjects.map(s => {
        const val = editingMarks[row.student._id]?.[s._id] || '';
        return val === '' ? '—' : val;
      }),
      row.totalMarks,
      row.maxPossible,
      row.percentage.toFixed(1) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-${selectedCycle}-${selectedClass}-${selectedSection}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const getGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600' };
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 35) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
          <p className="text-muted-foreground mt-4">Loading marks entry...</p>
        </CardContent>
      </Card>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marks Entry</h1>
          <p className="text-muted-foreground mt-1">Enter and manage student marks for exam cycles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={studentRows.length === 0}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || !selectedCycle || !selectedClass}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save All Marks'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select exam cycle, class, and section to load students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Exam Cycle *</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                <SelectContent>
                  {examCycles.filter(c => c.isActive).map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.examName} ({c.examCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c._id} value={c.className}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter by Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {filteredSubjects.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.subjectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{students.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{filteredSubjects.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exam Cycle</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {examCycles.find(c => c._id === selectedCycle)?.examName || '—'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class Average</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentRows.length > 0
                  ? (studentRows.reduce((s, r) => s + r.percentage, 0) / studentRows.length).toFixed(1) + '%'
                  : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marks Table */}
      {!selectedCycle || !selectedClass ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Exam Cycle and Class</h3>
            <p className="text-muted-foreground">Choose an exam cycle and class to start entering marks.</p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-muted-foreground">No students are enrolled in {selectedClass}{selectedSection ? ` - ${selectedSection}` : ''}.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Marks</CardTitle>
            <CardDescription>{students.length} students × {filteredSubjects.length} subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10 min-w-48">#</TableHead>
                    {filteredSubjects.map(subject => (
                      <TableHead key={subject._id} className="text-center min-w-24">
                        <div className="text-xs">{subject.subjectName}</div>
                        <div className="text-xs text-muted-foreground">(Max: {subject.totalMarks || 100})</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRows.map((row, idx) => {
                    const gradeInfo = getGrade(row.percentage);
                    return (
                      <TableRow key={row.student._id}>
                        <TableCell className="sticky left-0 bg-white z-10 font-medium">
                          <div>{row.student.studentName}</div>
                          <div className="text-xs text-muted-foreground">{row.student.admissionNo || ''}</div>
                        </TableCell>
                        {filteredSubjects.map(subject => {
                          const value = editingMarks[row.student._id]?.[subject._id] || '';
                          const maxM = subject.totalMarks || 100;
                          const passM = subject.passingMarks || 35;
                          const numVal = parseFloat(value);
                          const isBelowPass = value !== '' && !isNaN(numVal) && numVal < passM;

                          return (
                            <TableCell key={subject._id} className="text-center p-1">
                              <Input
                                type="number"
                                min={0}
                                max={maxM}
                                value={value}
                                onChange={e => handleMarkChange(row.student._id, subject._id, e.target.value)}
                                className={`w-20 text-center text-sm ${isBelowPass ? 'border-red-500 bg-red-50' : ''}`}
                                placeholder="—"
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold">{row.totalMarks || '—'}</TableCell>
                        <TableCell className="text-center">
                          {row.maxPossible > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Progress value={row.percentage} className="w-12 h-2" />
                              <span className="text-xs font-medium">{row.percentage.toFixed(1)}%</span>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className={`text-center font-bold ${gradeInfo.color}`}>
                          {row.maxPossible > 0 ? gradeInfo.grade : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                // Reset all marks
                const reset: Record<string, Record<string, string>> = {};
                students.forEach(s => {
                  reset[s._id] = {};
                  filteredSubjects.forEach(sub => { reset[s._id][sub._id] = ''; });
                });
                setEditingMarks(reset);
                toast.info('All marks cleared');
              }}>Clear All</Button>
              <Button onClick={handleSubmitForReview}>
                <CheckCircle className="h-4 w-4 mr-2" />Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
