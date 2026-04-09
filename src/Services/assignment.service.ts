import ApiClient from './apiClient';

export interface Assignment {
  _id: string;
  classId: string;
  sectionId: string;
  subjectId: any;
  teacherId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: Date;
  totalPoints: number;
  submissionType: 'file' | 'text' | 'both';
  status: 'draft' | 'published' | 'closed';
  submissionCount: number;
  gradeCount: number;
  allowLateSubmission: boolean;
  latePenalty?: number;
  attachments: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  _id: string;
  assignmentId: string;
  studentId: any;
  classId: string;
  sectionId: string;
  submittedFile?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  };
  submittedText?: string;
  submittedDate?: Date;
  isLateSubmission: boolean;
  daysLate: number;
  status: 'pending' | 'submitted' | 'graded' | 'unsubmitted';
  obtainedPoints?: number;
  totalPoints: number;
  percentage?: number;
  gradeLevel?: 'A' | 'B' | 'C' | 'D' | 'F' | 'P';
  feedback?: string;
  rubricScores?: Array<{
    criterion: string;
    maxPoints: number;
    obtainedPoints: number;
    weight?: number;
  }>;
  gradedDate?: Date;
  gradedBy?: string;
}

export interface GradingSummary {
  total: number;
  submitted: number;
  graded: number;
  pending: number;
  averageScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export interface CreateAssignmentData {
  classId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: Date;
  totalPoints: number;
  submissionType?: 'file' | 'text' | 'both';
  allowLateSubmission?: boolean;
  latePenalty?: number;
  attachments?: any[];
}

export interface GradeSubmissionData {
  obtainedPoints: number;
  feedback?: string;
  gradeLevel?: 'A' | 'B' | 'C' | 'D' | 'F' | 'P';
  rubricScores?: Array<{
    criterion: string;
    maxPoints: number;
    obtainedPoints: number;
    weight?: number;
  }>;
}

class AssignmentService {
  private baseUrl = '/api/teacher/assignments';

  /**
   * Create a new assignment
   */
  async createAssignment(data: CreateAssignmentData): Promise<Assignment> {
    const response = await ApiClient.post(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Get all assignments for a class
   */
  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`);
    return response.data.data;
  }

  /**
   * Get assignment details with all submissions
   */
  async getAssignmentWithSubmissions(assignmentId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/${assignmentId}/submissions`);
    return response.data.data;
  }

  /**
   * Get grading summary for an assignment
   */
  async getGradingSummary(assignmentId: string): Promise<GradingSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${assignmentId}/grading-summary`);
    return response.data.data;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(assignmentId: string, data: Partial<CreateAssignmentData>): Promise<Assignment> {
    const response = await ApiClient.put(`${this.baseUrl}/${assignmentId}`, data);
    return response.data.data;
  }

  /**
   * Publish an assignment (make it visible to students)
   */
  async publishAssignment(assignmentId: string): Promise<Assignment> {
    const response = await ApiClient.put(`${this.baseUrl}/${assignmentId}/publish`);
    return response.data.data;
  }

  /**
   * Close an assignment (stop accepting submissions)
   */
  async closeAssignment(assignmentId: string): Promise<Assignment> {
    const response = await ApiClient.put(`${this.baseUrl}/${assignmentId}/close`);
    return response.data.data;
  }

  /**
   * Grade a student submission
   */
  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    gradeData: GradeSubmissionData
  ): Promise<AssignmentSubmission> {
    const response = await ApiClient.put(
      `${this.baseUrl}/${assignmentId}/submissions/${submissionId}/grade`,
      gradeData
    );
    return response.data.data;
  }

  /**
   * Delete an assignment (only draft assignments)
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    await ApiClient.delete(`${this.baseUrl}/${assignmentId}`);
  }
}

export default new AssignmentService();
