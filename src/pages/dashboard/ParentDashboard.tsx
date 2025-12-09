import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { UserCheck, BookOpen, CreditCard, Bell, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const childInfo = {
  name: 'Arjun Verma',
  class: '10-A',
  rollNo: '24',
  attendance: 92,
  overallGrade: 'A',
};

const performanceData = [
  { month: 'Jun', score: 78 },
  { month: 'Jul', score: 82 },
  { month: 'Aug', score: 79 },
  { month: 'Sep', score: 85 },
  { month: 'Oct', score: 88 },
  { month: 'Nov', score: 91 },
];

const notifications = [
  { id: 1, type: 'exam', message: 'Mid-term exams scheduled from Dec 15-22', time: '2 hours ago' },
  { id: 2, type: 'fee', message: 'Fee reminder: ₹8,500 due by Dec 10', time: '1 day ago' },
  { id: 3, type: 'event', message: 'Annual Sports Day on Dec 5', time: '2 days ago' },
  { id: 4, type: 'result', message: 'Unit test results published', time: '3 days ago' },
];

const subjectPerformance = [
  { subject: 'Mathematics', score: 92, grade: 'A+' },
  { subject: 'Science', score: 88, grade: 'A' },
  { subject: 'English', score: 85, grade: 'A' },
  { subject: 'Hindi', score: 90, grade: 'A+' },
  { subject: 'Social Studies', score: 82, grade: 'A' },
];

const notificationIcons = {
  exam: '📝',
  fee: '💰',
  event: '🎉',
  result: '📊',
};

export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      {/* Header with Child Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-primary/20">
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              AV
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{childInfo.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="secondary">Class {childInfo.class}</Badge>
              <Badge variant="outline">Roll No. {childInfo.rollNo}</Badge>
              <Badge variant="success">Grade {childInfo.overallGrade}</Badge>
            </div>
          </div>
        </div>
        <Button>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay Fees
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          value={`${childInfo.attendance}%`}
          subtitle="This semester"
          icon={UserCheck}
          trend={{ value: 3.2, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Overall Grade"
          value={childInfo.overallGrade}
          subtitle="Based on recent tests"
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Fee Status"
          value="₹8,500"
          subtitle="Due by Dec 10"
          icon={CreditCard}
          variant="warning"
        />
        <StatCard
          title="Notifications"
          value="4"
          subtitle="New updates"
          icon={Bell}
          variant="default"
        />
      </div>

      {/* Performance Chart & Subject Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Performance Trend</CardTitle>
              <Badge variant="success" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +13%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={[60, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{subject.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{subject.score}%</span>
                    <Badge variant="secondary" className="text-xs">{subject.grade}</Badge>
                  </div>
                </div>
                <Progress value={subject.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span className="text-xl">
                  {notificationIcons[notification.type as keyof typeof notificationIcons]}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
