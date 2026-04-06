import ApiClient from './apiClient';

export interface StudentPerformance {
  _id: string;
  studentId: any;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  academicYear: number;
  examMarks: {
    totalExams: number;
    totalMarks: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    exams: Array<{
      examId: string;
      examName: string;
      marks: number;
      totalMarks: number;
      percentage: number;
      date: Date;
    }>;
  };
  assignmentMarks: {
    totalAssignments: number;
    submittedAssignments: number;
    averageMarks: number;
    submissions: Array<{
      assignmentId: string;
      title: string;
      obtainedPoints: number;
      totalPoints: number;
      percentage: number;
      submittedDate: Date;
    }>;
  };
  attendanceData: {
    totalClasses: number;
    classesAttended: number;
    classesAbsent: number;
  };
  attendanceRate: number;
  participationScore: number;
  engagement: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  discipline: 'poor' | 'fair' | 'good' | 'very-good' | 'excellent';
  overallPerformance: 'failing' | 'below-average' | 'average' | 'above-average' | 'excellent';
  performanceGrade: 'F' | 'D' | 'C' | 'B' | 'A';
  performancePercentage: number;
  performanceTrend: 'declining' | 'stable' | 'improving' | 'rapidly-improving';
  teacherComments: Array<{
    comment: string;
    date: Date;
    category: 'academic' | 'behavioral' | 'engagement' | 'general';
  }>;
  interventionsNeeded: Array<{
    intervention: string;
    priority: 'high' | 'medium' | 'low';
    startDate: Date;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
}

export interface ClassPerformanceStats {
  totalStudents: number;
  excellentCount: number;
  aboveAverageCount: number;
  averageCount: number;
  belowAverageCount: number;
  failingCount: number;
  averagePercentage: string;
  averageAttendance: string;
}

export interface AttendanceAnalysis {
  classTotal: number;
  excellentAttendance: number;
  goodAttendance: number;
  averageAttendance: number;
  poorAttendance: number;
  classAverageAttendance: string;
  lowAttendanceStudents: Array<{
    studentId: string;
    name: string;
    rollNumber: string;
    attendanceRate: number;
    totalClasses: number;
    classesAttended: number;
    classesAbsent: number;
  }>;
}

export interface AssignmentAnalysis {
  totalStudents: number;
  totalAssignmentsSubmitted: number;
  averageSubmissionRate: string;
  classAverageMarks: string;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  nonSubmitters: Array<{
    studentId: string;
    name: string;
    rollNumber: string;
  }>;
}

class PerformanceAnalyticsService {
  private baseUrl = '/api/teacher/analytics';

  /**
   * Get performance data for a specific student in a subject
   */
  async getStudentPerformance(studentId: string, subjectId: string): Promise<StudentPerformance> {
    const response = await ApiClient.get(`${this.baseUrl}/student/${studentId}/${subjectId}`);
    return response.data.data;
  }

  /**
   * Get all students' performance for a class
   */
  async getClassPerformance(classId: string, subjectId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/class/${classId}/${subjectId}`);
    return response.data;
  }

  /**
   * Get top performing students
   */
  async getTopPerformers(classId: string, subjectId: string, limit: number = 10) {
    const response = await ApiClient.get(`${this.baseUrl}/top-performers/${classId}/${subjectId}`, {
      params: { limit }
    });
    return response.data.data;
  }

  /**
   * Get struggling students (failing, low attendance, declining trend)
   */
  async getStrugglingStudents(classId: string, subjectId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/struggling/${classId}/${subjectId}`);
    return response.data.data;
  }

  /**
   * Get performance trend for a student
   */
  async getStudentTrend(studentId: string, subjectId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/student-trend/${studentId}/${subjectId}`);
    return response.data.data;
  }

  /**
   * Get attendance analysis for a class
   */
  async getAttendanceAnalysis(classId: string, subjectId: string): Promise<AttendanceAnalysis> {
    const response = await ApiClient.get(`${this.baseUrl}/attendance/${classId}/${subjectId}`);
    return response.data.data;
  }

  /**
   * Get assignment performance analysis
   */
  async getAssignmentAnalysis(classId: string, subjectId: string): Promise<AssignmentAnalysis> {
    const response = await ApiClient.get(`${this.baseUrl}/assignments/${classId}/${subjectId}`);
    return response.data.data;
  }

  /**
   * Add teacher comment to student performance
   */
  async addStudentComment(
    studentId: string,
    subjectId: string,
    comment: string,
    category?: 'academic' | 'behavioral' | 'engagement' | 'general'
  ): Promise<StudentPerformance> {
    const response = await ApiClient.put(
      `${this.baseUrl}/student/${studentId}/${subjectId}/comment`,
      { comment, category }
    );
    return response.data.data;
  }

  /**
   * Update student intervention record
   */
  async updateIntervention(
    studentId: string,
    subjectId: string,
    intervention: string,
    priority?: 'high' | 'medium' | 'low'
  ): Promise<StudentPerformance> {
    const response = await ApiClient.put(
      `${this.baseUrl}/student/${studentId}/${subjectId}/intervention`,
      { intervention, priority }
    );
    return response.data.data;
  }
}

export default new PerformanceAnalyticsService();
