import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  BookOpen,
  BarChart,
  Target,
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
}

interface ClassDoc {
  _id: string;
  className: string;
  sections?: string[];
}

interface ClassSummaryStudent {
  studentId: { _id: string; studentName: string };
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
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
  students: ClassSummaryStudent[];
}

export default function ProgressAnalyticsPage() {
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [summaries, setSummaries] = useState<ClassSummaryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesRes, classesRes] = await Promise.all([
        apiClient.get('/progress-reports/exam-cycles', { params: { isPublished: true } }),
        apiClient.get('/timetable/classes'),
      ]);
      setExamCycles(ensureArray<ExamCycle>(cyclesRes.data?.data || cyclesRes.data));
      setClasses(ensureArray<ClassDoc>(classesRes.data?.data || classesRes.data));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchSummary = useCallback(async () => {
    if (!selectedCycle || !selectedClass) {
      setSummaries([]);
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
        const transformed = {
          ...raw,
          students: (raw.students || []).map((s: any) => ({
            ...s,
            studentId: s.student,        // map student -> studentId
            totalMarks: s.obtained,      // map obtained -> totalMarks
            maxMarks: s.max,             // map max -> maxMarks
          }))
        };
        setSummaries([transformed]);
      } else {
        setSummaries([]);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setSummaries([]);
    }
  }, [selectedCycle, selectedClass, selectedSection]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const sections = useMemo(() => {
    const cls = classes.find(c => c._id === selectedClass || c.className === selectedClass);
    return cls?.sections || ['A', 'B', 'C', 'D'];
  }, [classes, selectedClass]);

  // Computed analytics
  const overallStats = useMemo(() => {
    if (summaries.length === 0) return null;
    const allStudents = summaries.flatMap(s => s.students);
    if (allStudents.length === 0) return null;

    const totalStudents = allStudents.length;
    const avgPercentage = allStudents.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalStudents;
    const highest = Math.max(...allStudents.map(s => s.percentage || 0));
    const lowest = Math.min(...allStudents.map(s => s.percentage || 0));
    const passCount = allStudents.filter(s => s.percentage >= 35).length;
    const passRate = (passCount / totalStudents) * 100;

    // Grade distribution
    const gradeDist: Record<string, number> = {};
    allStudents.forEach(s => {
      const g = s.grade || 'N/A';
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    });

    // Top performers
    const topPerformers = [...allStudents].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 10);

    // Bottom performers
    const bottomPerformers = [...allStudents].sort((a, b) => (a.percentage || 0) - (b.percentage || 0)).slice(0, 5);

    return { totalStudents, avgPercentage, highest, lowest, passRate, gradeDist, topPerformers, bottomPerformers };
  }, [summaries]);

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading analytics...</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Progress Analytics</h1>
          <p className="text-muted-foreground mt-1">Analyze student performance and class-wise trends.</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
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
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className="w-full text-center py-2">
                {summaries.length > 0 ? `${summaries[0].totalStudents} students loaded` : 'Select filters to load data'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedCycle || !selectedClass ? (
        <Card><CardContent className="p-12 text-center">
          <BarChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select Exam Cycle and Class</h3>
          <p className="text-muted-foreground">Choose filters to view analytics.</p>
        </CardContent></Card>
      ) : !overallStats ? (
        <Card><CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">No marks data found for the selected filters.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Students</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />{overallStats.totalStudents}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Class Average</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">{overallStats.avgPercentage.toFixed(1)}%</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pass Rate</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{overallStats.passRate.toFixed(1)}%</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Range</CardTitle></CardHeader>
              <CardContent><div className="text-lg font-bold"><span className="text-green-600">{overallStats.highest.toFixed(0)}%</span> — <span className="text-red-600">{overallStats.lowest.toFixed(0)}%</span></div></CardContent></Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Grade Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(overallStats.gradeDist).sort((a, b) => a[0].localeCompare(b[0])).map(([grade, count]) => {
                  const pct = (count / overallStats.totalStudents) * 100;
                  const color = grade.startsWith('A') ? 'bg-green-500' : grade.startsWith('B') ? 'bg-blue-500' : grade.startsWith('C') ? 'bg-yellow-500' : grade === 'D' ? 'bg-orange-500' : 'bg-red-500';
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className="font-bold w-8 text-center">{grade}</span>
                      <Progress value={pct} className="flex-1 h-3" />
                      <span className="text-sm text-muted-foreground w-24">{count} students ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top & Bottom Performers */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><TrendingUp className="h-5 w-5" />Top Performers</CardTitle></CardHeader>
              <CardContent>
                {overallStats.topPerformers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-2">
                    {overallStats.topPerformers.map((s, i) => (
                      <div key={s.studentId?._id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-7 h-7 flex items-center justify-center text-xs">#{i + 1}</Badge>
                          <span className="font-medium">{s.studentId?.studentName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{s.percentage?.toFixed(1)}%</span>
                          <Badge className="text-xs">{s.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><TrendingDown className="h-5 w-5" />Needs Attention</CardTitle></CardHeader>
              <CardContent>
                {overallStats.bottomPerformers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-2">
                    {overallStats.bottomPerformers.map((s, i) => (
                      <div key={s.studentId?._id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-7 h-7 flex items-center justify-center text-xs">#{i + 1}</Badge>
                          <span className="font-medium">{s.studentId?.studentName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{s.percentage?.toFixed(1)}%</span>
                          <Badge variant="outline" className="text-red-600 text-xs">{s.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Student Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Student Rankings</CardTitle>
              <CardDescription>{summaries[0]?.className}{summaries[0]?.section ? ` - Section ${summaries[0].section}` : ''} — {summaries[0]?.examCycle?.examName}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries[0]?.students?.map((student) => (
                    <TableRow key={student.studentId?._id}>
                      <TableCell className="font-bold">#{student.rank}</TableCell>
                      <TableCell>{student.studentId?.studentName || 'Unknown'}</TableCell>
                      <TableCell className="text-center">{student.totalMarks}/{student.maxMarks}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={student.percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium">{student.percentage?.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center font-bold ${student.grade?.startsWith('A') ? 'text-green-600' : student.grade?.startsWith('F') ? 'text-red-600' : ''}`}>
                        {student.grade || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
