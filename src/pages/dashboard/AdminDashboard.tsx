import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { TimetableCard } from '@/components/dashboard/TimetableCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { Users, UserCheck, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dashboardService from '@/Services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import { attendanceApi } from '@/Services/attendanceApi';
import activityApi from '@/Services/activityApi';

type AttendanceSession = 'morning' | 'afternoon' | 'full-day';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceSession>('full-day');
  const [activityCount, setActivityCount] = useState(20);
  const [activityType, setActivityType] = useState('all');
  const [daysFilter, setDaysFilter] = useState(7);
  const [feeSort, setFeeSort] = useState<'highest' | 'lowest'>('highest');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    presentCount: 0,
    absentCount: 0,
    feeCollected: 0,
    feePending: 0,
    atRiskStudents: 0,
    defaulters: 0,
  });
  const [sessionStats, setSessionStats] = useState<Record<AttendanceSession, { present: number; absent: number; total: number }>>({
    'morning': { present: 0, absent: 0, total: 0 },
    'afternoon': { present: 0, absent: 0, total: 0 },
    'full-day': { present: 0, absent: 0, total: 0 }
  });
  const [chartData, setChartData] = useState<{
    attendance: Array<{
      _id: string;
      total: number;
      present: number;
      absent: number;
      percentage?: number;
    }>;
    fees: Array<{
      _id: string;
      className: string;
      totalFee: number;
      paid: number;
      unpaid: number;
      studentCount: number;
      totalAmount: number;
    }>;
  }>({
    attendance: [],
    fees: [],
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getAdminSummary();
      const { overview, fees, attendance } = data.data;

      // Calculate attendance percentage (full-day overall)
      const totalMarked = attendance.today.totalMarked || 0;
      const presentCount = attendance.today.presentCount || 0;
      const attendancePercentage = totalMarked > 0 
        ? Math.round((presentCount / totalMarked) * 100) 
        : 0;

      setStats({
        totalStudents: overview.totalStudents,
        attendanceToday: attendancePercentage,
        presentCount: presentCount,
        absentCount: attendance.today.absentCount || 0,
        feeCollected: fees.monthly.totalCollected || 0,
        feePending: fees.overall.totalDueAmount || 0,
        atRiskStudents: overview.lowAttendanceStudents,
        defaulters: overview.defaulters,
      });

      // Fetch session-based attendance stats for today
      const todayDate = new Date().toISOString().split('T')[0];
      try {
        const attendanceRecords = await attendanceApi.getRecords('all', 'all', todayDate);
        
        // Calculate stats for each session
        let morningPresent = 0, morningAbsent = 0;
        let afternoonPresent = 0, afternoonAbsent = 0;
        let fullDayPresent = 0, fullDayAbsent = 0;
        let totalStudents = 0;
        
        const processedStudents = new Set<string>();
        
        attendanceRecords.forEach((record: any) => {
          const studentId = record.studentId?._id || record.studentId;
          if (!processedStudents.has(studentId)) {
            processedStudents.add(studentId);
            totalStudents++;
            
            const morning = record.sessions?.morning;
            const afternoon = record.sessions?.afternoon;
            
            // Morning: check morning session only
            if (morning === 'present' || morning === true) {
              morningPresent++;
            } else if (morning === 'absent' || morning === false) {
              morningAbsent++;
            }
            
            // Afternoon: check afternoon session only
            if (afternoon === 'present' || afternoon === true) {
              afternoonPresent++;
            } else if (afternoon === 'absent' || afternoon === false) {
              afternoonAbsent++;
            }
            
            // Full-day: both sessions must be present
            if ((morning === 'present' || morning === true) && (afternoon === 'present' || afternoon === true)) {
              fullDayPresent++;
            } else if ((morning === 'absent' || morning === false) && (afternoon === 'absent' || afternoon === false)) {
              fullDayAbsent++;
            }
          }
        });

        setSessionStats({
          'morning': { 
            present: morningPresent, 
            absent: morningAbsent, 
            total: morningPresent + morningAbsent 
          },
          'afternoon': { 
            present: afternoonPresent, 
            absent: afternoonAbsent, 
            total: afternoonPresent + afternoonAbsent 
          },
          'full-day': { 
            present: fullDayPresent, 
            absent: totalStudents - fullDayPresent,
            total: totalStudents
          }
        });

        // Fetch and calculate weekly full-day attendance
        const weeklyData = [];
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        // Get attendance for last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          try {
            const dayRecords = await attendanceApi.getRecords('all', 'all', dateStr);
            
            let dayFullDayPresent = 0;
            let dayTotal = 0;
            const dayProcessedStudents = new Set<string>();
            
            dayRecords.forEach((record: any) => {
              const studentId = record.studentId?._id || record.studentId;
              if (!dayProcessedStudents.has(studentId)) {
                dayProcessedStudents.add(studentId);
                dayTotal++;
                
                const morning = record.sessions?.morning;
                const afternoon = record.sessions?.afternoon;
                
                // Count as present only if BOTH sessions are present (full-day)
                if ((morning === 'present' || morning === true) && (afternoon === 'present' || afternoon === true)) {
                  dayFullDayPresent++;
                }
              }
            });

            const dayOfWeek = date.getDay();
            const dayName = daysOfWeek[(dayOfWeek + 6) % 7]; // Convert JS day (0=Sun) to Mon-Sun
            
            weeklyData.push({
              _id: dayName,
              total: dayTotal,
              present: dayFullDayPresent,
              absent: dayTotal - dayFullDayPresent,
              percentage: dayTotal > 0 ? Math.round((dayFullDayPresent / dayTotal) * 100) : 0
            });
          } catch (err) {
            console.warn(`Could not fetch attendance for ${dateStr}:`, err);
          }
        }

        setChartData({
          attendance: weeklyData.length > 0 ? weeklyData : [],
          fees: (fees.byClass || []) as any,
        });
      } catch (err) {
        console.warn('Could not fetch detailed session stats:', err);
        setChartData({
          attendance: attendance.trend || [],
          fees: (fees.byClass || []) as any,
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async (count: number, type: string = 'all', days: number = 7, sort: 'highest' | 'lowest' = 'highest') => {
    try {
      setActivitiesLoading(true);
      const data = await activityApi.getRecentActivities(count, type, days, sort);
      setRecentActivities(data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent activities',
        variant: 'destructive',
      });
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleActivityCountChange = (count: number) => {
    setActivityCount(count);
    loadRecentActivities(count, activityType, daysFilter, feeSort);
  };

  const handleActivityTypeChange = (type: string) => {
    setActivityType(type);
    loadRecentActivities(activityCount, type, daysFilter, feeSort);
  };

  const handleDaysFilterChange = (days: number) => {
    setDaysFilter(days);
    loadRecentActivities(activityCount, activityType, days, feeSort);
  };

  const handleFeeSortChange = (sort: 'highest' | 'lowest') => {
    setFeeSort(sort);
    loadRecentActivities(activityCount, activityType, daysFilter, sort);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadDashboard(),
        loadRecentActivities(activityCount, activityType, daysFilter, feeSort)
      ]);
      toast({
        title: 'Success',
        description: 'Dashboard data refreshed',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadRecentActivities(activityCount, activityType, daysFilter, feeSort);
  }, []);

  const generateAIInsights = () => {
    const insights = [];

    // Fee-related insight
    if (stats.defaulters > 10) {
      insights.push({
        id: '1',
        type: 'risk' as const,
        title: `High Fee Defaults - ${stats.defaulters} Students`,
        description: `${stats.defaulters} students have pending fee dues totaling ₹${dashboardService.formatCurrency(stats.feePending).replace('₹', '')}. Consider sending automated reminders to parents.`,
        severity: 'high' as const,
      });
    }

    // Attendance-related insight
    if (stats.atRiskStudents > 5) {
      insights.push({
        id: '2',
        type: 'risk' as const,
        title: `Low Attendance - ${stats.atRiskStudents} Students`,
        description: `${stats.atRiskStudents} students have attendance below 75% this month. Schedule parent-teacher meetings to address absences.`,
        severity: 'high' as const,
      });
    }

    // Today's attendance insight
    if (stats.attendanceToday < 90) {
      insights.push({
        id: '3',
        type: 'trend' as const,
        title: `Today's Attendance Below Target`,
        description: `Only ${stats.attendanceToday}% students present today (${stats.presentCount}/${stats.presentCount + stats.absentCount}). Follow up on absences.`,
        severity: 'medium' as const,
      });
    }

    // Positive insight
    if (stats.feeCollected > 500000) {
      insights.push({
        id: '4',
        type: 'recommendation' as const,
        title: 'Strong Fee Collection',
        description: `This month's fee collection of ₹${dashboardService.formatCurrency(stats.feeCollected).replace('₹', '')} is on track. Maintain momentum for year-end targets.`,
        severity: 'low' as const,
      });
    }

    // Default insights if none generated
    if (insights.length === 0) {
      insights.push(
        {
          id: '1',
          type: 'trend' as const,
          title: 'School Performance Stable',
          description: 'All key metrics are within normal range. Continue monitoring attendance and fee collection.',
          severity: 'low' as const,
        },
        {
          id: '2',
          type: 'recommendation' as const,
          title: 'Fee Collection Healthy',
          description: 'Monthly fee collection is on pace. Keep up the current collection strategy.',
          severity: 'low' as const,
        }
      );
    }

    return insights;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of school performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Attendance Session Selector */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground">Attendance (by session):</span>
        <div className="flex gap-2">
          <Button
            variant={activeSession === 'morning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSession('morning')}
          >
            Morning
          </Button>
          <Button
            variant={activeSession === 'afternoon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSession('afternoon')}
          >
            Afternoon
          </Button>
          <Button
            variant={activeSession === 'full-day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSession('full-day')}
          >
            Full Day
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          subtitle={`Active students`}
          icon={Users}
          gradient="from-blue-500 to-blue-600"
          loading={loading}
        />
        <StatCard
          title={`Attendance Today (${activeSession === 'morning' ? 'Morning' : activeSession === 'afternoon' ? 'Afternoon' : 'Full-Day'})`}
          value={`${sessionStats[activeSession].total > 0 ? Math.round((sessionStats[activeSession].present / sessionStats[activeSession].total) * 100) : 0}%`}
          subtitle={`${sessionStats[activeSession].present} present`}
          icon={UserCheck}
          gradient="from-green-500 to-green-600"
          loading={loading}
        />
        <StatCard
          title="Fee Collected (Month)"
          value={dashboardService.formatCurrency(stats.feeCollected)}
          subtitle={`Pending: ${dashboardService.formatCurrency(stats.feePending)}`}
          icon={CreditCard}
          gradient="from-orange-500 to-orange-600"
          loading={loading}
        />
        <StatCard
          title="At-Risk Students"
          value={stats.atRiskStudents}
          subtitle={`Low attendance`}
          icon={AlertTriangle}
          gradient="from-red-500 to-red-600"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceChart 
          data={chartData.attendance} 
          loading={loading}
        />
        <FeeCollectionChart 
          data={chartData.fees} 
          loading={loading}
        />
      </div>

      {/* AI Insights & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AIInsightCard insights={generateAIInsights()} className="lg:col-span-2" />
        <QuickActions role="admin" />
      </div>

      {/* Timetable Management */}
      <TimetableCard />

      {/* Recent Activity */}
      <RecentActivity 
        activities={recentActivities}
        loading={activitiesLoading}
        activityCount={activityCount}
        onActivityCountChange={handleActivityCountChange}
        activityType={activityType}
        onActivityTypeChange={handleActivityTypeChange}
        daysFilter={daysFilter}
        onDaysFilterChange={handleDaysFilterChange}
        feeSort={feeSort}
        onFeeSortChange={handleFeeSortChange}
      />
    </div>
  );
}
