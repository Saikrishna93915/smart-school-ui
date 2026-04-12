import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  RefreshCw,
  Download,
  FileText,
  MessageSquare,
  ChevronLeft,
  Calendar
} from 'lucide-react';

interface ReportData {
  reportId: string;
  examName: string;
  examType: string;
  generatedOn: string;
  format: string;
  hasTeacherRemark: boolean;
  teacherRemark: string | null;
  promotedToClass: string | null;
  rankInClass: number | null;
  attendance: { totalWorkingDays?: number; daysPresent?: number; attendancePercentage?: number } | null;
}

export default function DownloadReport() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<{ name: string; className: string; section: string } | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/parent/child/${childId}/reports`);
      const data = res.data?.data;
      if (data) {
        setChild(data.child);
        setReports(data.reports || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewReport = (report: ReportData) => {
    // Navigate to the report card page for this exam
    navigate(`/progress-reports/report-card?student=${childId}&exam=${report.reportId}`);
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading reports...</p>
      </CardContent></Card>
    );
  }

  if (!child || reports.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
        <p className="text-muted-foreground mb-4">Report cards will appear here once exams are published.</p>
        <Button variant="outline" onClick={() => navigate('/parent/dashboard')}><ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/parent/dashboard')} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Report Cards</h1>
          <p className="text-muted-foreground">{child.name} • Class {child.className} - Section {child.section}</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>View your child's academic performance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated On</TableHead>
                <TableHead>Teacher's Remark</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.reportId}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {report.examName}
                  </TableCell>
                  <TableCell><Badge variant="outline">{report.examType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {report.generatedOn ? new Date(report.generatedOn).toLocaleDateString() : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.hasTeacherRemark ? (
                      <div className="max-w-xs">
                        <p className="text-sm italic text-muted-foreground truncate" title={report.teacherRemark || ''}>
                          "{report.teacherRemark}"
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.rankInClass ? (
                      <Badge className="bg-blue-100 text-blue-800">#{report.rankInClass}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleViewReport(report)}>
                      <Download className="h-4 w-4 mr-2" />View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
