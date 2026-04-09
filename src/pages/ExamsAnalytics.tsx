import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Trophy, 
  AlertCircle, 
  Eye, 
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Download,
  Target,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import examService from '@/Services/exam.service';

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
    totalStudents?: number;
    passPercentage?: number;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

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

  // Filter exams based on search and filters
  const filteredExams = useMemo(() => {
    let exams = data?.examSummary || [];

    // Apply search
    if (searchTerm) {
      exams = exams.filter(exam =>
        exam.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.className.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      exams = exams.filter(exam => exam.status === statusFilter);
    }

    // Apply class filter
    if (classFilter !== 'all') {
      exams = exams.filter(exam => exam.className === classFilter);
    }

    return exams;
  }, [data, searchTerm, statusFilter, classFilter]);

  // Get unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = new Set((data?.examSummary || []).map(e => e.className));
    return Array.from(classes).sort();
  }, [data]);

  // Count exams by status
  const examsByStatus = useMemo(() => {
    const exams = data?.examSummary || [];
    return {
      scheduled: exams.filter(e => e.status === 'scheduled').length,
      ongoing: exams.filter(e => e.status === 'ongoing').length,
      completed: exams.filter(e => e.status === 'completed').length,
    };
  }, [data]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      ongoing: { color: 'bg-green-100 text-green-800', label: 'Ongoing' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleExamClick = (examId: string) => {
    navigate(`/exams/${examId}/results`);
  };

  const handleAnalyticsClick = (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/exams/analytics/${examId}`);
  };

  const topRecentSubmissions = useMemo(() => {
    return (data?.recentSubmissions || []).slice(0, 10);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Exam Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            View all exams and click on analytics button for each exam to see detailed student performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => loadAnalytics(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="default" onClick={() => navigate('/exams')}>
            <Eye className="h-4 w-4 mr-2" />
            View All Exams
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.examsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All exams in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.submissionsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Student attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.averageMarks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Overall average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-600" />
              Highest Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.summary.highestMarks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Top score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-red-600" />
              Lowest Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.summary.lowestMarks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Lowest score</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Exams</p>
                <p className="text-2xl font-bold text-blue-600">{examsByStatus.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing Exams</p>
                <p className="text-2xl font-bold text-green-600">{examsByStatus.ongoing}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Exams</p>
                <p className="text-2xl font-bold text-purple-600">{examsByStatus.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exams by name, subject, class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(className => (
                  <SelectItem key={className} value={className}>
                    Class {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams List with Analytics Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            All Exams
            <Badge variant="outline" className="ml-2">
              {filteredExams.length} exams
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Click on Analytics button for each exam to view detailed performance and student results
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Avg Marks</TableHead>
                <TableHead className="text-center">Pass %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow 
                    key={exam.examId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">{exam.examName}</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{exam.className}-{exam.section}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {exam.submissions}
                        {exam.totalStudents && (
                          <span className="text-xs text-muted-foreground ml-1">
                            / {exam.totalStudents}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{exam.averageMarks}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {exam.passPercentage ? (
                        <Badge className={
                          exam.passPercentage >= 75 ? 'bg-green-600' :
                          exam.passPercentage >= 60 ? 'bg-blue-600' :
                          exam.passPercentage >= 40 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }>
                          {exam.passPercentage}%
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleExamClick(exam.examId)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Exam Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={(e) => handleAnalyticsClick(exam.examId, e)}
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analytics
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Detailed Analytics with Student Results</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Class Performance & Recent Submissions Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Performance Overview
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
                    <TableCell>
                      <span className="font-medium">{row.averageMarks}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Submissions (Live)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-updates every 20 seconds
            </p>
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
                    <TableCell>
                      <Badge variant="outline">{row.marksObtained}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => console.log('Export analytics')}>
          <Download className="h-4 w-4 mr-2" />
          Export Analytics Report
        </Button>
      </div>
    </div>
  );
};

export default ExamsAnalytics;
