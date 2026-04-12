import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import {
  RefreshCw,
  Users,
  GraduationCap,
  TrendingUp,
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  BookOpen
} from 'lucide-react';

interface PerformanceData {
  latestExam: {
    name: string;
    type: string;
    percentage: number;
    totalObtained: number;
    totalMax: number;
    subjects: number;
  } | null;
  overallPercentage: number;
  examsTaken: number;
}

interface ChildData {
  id: string;
  name: string;
  className: string;
  section: string;
  admissionNumber: string;
  attendanceToday: { morning: string; afternoon: string } | null;
  feesDue: number;
  totalFee: number;
  performance: PerformanceData;
}

interface DashboardSummary {
  totalChildren: number;
  avgAttendance: number;
  totalFeesDue: number;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({ totalChildren: 0, avgAttendance: 0, totalFeesDue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/parent/dashboard');
      const data = res.data?.data;
      if (data) {
        setChildren(data.children || []);
        setSummary(data.summary || { totalChildren: 0, avgAttendance: 0, totalFeesDue: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch parent dashboard:', err);
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent': return <Badge variant="outline" className="text-red-600"><AlertCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      default: return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading children's data...</p>
      </CardContent></Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
        <p className="text-muted-foreground mb-4">No children are linked to your account. Please contact the school administration.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground">View your children's academic information</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Children" value={summary.totalChildren} subtitle="Enrolled" icon={Users} variant="primary" trend={{ value: 0, isPositive: true }} />
        <StatCard title="Attendance" value={`${summary.avgAttendance}%`} subtitle="This month" icon={Calendar} variant="success" trend={{ value: 0, isPositive: true }} />
        <StatCard title="Fees Due" value={`₹${summary.totalFeesDue.toLocaleString()}`} subtitle="Outstanding" icon={DollarSign} variant={summary.totalFeesDue > 0 ? 'warning' : 'default'} trend={{ value: 0, isPositive: true }} />
      </div>

      {/* Children Cards */}
      {children.map(child => {
        const perf = child.performance;
        const latestExam = perf?.latestExam;
        return (
        <Card key={child.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>{child.name}</span>
                <CardDescription>Class {child.className} - Section {child.section} | {child.admissionNumber}</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              {/* Performance Overview */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" />Academic Performance</h4>
                {latestExam ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latest Exam</span>
                      <span className="font-medium">{latestExam.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-bold text-lg">{latestExam.percentage}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{latestExam.totalObtained}/{latestExam.totalMax} marks • {latestExam.subjects} subjects</div>
                    <Progress value={latestExam.percentage} className="h-2" />
                    {perf?.overallPercentage > 0 && (
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-muted-foreground">Overall Average</span>
                        <span className="font-bold text-primary">{perf.overallPercentage}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No exam data available yet</p>
                )}
              </div>

              {/* Today's Attendance */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Today's Attendance</h4>
                {child.attendanceToday ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Morning</span>
                      {getStatusBadge(child.attendanceToday.morning)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Afternoon</span>
                      {getStatusBadge(child.attendanceToday.afternoon)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Attendance not marked yet</p>
                )}
              </div>

              {/* Fees Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" />Fees Status</h4>
                {child.totalFee > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due</span>
                      <span className={`font-semibold ${child.feesDue > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{child.feesDue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">₹{child.totalFee.toLocaleString()}</span>
                    </div>
                    <Progress value={child.totalFee > 0 ? ((child.totalFee - child.feesDue) / child.totalFee) * 100 : 0} className="h-2" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Fee data not available</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Quick Actions</h4>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => window.location.href = `/parent/child-performance?childId=${child.id}`}>
                    <TrendingUp className="h-4 w-4 mr-2" />Performance
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => window.location.href = `/parent/download-report?childId=${child.id}`}>
                    <BookOpen className="h-4 w-4 mr-2" />Report Card
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      })}
    </div>
  );
}
