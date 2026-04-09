import ApiClient from './apiClient';

export interface MyClass {
  _id: string;
  className: string;
  academicYear: any;
  level?: string;
}

export interface ClassDetails {
  class: any;
  sections: any[];
  subjects: any[];
  statistics: {
    totalStudents: number;
    totalSections: number;
    totalSubjectsAssigned: number;
    totalAssignments: number;
  };
}

export interface Section {
  _id: string;
  sectionName: string;
  capacity: number;
  totalStudents: number;
  students: any[];
  classTeacher?: any;
}

export interface ClassPerformanceSummary {
  totalStudents: number;
  excellentStudents: number;
  aboveAverageStudents: number;
  averageStudents: number;
  belowAverageStudents: number;
  failingStudents: number;
  averagePercentage: string;
  averageAttendance: string;
  studentsNeedingIntervention: number;
  alerts: Array<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    reason: string;
  }>;
}

export interface ClassAssignmentSummary {
  totalAssignments: number;
  draftAssignments: number;
  publishedAssignments: number;
  closedAssignments: number;
  averageSubmissionCount: string;
  averageGradeCount: string;
  pendingAssignments: Array<{
    _id: string;
    title: string;
    dueDate: Date;
    submissionCount: number;
    gradeCount: number;
    pendingGrades: number;
  }>;
}

export interface ClassScheduleSummary {
  totalSessions: number;
  totalHours: string;
  subjects: string[];
  schedule: {
    Sunday: any[];
    Monday: any[];
    Tuesday: any[];
    Wednesday: any[];
    Thursday: any[];
    Friday: any[];
    Saturday: any[];
  };
  rooms: string[];
  buildings: string[];
}

export interface ClassOverview {
  _id: string;
  className: string;
  level?: string;
  totalStudents: number;
  totalSections: number;
  totalAssignments: number;
  totalSchedules: number;
}

class MyClassesService {
  private baseUrl = '/api/teacher/classes';

  /**
   * Get all classes assigned to teacher
   */
  async getMyClasses(): Promise<MyClass[]> {
    const response = await ApiClient.get(this.baseUrl);
    return response.data.data;
  }

  /**
   * Get quick overview of all classes with statistics
   */
  async getClassesOverview(): Promise<ClassOverview[]> {
    const response = await ApiClient.get(`${this.baseUrl}/overview`);
    return response.data.data;
  }

  /**
   * Get detailed information for a class
   */
  async getClassDetails(classId: string): Promise<ClassDetails> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`);
    return response.data.data;
  }

  /**
   * Get all sections in a class
   */
  async getClassSections(classId: string): Promise<Section[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/sections`);
    return response.data.data;
  }

  /**
   * Get students in a section
   */
  async getSectionStudents(classId: string, sectionId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/sections/${sectionId}/students`);
    return response.data.data;
  }

  /**
   * Get class performance summary
   */
  async getClassPerformanceSummary(
    classId: string,
    subjectId?: string
  ): Promise<ClassPerformanceSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/performance-summary`, {
      params: { subjectId }
    });
    return response.data.data;
  }

  /**
   * Get class assignment statistics
   */
  async getClassAssignmentSummary(classId: string): Promise<ClassAssignmentSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/assignments-summary`);
    return response.data.data;
  }

  /**
   * Get class schedule summary
   */
  async getClassScheduleSummary(classId: string): Promise<ClassScheduleSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/schedule-summary`);
    return response.data.data;
  }
}

export default new MyClassesService();
