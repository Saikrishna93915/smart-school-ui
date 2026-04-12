import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Award,
  TrendingUp,
  Search,
} from 'lucide-react';
import apiClient from '@/Services/apiClient';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ExamCycle {
  _id: string;
  examName: string;
  examCode: string;
  examType: string;
  academicYear: string;
  isPublished: boolean;
  isActive: boolean;
}

interface ClassDoc {
  _id: string;
  className: string;
  sections?: string[];
}

interface StudentSummary {
  studentId: { _id: string; studentName: string; admissionNo?: string };
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  isAbsent?: boolean;
  isVerified?: boolean;
  subjectMarks?: { subjectId: { subjectName: string }; marks: number; maxMarks: number }[];
}

interface ClassSummaryData {
  examCycle: ExamCycle;
  className: string;
  section: string;
  totalStudents: number;
  classAverage: number;
  highestMarks: number;
  lowestMarks: number;
  passPercentage: number;
  students: StudentSummary[];
}

export default function ClassProgressPage() {
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [summary, setSummary] = useState<ClassSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesRes, classesRes] = await Promise.all([
        apiClient.get('/progress-reports/exam-cycles', { params: { isActive: true } }),
        apiClient.get('/timetable/classes'),
      ]);
      setExamCycles(ensureArray<ExamCycle>(cyclesRes.data?.data || cyclesRes.data));
      setClasses(ensureArray<ClassDoc>(classesRes.data?.data || classesRes.data));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchSummary = useCallback(async () => {
    if (!selectedCycle || !selectedClass) {
      setSummary(null);
      return;
    }
    try {
      const params: Record<string, string> = {
        examCycleId: selectedCycle,
        className: selectedClass
      };
      if (selectedSection && selectedSection !== 'all') params.section = selectedSection;

      const res = await apiClient.get('/progress-reports/class-summary', { params });
      const raw = res.data?.data || res.data;

      if (raw) {
        // Transform API response to match frontend interface
        const transformed: ClassSummaryData = {
          ...raw,
          students: (raw.students || []).map((s: any) => ({
            ...s,
            studentId: s.student,
            totalMarks: s.obtained,
            maxMarks: s.max,
          }))
        };
        setSummary(transformed);
      } else {
        setSummary(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
      if (err.response?.status === 404) {
        setSummary(null);
      }
    }
  }, [selectedCycle, selectedClass, selectedSection]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const sections = useMemo(() => {
    const cls = classes.find(c => c._id === selectedClass || c.className === selectedClass);
    return cls?.sections || ['A', 'B', 'C', 'D'];
  }, [classes, selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!summary?.students) return [];
    if (!searchTerm) return summary.students;
    const term = searchTerm.toLowerCase();
    return summary.students.filter(s =>
      s.studentId?.studentName?.toLowerCase().includes(term) ||
      s.studentId?.admissionNo?.toLowerCase().includes(term)
    );
  }, [summary, searchTerm]);

  const handleVerifyAll = async () => {
    if (!selectedCycle || !selectedClass) return;
    try {
      await apiClient.post('/progress-reports/marks/verify', {
        examCycleId: selectedCycle,
        className: selectedClass,
        section: selectedSection,
      });
      toast.success('All marks verified successfully');
      setIsVerifyDialogOpen(false);
      await fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify marks');
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600';
    if (grade?.startsWith('B')) return 'text-blue-600';
    if (grade?.startsWith('C')) return 'text-yellow-600';
    if (grade === 'D') return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading class progress...</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Progress</h1>
          <p className="text-muted-foreground mt-1">View and verify student marks for each class.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          {summary && summary.students.length > 0 && (
            <Button onClick={() => setIsVerifyDialogOpen(true)}><CheckCircle className="h-4 w-4 mr-2" />Verify All Marks</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Exam Cycle</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                <SelectContent>
                  {examCycles.map(c => <SelectItem key={c._id} value={c._id}>{c.examName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c._id} value={c.className}>{c.className}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Students</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary.totalStudents}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Class Average</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{summary.classAverage?.toFixed(1) || '—'}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Highest</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{summary.highestMarks?.toFixed(1) || '—'}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lowest</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{summary.lowestMarks?.toFixed(1) || '—'}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pass Rate</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary.passPercentage?.toFixed(1) || '—'}%</div></CardContent></Card>
        </div>
      )}

      {/* Student Table */}
      {!selectedCycle || !selectedClass ? (
        <Card><CardContent className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select Cycle and Class</h3>
          <p className="text-muted-foreground">Choose an exam cycle and class to view progress.</p>
        </CardContent></Card>
      ) : !summary || summary.students.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Marks Data</h3>
          <p className="text-muted-foreground">Marks haven't been entered for this class yet.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{summary.className}{summary.section ? ` - Section ${summary.section}` : ''}</CardTitle>
            <CardDescription>{summary.examCycle?.examName} — {filteredStudents.length} students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Total Marks</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.studentId?._id}>
                    <TableCell className="font-bold">#{student.rank || '—'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{student.studentId?.studentName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{student.studentId?.admissionNo || ''}</div>
                    </TableCell>
                    <TableCell className="text-center">{student.totalMarks}/{student.maxMarks}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={student.percentage} className="w-16 h-2" />
                        <span className="text-sm font-medium">{student.percentage?.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-center font-bold ${getGradeColor(student.grade)}`}>{student.grade || '—'}</TableCell>
                    <TableCell className="text-center">
                      {student.isAbsent ? (
                        <Badge variant="outline" className="text-gray-500">Absent</Badge>
                      ) : student.isVerified ? (
                        <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Verify All Marks</DialogTitle>
            <DialogDescription>This will mark all student marks as verified for {summary?.examCycle?.examName} — {summary?.className}{summary?.section ? ` - ${summary.section}` : ''}. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVerifyAll} className="bg-green-600">Verify All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
