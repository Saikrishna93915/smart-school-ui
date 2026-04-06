import apiClient from "./apiClient";

// Type definitions for API responses
export interface DashboardStatsResponse {
  success: boolean;
  data: {
    totalStudents?: number;
    totalTeachers?: number;
    todayAttendance?: {
      present: number;
      total: number;
      rate: string;
    };
    feeCollection?: {
      monthly: number;
      pending: number;
    };
    activeExams?: number;
  };
  message?: string;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  audience: string | Record<string, unknown>;
  status?: string;
  featured?: boolean;
  pinned?: boolean;
  publishedAt?: string;
  expiresAt?: string;
}

export const principalService = {
  /**
   * Get principal dashboard statistics
   */
  getDashboardStats: () => apiClient.get<DashboardStatsResponse>("/principal/dashboard"),
  
  /**
   * Get students summary (read-only view)
   */
  getStudentsSummary: (params?: Record<string, unknown>) => 
    apiClient.get("/principal/students", { params }),
  
  /**
   * Get teachers summary (read-only view)
   */
  getTeachersSummary: () => apiClient.get("/principal/teachers"),
  
  /**
   * Get attendance overview
   */
  getAttendanceOverview: () => apiClient.get("/principal/attendance"),
  
  /**
   * Get finance overview
   */
  getFinanceOverview: (academicYear?: string) =>
    apiClient.get("/principal/finance", { params: academicYear ? { academicYear } : {} }),
  
  /**
   * Get exam results overview
   */
  getExamResults: (params?: Record<string, unknown>) => apiClient.get("/principal/exams", { params }),
  
  /**
   * Get announcements (read-only)
   */
  getAnnouncements: (params?: Record<string, unknown>) =>
    apiClient.get("/principal/announcements", { params }),

  /**
   * Create new announcement
   */
  createAnnouncement: (data: AnnouncementPayload) =>
    apiClient.post("/principal/announcements", data),

  /**
   * Update announcement
   */
  updateAnnouncement: (id: string, data: Partial<AnnouncementPayload>) =>
    apiClient.put(`/principal/announcements/${id}`, data),

  /**
   * Delete announcement
   */
  deleteAnnouncement: (id: string) =>
    apiClient.delete(`/principal/announcements/${id}`),

  /**
   * Pin/unpin announcement
   */
  pinAnnouncement: (id: string, pinned: boolean) =>
    apiClient.put(`/principal/announcements/${id}/pin`, { pinned }),

  /**
   * Archive announcement
   */
  archiveAnnouncement: (id: string) =>
    apiClient.put(`/principal/announcements/${id}/archive`),
  
  /**
   * Get low attendance students alert
   */
  getLowAttendanceStudents: () => apiClient.get("/principal/attendance/low-attendance"),

  /**
   * Get fee defaulters list
   */
  getFeeDefaulters: () => apiClient.get("/principal/finance/defaulters"),

  /**
   * Get transport overview
   */
  getTransportOverview: () => apiClient.get("/principal/transport"),

  /**
   * Get available report types
   */
  getReportTypes: () => apiClient.get("/principal/reports/types"),

  /**
   * Generate custom report
   */
  generateReport: (data: { reportType: string; startDate?: string; endDate?: string; class?: string; section?: string; department?: string }) =>
    apiClient.post("/principal/reports/generate", data),

  /**
   * Export report to CSV
   */
  exportReportCSV: (data: { headers: string[]; rows: string[][] }) =>
    apiClient.post("/principal/reports/export/csv", data, { responseType: "blob" }),

  /**
   * Export report to JSON
   */
  exportReportJSON: (data: { title: string; headers: string[]; rows: string[][] }) =>
    apiClient.post("/principal/reports/export/json", data, { responseType: "blob" }),
};

export default principalService;
