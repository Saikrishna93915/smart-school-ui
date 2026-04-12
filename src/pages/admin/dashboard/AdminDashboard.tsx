import React from 'react';
import { Users, School, Clock, CheckCircle, AlertTriangle, PlusCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExamStructure from '../exams/ExamStructure';
import AllReports from '../reports/AllReports';

const weakStudents = [
  { id: 1, name: 'Rahul Kumar', className: '10A', subjects: 'Math, Science', attendance: 65 },
  { id: 2, name: 'Priya Singh', className: '9B', subjects: 'English', attendance: 72 }
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Academic Year: 2025-26</p>
        </div>
        <div className="flex gap-2">
          <Button><PlusCircle className="h-4 w-4 mr-2" />Create New Exam</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Students</p><p className="text-2xl font-bold">1250</p></div><Users className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Teachers</p><p className="text-2xl font-bold">48</p></div><School className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Exams Completed</p><p className="text-2xl font-bold">3</p></div><CheckCircle className="h-5 w-5" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Verification</p><p className="text-2xl font-bold">156</p></div><Clock className="h-5 w-5" /></CardContent></Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full md:w-[560px] grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exams">Exam Structure</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Assignment</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Students Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Weak Subjects</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weakStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{student.subjects}</TableCell>
                      <TableCell>{student.attendance}%</TableCell>
                      <TableCell>{student.attendance < 75 ? <Badge variant="destructive">High</Badge> : <Badge variant="outline">Medium</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams"><ExamStructure /></TabsContent>
        <TabsContent value="reports"><AllReports /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
