// src/Services/exam.service.ts

import ApiClient from './apiClient';
import { 
  Exam, 
  Submission, 
  CreateExamData, 
  ExamFilters, 
  PaginatedResponse,
  ApiResponse 
} from '@/types/exam';

// Enhanced helper function to handle different response structures
const toApiResponse = <T>(axiosResponse: any): ApiResponse<T> => {
  const responseData = axiosResponse.data;
  
  // Handle different response structures from backend
  if (responseData && typeof responseData === 'object') {
    // Case 1: Already has success, message, data structure
    if ('success' in responseData && 'data' in responseData) {
      return {
        success: responseData.success,
        message: responseData.message || 'Success',
        data: responseData.data,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Case 2: Has success and data at root level
    if ('success' in responseData) {
      return {
        success: responseData.success,
        message: responseData.message || 'Success',
        data: responseData.data || responseData,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Case 3: Direct data (like array of exams)
    return {
      success: true,
      message: 'Success',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Case 4: Empty or invalid response
  return {
    success: false,
    message: 'Invalid response from server',
    data: null as any,
    timestamp: new Date().toISOString(),
  };
};

// Enhanced paginated response helper
const toPaginatedResponse = <T>(axiosResponse: any): PaginatedResponse<T> => {
  const baseResponse = toApiResponse<T>(axiosResponse);

  // Normalize data to an array for paginated responses
  const dataArray: T[] = Array.isArray(baseResponse.data)
    ? (baseResponse.data as unknown as T[])
    : baseResponse.data !== null && baseResponse.data !== undefined
      ? [baseResponse.data as unknown as T]
      : [];

  return {
    success: baseResponse.success,
    message: baseResponse.message,
    data: dataArray,
    timestamp: baseResponse.timestamp,
    pagination: axiosResponse.data?.pagination || {
      page: 1,
      limit: 10,
      total: dataArray.length,
      pages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
};

class ExamService {
  // ==================== Exam CRUD Operations ====================
  async createExam(examData: CreateExamData): Promise<ApiResponse<Exam>> {
    try {
      console.log('Creating exam with data:', examData);
      const response = await ApiClient.post<Exam>('/exams', examData);
      console.log('Create exam response:', response);
      return toApiResponse<Exam>(response);
    } catch (error: any) {
      console.error('Create exam service error:', error);
      
      // Handle network errors or empty responses
      if (error.message.includes('Unexpected end of JSON input')) {
        return {
          success: false,
          message: 'Server returned empty response. Please check if exam was created.',
          data: null as any,
          timestamp: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  }

  async getExams(filters?: ExamFilters): Promise<PaginatedResponse<Exam>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const url = params.toString() ? `/exams?${params.toString()}` : '/exams';
    const response = await ApiClient.get<Exam[]>(url);
    return toPaginatedResponse<Exam>(response);
  }

  async getMyExams(): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await ApiClient.get<Exam[]>('/exams/my-exams');
      return toApiResponse<Exam[]>(response);
    } catch (error: any) {
      console.error('Get my exams error:', error);
      
      // Return empty array instead of throwing for 403 errors
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Access denied to student exams',
          data: [],
          timestamp: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  }

  async getExamById(id: string): Promise<ApiResponse<Exam>> {
    const response = await ApiClient.get<Exam>(`/exams/${id}`);
    return toApiResponse<Exam>(response);
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<ApiResponse<Exam>> {
    const response = await ApiClient.put<Exam>(`/exams/${id}`, updates);
    return toApiResponse<Exam>(response);
  }

  async deleteExam(id: string): Promise<ApiResponse<void>> {
    const response = await ApiClient.delete<void>(`/exams/${id}`);
    return toApiResponse<void>(response);
  }

  async updateExamStatus(id: string, status: Exam['status']): Promise<ApiResponse<Exam>> {
    const response = await ApiClient.patch<Exam>(`/exams/${id}/status`, { status });
    return toApiResponse<Exam>(response);
  }

  // ==================== Submission Operations ====================
  async submitExam(examId: string, answers: Submission['answers']): Promise<ApiResponse<Submission>> {
    const response = await ApiClient.post<Submission>(`/exams/${examId}/submit`, { answers });
    return toApiResponse<Submission>(response);
  }

  async evaluateExam(examId: string): Promise<ApiResponse<void>> {
    const response = await ApiClient.post<void>(`/exams/${examId}/evaluate`);
    return toApiResponse<void>(response);
  }

  async getSubmissions(examId: string): Promise<ApiResponse<Submission[]>> {
    const response = await ApiClient.get<Submission[]>(`/exams/${examId}/submissions`);
    return toApiResponse<Submission[]>(response);
  }

  async getMySubmissions(): Promise<ApiResponse<Submission[]>> {
    const response = await ApiClient.get<Submission[]>('/submissions/my');
    return toApiResponse<Submission[]>(response);
  }

  async getSubmissionById(submissionId: string): Promise<ApiResponse<Submission>> {
    const response = await ApiClient.get<Submission>(`/submissions/${submissionId}`);
    return toApiResponse<Submission>(response);
  }

  // ==================== Analysis Operations ====================
  async getExamAnalytics(examId: string): Promise<ApiResponse<any>> {
    const response = await ApiClient.get<any>(`/exams/${examId}/analytics`);
    return toApiResponse<any>(response);
  }

  async getClassPerformance(className: string, section: string): Promise<ApiResponse<any>> {
    const response = await ApiClient.get<any>(`/exams/performance/${className}/${section}`);
    return toApiResponse<any>(response);
  }

  // ==================== Batch Operations ====================
  async publishResults(examId: string): Promise<ApiResponse<void>> {
    const response = await ApiClient.post<void>(`/exams/${examId}/publish-results`);
    return toApiResponse<void>(response);
  }

  async sendNotifications(examId: string, message: string): Promise<ApiResponse<void>> {
    const response = await ApiClient.post<void>(`/exams/${examId}/notify`, { message });
    return toApiResponse<void>(response);
  }
}

export default new ExamService();