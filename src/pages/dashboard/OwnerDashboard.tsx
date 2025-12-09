import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const revenueData = [
  { month: 'Apr', revenue: 85, expenses: 45 },
  { month: 'May', revenue: 92, expenses: 48 },
  { month: 'Jun', revenue: 88, expenses: 44 },
  { month: 'Jul', revenue: 95, expenses: 52 },
  { month: 'Aug', revenue: 102, expenses: 55 },
  { month: 'Sep', revenue: 98, expenses: 50 },
  { month: 'Oct', revenue: 110, expenses: 58 },
  { month: 'Nov', revenue: 115, expenses: 60 },
];

const alerts = [
  { id: 1, type: 'warning', message: '15 students have pending fees above ₹50,000', time: '2 hours ago' },
  { id: 2, type: 'info', message: 'Teacher salary disbursement pending for 3 staff', time: '1 day ago' },
  { id: 3, type: 'success', message: 'Fee collection target achieved for November', time: '2 days ago' },
];

const alertStyles = {
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
};

export default function OwnerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <p className="text-muted-foreground">Financial overview and business insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="₹1.2Cr"
          subtitle="Academic Year 2024-25"
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Students Enrolled"
          value="1,248"
          subtitle="+86 this quarter"
          icon={Users}
          trend={{ value: 7.4, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="Outstanding Fees"
          value="₹18.5L"
          subtitle="142 students pending"
          icon={CreditCard}
          trend={{ value: 2.1, isPositive: false }}
          variant="warning"
        />
        <StatCard
          title="Branches"
          value="3"
          subtitle="All operational"
          icon={Building2}
          variant="default"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue vs Expenses (in Lakhs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `₹${value}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`₹${value}L`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Important Alerts</CardTitle>
            <Badge variant="outline">{alerts.length} Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${alertStyles[alert.type as keyof typeof alertStyles]}`}
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs opacity-70 mt-1">{alert.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
