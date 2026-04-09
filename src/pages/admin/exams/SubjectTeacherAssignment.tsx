import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SubjectTeacherAssignment: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [query, setQuery] = useState('');

  const teachers = [
    { id: 1, name: 'Mr. Rajesh Sharma', subject: 'Mathematics', available: true },
    { id: 2, name: 'Mrs. Priya Gupta', subject: 'Science', available: true },
    { id: 3, name: 'Ms. Anita Reddy', subject: 'English', available: true },
    { id: 4, name: 'Mr. Suresh Verma', subject: 'Hindi', available: false },
    { id: 5, name: 'Mrs. Geeta Singh', subject: 'Social Studies', available: true }
  ];

  const assignments = [
    { subject: 'Mathematics', teacher: 'Mr. Rajesh Sharma', status: 'Assigned' },
    { subject: 'Science', teacher: 'Mrs. Priya Gupta', status: 'Assigned' },
    { subject: 'English', teacher: 'Not Assigned', status: 'Pending' },
    { subject: 'Hindi', teacher: 'Mr. Suresh Verma', status: 'Assigned' },
    { subject: 'Social Studies', teacher: 'Mrs. Geeta Singh', status: 'Assigned' }
  ];

  const filteredTeachers = useMemo(
    () => teachers.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.subject.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map((c) => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['A','B','C','D'].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Search Teacher</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by teacher or subject" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments - Class {selectedClass}{selectedSection}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((item) => (
                <TableRow key={item.subject}>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{item.teacher}</TableCell>
                  <TableCell>{item.status === 'Assigned' ? <Badge>Assigned</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm">Change</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Teachers</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="rounded-md border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{teacher.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {teacher.available ? <Badge>Available</Badge> : <Badge variant="outline">Busy</Badge>}
                <Button size="sm">Assign</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectTeacherAssignment;
