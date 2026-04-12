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
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronLeft,
  Target,
  Users,
  Award
} from 'lucide-react';

interface SubjectComparison {
  subjectName: string;
  childPercentage: string;
  classAverage: string;
  topScore: string;
}

interface OverallComparison {
  childPercentage: string;
  classAverage: string;
}

export default function Comparison() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<{ name: string; className: string; section: string } | null>(null);
  const [overall, setOverall] = useState<OverallComparison>({ childPercentage: '0', classAverage: '0' });
  const [subjects, setSubjects] = useState<SubjectComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/parent/child/${childId}/comparison`);
      const data = res.data?.data;
      if (data) {
        setChild(data.child);
        setOverall(data.overall || { childPercentage: '0', classAverage: '0' });
        setSubjects(data.subjects || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch comparison:', err);
      toast.error(err.response?.data?.message || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading comparison data...</p>
      </CardContent></Card>
    );
  }

  if (!child || subjects.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Comparison Data Available</h3>
        <p className="text-muted-foreground mb-4">Performance comparison data will appear here once marks are entered for the class.</p>
        <Button variant="outline" onClick={() => navigate('/parent/dashboard')}><ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
      </CardContent></Card>
    );
  }

  const childPct = parseFloat(overall.childPercentage);
  const classPct = parseFloat(overall.classAverage);
  const diff = childPct - classPct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/parent/dashboard')} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Performance Comparison</h1>
          <p className="text-muted-foreground">{child.name} • Class {child.className} - Section {child.section}</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Overall Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Your Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{childPct}%</div>
            <Progress value={childPct} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Class Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{classPct}%</div>
            <Progress value={classPct} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {diff >= 0 ? 'Above' : 'Below'} class average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Comparison</CardTitle>
          <CardDescription>Comparing your child's performance with class average and top score</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Your Child</TableHead>
                <TableHead className="text-center">Class Average</TableHead>
                <TableHead className="text-center">Top Score</TableHead>
                <TableHead className="text-center">Gap from Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((sub, idx) => {
                const childPct = parseFloat(sub.childPercentage);
                const avgPct = parseFloat(sub.classAverage);
                const gap = childPct - avgPct;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{sub.subjectName}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={childPct} className="w-16 h-2" />
                        <span className="text-sm font-semibold">{childPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={avgPct} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground">{avgPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-green-600">{sub.topScore}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-semibold ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gap >= 0 ? '+' : ''}{gap.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visual Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((sub, idx) => {
              const childPct = parseFloat(sub.childPercentage);
              const avgPct = parseFloat(sub.classAverage);
              const topPct = parseFloat(sub.topScore);
              const maxVal = Math.max(childPct, avgPct, topPct, 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sub.subjectName}</span>
                    <span className="text-muted-foreground text-xs">
                      Child: {childPct}% | Avg: {avgPct}% | Top: {topPct}%
                    </span>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="bg-primary rounded-l" style={{ width: `${(childPct / maxVal) * 100}%` }} />
                    <div className="bg-blue-400" style={{ width: `${(avgPct / maxVal) * 100}%` }} />
                    <div className="bg-green-400 rounded-r" style={{ width: `${(topPct / maxVal) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary rounded" />Your Child</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded" />Class Average</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded" />Top Score</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
