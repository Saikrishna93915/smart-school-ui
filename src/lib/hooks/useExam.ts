// src/hooks/useExam.ts

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import examService from '@/Services/exam.service'
import { Exam, Submission, CreateExamData, ExamFilters } from '@/types/exam';

interface UseExamReturn {
  // State
  exams: Exam[];
  currentExam: Exam | null;
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createExam: (data: CreateExamData) => Promise<void>;
  fetchExams: (filters?: ExamFilters) => Promise<void>;
  fetchMyExams: () => Promise<void>;
  fetchExamById: (id: string) => Promise<void>;
  updateExam: (id: string, updates: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  submitExam: (examId: string, answers: Submission['answers']) => Promise<void>;
  clearError: () => void;
}

export const useExam = (): UseExamReturn => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [submissions] = useState<Submission[]>([]); // Remove setSubmissions since it's not used
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExam = useCallback(async (data: CreateExamData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.createExam(data);
      
      if (response.success) {
        setExams(prev => [response.data, ...prev]);
        toast.success('Exam created successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create exam');
      toast.error(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExams = useCallback(async (filters?: ExamFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.getExams(filters);
      
      if (response.success) {
        setExams(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.getMyExams();
      
      if (response.success) {
        setExams(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExamById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.getExamById(id);
      
      if (response.success) {
        setCurrentExam(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exam');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExam = useCallback(async (id: string, updates: Partial<Exam>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.updateExam(id, updates);
      
      if (response.success) {
        setExams(prev => prev.map(exam => 
          exam._id === id ? response.data : exam
        ));
        if (currentExam?._id === id) {
          setCurrentExam(response.data);
        }
        toast.success('Exam updated successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update exam');
      toast.error(err.message || 'Failed to update exam');
    } finally {
      setLoading(false);
    }
  }, [currentExam]);

  const deleteExam = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.deleteExam(id);
      
      if (response.success) {
        setExams(prev => prev.filter(exam => exam._id !== id));
        if (currentExam?._id === id) {
          setCurrentExam(null);
        }
        toast.success('Exam deleted successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete exam');
      toast.error(err.message || 'Failed to delete exam');
    } finally {
      setLoading(false);
    }
  }, [currentExam]);

  const submitExam = useCallback(async (examId: string, answers: Submission['answers']): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.submitExam(examId, answers);
      
      if (response.success) {
        toast.success('Exam submitted successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit exam');
      toast.error(err.message || 'Failed to submit exam');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return {
    // State
    exams,
    currentExam,
    submissions,
    loading,
    error,
    
    // Actions
    createExam,
    fetchExams,
    fetchMyExams,
    fetchExamById,
    updateExam,
    deleteExam,
    submitExam,
    clearError,
  };
};