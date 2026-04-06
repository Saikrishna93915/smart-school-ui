import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, Users, Trophy, AlertCircle, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import examService from '@/Services/exam.service';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsOverviewResponse {
  summary: {
    examsCount: number;
    submissionsCount: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
  };
  classPerformance: Array<{
    className: string;
    section: string;
    submissions: number;
    averageMarks: number;
  }>;
  examSummary: Array<{
    examId: string;
    examName: string;
    subject: string;
    className: string;
    section: string;
    status: string;
    submissions: number;
    averageMarks: number;
  }>;
  recentSubmissions: Array<{
    submissionId: string;
    examId: string;
    examName: string;
    subject: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    section: string;
    marksObtained: number;
    status: string;
    submittedAt: string;
    evaluatedAt: string | null;
  }>;
}

const POLL_INTERVAL_MS = 20000;

const ExamsAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const canAccessAnalytics = user?.role === 'admin' || user?.role === 'teacher';

  const loadAnalytics = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await examService.getAnalyticsOverview();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load analytics');
      }

      setData(response.data as AnalyticsOverviewResponse);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalytics(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const topRecentSubmissions = useMemo(() => {
    return (data?.recentSubmissions || []).slice(0, 20);
  }, [data]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={() => loadAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Exam Analytics</h1>
          <p className="text-muted-foreground">Auto-updates every 20 seconds based on latest submissions and marks.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/exams')}>
            Back to Exams
          </Button>
          <Button onClick={() => loadAnalytics(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.examsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.submissionsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.averageMarks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.summary.highestMarks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lowest Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.summary.lowestMarks || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Exam-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Avg Marks</TableHead>
                {canAccessAnalytics && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.examSummary || []).map((row) => (
                <TableRow key={row.examId}>
                  <TableCell className="font-medium">{row.examName}</TableCell>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell>{row.className}-{row.section}</TableCell>
                  <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                  <TableCell>{row.submissions}</TableCell>
                  <TableCell>{row.averageMarks}</TableCell>
                  {canAccessAnalytics && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/exams/${row.examId}/results`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(`/exams/analytics/${row.examId}`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Avg Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.classPerformance || []).map((row) => (
                  <TableRow key={`${row.className}-${row.section}`}>
                    <TableCell className="font-medium">{row.className}-{row.section}</TableCell>
                    <TableCell>{row.submissions}</TableCell>
                    <TableCell>{row.averageMarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Submissions (Live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRecentSubmissions.map((row) => (
                  <TableRow key={row.submissionId}>
                    <TableCell>
                      <div className="font-medium">{row.studentName}</div>
                      <div className="text-xs text-muted-foreground">{row.admissionNumber}</div>
                    </TableCell>
                    <TableCell>{row.className}-{row.section}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.examName}</div>
                      <div className="text-xs text-muted-foreground">{row.subject}</div>
                    </TableCell>
                    <TableCell>{row.marksObtained}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamsAnalytics;
