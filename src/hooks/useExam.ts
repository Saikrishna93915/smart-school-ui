// src/lib/hooks/useExam.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import { Exam, Submission, CreateExamData } from '@/types/exam';
import { useAuth } from '@/contexts/AuthContext';

export const useExam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Determine user role
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'owner';

  // Main exams query
  const {
    data: exams = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      try {
        let response;
        
        if (isTeacher) {
          // Teachers get all exams
          const examsResponse = await examService.getExams();
          response = examsResponse;
        } else {
          // Students get their exams
          const myExamsResponse = await examService.getMyExams();
          response = myExamsResponse;
          
          // If student endpoint fails, try to get filtered exams
          if (!response.success && response.message?.includes('Access denied')) {
            console.warn('Student access denied, trying alternative approach');
            const allExams = await examService.getExams();
              if (allExams.success && Array.isArray(allExams.data)) {
              // Get student's class info from user or response data
              const studentClassName = (user as any)?.className || 
                                     response.data?.[0]?.className || 
                                     'unknown';
              const studentSection = (user as any)?.section || 
                                   response.data?.[0]?.section || 
                                   'unknown';
              
              // Filter for student's class
              const studentExams = allExams.data.filter(exam => 
                exam.className === studentClassName && 
                exam.section === studentSection
              );
              return studentExams;
            }
          }
        }
        
        return response.success ? (Array.isArray(response.data) ? response.data : []) : [];
      } catch (err: any) {
        console.error('Fetch exams error:', err);
        setError(err.message);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!user,
  });

  // Create exam mutation with enhanced error handling
  const createExamMutation = useMutation({
    mutationFn: async (examData: CreateExamData) => {
      console.log('Mutation: Creating exam with data:', examData);
      
      try {
        const response = await examService.createExam(examData);
        console.log('Mutation response:', response);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to create exam');
        }
        
        return response;
      } catch (error: any) {
        console.error('Mutation error:', error);
        
        // Handle empty response errors
        if (error.message.includes('empty response') || error.message.includes('Unexpected end of JSON')) {
          // Even if response was empty, the exam might have been created
          // We'll invalidate queries to refresh the list
          queryClient.invalidateQueries({ queryKey: ['exams'] });
          throw new Error('Exam might have been created, but server response was invalid. Please refresh the page.');
        }
        
        throw error;
      }
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Exam created successfully!');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
      }
    },
    onError: (error: any) => {
      console.error('Create exam mutation error:', error);
      
      let errorMessage = 'Failed to create exam';
      
      // Provide user-friendly error messages
      if (error.message.includes('empty response') || error.message.includes('Unexpected end of JSON')) {
        errorMessage = 'Exam might have been created, but there was an issue with the server response. Please refresh the page to see if it was created.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Your session has expired. Please login again.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'You do not have permission to create exams.';
      } else {
        errorMessage = error.message || 'Failed to create exam';
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    },
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Exam> }) =>
      examService.updateExam(id, updates),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Exam updated successfully');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
      } else {
        throw new Error(response.message || 'Failed to update exam');
      }
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update exam';
      toast.error(errorMessage);
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examService.deleteExam(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Exam deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
      } else {
        throw new Error(response.message || 'Failed to delete exam');
      }
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete exam';
      toast.error(errorMessage);
    },
  });

  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: ({ examId, answers }: { examId: string; answers: Submission['answers'] }) =>
      examService.submitExam(examId, answers),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Exam submitted successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to submit exam');
      }
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit exam';
      toast.error(errorMessage);
    },
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper functions
  const fetchExams = async () => {
    await refetch();
  };

  const fetchMyExams = async () => {
    await refetch();
  };

  return {
    // State
    exams: Array.isArray(exams) ? exams : [],
    loading: isLoading,
    error: error || queryError?.message,
    
    // Actions
    fetchExams,
    fetchMyExams,
    createExam: createExamMutation.mutateAsync,
    updateExam: updateExamMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
    submitExam: submitExamMutation.mutateAsync,
    clearError,
    
    // Mutation states
    isCreating: createExamMutation.isPending,
    isUpdating: updateExamMutation.isPending,
    isDeleting: deleteExamMutation.isPending,
    
    // Additional info
    isTeacher,
  };
};