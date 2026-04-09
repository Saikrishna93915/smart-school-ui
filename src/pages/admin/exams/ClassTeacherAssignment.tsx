import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const classTeachers = [
  { className: '1', section: 'A', teacher: 'Mrs. Sunita Sharma', experience: '15 years' },
  { className: '1', section: 'B', teacher: 'Mr. Rakesh Kumar', experience: '8 years' },
  { className: '2', section: 'A', teacher: 'Mrs. Anita Desai', experience: '12 years' },
  { className: '2', section: 'B', teacher: 'Not Assigned', experience: '-' }
];

const ClassTeacherAssignment: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Teacher Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classTeachers.map((item) => (
              <TableRow key={`${item.className}-${item.section}`}>
                <TableCell>Class {item.className}</TableCell>
                <TableCell>{item.section}</TableCell>
                <TableCell>
                  {item.teacher !== 'Not Assigned' ? (
                    <div className="flex items-center gap-2">
                      <span>{item.teacher}</span>
                      <Badge variant="secondary">Class Teacher</Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not Assigned</span>
                  )}
                </TableCell>
                <TableCell>{item.experience}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">{item.teacher === 'Not Assigned' ? 'Assign' : 'Change'}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClassTeacherAssignment;
