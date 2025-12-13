import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, ClipboardList, Trophy, TrendingUp, FileText } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const upcomingExams = [
  { id: 1, name: 'Mid-Term Examination', startDate: 'Dec 15, 2024', endDate: 'Dec 22, 2024', classes: 'All Classes', type: 'Term Exam', status: 'scheduled' },
  { id: 2, name: 'Unit Test 3 - Science', startDate: 'Dec 5, 2024', endDate: 'Dec 5, 2024', classes: '9-A, 9-B', type: 'Unit Test', status: 'scheduled' },
  { id: 3, name: 'Weekly Quiz - Math', startDate: 'Dec 2, 2024', endDate: 'Dec 2, 2024', classes: '10-A, 10-B', type: 'Quiz', status: 'completed' },
];

const recentResults = [
  { id: 1, name: 'Unit Test 2 - Mathematics', date: 'Nov 25, 2024', class: '10-A', avgScore: 78, topScore: 98, passRate: 92 },
  { id: 2, name: 'Unit Test 2 - English', date: 'Nov 23, 2024', class: '10-A', avgScore: 82, topScore: 95, passRate: 96 },
  { id: 3, name: 'Weekly Quiz - Science', date: 'Nov 20, 2024', class: '9-B', avgScore: 75, topScore: 92, passRate: 88 },
];

const classPerformance = [
  { class: '10-A', Math: 82, Science: 78, English: 85, Hindi: 80, SST: 76 },
  { class: '10-B', Math: 75, Science: 80, English: 78, Hindi: 82, SST: 74 },
  { class: '9-A', Math: 88, Science: 85, English: 82, Hindi: 86, SST: 80 },
  { class: '9-B', Math: 72, Science: 76, English: 80, Hindi: 78, SST: 75 },
];

const statusStyles = {
  scheduled: 'bg-primary/10 text-primary',
  ongoing: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

export default function Exams() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Exams & Results</h1>
            <p className="text-muted-foreground">Manage examinations and view results</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Upcoming Exams"
            value="3"
            subtitle="This month"
            icon={Calendar}
            variant="primary"
          />
          <StatCard
            title="Results Published"
            value="12"
            subtitle="This semester"
            icon={ClipboardList}
            variant="success"
          />
          <StatCard
            title="Avg. Pass Rate"
            value="92%"
            subtitle="All classes"
            icon={Trophy}
            trend={{ value: 3.2, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Top Score"
            value="98/100"
            subtitle="Mathematics"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="results">Recent Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Scheduled Examinations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{exam.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline">{exam.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {exam.startDate} {exam.endDate !== exam.startDate && `- ${exam.endDate}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Classes: {exam.classes}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusStyles[exam.status as keyof typeof statusStyles]}>
                        {exam.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Published Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{result.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline">Class {result.class}</Badge>
                          <span className="text-sm text-muted-foreground">{result.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.avgScore}%</p>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">{result.passRate}%</p>
                        <p className="text-xs text-muted-foreground">Pass Rate</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class-wise Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformance} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="class"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        domain={[0, 100]}
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
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                      <Bar dataKey="Math" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Science" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="English" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Hindi" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="SST" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Math</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-secondary" />
                    <span className="text-xs text-muted-foreground">Science</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span className="text-xs text-muted-foreground">English</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Hindi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <span className="text-xs text-muted-foreground">SST</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
