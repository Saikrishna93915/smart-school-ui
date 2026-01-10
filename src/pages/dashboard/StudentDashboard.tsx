import { useState, useEffect } from 'react';
import axios from 'axios';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserCheck, BookOpen, Trophy, Calendar, Clock, ChevronRight } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// Static data (unchanged)
const subjectData = [
  { subject: 'Math', score: 92, fullMark: 100 },
  { subject: 'Science', score: 88, fullMark: 100 },
  { subject: 'English', score: 85, fullMark: 100 },
  { subject: 'Hindi', score: 90, fullMark: 100 },
  { subject: 'SST', score: 82, fullMark: 100 },
  { subject: 'Computer', score: 95, fullMark: 100 },
];

const todaySchedule = [
  { id: 1, time: '08:30', subject: 'Mathematics', teacher: 'Priya Ma\'am', room: '301' },
  { id: 2, time: '09:30', subject: 'English', teacher: 'Rahul Sir', room: '302' },
  { id: 3, time: '10:45', subject: 'Science', teacher: 'Meera Ma\'am', room: 'Lab 1' },
  { id: 4, time: '11:45', subject: 'Hindi', teacher: 'Sharma Ji', room: '301' },
  { id: 5, time: '02:00', subject: 'Computer', teacher: 'Vikram Sir', room: 'Lab 2' },
];

const upcomingExams = [
  { id: 1, subject: 'Mathematics', date: 'Dec 15', type: 'Mid-term' },
  { id: 2, subject: 'Science', date: 'Dec 16', type: 'Mid-term' },
  { id: 3, subject: 'English', date: 'Dec 17', type: 'Mid-term' },
];

const achievements = [
  { id: 1, title: 'Perfect Attendance', icon: '🏆', date: 'Nov 2024' },
  { id: 2, title: 'Math Olympiad', icon: '🥇', date: 'Oct 2024' },
  { id: 3, title: 'Science Fair Winner', icon: '🔬', date: 'Sep 2024' },
];

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:8080/api/student/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setStudentData(response.data.data);
        } else {
          throw new Error('Failed to fetch student data');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/5">
          <p className="text-destructive text-lg font-semibold">Error loading dashboard</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg">No student data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {studentData.name}!</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="secondary">Class {studentData.className}-{studentData.section}</Badge>
          <Badge variant="outline">Admission No. {studentData.admissionNumber}</Badge>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            {studentData.gender}
          </Badge>
          {studentData.status && (
            <Badge className={`${
              studentData.status === 'active' 
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            }`}>
              {studentData.status}
            </Badge>
          )}
        </div>
        {studentData.fatherName && (
          <p className="text-sm text-muted-foreground mt-2">
            Father: {studentData.fatherName} | Mother: {studentData.motherName}
          </p>
        )}
        {studentData.address && (
          <p className="text-sm text-muted-foreground">
            {studentData.address.city}, {studentData.address.state}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          value="92%"
          subtitle="This semester"
          icon={UserCheck}
          trend={{ value: 2.5, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Overall Grade"
          value="A"
          subtitle="Class Rank: 5th"
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Achievements"
          value="12"
          subtitle="This year"
          icon={Trophy}
          variant="warning"
        />
        <StatCard
          title="Upcoming Exams"
          value="3"
          subtitle="Starting Dec 15"
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Performance Radar & Today's Schedule */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={subjectData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today's Classes</CardTitle>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                5 classes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.map((cls, index) => (
              <div
                key={cls.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  index === 2 ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-bold">{cls.time}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1">
                  <p className="font-medium">{cls.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {cls.teacher} • Room {cls.room}
                  </p>
                </div>
                {index === 2 && (
                  <Badge variant="success">Now</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Exams & Achievements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Exams</CardTitle>
              <Badge variant="warning">3 exams</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-warning/5 border-warning/20"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">{exam.subject}</p>
                    <p className="text-xs text-muted-foreground">{exam.type}</p>
                  </div>
                </div>
                <Badge variant="outline">{exam.date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
              <Badge variant="success">
                <Trophy className="h-3 w-3 mr-1" />
                12 total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}