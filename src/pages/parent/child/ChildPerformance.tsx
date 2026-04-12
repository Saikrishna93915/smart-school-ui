import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Award,
  ChevronLeft,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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

export default function ChildPerformance() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<{ name: string; className: string; section: string } | null>(null);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/parent/child/${childId}/performance`);
      const data = res.data?.data;
      if (data) {
        setChild(data.child);
        setExams(data.exams || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch performance:', err);
      toast.error(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pass': return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'Fail': return <Badge variant="outline" className="text-red-600">Fail</Badge>;
      case 'Absent': return <Badge variant="outline">Absent</Badge>;
      default: return <Badge variant="outline">—</Badge>;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading performance data...</p>
      </CardContent></Card>
    );
  }

  if (!child || exams.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Exam Data Available</h3>
        <p className="text-muted-foreground mb-4">No exam results have been published yet.</p>
        <Button variant="outline" onClick={() => navigate('/parent/dashboard')}><ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
      </CardContent></Card>
    );
  }

  const overallPercentage = exams.length > 0
    ? (exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/parent/dashboard')} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Academic Performance</h1>
          <p className="text-muted-foreground">{child.name} • Class {child.className} - Section {child.section}</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overall Average</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallPercentage}%</div>
            <Progress value={parseFloat(overallPercentage)} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Exams Taken</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{exams.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Trend</CardTitle></CardHeader>
          <CardContent>
            {exams.length >= 2 ? (
              <div className="flex items-center gap-2">
                {exams[exams.length - 1].percentage >= exams[exams.length - 2].percentage ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <span className="text-lg font-semibold">
                  {exams[exams.length - 1].percentage >= exams[exams.length - 2].percentage ? 'Improving' : 'Declining'}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Need more data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam-wise Results */}
      <Tabs defaultValue={exams[0]?.examId}>
        <TabsList className="w-full overflow-x-auto">
          {exams.map(exam => (
            <TabsTrigger key={exam.examId} value={exam.examId}>{exam.examName}</TabsTrigger>
          ))}
        </TabsList>

        {exams.map(exam => (
          <TabsContent key={exam.examId} value={exam.examId} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{exam.examName} — {exam.examType}</CardTitle>
                <CardDescription>
                  Total: {exam.totalObtained}/{exam.totalMax} ({exam.percentage}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.subjects.map((sub, idx) => {
                      const pct = sub.maxMarks > 0 ? ((sub.marks / sub.maxMarks) * 100).toFixed(1) : 0;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {sub.subjectName}
                          </TableCell>
                          <TableCell className="text-center font-semibold">{sub.marks}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{sub.maxMarks}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={parseFloat(pct)} className="w-16 h-2" />
                              <span className="text-sm">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-center font-bold ${getGradeColor(sub.grade)}`}>{sub.grade || '—'}</TableCell>
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
