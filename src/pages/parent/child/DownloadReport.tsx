import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const reports = [
  { exam: 'Unit Test 1', generatedOn: '2025-04-20', format: 'PDF' },
  { exam: 'Unit Test 2', generatedOn: '2025-05-15', format: 'PDF' },
  { exam: 'Quarterly', generatedOn: '2025-07-15', format: 'PDF' },
  { exam: 'Half Yearly', generatedOn: '2025-10-15', format: 'PDF' }
];

const DownloadReport: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Download Report Cards</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Generated On</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.exam}>
                <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" />{report.exam}</TableCell>
                <TableCell>{report.generatedOn}</TableCell>
                <TableCell>{report.format}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm"><Download className="h-4 w-4 mr-1" />Download</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DownloadReport;
