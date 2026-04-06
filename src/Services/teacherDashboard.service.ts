import ApiClient from './apiClient';

export interface DashboardOverview {
  todaysClasses: any[];
  pendingTasks: {
    tasksToMark: number;
    submissionsToGrade: number;
    announcementsToPost: number;
    totalPendingTasks: number;
  };
  performanceAlerts: any[];
  recentAnnouncements: any[];
  timestamp: string;
}

export interface DashboardStatistics {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  totalMaterials: number;
  averageAttendanceRate: string;
}

export interface StudentAlert {
  studentId: string;
  studentName: string;
  rollNumber: string;
  performancePercentage: number;
  attendanceRate: number;
  overallPerformance: string;
  performanceTrend: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
}

class TeacherDashboardService {
  private baseUrl = '/api/teacher/dashboard';

  /**
   * Get dashboard overview (today's classes, pending tasks, alerts, announcements)
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await ApiClient.get(this.baseUrl);
    return response.data.data;
  }

  /**
   * Get dashboard statistics (total classes, students, assignments, materials)
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    const response = await ApiClient.get(`${this.baseUrl}/statistics`);
    return response.data.data;
  }

  /**
   * Get pending tasks count
   */
  async getPendingTasks() {
    const response = await ApiClient.get(`${this.baseUrl}/pending-tasks`);
    return response.data.data;
  }

  /**
   * Get student alerts (failing, low attendance, declining trends)
   */
  async getStudentAlerts(): Promise<StudentAlert[]> {
    const response = await ApiClient.get(`${this.baseUrl}/alerts`);
    return response.data.data;
  }
}

export default new TeacherDashboardService();
