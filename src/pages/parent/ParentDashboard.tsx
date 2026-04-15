import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  BookOpen,
  Bus,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronRight,
  Receipt,
  GraduationCap,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Star,
  Award,
  Eye,
  Zap,
  Shield,
  Heart
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line
} from 'recharts';

// ========================
// TYPES
// ========================
interface AttendanceData {
  morning: string;
  afternoon: string;
}

interface AttendanceMonthly {
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface ExamData {
  name: string;
  type: string;
  percentage: number;
  totalObtained: number;
  totalMax: number;
  subjects: number;
}

interface PerformanceData {
  latestExam: ExamData | null;
  overallPercentage: number;
  examsTaken: number;
}

interface TransportData {
  vehicleNo: string;
  vehicleType: string;
  tripType: string;
  status: string;
  scheduledStart: string;
  actualStart: string | null;
  boardingStop: number;
}

interface FeeData {
  id: string;
  studentName: string;
  className: string;
  amount: number;
  dueAmount: number;
  status: string;
  date: string;
  paymentMethod: string;
  receiptNumber: string | null;
  description: string | null;
}

interface Announcement {
  id: string;
  title: string;
  type: string;
  priority: string;
  date: string;
  pinned: boolean;
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  subject?: string;
}

interface Notification {
  type: string;
  message: string;
  amount?: number;
  status: string;
  dueDate: string;
}

interface ChildData {
  id: string;
  name: string;
  className: string;
  section: string;
  admissionNumber: string;
  dob: string;
  gender: string;
  attendanceToday: AttendanceData | null;
  attendanceMonthly: AttendanceMonthly;
  feesDue: number;
  totalFee: number;
  totalPaid: number;
  nextDueDate: string | null;
  performance: PerformanceData;
  transport: TransportData | null;
  pendingAssignments: number;
}

interface DashboardData {
  children: ChildData[];
  summary: {
    totalChildren: number;
    avgAttendance: number;
    totalFeesDue: number;
  };
  announcements: Announcement[];
  upcomingEvents: UpcomingEvent[];
  recentTransactions: FeeData[];
  notifications: {
    unread: number;
    alerts: Notification[];
  };
  pendingAssignments: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    totalPoints: number;
  }[];
}

// ========================
// HELPERS
// ========================
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const getTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};

const getAttendanceBadge = (status: string) => {
  switch (status) {
    case 'present':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
    case 'absent':
      return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
    case 'late':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground/60">Not Marked</Badge>;
  }
};

const getFeeStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
    case 'completed':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>;
    case 'partial':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>;
    case 'overdue':
      return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAnnouncementIcon = (type: string) => {
  switch (type) {
    case 'exam': return <GraduationCap className="h-4 w-4" />;
    case 'holiday': return <Calendar className="h-4 w-4" />;
    case 'event': return <Star className="h-4 w-4" />;
    case 'emergency': return <AlertTriangle className="h-4 w-4" />;
    case 'achievement': return <Award className="h-4 w-4" />;
    case 'reminder': return <Clock className="h-4 w-4" />;
    case 'meeting': return <Users className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-muted-foreground bg-muted/30 border-border';
  }
};

