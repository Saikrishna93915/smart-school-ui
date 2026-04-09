import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const subjects = [
  { name: 'Mathematics', teacher: 'Mr. Sharma', entries: 40, pending: 0, verified: false },
  { name: 'Science', teacher: 'Mrs. Gupta', entries: 40, pending: 0, verified: false },
  { name: 'English', teacher: 'Ms. Reddy', entries: 38, pending: 2, verified: false },
  { name: 'Hindi', teacher: 'Mr. Verma', entries: 25, pending: 15, verified: false },
  { name: 'Social Studies', teacher: 'Mrs. Singh', entries: 40, pending: 0, verified: true }
];

const VerifyMarks: React.FC = () => {
  const verified = subjects.filter((s) => s.verified).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Marks - Class 10A - Unit Test 1</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Verification Progress</span><span>{verified}/{subjects.length}</span></div>
          <Progress value={(verified / subjects.length) * 100} className="h-2" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.name}>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.teacher}</TableCell>
                <TableCell>{subject.entries}/40</TableCell>
                <TableCell>{subject.pending}</TableCell>
                <TableCell>{subject.verified ? <Badge>Verified</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" disabled={subject.pending > 0 || subject.verified}><CheckCircle className="h-4 w-4 mr-1" />Verify</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VerifyMarks;
