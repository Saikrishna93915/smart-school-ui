import React from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const examResults = [
  { exam: 'Unit Test 1', date: 'Apr 2025', mathematics: 78, science: 82, english: 71, hindi: 65, sst: 75, percentage: 74.2, grade: 'B+' },
  { exam: 'Unit Test 2', date: 'May 2025', mathematics: 82, science: 85, english: 75, hindi: 68, sst: 78, percentage: 77.6, grade: 'A-' },
  { exam: 'Quarterly', date: 'Jul 2025', mathematics: 71, science: 78, english: 68, hindi: 62, sst: 70, percentage: 69.8, grade: 'B' }
];

const MyMarks: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Marks</CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Math</TableHead>
                <TableHead>Science</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Hindi</TableHead>
                <TableHead>SST</TableHead>
                <TableHead>Overall %</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examResults.map((item) => (
                <TableRow key={item.exam}>
                  <TableCell className="font-medium">{item.exam}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.mathematics}</TableCell>
                  <TableCell>{item.science}</TableCell>
                  <TableCell>{item.english}</TableCell>
                  <TableCell>{item.hindi}</TableCell>
                  <TableCell>{item.sst}</TableCell>
                  <TableCell>{item.percentage}%</TableCell>
                  <TableCell>{item.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMarks;
