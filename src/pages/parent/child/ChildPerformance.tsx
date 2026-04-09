import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const examResults = [
  { exam: 'Unit Test 1', mathematics: 78, science: 82, english: 71, hindi: 65, sst: 75, percentage: 74.2, rank: 8 },
  { exam: 'Unit Test 2', mathematics: 82, science: 85, english: 75, hindi: 68, sst: 78, percentage: 77.6, rank: 5 },
  { exam: 'Quarterly', mathematics: 71, science: 78, english: 68, hindi: 62, sst: 70, percentage: 69.8, rank: 12 }
];

const ChildPerformance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Child Performance</h1>
        <p className="text-muted-foreground">Rahul Kumar • Class 10A</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Performance Trend</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {examResults.map((item) => (
            <div key={item.exam} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{item.exam}</span><span>{item.percentage}%</span></div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detailed Results</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Math</TableHead>
                <TableHead>Science</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Hindi</TableHead>
                <TableHead>SST</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examResults.map((item) => (
                <TableRow key={item.exam}>
                  <TableCell>{item.exam}</TableCell>
                  <TableCell>{item.mathematics}</TableCell>
                  <TableCell>{item.science}</TableCell>
                  <TableCell>{item.english}</TableCell>
                  <TableCell>{item.hindi}</TableCell>
                  <TableCell>{item.sst}</TableCell>
                  <TableCell>{item.percentage}%</TableCell>
                  <TableCell>#{item.rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildPerformance;
