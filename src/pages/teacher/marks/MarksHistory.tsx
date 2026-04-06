import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const history = [
  { exam: 'Unit Test 1', className: '10A', submittedOn: '2025-04-20', status: 'Submitted' },
  { exam: 'Unit Test 1', className: '9B', submittedOn: '2025-04-20', status: 'Verified' },
  { exam: 'Quarterly', className: '10A', submittedOn: '2025-07-14', status: 'Draft' }
];

const MarksHistory: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Marks History</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exam</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Submitted On</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={`${item.exam}-${item.className}-${item.submittedOn}`}>
              <TableCell>{item.exam}</TableCell>
              <TableCell>{item.className}</TableCell>
              <TableCell>{item.submittedOn}</TableCell>
              <TableCell>{item.status === 'Verified' ? <Badge>Verified</Badge> : <Badge variant="outline">{item.status}</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default MarksHistory;
