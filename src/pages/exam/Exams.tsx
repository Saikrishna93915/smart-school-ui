// src/pages/exam/Exams.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp,
  Download,
  RefreshCw,
  Grid,
  List,
  Loader2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Users,
  BookOpen,
  Award,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Components
import CreateExamDialog from '@/components/dashboard/Exams/CreateExamDialog';
import ExamDetailsDialog from '@/components/dashboard/Exams/ExamDetailsDialog';
import ExamCard from '@/components/dashboard/Exams/ExamCard';

// Hooks & Services
import { useAuth } from '@/contexts/AuthContext';
import { useExam } from '@/hooks/useExam';
import { toast } from 'sonner';
import { formatDuration, formatExamDate, formatTime } from '@/lib/utils/examUtils';

// Types
import type { Exam } from '@/types/exam';

interface ExamWithSubmission extends Exam {
  submissionStatus?: string;
  totalStudents?: number;
  totalMarks?: number;
  hasAttempted?: boolean;
  calculatedStatus?: string;
}

const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    exams, 
    loading, 
    error, 
    fetchExams, 
    fetchMyExams, 
    isTeacher
  } = useExam();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamWithSubmission | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  // State for filtered exams
  const [filteredExams, setFilteredExams] = useState<ExamWithSubmission[]>([]);
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    ongoing: 0,
    completed: 0,
    draft: 0
  });

  const isStudent = user?.role === 'student';

  const updateStats = useCallback((examsList: ExamWithSubmission[]) => {
    const total = examsList.length;
    const scheduled = examsList.filter(e => {
      const status = (e.calculatedStatus || e.status)?.toLowerCase();
      return status === 'scheduled';
    }).length;
    const ongoing = examsList.filter(e => {
      const status = (e.calculatedStatus || e.status)?.toLowerCase();
      return status === 'ongoing' || status === 'live';
    }).length;
    const completed = examsList.filter(e => {
      const status = (e.calculatedStatus || e.status)?.toLowerCase();
      return status === 'completed';
    }).length;
    const draft = examsList.filter(e => {
      const status = (e.calculatedStatus || e.status)?.toLowerCase();
      return status === 'draft';
    }).length;

    setStats({ total, scheduled, ongoing, completed, draft });
  }, []);

  const updateUniqueClasses = useCallback((classes: string[]) => {
    setUniqueClasses(classes);
  }, []);

  const applyFilters = useCallback(() => {
    if (!Array.isArray(exams) || exams.length === 0) {
      setFilteredExams([]);
      updateStats([]);
      updateUniqueClasses([]);
      return;
    }

    // Cast exams to ExamWithSubmission type
    const typedExams = exams as ExamWithSubmission[];
    let filtered = [...typedExams];

    // Filter by tab status (use calculatedStatus if available)
    if (activeTab !== 'all') {
      filtered = filtered.filter(exam => {
        const examStatus = (exam?.calculatedStatus || exam?.status)?.toLowerCase();
        const activeTabLower = activeTab.toLowerCase();
        
        // Handle status mappings
        if (activeTabLower === 'ongoing' || activeTabLower === 'live') {
          return examStatus === 'ongoing' || examStatus === 'live';
        }
        return examStatus === activeTabLower;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(exam => 
        exam?.name?.toLowerCase().includes(term) ||
        exam?.description?.toLowerCase().includes(term) ||
        exam?.subject?.toLowerCase().includes(term) ||
        exam?.className?.toLowerCase().includes(term) ||
        exam?.section?.toLowerCase().includes(term)
      );
    }

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter(exam => exam?.className === classFilter);
    }

    setFilteredExams(filtered);
    updateStats(filtered);
    
    // Extract unique classes from all exams (not just filtered)
    const classes = Array.from(
      new Set(
        typedExams
          .filter(exam => exam?.className)
          .map(exam => exam.className!)
          .filter(Boolean)
          .sort()
      )
    );
    updateUniqueClasses(classes);
  }, [exams, activeTab, searchTerm, classFilter, updateStats, updateUniqueClasses]);

  const loadInitialExams = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      setHasPermissionError(false);
      
      if (isTeacher) {
        // Teacher fetches all exams they created
        await fetchExams();
      } else if (isStudent) {
        // Student fetches only their assigned exams
        await fetchMyExams();
      } else {
        // Default to my-exams for students, all exams for others
        if (user?.role === 'student') {
          await fetchMyExams();
        } else {
          await fetchExams();
        }
      }
      
    } catch (err: any) {
      console.error('Failed to load exams:', err);
      
      // Handle specific error types
      if (err?.response?.status === 403) {
        setHasPermissionError(true);
        toast.error('You do not have permission to view these exams');
      } else if (err?.response?.status === 401) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error(err?.message || 'Failed to load exams');
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [isTeacher, isStudent, user?.role, fetchExams, fetchMyExams, navigate]);

  // Load exams on component mount
  useEffect(() => {
    loadInitialExams();
  }, []);

  // Apply filters whenever exams, activeTab, searchTerm, or classFilter changes
  useEffect(() => {
    applyFilters();
  }, [exams, activeTab, searchTerm, classFilter]);

  const handleRefresh = async () => {
    try {
      await loadInitialExams();
      toast.success('Exams refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh exams:', error);
    }
  };

  const handleExamAction = (exam: ExamWithSubmission, action: string) => {
    if (!exam?._id) {
      toast.error('Invalid exam data');
      return;
    }

    switch (action) {
      case 'view':
        setSelectedExam(exam);
        setIsDetailsDialogOpen(true);
        break;
      case 'edit':
        if (isTeacher || user?.role === 'admin') {
          setSelectedExam(exam);
          setIsEditDialogOpen(true);
        } else {
          toast.error('Only teachers can edit exams');
        }
        break;
      case 'start':
        // ONE-ATTEMPT RULE: Check if student already attempted this exam
        if (isStudent && exam.hasAttempted) {
          toast.error('You have already completed this exam. Only one attempt is allowed.');
          return;
        }

        const examStatus = (exam.calculatedStatus || exam.status)?.toLowerCase();
        if (examStatus === 'ongoing' || examStatus === 'live') {
          navigate(`/exams/${exam._id}/take`);
        } else if (examStatus === 'scheduled') {
          toast.warning('This exam is scheduled but has not started yet. Please wait for the start time.');
        } else if (examStatus === 'completed') {
          toast.error('This exam has already ended.');
        } else {
          toast.error('This exam is not currently available for taking');
        }
        break;
      case 'preview':
        if (isTeacher || user?.role === 'admin') {
          toast.info('Exam preview page coming soon');
          // navigate(`/dashboard/exams/${exam._id}/preview`);
        }
        break;
      case 'results':
        navigate(`/exams/${exam._id}/results`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${exam.name}"?`)) {
          // Implement delete logic
          toast.success('Delete functionality coming soon');
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  const getRoleBasedMessage = () => {
    if (isTeacher) {
      return 'Create, manage, and monitor exams for your classes';
    } else if (isStudent) {
      return 'View and take your scheduled exams - Each exam can be taken only once';
    } else {
      return 'Manage all exams in the system';
    }
  };

  const getExamStatusBadge = (status: string = '') => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'draft':
        return { text: 'Draft', className: 'bg-gray-500 text-white', color: 'bg-gray-500' };
      case 'scheduled':
        return { text: 'Scheduled', className: 'bg-blue-500 text-white', color: 'bg-blue-500' };
      case 'ongoing':
      case 'live':
        return { text: 'Active Now', className: 'bg-green-500 text-white animate-pulse', color: 'bg-green-500' };
      case 'completed':
        return { text: 'Completed', className: 'bg-purple-500 text-white', color: 'bg-purple-500' };
      case 'archived':
        return { text: 'Archived', className: 'bg-gray-400 text-white', color: 'bg-gray-400' };
      default:
        return { text: 'Unknown', className: 'bg-gray-300 text-gray-800', color: 'bg-gray-300' };
    }
  };

  const renderLoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Loading Exams</p>
          <p className="text-gray-600 max-w-md">
            {isTeacher ? 'Fetching all your created exams...' : 
             isStudent ? 'Loading your assigned exams...' : 
             'Loading exam data...'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Unable to Load Exams</p>
          <p className="text-gray-600">
            {error || 'An error occurred while loading exams. Please try again.'}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={loadInitialExams} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isTeacher ? 'No exams created yet' : 'No exams scheduled'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {searchTerm || classFilter !== 'all'
          ? 'No exams match your current filters. Try adjusting your search or filters.'
          : isTeacher
          ? 'Create your first exam to get started with assessments'
          : 'You don\'t have any exams scheduled yet. Contact your teacher for more information.'}
      </p>
      <div className="flex gap-3 justify-center">
        {isTeacher && (
          <Button onClick={() => navigate('/exams/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Exam
          </Button>
        )}
        {(searchTerm || classFilter !== 'all') && (
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setClassFilter('all');
          }}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderExamGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExams.map((exam) => (
        <ExamCard
          key={exam._id}
          exam={exam}
          viewMode={isTeacher ? 'teacher' : 'student'}
          onView={() => handleExamAction(exam, 'view')}
          onEdit={() => handleExamAction(exam, 'edit')}
          onStart={() => handleExamAction(exam, 'start')}
          onViewResults={() => handleExamAction(exam, 'results')}
          onDelete={() => handleExamAction(exam, 'delete')}
        />
      ))}
    </div>
  );

  const renderExamList = () => (
    <div className="space-y-3">
      {filteredExams.map((exam) => {
        const currentStatus = exam.calculatedStatus || exam.status;
        const statusBadge = getExamStatusBadge(currentStatus);
        const canTakeExam = isStudent && !exam.hasAttempted && (currentStatus?.toLowerCase() === 'ongoing' || 
                                        currentStatus?.toLowerCase() === 'live');
        const hasSubmission = exam.submissionStatus && exam.submissionStatus !== 'not_attempted';

        return (
          <div 
            key={exam._id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleExamAction(exam, 'view')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusBadge.color}`}>
                    {currentStatus?.toLowerCase() === 'completed' ? (
                      <Award className="h-5 w-5 text-white" />
                    ) : currentStatus?.toLowerCase() === 'ongoing' || currentStatus?.toLowerCase() === 'live' ? (
                      <PlayCircle className="h-5 w-5 text-white" />
                    ) : currentStatus?.toLowerCase() === 'draft' ? (
                      <FileText className="h-5 w-5 text-white" />
                    ) : (
                      <Calendar className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{exam.name}</h3>
                      <Badge variant="outline" className={statusBadge.className}>
                        {statusBadge.text}
                      </Badge>
                      {hasSubmission && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {exam.submissionStatus === 'submitted' ? 'Submitted' : 
                           exam.submissionStatus === 'evaluated' ? 'Evaluated' : 'In Progress'}
                        </Badge>
                      )}
                      {exam.hasAttempted && (
                        <Badge className="bg-blue-100 text-blue-800">
                          ✓ Attempted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {exam.subject} • Class {exam.className}-{exam.section}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {exam.totalStudents || 'N/A'} students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {exam.totalMarks || exam.totalMarks || 0} marks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(exam.durationMinutes || exam.duration || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatExamDate(exam.examDate || exam.date)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{formatTime(exam.startTime)} - {formatTime(exam.endTime)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canTakeExam && (
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleExamAction(exam, 'start');
                    }}>
                      Start Exam
                    </Button>
                  )}
                  {exam.hasAttempted && (
                    <Button size="sm" variant="outline" disabled>
                      Attempt Used
                    </Button>
                  )}
                  {hasSubmission && (
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      handleExamAction(exam, 'results');
                    }}>
                      View Results
                    </Button>
                  )}
                  {isTeacher && (
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      handleExamAction(exam, 'edit');
                    }}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Loading state
  if (isInitialLoading) {
    return renderLoadingState();
  }

  // Error state
  if (error && !hasPermissionError) {
    return renderErrorState();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {isTeacher ? 'Exam Management' : 'My Exams'}
          </h1>
          <p className="text-gray-600">
            {getRoleBasedMessage()}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {isTeacher && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/exams/analytics')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                onClick={() => navigate('/exams/create')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Exam
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Permission Warning */}
      {hasPermissionError && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Access Restricted</AlertTitle>
          <AlertDescription className="text-amber-700">
            You don't have permission to access all exam features. 
            {isStudent && ' Contact your teacher if you believe this is an error.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Dashboard - Only for Teachers/Admins */}
      {(isTeacher || user?.role === 'admin') && exams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Exams</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.scheduled}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Now</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.ongoing}</h3>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.completed}</h3>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-xl">
              {isTeacher ? 'All Exams' : 'My Scheduled Exams'}
              {exams.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {exams.length} total
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exams by name, subject, class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                {uniqueClasses.length > 0 && (
                  <Select 
                    value={classFilter} 
                    onValueChange={setClassFilter}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[140px]">
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
                )}
                
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    disabled={loading}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`h-8 w-8 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    disabled={loading}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-6">
          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="flex flex-wrap w-full max-w-2xl">
              <TabsTrigger value="all" className="flex-1 min-w-[80px]">
                All
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex-1 min-w-[80px]">
                Scheduled
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="flex-1 min-w-[80px]">
                Active
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 min-w-[80px]">
                Completed
              </TabsTrigger>
              {isTeacher && (
                <TabsTrigger value="draft" className="flex-1 min-w-[80px]">
                  Drafts
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Results Summary */}
          {filteredExams.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredExams.length}</span> exam{filteredExams.length !== 1 ? 's' : ''}
                {searchTerm && (
                  <span> for "<span className="font-semibold">{searchTerm}</span>"</span>
                )}
                {classFilter !== 'all' && (
                  <span> in Class <span className="font-semibold">{classFilter}</span></span>
                )}
              </p>
              {isTeacher && (
                <Button variant="outline" size="sm" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          )}

          {/* Loading State for Additional Data */}
          {loading && exams.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <p className="text-gray-600">Updating exam data...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredExams.length === 0 && renderEmptyState()}

          {/* Exams Display */}
          {!loading && filteredExams.length > 0 && (
            <>
              {viewMode === 'grid' ? renderExamGrid() : renderExamList()}
              
              {/* Pagination Hint */}
              {filteredExams.length >= 20 && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    Showing first {filteredExams.length} exams. Use filters to narrow down results.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Exam Dialog */}
      {isTeacher && (
        <>
          <CreateExamDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              loadInitialExams();
              toast.success('Exam updated successfully!');
            }}
            initialData={selectedExam}
            mode="edit"
          />
        </>
      )}
      
      {/* Exam Details Dialog */}
      <ExamDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        exam={selectedExam}
      />
    </div>
  );
};

export default ExamsPage;
