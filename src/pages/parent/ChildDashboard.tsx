import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  RefreshCw, Users, Calendar, DollarSign, TrendingUp, BookOpen, Bus,
  Bell, AlertTriangle, CheckCircle2, XCircle, Clock, FileText,
  ChevronRight, Receipt, GraduationCap, MapPin, AlertCircle,
  ArrowUpRight, ArrowDownRight, Sparkles, Target, Star, Award, Eye, Zap
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts';

interface ChildData {
  id: string; name: string; className: string; section: string; admissionNumber: string;
  dob: string; gender: string; attendanceToday: { morning: string; afternoon: string } | null;
  attendanceMonthly: { present: number; absent: number; total: number; percentage: number };
  feesDue: number; totalFee: number; totalPaid: number; nextDueDate: string | null;
  performance: { latestExam: { name: string; type: string; percentage: number; totalObtained: number; totalMax: number; subjects: number } | null; overallPercentage: number; examsTaken: number };
  transport: { vehicleNo: string; vehicleType: string; tripType: string; status: string; scheduledStart: string } | null;
  pendingAssignments: number;
}

interface DashboardData {
  children: ChildData[];
  summary: { totalChildren: number; avgAttendance: number; totalFeesDue: number };
  announcements: { id: string; title: string; type: string; priority: string; date: string; pinned: boolean }[];
  upcomingEvents: { id: string; title: string; type: string; date: string; subject?: string }[];
  recentTransactions: { id: string; studentName: string; className: string; amount: number; dueAmount: number; status: string; date: string; paymentMethod: string; receiptNumber: string | null }[];
  notifications: { unread: number; alerts: { type: string; message: string; amount?: number; status: string }[] };
  pendingAssignments: { id: string; title: string; subject: string; dueDate: string; totalPoints: number }[];
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const formatCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const getTimeAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60));
  if (diff < 1) return 'Just now'; if (diff < 24) return `${diff}h ago`;
  const days = Math.floor(diff / 24); return days < 7 ? `${days}d ago` : formatDate(d);
};
const getGradeLabel = (pct: number) => {
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { grade: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 50) return { grade: 'C', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { grade: 'D', color: 'text-rose-600', bg: 'bg-rose-50' };
};
const getAttendanceBadge = (s: string) => {
  if (s === 'present') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
  if (s === 'absent') return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
  return <Badge variant="outline" className="text-muted-foreground/60">Not Marked</Badge>;
};
const getFeeStatusBadge = (s: string) => {
  if (s === 'paid' || s === 'completed') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>;
  if (s === 'partial') return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
  return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Pending</Badge>;
};
const getAnnouncementIcon = (t: string) => {
  switch (t) {
    case 'exam': return <GraduationCap className="h-4 w-4" />;
    case 'event': return <Star className="h-4 w-4" />;
    case 'emergency': return <AlertTriangle className="h-4 w-4" />;
    case 'achievement': return <Award className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};
const getPriorityColor = (p: string) => {
  switch (p) {
    case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-muted-foreground bg-muted/30 border-border';
  }
};
const getTripTypeLabel = (t: string) => {
  if (t === 'morning-pickup') return 'Morning Pickup';
  if (t === 'morning-drop') return 'Morning Drop';
  if (t === 'evening-pickup') return 'Evening Pickup';
  if (t === 'evening-drop') return 'Evening Drop';
  return t;
};
const getTransportStatusBadge = (s: string) => {
  if (s === 'in-progress') return <Badge className="bg-sky-50 text-sky-700 border-sky-200"><MapPin className="h-3 w-3 mr-1 animate-pulse" />On Route</Badge>;
  if (s === 'completed') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Arrived</Badge>;
  if (s === 'scheduled') return <Badge variant="outline" className="text-muted-foreground/70"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
  return <Badge variant="outline">{s}</Badge>;
};
const getAvatarColor = (name: string) => {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-4 w-28 mb-2" /><Skeleton className="h-8 w-56 mb-1" /><Skeleton className="h-4 w-48" /></div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1"><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

export default function ChildDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiClient.get('/parent/dashboard');
      const data = res.data?.data;
      if (data) setDashboardData(data);
    } catch (err: any) {
      if (err.response?.status !== 404) toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const child = useMemo(() =>
    dashboardData?.children.find(c => String(c.id) === childId) || null
  , [dashboardData, childId]);

  if (loading) return <DashboardSkeleton />;

  if (!dashboardData || dashboardData.children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md"><CardContent className="p-12 text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center"><Users className="h-8 w-8 text-muted-foreground/50" /></div>
          <h3 className="text-xl font-semibold mb-2">No Children Linked</h3>
          <p className="text-muted-foreground mb-6">Please contact the school administration.</p>
          <Button variant="outline" onClick={() => navigate('/parent/dashboard')}><ChevronRight className="h-4 w-4 mr-2" />Go Home</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md"><CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500/50" />
          <h3 className="text-xl font-semibold mb-2">Child Not Found</h3>
          <p className="text-muted-foreground mb-6">This child may not be linked to your account.</p>
          <Button variant="outline" onClick={() => navigate('/parent/dashboard')}><ChevronRight className="h-4 w-4 mr-2" />Go Home</Button>
        </CardContent></Card>
      </div>
    );
  }

  const { summary, announcements, upcomingEvents, recentTransactions, pendingAssignments } = dashboardData;

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Child Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-violet-500/10 to-primary/5 p-6 border border-primary/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-24 translate-x-24" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl ${getAvatarColor(child.name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {child.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-primary" onClick={() => navigate('/parent/dashboard')}>
                    All Children
                  </Button>
                  {' • '}Child Dashboard
                </p>
                <h1 className="text-2xl font-bold tracking-tight">{child.name}</h1>
                <p className="text-muted-foreground">
                  Class {child.className} — Section {child.section} • {child.admissionNumber}
                  {child.gender && ` • ${child.gender}`}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="rounded-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="text-3xl font-bold">{child.attendanceMonthly.percentage}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{child.attendanceMonthly.present}/{child.attendanceMonthly.total} days</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Calendar className="h-5 w-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fees Due</p>
                  <p className="text-3xl font-bold">{child.feesDue > 0 ? formatCurrency(child.feesDue) : '₹0'}</p>
                  <p className="text-xs text-muted-foreground mt-1">of {formatCurrency(child.totalFee)}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  {child.performance.latestExam ? (
                    <>
                      <p className="text-3xl font-bold">{child.performance.latestExam.percentage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{child.performance.latestExam.name}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-muted-foreground/50">—</p>
                      <p className="text-xs text-muted-foreground mt-1">No exam data</p>
                    </>
                  )}
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Homework</p>
                  <p className="text-3xl font-bold">{child.pendingAssignments}</p>
                  <p className="text-xs text-muted-foreground mt-1">pending submissions</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><BookOpen className="h-5 w-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1 rounded-xl mb-4">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Eye className="h-4 w-4 mr-1.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4 mr-1.5" />Attendance
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <DollarSign className="h-4 w-4 mr-1.5" />Finance
            </TabsTrigger>
            <TabsTrigger value="academics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <GraduationCap className="h-4 w-4 mr-1.5" />Academics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Attendance Snapshot */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-500" />Attendance</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {child.attendanceToday ? (
                    <>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Morning:</span>{getAttendanceBadge(child.attendanceToday.morning)}</div>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Afternoon:</span>{getAttendanceBadge(child.attendanceToday.afternoon)}</div>
                    </>
                  ) : <p className="text-xs text-muted-foreground/60">Not marked today</p>}
                  <Separator />
                  <Progress value={child.attendanceMonthly.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-600">{child.attendanceMonthly.present} Present</span>
                    <span className="text-rose-600">{child.attendanceMonthly.absent} Absent</span>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Upcoming</CardTitle></CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingEvents.slice(0, 4).map(evt => (
                        <div key={evt.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${evt.type === 'exam' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                            {evt.type === 'exam' ? <GraduationCap className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{evt.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(evt.date)}{evt.subject && ` • ${evt.subject}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-4 text-muted-foreground/60"><Calendar className="h-6 w-6 mx-auto mb-1 opacity-40" /><p className="text-xs">No upcoming events</p></div>}
                </CardContent>
              </Card>

              {/* Transport & Homework */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base">Quick Info</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {child.transport && (
                    <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Bus className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium">Transport</span>
                        {getTransportStatusBadge(child.transport.status)}
                      </div>
                      <p className="text-xs text-cyan-700">{child.transport.vehicleNo} • {getTripTypeLabel(child.transport.tripType)}</p>
                      {child.transport.scheduledStart && <p className="text-xs text-cyan-700 mt-0.5">Scheduled: {formatTime(child.transport.scheduledStart)}</p>}
                    </div>
                  )}
                  {child.pendingAssignments > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Homework</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{child.pendingAssignments} pending</Badge>
                      </div>
                    </div>
                  )}
                  {!child.transport && child.pendingAssignments === 0 && (
                    <p className="text-center text-sm text-muted-foreground/60 py-4">No additional info</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Transactions + Announcements */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="md:col-span-3 border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center justify-between"><span className="flex items-center gap-2"><Receipt className="h-4 w-4" />Recent Transactions</span><Badge variant="outline" className="font-normal">{recentTransactions.length}</Badge></CardTitle></CardHeader>
                <CardContent>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-1">
                      {recentTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="flex items-center gap-2"><p className="text-sm font-medium">{tx.studentName}</p>{getFeeStatusBadge(tx.status)}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">{tx.className} • {getTimeAgo(tx.date)}{tx.receiptNumber && ` • ${tx.receiptNumber}`}</p>
                          </div>
                          <div className="text-right"><p className="font-semibold text-sm">{formatCurrency(tx.amount)}</p>{tx.dueAmount > 0 && <p className="text-xs text-rose-500 font-medium">{formatCurrency(tx.dueAmount)} due</p>}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 text-muted-foreground/60"><Receipt className="h-6 w-6 mx-auto mb-1 opacity-40" /><p className="text-xs">No transactions</p></div>}
                </CardContent>
              </Card>
              <Card className="md:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Announcements</CardTitle></CardHeader>
                <CardContent>
                  {announcements.length > 0 ? (
                    <div className="space-y-2">
                      {announcements.map(ann => (
                        <div key={ann.id} className="p-3 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border/50">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 p-2 rounded-lg border ${getPriorityColor(ann.priority)}`}>{getAnnouncementIcon(ann.type)}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {ann.pinned && <span className="text-amber-500">📌</span>}
                                <p className="text-sm font-medium truncate">{ann.title}</p>
                              </div>
                              <span className="text-xs text-muted-foreground/60 mt-0.5 block">{getTimeAgo(ann.date)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 text-muted-foreground/60"><Bell className="h-6 w-6 mx-auto mb-1 opacity-40" /><p className="text-xs">No announcements</p></div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Today&apos;s Status</CardTitle></CardHeader>
                <CardContent>
                  {child.attendanceToday ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                        <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><span className="text-sm">☀️</span></div><p className="text-sm font-semibold text-emerald-800">Morning</p></div>
                        {getAttendanceBadge(child.attendanceToday.morning)}
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50">
                        <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center"><span className="text-sm">🌙</span></div><p className="text-sm font-semibold text-violet-800">Afternoon</p></div>
                        {getAttendanceBadge(child.attendanceToday.afternoon)}
                      </div>
                    </div>
                  ) : <div className="text-center py-8 text-muted-foreground/60"><Clock className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Not marked yet</p></div>}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: 'Present', value: child.attendanceMonthly.present, fill: '#10b981' },
                          { name: 'Absent', value: child.attendanceMonthly.absent, fill: '#f43f5e' }
                        ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                          {[0, 1].map((_, i) => <Cell key={i} className="stroke-2 stroke-background" />)}
                        </Pie>
                        <RechartsTooltip formatter={(val: number) => [`${val} days`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      <p className="text-3xl font-bold">{child.attendanceMonthly.percentage}%</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-sm">{child.attendanceMonthly.present} Present</span></div>
                        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="text-sm">{child.attendanceMonthly.absent} Absent</span></div>
                        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="text-sm">{child.attendanceMonthly.total} Total</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="mt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-0 shadow-sm"><CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-violet-600" /></div><div><p className="text-sm text-muted-foreground">Total Fee</p><p className="text-xl font-bold">{formatCurrency(child.totalFee)}</p></div></div>
                  <Separator />
                  <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><div><p className="text-sm text-muted-foreground">Paid</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(child.totalPaid)}</p></div></div>
                  <Separator />
                  <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${child.feesDue > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}><AlertCircle className={`h-5 w-5 ${child.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`} /></div><div><p className="text-sm text-muted-foreground">Due</p><p className={`text-xl font-bold ${child.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(child.feesDue)}</p></div></div>
                </div>
              </CardContent></Card>
              <Card className="border-0 shadow-sm md:col-span-2"><CardHeader><CardTitle className="text-base">Fee Progress</CardTitle><CardDescription>Payment completion overview</CardDescription></CardHeader><CardContent className="space-y-4">
                {child.totalFee > 0 ? (
                  <>
                    <Progress value={child.totalFee > 0 ? (child.totalPaid / child.totalFee) * 100 : 0} className="h-3" />
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="font-semibold">{child.totalFee > 0 ? ((child.totalPaid / child.totalFee) * 100).toFixed(0) : 0}%</span></div>
                    {child.nextDueDate && <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600 shrink-0" /><span className="text-sm text-amber-800">Next due: <strong>{formatDate(child.nextDueDate)}</strong></span></div>}
                  </>
                ) : <div className="text-center py-8 text-muted-foreground/60"><DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No fee data</p></div>}
              </CardContent></Card>
            </div>
          </TabsContent>

          {/* Academics Tab */}
          <TabsContent value="academics" className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Exam Performance</CardTitle></CardHeader><CardContent>
                {child.performance.latestExam ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div><p className="font-semibold">{child.performance.latestExam.name}</p><Badge variant="outline" className="mt-1 capitalize">{child.performance.latestExam.type}</Badge></div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">{child.performance.latestExam.percentage}%</p>
                        <Badge className={`mt-1 ${getGradeLabel(child.performance.latestExam.percentage).bg} ${getGradeLabel(child.performance.latestExam.percentage).color}`}>{getGradeLabel(child.performance.latestExam.percentage).grade}</Badge>
                      </div>
                    </div>
                    <Progress value={child.performance.latestExam.percentage} className="h-3" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Marks</p><p className="text-lg font-bold">{child.performance.latestExam.totalObtained}/{child.performance.latestExam.totalMax}</p></div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Subjects</p><p className="text-lg font-bold">{child.performance.latestExam.subjects}</p></div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Exams</p><p className="text-lg font-bold">{child.performance.examsTaken}</p></div>
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground/60"><GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No exam data</p></div>}
              </CardContent></Card>
              <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Pending Assignments</CardTitle><Badge variant="outline" className="ml-auto">{child.pendingAssignments}</Badge></CardHeader><CardContent>
                {pendingAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {pendingAssignments.slice(0, 4).map(a => (
                      <div key={a.id} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.subject}</p></div>
                          <div className="text-right"><p className="text-xs font-medium text-amber-600">{formatDate(a.dueDate)}</p><p className="text-[10px] text-muted-foreground">{a.totalPoints} pts</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground/60"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">All caught up!</p></div>}
              </CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Navigate to detailed views for {child.name}</CardDescription></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/parent/child/${child.id}/performance`)}><TrendingUp className="h-4 w-4 mr-2" />Performance</Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/parent/child/${child.id}/comparison`)}><ArrowUpRight className="h-4 w-4 mr-2" />Comparison</Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/parent/child/${child.id}/reports`)}><FileText className="h-4 w-4 mr-2" />Report Cards</Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/parent/child/${child.id}/timetable`)}><Calendar className="h-4 w-4 mr-2" />Timetable</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
