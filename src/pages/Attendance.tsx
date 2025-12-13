import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users, UserCheck, UserX, Clock, Save, Send } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

const classStudents = [
  { id: 1, name: 'Arjun Verma', rollNo: '01', present: true },
  { id: 2, name: 'Priya Patel', rollNo: '02', present: true },
  { id: 3, name: 'Rohit Sharma', rollNo: '03', present: false },
  { id: 4, name: 'Kavya Singh', rollNo: '04', present: true },
  { id: 5, name: 'Amit Kumar', rollNo: '05', present: true },
  { id: 6, name: 'Neha Gupta', rollNo: '06', present: true },
  { id: 7, name: 'Rahul Joshi', rollNo: '07', present: false },
  { id: 8, name: 'Meera Nair', rollNo: '08', present: true },
  { id: 9, name: 'Vikram Singh', rollNo: '09', present: true },
  { id: 10, name: 'Anita Desai', rollNo: '10', present: true },
  { id: 11, name: 'Karan Malhotra', rollNo: '11', present: false },
  { id: 12, name: 'Pooja Sharma', rollNo: '12', present: true },
];

const absenteeList = [
  { id: 3, name: 'Rohit Sharma', class: '10-A', parent: 'Mohan Sharma', phone: '+91 98765 43212', consecutiveDays: 3 },
  { id: 7, name: 'Rahul Joshi', class: '10-A', parent: 'Prakash Joshi', phone: '+91 98765 43216', consecutiveDays: 1 },
  { id: 11, name: 'Karan Malhotra', class: '10-B', parent: 'Sunil Malhotra', phone: '+91 98765 43220', consecutiveDays: 2 },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState(classStudents);

  const presentCount = students.filter((s) => s.present).length;
  const absentCount = students.filter((s) => !s.present).length;
  const attendancePercentage = Math.round((presentCount / students.length) * 100);

  const toggleAttendance = (id: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
  };

  return (
  
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Mark and track student attendance</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-lg border bg-background"
            />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9-A">Class 9-A</SelectItem>
                <SelectItem value="9-B">Class 9-B</SelectItem>
                <SelectItem value="10-A">Class 10-A</SelectItem>
                <SelectItem value="10-B">Class 10-B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Students"
            value={students.length}
            subtitle={`Class ${selectedClass}`}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Present Today"
            value={presentCount}
            subtitle={`${attendancePercentage}% attendance`}
            icon={UserCheck}
            variant="success"
          />
          <StatCard
            title="Absent Today"
            value={absentCount}
            subtitle="Need attention"
            icon={UserX}
            variant="danger"
          />
          <StatCard
            title="Marked At"
            value="09:15 AM"
            subtitle="Today"
            icon={Clock}
            variant="default"
          />
        </div>

        {/* Mark Attendance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mark Attendance - Class {selectedClass}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  Mark All Present
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => toggleAttendance(student.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    student.present
                      ? 'border-success bg-success/5 hover:bg-success/10'
                      : 'border-destructive bg-destructive/5 hover:bg-destructive/10'
                  }`}
                >
                  <Checkbox
                    checked={student.present}
                    className={student.present ? 'border-success data-[state=checked]:bg-success' : 'border-destructive'}
                  />
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="text-xs">
                      {student.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Roll {student.rollNo}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Absentee List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today's Absentees</CardTitle>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Notify Parents
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {absenteeList.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-destructive/20">
                      <AvatarFallback className="bg-destructive/10 text-destructive">
                        {student.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Class {student.class} • Parent: {student.parent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {student.consecutiveDays > 1 && (
                      <Badge variant="destructive">
                        {student.consecutiveDays} days absent
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      Call Parent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}
