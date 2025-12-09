import { StatCard } from '@/components/dashboard/StatCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { Users, UserCheck, CreditCard, AlertTriangle } from 'lucide-react';

const aiInsights = [
  {
    id: '1',
    type: 'risk' as const,
    title: 'Academic Risk Detected',
    description: '3 students showing declining performance in Mathematics. Immediate intervention recommended.',
    severity: 'high' as const,
    studentName: 'Multiple Students',
  },
  {
    id: '2',
    type: 'trend' as const,
    title: 'Attendance Pattern',
    description: 'Class 9-B showing 15% lower attendance on Mondays. Consider scheduling engaging activities.',
    severity: 'medium' as const,
  },
  {
    id: '3',
    type: 'recommendation' as const,
    title: 'Fee Collection Insight',
    description: '12 parents have pending fees. Sending automated reminders could improve collection by 25%.',
    severity: 'low' as const,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school's performance and activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value="1,248"
          subtitle="Across 36 sections"
          icon={Users}
          trend={{ value: 5.2, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="Attendance Today"
          value="96.8%"
          subtitle="1,208 present"
          icon={UserCheck}
          trend={{ value: 2.1, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Fee Collected"
          value="₹12.5L"
          subtitle="This month"
          icon={CreditCard}
          trend={{ value: 8.4, isPositive: true }}
          variant="warning"
        />
        <StatCard
          title="At-Risk Students"
          value="23"
          subtitle="Need attention"
          icon={AlertTriangle}
          trend={{ value: 3, isPositive: false }}
          variant="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceChart />
        <FeeCollectionChart />
      </div>

      {/* AI Insights & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AIInsightCard insights={aiInsights} className="lg:col-span-2" />
        <QuickActions role="admin" />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
