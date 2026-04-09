import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const data = [
  { student: 'Rahul Kumar', percentage: 78.4, grade: 'A-', rank: 8, status: 'Ready' },
  { student: 'Priya Singh', percentage: 82.2, grade: 'A', rank: 5, status: 'Ready' },
  { student: 'Amit Sharma', percentage: 65.1, grade: 'B', rank: 15, status: 'Pending Remarks' }
];

const FinalReport: React.FC = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Final Class Report - 10A</CardTitle>
      <Button>Generate Class Report</Button>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Rank</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.student}>
              <TableCell>{item.student}</TableCell>
              <TableCell>{item.percentage}%</TableCell>
              <TableCell>{item.grade}</TableCell>
              <TableCell>{item.rank}</TableCell>
              <TableCell>{item.status === 'Ready' ? <Badge>Ready</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default FinalReport;
