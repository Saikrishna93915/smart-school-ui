import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const rows = [
  { subject: 'Mathematics', className: '10A', students: 40, exam: 'Unit Test 1' },
  { subject: 'Mathematics', className: '9B', students: 38, exam: 'Unit Test 1' },
  { subject: 'Mathematics', className: '8C', students: 42, exam: 'Unit Test 1' }
];

const MySubjects: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>My Subjects</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Current Exam</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.subject}-${row.className}`}>
              <TableCell>{row.subject}</TableCell>
              <TableCell>{row.className}</TableCell>
              <TableCell>{row.students}</TableCell>
              <TableCell>{row.exam}</TableCell>
              <TableCell><Badge>Assigned</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default MySubjects;
