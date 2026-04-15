import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronLeft,
  Target,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trophy
} from 'lucide-react';

// ========================
// TYPES
// ========================
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

interface ChildInfo {
  name: string;
  className: string;
  section: string;
}

// ========================
// HELPERS
// ========================
const getDiffBadge = (gap: number) => {
  if (gap > 0) return { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <ArrowUpRight className="h-3 w-3" />, label: `+${gap.toFixed(1)}%` };
  if (gap < 0) return { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <ArrowDownRight className="h-3 w-3" />, label: `${gap.toFixed(1)}%` };
  return { color: 'text-muted-foreground bg-muted/50 border-border', icon: <Minus className="h-3 w-3" />, label: '0.0%' };
};

const getBarColor = (type: string) => {
  switch (type) {
    case 'child': return 'hsl(var(--primary))';
    case 'average': return '#60a5fa';
    case 'top': return '#34d399';
    default: return '#94a3b8';
  }
};

// ========================
// MAIN COMPONENT
// ========================
export default function Comparison() {
  const navigate = useNavigate();
  const { childId: paramChildId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [overall, setOverall] = useState<OverallComparison>({ childPercentage: '0', classAverage: '0' });
  const [subjects, setSubjects] = useState<SubjectComparison[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await apiClient.get(`/parent/child/${resolvedChildId}/comparison`);
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
  }, [paramChildId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const childPct = parseFloat(overall.childPercentage);
  const classPct = parseFloat(overall.classAverage);
  const diff = childPct - classPct;
  const topScore = Math.max(...subjects.map(s => parseFloat(s.topScore)), 0);

  const radarData = useMemo(() => {
    return subjects.map(s => ({
      subject: s.subjectName.length > 12 ? s.subjectName.substring(0, 12) + '…' : s.subjectName,
      child: parseFloat(s.childPercentage),
      average: parseFloat(s.classAverage),
      top: parseFloat(s.topScore)
    }));
  }, [subjects]);

  const barData = useMemo(() => {
    return subjects.map(s => ({
      subject: s.subjectName.length > 10 ? s.subjectName.substring(0, 10) + '…' : s.subjectName,
      child: parseFloat(s.childPercentage),
      average: parseFloat(s.classAverage),
      top: parseFloat(s.topScore)
    }));
  }, [subjects]);

  // ========================
  // LOADING STATE
  // ========================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-28 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-8 w-56 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
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
  if (!child || subjects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Comparison Data</h3>
            <p className="text-muted-foreground mb-6">Performance comparison data will appear here once marks are entered for the class.</p>
            <Button variant="outline" onClick={() => navigate('/parent/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Performance Comparison</h1>
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
          OVERALL COMPARISON CARDS
      ======================== */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Child's Performance */}
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Child</p>
              </div>
            </div>
            <p className="text-4xl font-bold">{childPct}%</p>
            <Progress value={childPct} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Class Average */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Average</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-600">{classPct}%</p>
            <Progress value={classPct} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Difference */}
        <Card className={`border-l-4 hover:shadow-md transition-shadow ${diff >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${diff >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {diff >= 0 ? <Trophy className="h-5 w-5 text-emerald-600" /> : <Award className="h-5 w-5 text-rose-600" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gap</p>
              </div>
            </div>
            <div className={`text-4xl font-bold flex items-center gap-2 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {diff >= 0 ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {diff >= 0 ? 'Above' : 'Below'} class average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================
          VISUAL CHARTS
      ======================== */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart Comparison */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Comparison</CardTitle>
            <CardDescription>Child vs Class Average vs Top Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="subject" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="child" fill="hsl(var(--primary))" name="Your Child" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" fill="#60a5fa" name="Class Average" radius={[4, 4, 0, 0]} />
                <Bar dataKey="top" fill="#34d399" name="Top Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        {radarData.length >= 3 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Performance Radar</CardTitle>
              <CardDescription>Multi-dimensional comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                  <Radar name="Your Child" dataKey="child" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Class Average" dataKey="average" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={1.5} />
                  <Radar name="Top Score" dataKey="top" stroke="#34d399" fill="#34d399" fillOpacity={0.1} strokeWidth={1.5} />
                  <Legend />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================
          DETAILED TABLE
      ======================== */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Detailed Comparison</CardTitle>
          <CardDescription>Subject-wise breakdown with gap analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Subject</TableHead>
                <TableHead className="text-center">Your Child</TableHead>
                <TableHead className="text-center">Class Average</TableHead>
                <TableHead className="text-center">Top Score</TableHead>
                <TableHead className="text-center">Gap from Average</TableHead>
                <TableHead className="text-center">Gap from Top</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((sub, idx) => {
                const childPct = parseFloat(sub.childPercentage);
                const avgPct = parseFloat(sub.classAverage);
                const topPct = parseFloat(sub.topScore);
                const gapAvg = childPct - avgPct;
                const gapTop = childPct - topPct;
                const diffAvg = getDiffBadge(gapAvg);
                const diffTop = getDiffBadge(gapTop);

                return (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {sub.subjectName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={childPct} className="w-16 h-2" />
                        <span className="text-sm font-bold w-10 text-right">{childPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={avgPct} className="w-16 h-2 bg-blue-100" />
                        <span className="text-sm text-blue-600 w-10 text-right">{avgPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 font-semibold">
                        {topPct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`inline-flex items-center gap-1 ${diffAvg.color}`}>
                        {diffAvg.icon}{diffAvg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`inline-flex items-center gap-1 ${diffTop.color}`}>
                        {diffTop.icon}{diffTop.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ========================
          KEY INSIGHTS
      ======================== */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Strongest Subject */}
            {(() => {
              const strongest = [...subjects].sort((a, b) => parseFloat(b.childPercentage) - parseFloat(a.childPercentage))[0];
              if (!strongest) return null;
              return (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Strongest Subject</p>
                  <p className="text-sm font-semibold text-emerald-800">{strongest.subjectName} — {strongest.childPercentage}%</p>
                </div>
              );
            })()}

            {/* Needs Improvement */}
            {(() => {
              const weakest = [...subjects].sort((a, b) => parseFloat(a.childPercentage) - parseFloat(b.childPercentage))[0];
              if (!weakest) return null;
              return (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium">Needs Attention</p>
                  <p className="text-sm font-semibold text-amber-800">{weakest.subjectName} — {weakest.childPercentage}%</p>
                </div>
              );
            })()}

            {/* Above Average Subjects */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">Above Class Average</p>
              <p className="text-sm font-semibold text-blue-800">
                {subjects.filter(s => parseFloat(s.childPercentage) > parseFloat(s.classAverage)).length} of {subjects.length} subjects
              </p>
            </div>

            {/* Room for Growth */}
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <p className="text-xs text-violet-600 font-medium">Gap from Top Score</p>
              <p className="text-sm font-semibold text-violet-800">
                {topScore - childPct > 0 ? `${(topScore - childPct).toFixed(1)}% improvement potential` : 'At top level! 🎉'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
