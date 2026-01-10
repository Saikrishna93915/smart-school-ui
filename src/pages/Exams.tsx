// src/pages/dashboard/Exams.tsx

import React, { useState, useEffect } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Components
import { CreateExamDialog } from '@/components/dashboard/Exams/CreateExamDialog';
import ExamCard from '@/components/dashboard/Exams/ExamCard';

// Hooks & Services
import { useAuth } from '@/contexts/AuthContext';
import { useExam } from '@/hooks/useExam';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils/examUtils';

// Import the Exam type from types
import type { Exam as TypesExam } from '@/types/exam';

const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exams, loading, error, fetchExams, isTeacher } = useExam();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [has403Error, setHas403Error] = useState(false);

  useEffect(() => {
    loadExams();
  }, [activeTab]);

  const loadExams = async () => {
    try {
      setHas403Error(false);
      await fetchExams();
      if (error && error.includes('403')) {
        setHas403Error(true);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
      if (err instanceof Error && err.message.includes('403')) {
        setHas403Error(true);
      }
    }
  };

  const handleRefresh = () => {
    loadExams();
    toast.success('Exams refreshed');
  };

  const handleExamAction = (exam: TypesExam, action: string) => {
    if (!exam || !exam._id) {
      toast.error('Invalid exam data');
      return;
    }

    switch (action) {
      case 'view':
        navigate(`/dashboard/exams/${exam._id}`);
        break;
      case 'edit':
        navigate(`/dashboard/exams/${exam._id}/edit`);
        break;
      case 'start':
        navigate(`/dashboard/exams/${exam._id}/take`);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this exam?')) {
          // Implement delete logic here
          toast.success('Exam deleted (implementation pending)');
        }
        break;
      default:
        toast.error('Unknown action');
    }
  };

  const getFilteredExams = (): TypesExam[] => {
    if (!Array.isArray(exams) || exams.length === 0) return [];

    let filtered = [...exams];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(exam => exam?.status === activeTab);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam?.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter(exam => exam?.className === classFilter);
    }

    return filtered.filter(Boolean) as TypesExam[];
  };

  const filteredExams = getFilteredExams();
  
  // Get unique classes safely
  const uniqueClasses = Array.from(
    new Set(
      exams
        .filter((exam): exam is TypesExam => exam?.className !== undefined)
        .map(exam => exam.className)
        .filter(Boolean)
    )
  );

  const getStats = () => {
    const validExams = exams.filter((exam): exam is TypesExam => exam !== undefined);
    
    const total = validExams.length;
    const scheduled = validExams.filter(e => e.status === 'scheduled').length;
    const live = validExams.filter(e => e.status === 'live').length;
    const completed = validExams.filter(e => e.status === 'completed').length;
    const draft = validExams.filter(e => e.status === 'draft').length;

    return { total, scheduled, live, completed, draft };
  };

  const stats = getStats();

  const formatExamDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return 'Date not set';
    
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (!date || isNaN(date.getTime())) return 'Invalid date';

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      if (isSameDay(date, today)) return 'Today';
      if (isSameDay(date, tomorrow)) return 'Tomorrow';

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '--:--';
    
    try {
      // Handle HH:MM format
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const hour = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      
      // Try parsing as date
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      }
      
      return '--:--';
    } catch {
      return '--:--';
    }
  };

  if (loading && exams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exams Management</h1>
          <p className="text-gray-600 mt-1">
            {isTeacher ? 'Create, manage, and monitor exams' : 'View and take your scheduled exams'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
                onClick={() => navigate('/dashboard/exams/analytics')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Permission Warning */}
      {has403Error && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Limited Access</p>
              <p className="text-amber-700 text-sm mt-1">
                You don't have permission to access all exam data. Showing only exams available to you.
                {!isTeacher && ' Contact your teacher if you think this is an error.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Live Now</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.live}</h3>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-600" />
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
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-xl">
              {isTeacher ? 'All Exams' : 'My Exams'}
              {exams.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {exams.length} total
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Select 
                  value={classFilter} 
                  onValueChange={setClassFilter}
                  disabled={loading || uniqueClasses.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
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
                
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    disabled={loading}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`h-8 w-8 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    disabled={loading}
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
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Error State */}
          {error && !has403Error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Error loading exams</p>
                  <p className="text-red-600 text-sm mt-1">
                    {typeof error === 'string' ? error : 'An unexpected error occurred'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadExams}
                  disabled={loading}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredExams.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No exams found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || classFilter !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : isTeacher
                  ? 'Create your first exam to get started'
                  : 'No exams scheduled for you yet. Contact your teacher for more information.'}
              </p>
              {isTeacher && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              )}
            </div>
          )}

          {/* Exams Grid/List */}
          {filteredExams.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
                  {searchTerm && ` for "${searchTerm}"`}
                </p>
                <Button variant="outline" size="sm" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export List
                </Button>
              </div>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExams.map((exam) => (
                    <ExamCard
                      key={exam._id || `exam-${Math.random()}`}
                      exam={exam}
                      viewMode={isTeacher ? 'teacher' : 'student'}
                      onEdit={() => handleExamAction(exam, 'edit')}
                      onStart={() => handleExamAction(exam, 'start')}
                      onDelete={() => handleExamAction(exam, 'delete')}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExams.map((exam) => (
                    <div 
                      key={exam._id || `exam-list-${Math.random()}`}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleExamAction(exam, 'view')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{exam.name || 'Unnamed Exam'}</h3>
                            <Badge variant="outline" className="text-xs">
                              {exam.status || 'unknown'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {exam.subject || 'No subject'} • Class {exam.className || 'N/A'}-{exam.section || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">
                            {formatExamDate(exam.examDate || exam.date)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{formatTime(exam.startTime)} - {formatTime(exam.endTime)}</span>
                            <span className="text-gray-400">•</span>
                            <span>{formatDuration(exam.duration || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Loading More */}
          {loading && exams.length > 0 && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 text-sm mt-2">Loading more exams...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exam Dialog */}
      {isTeacher && (
        <CreateExamDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            loadExams();
            toast.success('Exam created successfully!');
          }}
        />
      )}
    </div>
  );
};

export default ExamsPage;