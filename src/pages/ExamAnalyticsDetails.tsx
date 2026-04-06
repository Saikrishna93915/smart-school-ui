import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Users,
  Trophy,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import { format } from 'date-fns';

interface StudentResult {
  studentId?: string;
  student?: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  name?: string;
  admissionNumber?: string;
  className?: string;
  section?: string;
  marksObtained: number;
  totalMarks?: number;
  percentage?: number;
  rank?: number;
  status?: 'passed' | 'failed' | 'absent' | 'evaluated' | 'pending';
  submittedAt: string;
  timeTaken?: number;
  proctoring?: {
    totalViolations: number;
    violations: Record<string, number>;
  };
}

interface ExamAnalytics {
  exam: {
    _id: string;
    name: string;
    subject: string;
    className: string;
    section: string;
    status: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    duration: number;
    totalMarks: number;
    passingMarks?: number;
  };
  submissions: StudentResult[];
  totalStudents?: number;
  submittedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  proctoringSummary?: {
    totalViolations: number;
    byType: Record<string, number>;
    studentsWithViolations: number;
  };
}

const ExamAnalyticsDetails: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('marks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exporting, setExporting] = useState<'excel' | 'csv' | null>(null);

  useEffect(() => {
    loadExamAnalytics();
  }, [examId]);

  const loadExamAnalytics = async (showRefreshing = false) => {
    if (!examId) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await examService.getExamAnalytics(examId);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        throw new Error(response.message || 'Failed to load exam analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam analytics');
      toast.error('Failed to load exam analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!analytics) return [];

    let students = [...analytics.submissions];

    // Apply search
    if (searchTerm) {
      students = students.filter(s => {
        const name = s.name || s.student?.name || '';
        const admNo = s.admissionNumber || s.student?.admissionNumber || '';
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      students = students.filter(s => s.status === statusFilter);
    }

    // Apply sorting
    students.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'marks':
          comparison = b.marksObtained - a.marksObtained;
          break;
        case 'name':
          const nameA = a.name || a.student?.name || '';
          const nameB = b.name || b.student?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'percentage':
          comparison = (b.percentage || 0) - (a.percentage || 0);
          break;
        default:
          comparison = b.marksObtained - a.marksObtained;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return students;
  }, [analytics, searchTerm, statusFilter, sortBy, sortOrder]);

  // Performance distribution
  const performanceDistribution = useMemo(() => {
    if (!analytics) return [];

    const totalMarks = analytics.exam.totalMarks;
    const ranges = [
      { range: '90-100%', min: 90, max: 100, count: 0, color: 'bg-green-500' },
      { range: '75-89%', min: 75, max: 89, count: 0, color: 'bg-blue-500' },
      { range: '60-74%', min: 60, max: 74, count: 0, color: 'bg-yellow-500' },
      { range: '40-59%', min: 40, max: 59, count: 0, color: 'bg-orange-500' },
      { range: 'Below 40%', min: 0, max: 39, count: 0, color: 'bg-red-500' },
    ];

    analytics.submissions.forEach(student => {
      const percentage = student.percentage || (student.marksObtained / totalMarks) * 100;
      const range = ranges.find(r => percentage >= r.min && percentage <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [analytics]);

  // Stats calculations
  const stats = useMemo(() => {
    if (!analytics) return null;

    const passingMarks = analytics.exam.passingMarks || analytics.exam.totalMarks * 0.4;
    const passedCount = analytics.submissions.filter(s => s.marksObtained >= passingMarks).length;
    const failedCount = analytics.submissions.filter(s => s.marksObtained < passingMarks).length;
    const passPercentage = analytics.submittedCount > 0 
      ? ((passedCount / analytics.submittedCount) * 100).toFixed(1)
      : '0';

    return {
      totalStudents: analytics.totalStudents || analytics.submittedCount,
      submitted: analytics.submittedCount,
      absent: (analytics.totalStudents || analytics.submittedCount) - analytics.submittedCount,
      passed: passedCount,
      failed: failedCount,
      passPercentage,
    };
  }, [analytics]);

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      passed: { color: 'bg-green-100 text-green-800', label: 'Passed', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed', icon: XCircle },
      absent: { color: 'bg-gray-100 text-gray-800', label: 'Absent', icon: AlertCircle },
      evaluated: { color: 'bg-blue-100 text-blue-800', label: 'Evaluated', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
    };
    const config = statusConfig[status || 'pending'] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!examId || !analytics) return;

    try {
      setExporting(format);

      const blob = await examService.exportExamAnalytics(examId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      const safeExamName = (analytics.exam.name || 'exam')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '_');

      link.href = url;
      link.download = `${safeExamName}_analytics_${dateStamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export analytics');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/exams/analytics')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Exam not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { exam } = analytics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/exams/analytics')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exam.name}</h1>
            <p className="text-muted-foreground">
              {exam.subject} • Class {exam.className}-{exam.section}
            </p>
          </div>
          <Badge className={
            exam.status === 'completed' ? 'bg-purple-600' :
            exam.status === 'ongoing' ? 'bg-green-600' :
            'bg-blue-600'
          }>
            {exam.status}
          </Badge>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => loadExamAnalytics(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={!!exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={!!exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Exam Info & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.submitted} submitted • {stats?.absent} absent
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats?.passPercentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.passed} passed • {stats?.failed} failed
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Marks</p>
                <p className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}/{exam.totalMarks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  High: {analytics.highestScore} • Low: {analytics.lowestScore}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exam Details</p>
                <p className="text-lg font-semibold">{exam.duration} mins</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(exam.scheduledDate), 'dd MMM yyyy')}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Proctoring Violations Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-md border">
              <p className="text-sm text-muted-foreground">Total Violations</p>
              <p className="text-2xl font-bold text-red-600">{analytics.proctoringSummary?.totalViolations || 0}</p>
            </div>
            <div className="p-3 rounded-md border">
              <p className="text-sm text-muted-foreground">Students With Violations</p>
              <p className="text-2xl font-bold">{analytics.proctoringSummary?.studentsWithViolations || 0}</p>
            </div>
            <div className="p-3 rounded-md border">
              <p className="text-sm text-muted-foreground">Violation Types</p>
              <p className="text-2xl font-bold">{Object.keys(analytics.proctoringSummary?.byType || {}).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceDistribution.map((range) => (
              <div key={range.range}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{range.range}</span>
                  <span className="text-muted-foreground">{range.count} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${range.color} h-3 rounded-full transition-all duration-500`}
                    style={{ 
                      width: stats?.submitted 
                        ? `${(range.count / stats.submitted) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marks">Marks</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Results
              <Badge variant="outline">{filteredStudents.length} students</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Time Taken</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => {
                  const name = student.name || student.student?.name || 'N/A';
                  const admNo = student.admissionNumber || student.student?.admissionNumber || 'N/A';
                  const percentage = student.percentage || (student.marksObtained / exam.totalMarks) * 100;
                  
                  return (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{name}</p>
                            {student.className && (
                              <p className="text-sm text-muted-foreground">
                                Class {student.className}-{student.section}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{admNo}</TableCell>
                      <TableCell>
                        <span className="font-bold">{student.marksObtained}/{exam.totalMarks}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          percentage >= 75 ? 'bg-green-600' :
                          percentage >= 60 ? 'bg-blue-600' :
                          percentage >= 40 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }>
                          {percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.proctoring?.totalViolations ? 'destructive' : 'outline'}>
                          {student.proctoring?.totalViolations || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.timeTaken ? `${student.timeTaken} min` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(student.submittedAt), 'dd MMM yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(student.submittedAt), 'hh:mm a')}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamAnalyticsDetails;
