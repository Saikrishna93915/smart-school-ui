import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import {
  RefreshCw,
  Search,
  Download,
  Printer,
  User,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface StudentDoc {
  _id: string;
  studentName: string;
  admissionNo?: string;
  class?: { className: string; section?: string; academicYear?: string };
  className?: string;
  section?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
}

interface ReportSubject {
  subjectName: string;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks: number;
  maxMarks: number;
  passingMarks: number;
  grade?: string;
  gradePoint?: number;
  isPass?: boolean;
}

interface ReportCard {
  examCycleName: string;
  examType: string;
  subjects: ReportSubject[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  rank?: number;
  totalStudents?: number;
  result: 'Pass' | 'Fail' | 'Distinction';
}

interface ReportData {
  student: StudentDoc;
  reports: ReportCard[];
  classTeacherRemark?: string;
  attendance?: { totalWorkingDays: number; daysPresent: number; attendancePercentage: number };
  coCurricular?: Record<string, string>;
  personality?: Record<string, string>;
  generatedAt: string;
}

export default function StudentReportCardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [examCycles, setExamCycles] = useState<any[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // For parents: skip admin endpoints, use parent-specific endpoints
      if (user?.role === 'parent') {
        // Fetch parent's children to populate student list
        const dashboardRes = await apiClient.get('/parent/dashboard');
        const children = dashboardRes.data?.data?.children || [];

        // Transform children data to StudentDoc format
        const studentList: StudentDoc[] = children.map((c: any) => ({
          _id: String(c.id),
          studentName: c.name,
          admissionNo: c.admissionNumber,
          class: { className: c.className, section: c.section },
          className: c.className,
          section: c.section,
        }));

        setStudents(studentList);

        // If only one child, auto-select and fetch their report
        if (studentList.length === 1) {
          setSelectedStudent(studentList[0]._id);
          await fetchReportCard(studentList[0]._id);
        }

        setLoading(false);
        return;
      }

      // For admin/student: use original endpoints
      const [studentsRes, cyclesRes] = await Promise.all([
        apiClient.get('/admin/students'),
        apiClient.get('/progress-reports/exam-cycles', { params: { isPublished: true } }),
      ]);
      setStudents(ensureArray<StudentDoc>(studentsRes.data?.data || studentsRes.data));
      setExamCycles(ensureArray(cyclesRes.data?.data || cyclesRes.data));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchReportCard = useCallback(async (studentId: string) => {
    if (!studentId) { setReportData(null); return; }
    try {
      setSearching(true);
      const params: Record<string, string> = {};
      if (selectedCycle && selectedCycle !== 'all') params.examCycleId = selectedCycle;

      const res = await apiClient.get(`/progress-reports/students/${studentId}/report`, { params });
      const raw = res.data?.data || res.data || null;

      if (raw) {
        // Normalize student data — backend returns nested student.firstName/lastName and admissionNumber
        const rawStudent = raw.student || {};
        const normalizedStudent: StudentDoc = {
          ...rawStudent,
          studentName: rawStudent.studentName
            || `${rawStudent.student?.firstName || ''} ${rawStudent.student?.lastName || ''}`.trim()
            || rawStudent.name
            || '—',
          admissionNo: rawStudent.admissionNo || rawStudent.admissionNumber || '—',
          className: rawStudent.class?.className || rawStudent.className || '—',
          section: rawStudent.class?.section || rawStudent.section || '—',
        };

        // Transform API response to match frontend interface
        const transformed: ReportData = {
          student: normalizedStudent,
          reports: (raw.reports || []).map((r: any) => ({
            examCycleName: r.exam?.examName || 'Unknown Exam',
            examType: r.exam?.examType || '',
            subjects: (r.subjects || []).map((s: any) => ({
              subjectName: s.subjectId?.subjectName || 'Unknown',
              theoryMarks: s.theoryMarks,
              practicalMarks: s.practicalMarks,
              totalMarks: s.totalMarks,
              maxMarks: s.maxMarks,
              passingMarks: s.passingMarks,
              grade: s.grade,
              gradePoint: s.gradePoint,
              isPass: s.passingStatus === 'Pass'
            })),
            totalMarks: r.totals?.obtained || 0,
            maxMarks: r.totals?.max || 0,
            percentage: r.totals?.percentage || 0,
            grade: r.totals?.grade || 'N/A',
            gradePoint: r.totals?.gradePoint || 0,
            rank: r.rank,
            totalStudents: r.totalStudents,
            result: (r.totals?.percentage >= 90) ? 'Distinction' : (r.totals?.percentage >= 35) ? 'Pass' : 'Fail'
          })),
          classTeacherRemark: raw.classTeacherRemarks?.[0]?.classTeacherRemark,
          attendance: raw.classTeacherRemarks?.[0]?.attendance || null,
          coCurricular: raw.classTeacherRemarks?.[0]?.coCurricular,
          personality: raw.classTeacherRemarks?.[0]?.personality,
          generatedAt: raw.generatedAt || new Date().toISOString()
        };
        setReportData(transformed);
      } else {
        setReportData(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch report:', err);
      if (err.response?.status === 404) {
        setReportData(null);
      } else {
        toast.error(err.response?.data?.message || 'Failed to load report card');
      }
    } finally {
      setSearching(false);
    }
  }, [selectedCycle]);

  useEffect(() => {
    if (selectedStudent) fetchReportCard(selectedStudent);
  }, [selectedStudent, selectedCycle, fetchReportCard]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s =>
      s.studentName?.toLowerCase().includes(term) ||
      s.admissionNo?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon');
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading report cards...</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Report Cards</h1>
          <p className="text-muted-foreground mt-1">Generate and view student report cards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          {reportData && (
            <>
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
              <Button onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search Student</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Type to search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label>Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredStudents.slice(0, 100).map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.studentName}{s.admissionNo ? ` (${s.admissionNo})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exam Cycle (Optional)</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger><SelectValue placeholder="All cycles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {examCycles.map(c => <SelectItem key={c._id} value={c._id}>{c.examName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Card */}
      {searching ? (
        <Card><CardContent className="p-12 text-center">
          <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
          <p className="text-muted-foreground mt-4">Generating report card...</p>
        </CardContent></Card>
      ) : !selectedStudent ? (
        <Card><CardContent className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
          <p className="text-muted-foreground">Search and select a student to view their report card.</p>
        </CardContent></Card>
      ) : !reportData ? (
        <Card><CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Report Available</h3>
          <p className="text-muted-foreground">No published exam results found for this student.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-semibold">{reportData.student?.studentName || `${reportData.student?.student?.firstName || ''} ${reportData.student?.student?.lastName || ''}`.trim() || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Admission No</p><p className="font-semibold">{reportData.student?.admissionNo || reportData.student?.admissionNumber || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Class</p><p className="font-semibold">{reportData.student?.class?.className || reportData.student?.className || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Section</p><p className="font-semibold">{reportData.student?.class?.section || reportData.student?.section || '—'}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Report Cards per Exam Cycle */}
          {reportData.reports.map((report, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {report.examCycleName} — {report.examType}
                </CardTitle>
                {report.rank && (
                  <CardDescription>Rank: {report.rank}/{report.totalStudents}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Theory</TableHead>
                      <TableHead className="text-center">Practical</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.subjects.map((sub, sIdx) => (
                      <TableRow key={sIdx}>
                        <TableCell className="font-medium">{sub.subjectName}</TableCell>
                        <TableCell className="text-center">{sub.theoryMarks ?? '—'}</TableCell>
                        <TableCell className="text-center">{sub.practicalMarks ?? '—'}</TableCell>
                        <TableCell className="text-center font-semibold">{sub.totalMarks}</TableCell>
                        <TableCell className="text-center">{sub.maxMarks}</TableCell>
                        <TableCell className={`text-center font-bold ${sub.grade?.startsWith('A') ? 'text-green-600' : sub.grade?.startsWith('F') ? 'text-red-600' : ''}`}>
                          {sub.grade || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.isPass ? (
                            <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Pass</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">Fail</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center" colSpan={2}></TableCell>
                      <TableCell className="text-center">{report.totalMarks}</TableCell>
                      <TableCell className="text-center">{report.maxMarks}</TableCell>
                      <TableCell className="text-center">{report.grade}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={report.result === 'Fail' ? 'bg-red-100 text-red-800' : report.result === 'Distinction' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {report.result}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className="text-2xl font-bold">{report.percentage?.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Grade Point</p>
                    <p className="text-2xl font-bold">{report.gradePoint}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Overall Grade</p>
                    <p className="text-2xl font-bold text-primary">{report.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Attendance */}
          {reportData.attendance && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Attendance</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Working Days</p>
                    <p className="text-2xl font-bold">{reportData.attendance.totalWorkingDays}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Days Present</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.attendance.daysPresent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Attendance %</p>
                    <p className="text-2xl font-bold">{reportData.attendance.attendancePercentage?.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Teacher Remark */}
          {reportData.classTeacherRemark && (
            <Card>
              <CardHeader><CardTitle>Class Teacher's Remark</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground italic">"{reportData.classTeacherRemark}"</p></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
