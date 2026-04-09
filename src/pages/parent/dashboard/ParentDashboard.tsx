import React from 'react';
import { Bell, Calendar, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChildPerformance from '../child/ChildPerformance';
import DownloadReport from '../child/DownloadReport';
import Comparison from '../child/Comparison';

const ParentDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">Rahul Kumar • Class 10A</p>
        </div>
        <Button variant="outline"><Bell className="h-4 w-4 mr-2" />Notifications</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Overall %</p><p className="text-2xl font-bold">76.5%</p></div><TrendingUp className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Rank</p><p className="text-2xl font-bold">#8</p></div><Award className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Attendance</p><p className="text-2xl font-bold">90%</p></div><Calendar className="h-5 w-5" /></CardContent></Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Child Performance</TabsTrigger>
          <TabsTrigger value="download">Download Report</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance"><ChildPerformance /></TabsContent>
        <TabsContent value="download"><DownloadReport /></TabsContent>
        <TabsContent value="comparison"><Comparison /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentDashboard;
