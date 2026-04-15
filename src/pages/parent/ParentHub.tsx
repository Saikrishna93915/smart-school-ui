import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Bus
} from 'lucide-react';

interface ChildSummary {
  id: string;
  name: string;
  className: string;
  section: string;
  admissionNumber: string;
  gender: string;
  attendanceToday: { morning: string; afternoon: string } | null;
  attendanceMonthly: { present: number; absent: number; total: number; percentage: number };
  feesDue: number;
  totalFee: number;
  totalPaid: number;
  performance: { latestExam: { name: string; percentage: number } | null; overallPercentage: number; examsTaken: number };
  transport: { vehicleNo: string; status: string } | null;
  pendingAssignments: number;
}

interface DashboardData {
  children: ChildSummary[];
  summary: { totalChildren: number; avgAttendance: number; totalFeesDue: number };
  announcements: { id: string; title: string; type: string; priority: string; date: string; pinned: boolean }[];
  notifications: { unread: number; alerts: { type: string; message: string; amount?: number }[] };
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const getGradeColor = (pct: number) => {
  if (pct >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (pct >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (pct >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (pct >= 60) return 'text-sky-600 bg-sky-50 border-sky-200';
  if (pct >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

const getAvatarColor = (name: string) => {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function ParentHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiClient.get('/parent/dashboard');
      const d = res.data?.data;
      if (d) setData(d);
    } catch (err: any) {
      if (err.response?.status !== 404) toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-56 mb-2" /><Skeleton className="h-4 w-72" /></div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Children Linked</h3>
            <p className="text-muted-foreground mb-6">Please contact the school administration to link your children to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-violet-500/10 to-primary/5 p-6 border border-primary/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-24 translate-x-24" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Good {greeting}, {user?.name?.split(' ')[0] || 'Parent'} 👋</h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your {data.summary.totalChildren > 1 ? 'children' : 'child'}'s school activity
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="rounded-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {data.notifications.unread > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">{data.notifications.unread} Action Required</p>
                {data.notifications.alerts.slice(0, 2).map((a, i) => (
                  <p key={i} className="text-xs text-amber-700">{a.message}</p>
                ))}
              </div>
              <Badge className="bg-amber-200 text-amber-800 shrink-0">{data.notifications.unread}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Children</p>
                <p className="text-3xl font-bold">{data.summary.totalChildren}</p>
                <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-3xl font-bold">{data.summary.avgAttendance}%</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Calendar className="h-5 w-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 hover:shadow-md transition-shadow ${data.summary.totalFeesDue > 0 ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees Due</p>
                <p className="text-3xl font-bold">{formatCurrency(data.summary.totalFeesDue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data.summary.totalFeesDue > 0 ? 'Outstanding' : 'All clear!'}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Child Cards */}
      <h2 className="text-lg font-semibold mt-8">Your Children</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {data.children.map(child => {
          const examPct = child.performance.latestExam?.percentage || child.performance.overallPercentage || 0;
          return (
            <Card
              key={child.id}
              className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/parent/child/${child.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl ${getAvatarColor(child.name)} flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform`}>
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{child.name}</CardTitle>
                      <CardDescription>
                        Class {child.className} — Sec {child.section}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Attendance */}
                  <div className="text-center p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">Attendance</span>
                    </div>
                    <p className={`text-xl font-bold ${child.attendanceMonthly.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {child.attendanceMonthly.percentage}%
                    </p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {child.attendanceMonthly.percentage >= 75
                        ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        : <ArrowDownRight className="h-3 w-3 text-rose-500" />
                      }
                      <span className="text-[10px] text-muted-foreground">
                        {child.attendanceMonthly.present}/{child.attendanceMonthly.total}
                      </span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="text-center p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
                      <span className="text-xs text-muted-foreground">Grade</span>
                    </div>
                    {examPct > 0 ? (
                      <>
                        <Badge variant="outline" className={`font-bold text-sm ${getGradeColor(examPct)}`}>
                          {examPct >= 90 ? 'A+' : examPct >= 80 ? 'A' : examPct >= 70 ? 'B+' : examPct >= 60 ? 'B' : examPct >= 50 ? 'C' : 'D'}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">{examPct}%</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 mt-2">No data</p>
                    )}
                  </div>

                  {/* Fees */}
                  <div className="text-center p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs text-muted-foreground">Due</span>
                    </div>
                    <p className={`text-sm font-bold ${child.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {child.feesDue > 0 ? formatCurrency(child.feesDue) : 'Paid'}
                    </p>
                    {child.feesDue > 0 && (
                      <Progress value={child.totalFee > 0 ? (child.totalPaid / child.totalFee) * 100 : 0} className="h-1 mt-1" />
                    )}
                  </div>
                </div>

                {/* Today's Attendance */}
                {child.attendanceToday && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Today:</span>
                    {child.attendanceToday.morning === 'present'
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : child.attendanceToday.morning === 'absent'
                      ? <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      : <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                    }
                    <span className="font-medium">{child.attendanceToday.morning === 'present' ? 'Present' : child.attendanceToday.morning === 'absent' ? 'Absent' : 'Not marked'}</span>
                    {child.pendingAssignments > 0 && (
                      <>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="text-muted-foreground">Homework:</span>
                        <Badge variant="outline" className="text-[10px]">{child.pendingAssignments} pending</Badge>
                      </>
                    )}
                  </div>
                )}

                {/* Transport */}
                {child.transport && (
                  <div className="flex items-center gap-2 text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1.5 rounded-full border border-cyan-200 w-fit">
                    <Bus className="h-3 w-3" />
                    {child.transport.vehicleNo} • {child.transport.status}
                  </div>
                )}

                {/* Enter Dashboard Button */}
                <Button className="w-full group-hover:bg-primary transition-colors" size="sm">
                  View {child.name.split(' ')[0]}'s Dashboard
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              School Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.announcements.slice(0, 4).map(ann => (
                <div key={ann.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`mt-0.5 p-2 rounded-lg border ${getGradeColor(ann.priority === 'urgent' ? 95 : ann.priority === 'high' ? 85 : 50)}`}>
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ann.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
