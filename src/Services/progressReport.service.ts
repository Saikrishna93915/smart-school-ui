import apiClient from './apiClient';

export interface ProgressExamCyclePayload {
  academicYear: string;
  examName: string;
  examCode: string;
  examType: 'Unit Test' | 'Quarterly' | 'Half Yearly' | 'Annual';
  examSequence: number;
  startDate?: string;
  endDate?: string;
  resultDate?: string;
  isActive?: boolean;
}

export interface UpsertStudentMarksPayload {
  examCycleId: string;
  studentId: string;
  subjectId: string;
  className: string;
  section: string;
  theoryMarks?: number;
  practicalMarks?: number;
  maxMarks?: number;
  passingMarks?: number;
  teacherRemarks?: string;
  isAbsent?: boolean;
  submit?: boolean;
}

export interface VerifyMarksPayload {
  examCycleId: string;
  className: string;
  section: string;
  studentId?: string;
  verifyStatus?: 'Verified' | 'Published';
}

export interface SaveClassTeacherRemarkPayload {
  examCycleId: string;
  studentId: string;
  className: string;
  section: string;
  classTeacherRemark?: string;
  promotedToClass?: string;
  rankInClass?: number;
  attendance?: {
    totalWorkingDays?: number;
    daysPresent?: number;
    attendancePercentage?: number;
  };
  coCurricular?: {
    literature?: 'A' | 'B' | 'C' | 'D';
    cultural?: 'A' | 'B' | 'C' | 'D';
    scientific?: 'A' | 'B' | 'C' | 'D';
    creativity?: 'A' | 'B' | 'C' | 'D';
    games?: 'A' | 'B' | 'C' | 'D';
  };
  personality?: {
    regularity?: 'A' | 'B' | 'C' | 'D';
    punctuality?: 'A' | 'B' | 'C' | 'D';
    cleanliness?: 'A' | 'B' | 'C' | 'D';
    discipline?: 'A' | 'B' | 'C' | 'D';
    cooperation?: 'A' | 'B' | 'C' | 'D';
  };
}

export class ProgressReportService {
  private static BASE_URL = '/progress-reports';

  static async createExamCycle(payload: ProgressExamCyclePayload) {
    const response = await apiClient.post(`${this.BASE_URL}/exam-cycles`, payload);
    return response.data;
  }

  static async getExamCycles(params?: {
    academicYear?: string;
    isActive?: boolean;
    isPublished?: boolean;
  }) {
    const response = await apiClient.get(`${this.BASE_URL}/exam-cycles`, { params });
    return response.data;
  }

  static async upsertStudentMarks(payload: UpsertStudentMarksPayload) {
    const response = await apiClient.post(`${this.BASE_URL}/marks/upsert`, payload);
    return response.data;
  }

  static async verifyMarksForClass(payload: VerifyMarksPayload) {
    const response = await apiClient.post(`${this.BASE_URL}/marks/verify`, payload);
    return response.data;
  }

  static async saveClassTeacherRemark(payload: SaveClassTeacherRemarkPayload) {
    const response = await apiClient.post(`${this.BASE_URL}/class-teacher/remarks`, payload);
    return response.data;
  }

  static async publishExamResults(examCycleId: string) {
    const response = await apiClient.post(`${this.BASE_URL}/exam-cycles/${examCycleId}/publish`);
    return response.data;
  }

  static async getStudentProgressReport(studentId: string, params?: {
    examCycleId?: string;
    academicYear?: string;
  }) {
    const response = await apiClient.get(`${this.BASE_URL}/students/${studentId}/report`, { params });
    return response.data;
  }

  static async getClassExamSummary(params: {
    examCycleId: string;
    className: string;
    section: string;
  }) {
    const response = await apiClient.get(`${this.BASE_URL}/class-summary`, { params });
    return response.data;
  }
}

export default ProgressReportService;
