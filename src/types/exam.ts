// src/types/exam.ts

export type QuestionType = 
  | 'mcq' 
  | 'multi-correct' 
  | 'truefalse' 
  | 'short' 
  | 'long' 
  | 'fillblank' 
  | 'match' 
  | 'code';

export type ExamPattern = 
  | 'STANDARD' 
  | 'COMPETITIVE' 
  | 'PRACTICAL' 
  | 'OPEN_BOOK' 
  | 'TIME_BOUND' 
  | 'ADAPTIVE';

export type ExamStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'live' 
  | 'completed' 
  | 'archived';

export type ProctoringMode = 
  | 'basic' 
  | 'ai' 
  | 'live' 
  | 'strict';

export type DifficultyLevel = 
  | 'easy' 
  | 'medium' 
  | 'hard';

export interface Question {
  _id?: string;
  type: QuestionType;
  text: string;
  marks: number;
  negativeMarks?: number;
  difficulty: DifficultyLevel;
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
  description?: string;
  pattern: ExamPattern;
  status: ExamStatus;
  date: string;
  examDate: Date | string;
  startTime: string;
  endTime: string;
  duration: number;
  durationMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  showMarksImmediately: boolean;
  proctoringMode: ProctoringMode;
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

export interface ExamFilters {
  page?: number;
  limit?: number;
  status?: ExamStatus;
  className?: string;
  section?: string;
  subject?: string;
  search?: string;
}

export interface CreateExamData {
  name: string;
  className: string;
  section: string;
  subject: string;
  description?: string;
  pattern: ExamPattern;
  status: ExamStatus;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  showMarksImmediately: boolean;
  proctoringMode: ProctoringMode;
  maxAttempts: number;
  subjectGroups: SubjectGroup[];
  instructions: string[];
  classTargets?: ClassTarget[];
}