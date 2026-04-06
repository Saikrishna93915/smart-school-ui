import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const marks = [
  { subject: 'English', theory: 68, practical: 15, total: 83, max: 100, grade: 'A' },
  { subject: 'Hindi', theory: 62, practical: 12, total: 74, max: 100, grade: 'B+' },
  { subject: 'Mathematics', theory: 78, practical: 0, total: 78, max: 100, grade: 'B+' },
  { subject: 'Science', theory: 70, practical: 18, total: 88, max: 100, grade: 'A' },
  { subject: 'Social Studies', theory: 75, practical: 0, total: 75, max: 100, grade: 'B+' }
];

const totalMarks = marks.reduce((sum, m) => sum + m.total, 0);
const totalMax = marks.reduce((sum, m) => sum + m.max, 0);
const percentage = ((totalMarks / totalMax) * 100).toFixed(2);

const ReportCard: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Report Card</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button size="sm"><Download className="h-4 w-4 mr-2" />Download PDF</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-6 space-y-6 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold">PMC TECH SCHOOL</h2>
            <p className="text-muted-foreground">ANNUAL REPORT CARD 2025-26</p>
            <p className="text-xs text-muted-foreground mt-1">Hosur - Krishnagiri Highways, Tamil Nadu - 635 117</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">Student:</span> Rahul Kumar</p>
              <p><span className="font-semibold">Class:</span> 10A</p>
            </div>
            <div>
              <p><span className="font-semibold">Roll No:</span> 101</p>
              <p><span className="font-semibold">Admission:</span> ADM2023001</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left">Subject</th>
                  <th className="border p-2">Theory</th>
                  <th className="border p-2">Practical</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Max</th>
                  <th className="border p-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m.subject}>
                    <td className="border p-2">{m.subject}</td>
                    <td className="border p-2 text-center">{m.theory}</td>
                    <td className="border p-2 text-center">{m.practical}</td>
                    <td className="border p-2 text-center font-medium">{m.total}</td>
                    <td className="border p-2 text-center">{m.max}</td>
                    <td className="border p-2 text-center"><Badge variant="secondary">{m.grade}</Badge></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60">
                  <td colSpan={3} className="border p-2 text-right font-medium">Total</td>
                  <td className="border p-2 text-center font-bold">{totalMarks}</td>
                  <td className="border p-2 text-center font-bold">{totalMax}</td>
                  <td className="border p-2 text-center font-bold">{percentage}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
