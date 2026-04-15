import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Award,
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Star,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

// ========================
// TYPES
// ========================
interface SubjectMark {
  subjectName: string;
  subjectCode: string;
  marks: number;
  maxMarks: number;
  passingMarks: number;
  grade: string;
  passingStatus: string;
}

interface ExamResult {
  examId: string;
  examName: string;
  examType: string;
  percentage: number;
  totalObtained: number;
  totalMax: number;
  subjects: SubjectMark[];
}

interface ChildInfo {
  name: string;
  className: string;
  section: string;
}

// ========================
// HELPERS
// ========================
const getGradeColor = (grade: string) => {
  if (grade?.startsWith('A') || grade === 'A+') return 'text-emerald-600';
  if (grade?.startsWith('B')) return 'text-blue-600';
  if (grade?.startsWith('C')) return 'text-amber-600';
  return 'text-rose-600';
};

const getGradeBadgeColor = (grade: string) => {
  if (grade?.startsWith('A') || grade === 'A+') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (grade?.startsWith('B')) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (grade?.startsWith('C')) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

const getGradeDotColor = (grade: string) => {
  if (grade?.startsWith('A') || grade === 'A+') return '#10b981';
  if (grade?.startsWith('B')) return '#3b82f6';
  if (grade?.startsWith('C')) return '#f59e0b';
  return '#ef4444';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Pass':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Pass</Badge>;
    case 'Fail':
      return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>;
    case 'Absent':
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Absent</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
  if (current < previous) return <ArrowDownRight className="h-4 w-4 text-rose-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getExamTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'unit test': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'mid term': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'term exam': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'final': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

// ========================
// MAIN COMPONENT
// ========================
export default function ChildPerformance() {
  const navigate = useNavigate();
  const { childId: paramChildId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<string>('');

  // Resolve childId: use URL param, or fallback to first child from dashboard
  const resolveChildId = async (): Promise<string | null> => {
    if (paramChildId) return paramChildId;
    try {
      const res = await apiClient.get('/parent/dashboard');
      const children = res.data?.data?.children;
      if (children?.length > 0) return String(children[0].id);
    } catch (e) {
      console.error('Failed to resolve child ID from dashboard:', e);
    }
    return null;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resolvedChildId = await resolveChildId();
      if (!resolvedChildId) {
        toast.error('No children linked to your account');
        setLoading(false);
        return;
      }
      const res = await apiClient.get(`/parent/child/${resolvedChildId}/performance`);
      const data = res.data?.data;
      if (data) {
        setChild(data.child);
        setExams(data.exams || []);
        if (data.exams?.length > 0 && !activeExam) {
          setActiveExam(data.exams[0].examId);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch performance:', err);
      toast.error(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [paramChildId, activeExam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overallStats = useMemo(() => {
    if (exams.length === 0) return { avg: 0, highest: 0, lowest: 100, trend: 'stable' as const };
    const avg = exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length;
    const highest = Math.max(...exams.map(e => e.percentage));
    const lowest = Math.min(...exams.map(e => e.percentage));
    const trend = exams.length >= 2
      ? exams[exams.length - 1].percentage > exams[exams.length - 2].percentage ? 'up' : exams[exams.length - 1].percentage < exams[exams.length - 2].percentage ? 'down' : 'stable'
      : 'stable';
    return { avg: avg.toFixed(1), highest, lowest, trend };
  }, [exams]);

  const radarData = useMemo(() => {
    const active = exams.find(e => e.examId === activeExam);
    if (!active) return [];
    return active.subjects.map(s => ({
      subject: s.subjectName.length > 12 ? s.subjectName.substring(0, 12) + '…' : s.subjectName,
      score: s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0,
      fullMark: 100
    }));
  }, [exams, activeExam]);

  const barData = useMemo(() => {
    const active = exams.find(e => e.examId === activeExam);
    if (!active) return [];
    return active.subjects.map(s => ({
      subject: s.subjectName.length > 10 ? s.subjectName.substring(0, 10) + '…' : s.subjectName,
      marks: s.marks,
      maxMarks: s.maxMarks,
      percentage: s.maxMarks > 0 ? ((s.marks / s.maxMarks) * 100).toFixed(0) : 0
    }));
  }, [exams, activeExam]);

  const trendData = useMemo(() => {
    return exams.map(e => ({
      exam: e.examName.length > 12 ? e.examName.substring(0, 12) + '…' : e.examName,
      percentage: e.percentage,
      type: e.examType
    }));
  }, [exams]);

  // ========================
  // LOADING STATE
  // ========================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-28 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-8 w-56 bg-muted rounded mb-1 animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="h-4 w-20 bg-muted rounded mb-2" /><div className="h-8 w-24 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-12"><div className="h-64 bg-muted rounded animate-pulse" /></CardContent></Card>
      </div>
    );
  }

  // ========================
  // EMPTY STATE
  // ========================
  if (!child || exams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Award className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Exam Data Available</h3>
            <p className="text-muted-foreground mb-6">No exam results have been published yet. Results will appear here once your child's teachers enter the marks.</p>
            <Button variant="outline" onClick={() => navigate('/parent/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeExamData = exams.find(e => e.examId === activeExam);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ========================
          HEADER
      ======================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/parent/dashboard')} className="rounded-full">
            <ChevronLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Academic Performance</h1>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{child.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                {child.name} • Class {child.className} — Section {child.section}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ========================
          STAT CARDS
      ======================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{overallStats.avg}%</span>
              <Target className="h-5 w-5 text-primary/50" />
            </div>
            <Progress value={parseFloat(overallStats.avg)} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Highest Score</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-600">{overallStats.highest}%</span>
              <Trophy className="h-5 w-5 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Lowest Score</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-rose-600">{overallStats.lowest}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {overallStats.trend === 'up' && <span className="text-3xl font-bold text-emerald-600 flex items-center gap-1"><ArrowUpRight className="h-6 w-6" />Improving</span>}
              {overallStats.trend === 'down' && <span className="text-3xl font-bold text-rose-600 flex items-center gap-1"><ArrowDownRight className="h-6 w-6" />Declining</span>}
              {overallStats.trend === 'stable' && <span className="text-3xl font-bold text-muted-foreground flex items-center gap-1"><Minus className="h-6 w-6" />Stable</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================
          PERFORMANCE TREND CHART
      ======================== */}
      {trendData.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Trend
            </CardTitle>
            <CardDescription>Exam-wise percentage progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="exam" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ========================
          EXAM TABS
      ======================== */}
      <Tabs value={activeExam} onValueChange={setActiveExam}>
        <TabsList className="bg-muted/50 p-1 rounded-xl overflow-x-auto">
          {exams.map(exam => (
            <TabsTrigger
              key={exam.examId}
              value={exam.examId}
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              {exam.examName}
            </TabsTrigger>
          ))}
        </TabsList>

        {exams.map(exam => (
          <TabsContent key={exam.examId} value={exam.examId} className="space-y-4 mt-4">
            {/* Exam Header */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{exam.examName}</h3>
                      <Badge variant="outline" className={`capitalize ${getExamTypeColor(exam.examType)}`}>{exam.examType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: <strong>{exam.totalObtained}/{exam.totalMax}</strong> ({exam.percentage}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold">{exam.percentage}%</div>
                    <Badge className={`mt-1 ${getGradeBadgeColor(exam.subjects[0]?.grade || '')}`}>
                      Grade: {exam.subjects[0]?.grade || '—'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Radar + Bar Chart */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Radar Chart */}
              {radarData.length >= 3 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Subject Radar</CardTitle>
                    <CardDescription>Performance distribution across subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey="subject" className="text-xs" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                        <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bar Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Subject-wise Marks</CardTitle>
                  <CardDescription>Marks obtained vs maximum</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="subject" className="text-xs" />
                      <YAxis className="text-xs" />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Obtained" />
                      <Bar dataKey="maxMarks" fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Maximum" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subject Marks Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Detailed Results</CardTitle>
                <CardDescription>Subject-wise marks, grades, and passing status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Maximum</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Passing</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.subjects.map((sub, idx) => {
                      const pct = sub.maxMarks > 0 ? ((sub.marks / sub.maxMarks) * 100).toFixed(1) : '0';
                      return (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getGradeDotColor(sub.grade) }} />
                              {sub.subjectName}
                              {sub.subjectCode && <span className="text-xs text-muted-foreground/60">({sub.subjectCode})</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-lg">{sub.marks}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{sub.maxMarks}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={parseFloat(pct)} className="w-16 h-2" />
                              <span className="text-sm font-medium w-10 text-right">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`font-bold ${getGradeBadgeColor(sub.grade)}`}>
                              {sub.grade || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">{sub.passingMarks}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(sub.passingStatus)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
