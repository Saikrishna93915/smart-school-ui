import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Brain, AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Target, BookOpen, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const atRiskStudents = [
  {
    id: 1,
    name: 'Rohit Sharma',
    class: '10-A',
    riskScore: 78,
    factors: ['Low attendance (68%)', 'Declining grades in Math', 'Missed 5 assignments'],
    trend: 'declining',
    recommendation: 'Schedule parent-teacher meeting and assign peer tutor for Mathematics.',
  },
  {
    id: 2,
    name: 'Priya Patel',
    class: '9-B',
    riskScore: 62,
    factors: ['Grade drop in Science', 'Less class participation'],
    trend: 'stable',
    recommendation: 'Provide additional learning resources and one-on-one sessions.',
  },
  {
    id: 3,
    name: 'Amit Kumar',
    class: '10-B',
    riskScore: 55,
    factors: ['Frequent tardiness', 'Incomplete homework'],
    trend: 'improving',
    recommendation: 'Monitor progress and encourage timely submissions with rewards.',
  },
];

const classPerformance = [
  { class: '10-A', avgScore: 82, topSubject: 'Mathematics', weakSubject: 'Hindi' },
  { class: '10-B', avgScore: 78, topSubject: 'Science', weakSubject: 'English' },
  { class: '9-A', avgScore: 85, topSubject: 'English', weakSubject: 'Science' },
  { class: '9-B', avgScore: 80, topSubject: 'Hindi', weakSubject: 'Mathematics' },
];

const subjectAnalysis = [
  { subject: 'Math', classAvg: 78, schoolAvg: 75, fullMark: 100 },
  { subject: 'Science', classAvg: 82, schoolAvg: 80, fullMark: 100 },
  { subject: 'English', classAvg: 75, schoolAvg: 77, fullMark: 100 },
  { subject: 'Hindi', classAvg: 80, schoolAvg: 78, fullMark: 100 },
  { subject: 'SST', classAvg: 76, schoolAvg: 74, fullMark: 100 },
];

const performanceTrend = [
  { month: 'Jun', score: 72 },
  { month: 'Jul', score: 74 },
  { month: 'Aug', score: 73 },
  { month: 'Sep', score: 76 },
  { month: 'Oct', score: 78 },
  { month: 'Nov', score: 80 },
];

const recommendations = [
  {
    id: 1,
    title: 'Increase Math Practice Sessions',
    description: 'Class 9-B shows 15% lower scores in Algebra. Recommend additional practice worksheets.',
    impact: 'high',
    icon: Target,
  },
  {
    id: 2,
    title: 'Parent Engagement Drive',
    description: '23 parents haven\'t logged in for 30+ days. Schedule engagement activities.',
    impact: 'medium',
    icon: Users,
  },
  {
    id: 3,
    title: 'Reading Improvement Program',
    description: 'English comprehension scores are 8% below target. Introduce daily reading sessions.',
    impact: 'high',
    icon: BookOpen,
  },
];

const riskScoreColor = (score: number) => {
  if (score >= 70) return 'text-destructive';
  if (score >= 50) return 'text-warning';
  return 'text-success';
};

export default function AIInsights() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Intelligence Hub</h1>
              <p className="text-muted-foreground">Predictive analytics and actionable insights</p>
            </div>
          </div>
          <Badge variant="secondary" className="animate-pulse">
            <span className="w-2 h-2 bg-success rounded-full mr-2" />
            AI Model Updated
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="At-Risk Students"
            value="23"
            subtitle="Need intervention"
            icon={AlertTriangle}
            trend={{ value: 8, isPositive: false }}
            variant="danger"
          />
          <StatCard
            title="Performance Score"
            value="78.5"
            subtitle="School average"
            icon={Target}
            trend={{ value: 4.2, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Predictions Made"
            value="1,248"
            subtitle="This semester"
            icon={Brain}
            variant="primary"
          />
          <StatCard
            title="Accuracy Rate"
            value="94.2%"
            subtitle="Model confidence"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        {/* At-Risk Students */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Students At Risk
              </CardTitle>
              <Button variant="outline" size="sm">
                View All 23 Students
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {atRiskStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-destructive/20">
                      <AvatarFallback className="bg-destructive/10 text-destructive font-bold">
                        {student.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">Class {student.class}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className={`text-2xl font-bold ${riskScoreColor(student.riskScore)}`}>
                        {student.riskScore}
                      </span>
                    </div>
                    <Badge
                      variant={student.trend === 'improving' ? 'success' : student.trend === 'stable' ? 'warning' : 'destructive'}
                      className="mt-1"
                    >
                      {student.trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {student.trend === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {student.trend}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Risk Factors:</p>
                  <div className="flex flex-wrap gap-2">
                    {student.factors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary">AI Recommendation</p>
                    <p className="text-sm text-muted-foreground">{student.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subject Analysis Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectAnalysis}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Radar
                      name="Class Avg"
                      dataKey="classAvg"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="School Avg"
                      dataKey="schoolAvg"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Class Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-xs text-muted-foreground">School Average</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">School Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                      formatter={(value: number) => [`${value}%`, 'Avg Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--success))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((rec) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-lg border hover:shadow-card transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{rec.title}</p>
                          <Badge
                            variant={rec.impact === 'high' ? 'destructive' : 'warning'}
                            className="text-[10px]"
                          >
                            {rec.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
