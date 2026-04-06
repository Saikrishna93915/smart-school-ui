import { StatCard } from '@/components/dashboard/StatCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, Users, UserCheck, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickActions } from '@/components/dashboard/QuickActions';

const todaysClasses = [
  { id: 1, class: '10-A', subject: 'Mathematics', time: '08:30 AM', status: 'completed' },
  { id: 2, class: '9-B', subject: 'Mathematics', time: '10:00 AM', status: 'completed' },
  { id: 3, class: '10-B', subject: 'Mathematics', time: '11:30 AM', status: 'current' },
  { id: 4, class: '8-A', subject: 'Mathematics', time: '02:00 PM', status: 'upcoming' },
];

const atRiskStudents = [
  { id: 1, name: 'Rohit Sharma', class: '10-A', reason: 'Low attendance (68%)', risk: 'high' },
  { id: 2, name: 'Priya Patel', class: '9-B', reason: 'Declining grades', risk: 'medium' },
  { id: 3, name: 'Amit Kumar', class: '10-B', reason: 'Missed 3 assignments', risk: 'medium' },
];

const aiInsights = [
  {
    id: '1',
    type: 'risk' as const,
    title: 'Student Needs Support',
    description: 'Rohit Sharma (10-A) has missed 5 classes this week. Consider reaching out.',
    severity: 'high' as const,
    studentName: 'Rohit Sharma',
  },
  {
    id: '2',
    type: 'recommendation' as const,
    title: 'Teaching Suggestion',
    description: 'Class 9-B struggles with Algebra. Try visual examples for better understanding.',
    severity: 'low' as const,
  },
];

const statusStyles = {
  completed: 'bg-success/10 text-success',
  current: 'bg-primary/10 text-primary',
  upcoming: 'bg-muted text-muted-foreground',
};

const riskStyles = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
};

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good Morning, Priya!</h1>
          <p className="text-muted-foreground">Here's your teaching schedule for today</p>
        </div>
        <Button>
          <UserCheck className="h-4 w-4 mr-2" />
          Quick Attendance
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Classes Today"
          value="4"
          subtitle="2 completed, 1 ongoing"
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Total Students"
          value="156"
          subtitle="Across 4 sections"
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Attendance Marked"
          value="2/4"
          subtitle="Classes today"
          icon={UserCheck}
          variant="warning"
        />
        <StatCard
          title="Next Class"
          value="8-A"
          subtitle="Mathematics at 2:00 PM"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Today's Schedule & AI Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysClasses.map((cls) => (
              <div
                key={cls.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  cls.status === 'current' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold">{cls.time.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{cls.time.split(' ')[1]}</p>
                  </div>
                  <div>
                    <p className="font-medium">Class {cls.class}</p>
                    <p className="text-sm text-muted-foreground">{cls.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusStyles[cls.status as keyof typeof statusStyles]}>
                    {cls.status}
                  </Badge>
                  {cls.status === 'current' && (
                    <Button size="sm">
                      Mark Attendance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <AIInsightCard insights={aiInsights} />
      </div>

      {/* Quick Actions & My Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        <QuickActions role="teacher" />
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                My Weekly Schedule
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/timetable')}
              >
                View Full <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click "View Full" to see your complete weekly timetable with all assigned classes.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {todaysClasses.slice(0, 4).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{cls.class}</p>
                    <p className="text-xs text-muted-foreground">{cls.time}</p>
                  </div>
                  <Badge className={statusStyles[cls.status as keyof typeof statusStyles]}>
                    {cls.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Students Needing Attention</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {atRiskStudents.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-4 rounded-lg border ${riskStyles[student.risk as keyof typeof riskStyles]}`}
              >
                <Avatar className="h-10 w-10 border-2">
                  <AvatarFallback className="text-sm">
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{student.name}</p>
                  <p className="text-xs opacity-80">Class {student.class}</p>
                  <p className="text-xs mt-1">{student.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