const getGradeLabel = (pct: number) => {
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { grade: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 50) return { grade: 'C', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { grade: 'D', color: 'text-rose-600', bg: 'bg-rose-50' };
};

const getTripTypeLabel = (type: string) => {
  switch (type) {
    case 'morning-pickup': return 'Morning Pickup';
    case 'morning-drop': return 'Morning Drop';
    case 'evening-pickup': return 'Evening Pickup';
    case 'evening-drop': return 'Evening Drop';
    default: return type;
  }
};

const getTransportStatusBadge = (status: string) => {
  switch (status) {
    case 'in-progress':
      return <Badge className="bg-sky-50 text-sky-700 border-sky-200 animate-pulse"><MapPin className="h-3 w-3 mr-1" />On Route</Badge>;
    case 'completed':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Arrived</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="text-muted-foreground/70"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
    case 'delayed':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200"><AlertCircle className="h-3 w-3 mr-1" />Delayed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// ========================
// SUB-COMPONENTS
// ========================

/** Radial Gauge for attendance/performance */
function RadialGauge({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const data = [{ name: label, value: Math.max(value, 2), fill: value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444' }];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size * 0.75}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f1f5f9' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="relative -mt-16 text-center">
        <p className="text-2xl font-bold tracking-tight">{value}%</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}

/** Animated counter */
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      {prefix && <span className="text-lg font-medium text-muted-foreground">{prefix}</span>}
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
    </span>
  );
}

/** Insight badge */
function InsightBadge({ icon: Icon, text, color }: { icon: React.ElementType; text: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[color] || colorClasses.blue}`}>
      <Icon className="h-3 w-3" />
      {text}
    </div>
  );
}

// ========================
// MAIN COMPONENT
// ========================
export default function ParentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChild, setActiveChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get('/parent/dashboard');
      const data = res.data?.data;
      if (data) {
        setDashboardData(data);
        if (data.children?.length > 0 && !activeChild) {
          setActiveChild(String(data.children[0].id));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch parent dashboard:', err);
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedChild = useMemo(() =>
    dashboardData?.children.find(c => String(c.id) === activeChild) || null
  , [dashboardData, activeChild]);

  // ========================
  // SKELETON LOADING
  // ========================
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2"><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  // ========================
  // NO CHILDREN
  // ========================
  if (!dashboardData || dashboardData.children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Children Linked</h3>
            <p className="text-muted-foreground mb-6">
              No children are linked to your account. Please contact the school administration to get connected.
            </p>
            <Button variant="outline" onClick={() => fetchData(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { children, summary, announcements, upcomingEvents, recentTransactions, notifications, pendingAssignments } = dashboardData;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ========================
          HEADER
      ======================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 border border-primary/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Here's what's happening with your {summary.totalChildren > 1 ? 'children' : 'child'} today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.unread > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                        {notifications.unread}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{notifications.unread} pending notification{notifications.unread > 1 ? 's' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ========================
          CHILD TABS (for multiple children)
      ======================== */}
      {children.length > 1 && (
        <Tabs value={activeChild} onValueChange={setActiveChild} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            {children.map(child => (
              <TabsTrigger
                key={child.id}
                value={String(child.id)}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{child.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {child.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* ========================
          NOTIFICATION BANNER
      ======================== */}
      {notifications.unread > 0 && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Action Required — {notifications.unread} pending notification{notifications.unread > 1 ? 's' : ''}
                  </p>
                  {notifications.alerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-amber-700">{alert.message}</span>
                      {alert.amount && <span className="font-semibold text-amber-800">{formatCurrency(alert.amount)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================
          STAT CARDS
      ======================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Children */}
        <Card className="border-l-4 border-l-primary/70 hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Total Children</p>
                <AnimatedValue value={summary.totalChildren} />
                <InsightBadge icon={Shield} text="Enrolled & Active" color="blue" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <AnimatedValue value={summary.avgAttendance} suffix="%" />
                <InsightBadge
                  icon={summary.avgAttendance >= 75 ? ArrowUpRight : ArrowDownRight}
                  text={summary.avgAttendance >= 75 ? 'Good Standing' : 'Needs Attention'}
                  color={summary.avgAttendance >= 75 ? 'green' : 'amber'}
                />
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Performance</p>
                {selectedChild?.performance.latestExam ? (
                  <>
                    <AnimatedValue value={selectedChild.performance.latestExam.percentage} suffix="%" />
                    <InsightBadge
                      icon={Star}
                      text={getGradeLabel(selectedChild.performance.latestExam.percentage).grade}
                      color={selectedChild.performance.latestExam.percentage >= 75 ? 'green' : selectedChild.performance.latestExam.percentage >= 50 ? 'amber' : 'rose'}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-muted-foreground/50">—</p>
                    <InsightBadge icon={Clock} text="No data yet" color="blue" />
                  </>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees */}
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Fees Due</p>
                <AnimatedValue value={summary.totalFeesDue > 0 ? formatCurrency(summary.totalFeesDue) : '₹0'} />
                <InsightBadge
                  icon={summary.totalFeesDue > 0 ? AlertCircle : CheckCircle2}
                  text={summary.totalFeesDue > 0 ? 'Outstanding' : 'All Clear'}
                  color={summary.totalFeesDue > 0 ? 'amber' : 'green'}
                />
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================
          MAIN CONTENT TABS
      ======================== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4 mr-1.5" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="academics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Academics
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Student Profile Card */}
            <Card className="md:col-span-1 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Student Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChild && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                          {selectedChild.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedChild.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Class {selectedChild.className} • Sec {selectedChild.section}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {selectedChild.admissionNumber}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      {selectedChild.gender && (
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="text-sm font-medium">{selectedChild.gender}</p>
                        </div>
                      )}
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Assignments</p>
                        <p className="text-sm font-medium">{selectedChild.pendingAssignments} Pending</p>
                      </div>
                      {selectedChild.transport && (
                        <div className="col-span-2 p-2.5 rounded-lg bg-muted/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Transport</p>
                            <p className="text-sm font-medium">{selectedChild.transport.vehicleNo}</p>
                          </div>
                          {getTransportStatusBadge(selectedChild.transport.status)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Mini Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Attendance Snapshot</span>
                  {selectedChild && selectedChild.attendanceMonthly.percentage >= 75 && (
                    <InsightBadge icon={Award} text="Excellent" color="green" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChild && (
                  <div className="flex items-center justify-around">
                    <RadialGauge value={selectedChild.attendanceMonthly.percentage} label="Monthly" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-muted-foreground">Present</span>
                        <span className="text-sm font-semibold">{selectedChild.attendanceMonthly.present}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-rose-500" />
                        <span className="text-sm text-muted-foreground">Absent</span>
                        <span className="text-sm font-semibold">{selectedChild.attendanceMonthly.absent}</span>
                      </div>
                      <Separator />
                      {selectedChild.attendanceToday ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Today</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {getAttendanceBadge(selectedChild.attendanceToday.morning)}
                            {getAttendanceBadge(selectedChild.attendanceToday.afternoon)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60">Not marked today</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Upcoming
                </CardTitle>
                <CardDescription>Exams & deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {upcomingEvents.slice(0, 4).map(evt => (
                      <div key={evt.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-default group">
                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          evt.type === 'exam' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'
                        }`}>
                          {evt.type === 'exam' ? <GraduationCap className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{evt.title}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(evt.date)}
                            {evt.subject && <span className="text-muted-foreground/60">• {evt.subject}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground/60">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions + Announcements */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="md:col-span-3 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Recent Transactions
                  </span>
                  <Badge variant="outline" className="font-normal">{recentTransactions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-1">
                    {recentTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{tx.studentName}</p>
                            {getFeeStatusBadge(tx.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tx.className} • {getTimeAgo(tx.date)}
                            {tx.receiptNumber && ` • ${tx.receiptNumber}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(tx.amount)}</p>
                          {tx.dueAmount > 0 && (
                            <p className="text-xs text-rose-500 font-medium">{formatCurrency(tx.dueAmount)} due</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground/60">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <div className="space-y-2">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-3 rounded-lg hover:bg-muted/20 transition-colors group border border-transparent hover:border-border/50">
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 p-2 rounded-lg border ${getPriorityColor(ann.priority)}`}>
                            {getAnnouncementIcon(ann.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {ann.pinned && <span className="text-amber-500">📌</span>}
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ann.title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground/60">{getTimeAgo(ann.date)}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">{ann.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground/60">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No announcements</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== ATTENDANCE TAB ===== */}
        <TabsContent value="attendance" className="mt-0">
          {selectedChild && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Today's Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedChild.attendanceToday ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm">☀️</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Morning</p>
                          </div>
                        </div>
                        {getAttendanceBadge(selectedChild.attendanceToday.morning)}
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                            <span className="text-sm">🌙</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-sky-800">Afternoon</p>
                          </div>
                        </div>
                        {getAttendanceBadge(selectedChild.attendanceToday.afternoon)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/60">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Attendance not marked yet today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Present', value: selectedChild.attendanceMonthly.present, fill: '#10b981' },
                            { name: 'Absent', value: selectedChild.attendanceMonthly.absent, fill: '#f43f5e' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[0, 1].map((_, i) => (
                            <Cell key={i} className="stroke-2 stroke-background" />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val: number) => [`${val} days`, '']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      <div>
                        <p className="text-3xl font-bold">{selectedChild.attendanceMonthly.percentage}%</p>
                        <p className="text-xs text-muted-foreground">Attendance Rate</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span className="text-sm">{selectedChild.attendanceMonthly.present} Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                          <span className="text-sm">{selectedChild.attendanceMonthly.absent} Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                          <span className="text-sm">{selectedChild.attendanceMonthly.total} Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== FINANCE TAB ===== */}
        <TabsContent value="finance" className="mt-0">
          {selectedChild && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Fee</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedChild.totalFee)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedChild.totalPaid)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedChild.feesDue > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        <AlertCircle className={`h-5 w-5 ${selectedChild.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Due</p>
                        <p className={`text-xl font-bold ${selectedChild.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(selectedChild.feesDue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Fee Progress</CardTitle>
                  <CardDescription>Payment completion overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedChild.totalFee > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-semibold">{((selectedChild.totalPaid / selectedChild.totalFee) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={(selectedChild.totalPaid / selectedChild.totalFee) * 100} className="h-3" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground drop-shadow">
                            {formatCurrency(selectedChild.totalPaid)} of {formatCurrency(selectedChild.totalFee)}
                          </span>
                        </div>
                      </div>
                      {selectedChild.nextDueDate && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-sm text-amber-800">
                            Next payment due: <strong>{formatDate(selectedChild.nextDueDate)}</strong>
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/60">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No fee data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== ACADEMICS TAB ===== */}
        <TabsContent value="academics" className="mt-0">
          {selectedChild && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Latest Exam Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedChild.performance.latestExam ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedChild.performance.latestExam.name}</p>
                          <Badge variant="outline" className="mt-1 capitalize">{selectedChild.performance.latestExam.type}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold">{selectedChild.performance.latestExam.percentage}%</p>
                          <InsightBadge
                            icon={Star}
                            text={getGradeLabel(selectedChild.performance.latestExam.percentage).grade}
                            color={selectedChild.performance.latestExam.percentage >= 75 ? 'green' : selectedChild.performance.latestExam.percentage >= 50 ? 'amber' : 'rose'}
                          />
                        </div>
                      </div>
                      <Progress value={selectedChild.performance.latestExam.percentage} className="h-3" />
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 text-center">
                          <p className="text-xs text-muted-foreground">Marks</p>
                          <p className="text-lg font-bold">{selectedChild.performance.latestExam.totalObtained}/{selectedChild.performance.latestExam.totalMax}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 text-center">
                          <p className="text-xs text-muted-foreground">Subjects</p>
                          <p className="text-lg font-bold">{selectedChild.performance.latestExam.subjects}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 text-center">
                          <p className="text-xs text-muted-foreground">Exams Taken</p>
                          <p className="text-lg font-bold">{selectedChild.performance.examsTaken}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/60">
                      <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No exam data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Pending Assignments
                    <Badge variant="outline" className="ml-auto">{selectedChild.pendingAssignments}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedChild.pendingAssignments > 0 ? (
                    <div className="space-y-2">
                      {pendingAssignments.slice(0, 3).map(a => (
                        <div key={a.id} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{a.title}</p>
                              <p className="text-xs text-muted-foreground">{a.subject}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-amber-600">{formatDate(a.dueDate)}</p>
                              <p className="text-[10px] text-muted-foreground">{a.totalPoints} pts</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/60">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">All caught up! No pending assignments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========================
          QUICK ACTIONS
      ======================== */}
      {selectedChild && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Access detailed views for {selectedChild.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.location.href = `/parent/child-performance?childId=${selectedChild.id}`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Details
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.location.href = `/parent/download-report?childId=${selectedChild.id}`}>
                <FileText className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.location.href = `/parent/comparison?childId=${selectedChild.id}`}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Class Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
