// lib/api/examService.ts

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from './config';

// ==================== Types ====================
export interface Question {
  _id?: string;
  type: 'mcq' | 'multi-correct' | 'truefalse' | 'short' | 'long' | 'fillblank' | 'match' | 'code';
  text: string;
  marks: number;
  negativeMarks?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  options?: string[];
  correctAnswers?: number[];
  correctAnswer?: any;
  image?: string;
  explanation?: string;
  timeLimit?: number;
  codeLanguage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectGroup {
  _id?: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassTarget {
  className: string;
  sections: string[];
  totalStudents: number;
  roomAllocation?: string;
}

export interface Exam {
  _id: string;
  name: string;
  className: string;
  section: string;
  subject: string;
  description: string;
  pattern: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'archived';
  date: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  durationMinutes: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  showMarksImmediately: boolean;
  proctoringMode: 'basic' | 'ai' | 'live' | 'strict';
  maxAttempts: number;
  classTargets: ClassTarget[];
  subjectGroups: SubjectGroup[];
  instructions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  exam: string | Exam;
  student: string;
  answers: {
    questionId: string;
    answer: any;
    timeSpent?: number;
    markedForReview?: boolean;
  }[];
  totalMarksObtained?: number;
  status: 'pending' | 'submitted' | 'evaluated' | 'late';
  submittedAt?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== Error Handling ====================
export class ExamServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ExamServiceError';
  }
}

// ==================== Service Class ====================
class ExamService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    this.setupInterceptors();
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
        }
        
        const errorMessage = this.getErrorMessage(error);
        return Promise.reject(new ExamServiceError(
          errorMessage,
          error.code,
          error.response?.status,
          error
        ));
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      return data.message || data.error || 'An error occurred';
    }
    return error.message || 'Network error occurred';
  }

  // ==================== Auth Methods ====================
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  }

  clearAuth(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  // ==================== Exam CRUD Operations ====================
  async createExam(examData: Omit<Exam, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Exam>> {
    try {
      const response: AxiosResponse<ApiResponse<Exam>> = await this.axiosInstance.post('/exams', examData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create exam');
    }
  }

  async getExams(params?: {
    page?: number;
    limit?: number;
    status?: string;
    className?: string;
    section?: string;
  }): Promise<PaginatedResponse<Exam>> {
    try {
      const response: AxiosResponse<PaginatedResponse<Exam>> = await this.axiosInstance.get('/exams', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch exams');
    }
  }

  async getMyExams(): Promise<ApiResponse<Exam[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Exam[]>> = await this.axiosInstance.get('/exams/my-exams');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch student exams');
    }
  }

  async getExamById(id: string): Promise<ApiResponse<Exam>> {
    try {
      const response: AxiosResponse<ApiResponse<Exam>> = await this.axiosInstance.get(`/exams/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch exam');
    }
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<ApiResponse<Exam>> {
    try {
      const response: AxiosResponse<ApiResponse<Exam>> = await this.axiosInstance.put(`/exams/${id}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update exam');
    }
  }

  async deleteExam(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.axiosInstance.delete(`/exams/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete exam');
    }
  }

  async updateExamStatus(id: string, status: Exam['status']): Promise<ApiResponse<Exam>> {
    try {
      const response: AxiosResponse<ApiResponse<Exam>> = await this.axiosInstance.patch(`/exams/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update exam status');
    }
  }

  // ==================== Submission Operations ====================
  async submitExam(examId: string, answers: Submission['answers']): Promise<ApiResponse<Submission>> {
    try {
      const response: AxiosResponse<ApiResponse<Submission>> = await this.axiosInstance.post(
        `/exams/${examId}/submit`, 
        { answers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit exam');
    }
  }

  async evaluateExam(examId: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.axiosInstance.post(
        `/exams/${examId}/evaluate`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to evaluate exam');
    }
  }

  async getSubmissions(examId: string): Promise<ApiResponse<Submission[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Submission[]>> = await this.axiosInstance.get(
        `/exams/${examId}/submissions`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch submissions');
    }
  }

  async getMySubmissions(): Promise<ApiResponse<Submission[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Submission[]>> = await this.axiosInstance.get(
        '/submissions/my'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch submissions');
    }
  }

  // ==================== Utility Methods ====================
  private handleError(error: any, defaultMessage: string): ExamServiceError {
    if (error instanceof ExamServiceError) {
      return error;
    }
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || defaultMessage;
      return new ExamServiceError(
        message,
        error.code,
        error.response?.status,
        error
      );
    }
    
    return new ExamServiceError(
      error.message || defaultMessage,
      undefined,
      undefined,
      error
    );
  }

  async retry<T>(fn: () => Promise<T>, retries: number = API_CONFIG.MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        return this.retry(fn, retries - 1);
      }
      throw error;
    }
  }
}

// ==================== Singleton Instance ====================
export const examService = new ExamService();