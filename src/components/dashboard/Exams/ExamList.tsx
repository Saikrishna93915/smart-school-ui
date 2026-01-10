// components/exams/ExamList.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Grid,
  List
} from 'lucide-react';
import { examService, type Exam as ServiceExam, type PaginatedResponse } from '@/lib/api/examService';
import ExamCard from './ExamCard';
import { toast } from 'sonner';
import { formatExamDate } from '@/lib/utils/examUtils';

interface ExamListProps {
  viewMode?: 'teacher' | 'student';
  showFilters?: boolean;
  onExamSelect?: (exam: ServiceExam) => void;
}

export default function ExamList({ 
  viewMode = 'teacher', 
  showFilters = true,
  onExamSelect 
}: ExamListProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ServiceExam[]>([]);
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<ServiceExam> | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewModeUI, setViewModeUI] = useState<'grid' | 'list'>('grid');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch exams based on view mode
  const fetchExams = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(classFilter !== 'all' && { className: classFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      let response;
      if (viewMode === 'teacher') {
        response = await examService.getExams(params);
      } else {
        response = await examService.getMyExams();
      }

      if (viewMode === 'teacher' && 'pagination' in response) {
        setPaginatedData(response as PaginatedResponse<ServiceExam>);
        setExams(response.data);
      } else {
        setExams(response.data || []);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load exams');
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams(currentPage);
  }, [currentPage, statusFilter, classFilter, viewMode]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExams(currentPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExams(1);
  };

  const handleExamAction = (exam: ServiceExam, action: string) => {
    if (action === 'edit') {
      onExamSelect?.(exam);
    }
  };

  const getFilteredExams = () => {
    let filtered = exams;
    
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }
    
    if (classFilter !== 'all') {
      filtered = filtered.filter(exam => exam.className === classFilter);
    }
    
    if (dateFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      filtered = filtered.filter(exam => {
        const examDate = new Date(exam.examDate || exam.date);
        
        switch (dateFilter) {
          case 'today':
            return examDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return examDate.toDateString() === tomorrow.toDateString();
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return examDate >= weekStart && examDate <= weekEnd;
          case 'next_week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            return examDate >= nextWeekStart && examDate <= nextWeekEnd;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const filteredExams = getFilteredExams();
  
  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(exams.map(exam => exam.className)));

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'teacher' ? 'All Exams' : 'My Exams'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewModeUI('grid')}
              className={`px-3 ${viewModeUI === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewModeUI('list')}
              className={`px-3 ${viewModeUI === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search exams by name, subject, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="next_week">Next Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Mode
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={viewModeUI === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewModeUI('grid')}
                      className="flex-1"
                    >
                      Grid
                    </Button>
                    <Button
                      type="button"
                      variant={viewModeUI === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewModeUI('list')}
                      className="flex-1"
                    >
                      List
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Failed to load exams</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExams.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No exams found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || classFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : viewMode === 'teacher'
                ? 'Create your first exam to get started'
                : 'No exams scheduled for you yet'}
            </p>
            {viewMode === 'teacher' && (
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Create Exam
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exams Grid/List */}
      {filteredExams.length > 0 && (
        <div className={viewModeUI === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-6'
        }>
          {filteredExams.map((exam) => (
            viewModeUI === 'grid' ? (
              <ExamCard
                key={exam._id}
                exam={exam as any}
                viewMode={viewMode}
                onEdit={() => handleExamAction(exam, 'edit')}
                className="h-full"
              />
            ) : (
              <div key={exam._id} className="border rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exam.name}
                      </h3>
                      <Badge variant="outline" className={
                        exam.status === 'scheduled' ? 'border-blue-200 text-blue-700' :
                        exam.status === 'draft' ? 'border-gray-200 text-gray-700' :
                        'border-green-200 text-green-700'
                      }>
                        {exam.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{exam.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {(exam.subjectGroups || []).reduce((total, group) => 
                        total + (group?.questions || []).reduce((sum, q) => sum + (q?.marks || 0), 0), 0
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Total Marks</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatExamDate(exam.examDate || exam.date)}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {exam.startTime} - {exam.endTime}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Class {exam.className}-{exam.section || ''}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {(exam.subjectGroups || []).reduce((total, group) => total + (group?.questions || []).length, 0)} Questions
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {viewMode === 'teacher' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExamAction(exam, 'edit')}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled={exam.status !== 'scheduled'}
                      >
                        Start Exam
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Created by {exam.createdBy}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Pagination */}
      {paginatedData && paginatedData.pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, paginatedData.pagination.total)} of{' '}
            {paginatedData.pagination.total} exams
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!paginatedData.pagination.hasPrev || currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, paginatedData.pagination.pages) }, (_, i) => {
              let pageNum;
              if (paginatedData.pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= paginatedData.pagination.pages - 2) {
                pageNum = paginatedData.pagination.pages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(paginatedData.pagination.pages, prev + 1))}
              disabled={!paginatedData.pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}