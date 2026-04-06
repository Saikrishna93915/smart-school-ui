import React from 'react';
import { Award, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyMarks from '../performance/MyMarks';
import ProgressGraph from '../performance/ProgressGraph';
import ReportCard from '../performance/ReportCard';

const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Rahul Kumar • Class 10A • Roll 101</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Overall %</p><p className="text-2xl font-bold">76.5%</p></div><TrendingUp className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Class Rank</p><p className="text-2xl font-bold">#8</p></div><Award className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Attendance</p><p className="text-2xl font-bold">90%</p></div><Calendar className="h-5 w-5" /></CardContent></Card>
      </div>

      <Tabs defaultValue="marks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marks">My Marks</TabsTrigger>
          <TabsTrigger value="graph">Progress Graph</TabsTrigger>
          <TabsTrigger value="report">Report Card</TabsTrigger>
        </TabsList>

        <TabsContent value="marks"><MyMarks /></TabsContent>
        <TabsContent value="graph"><ProgressGraph /></TabsContent>
        <TabsContent value="report"><ReportCard /></TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
