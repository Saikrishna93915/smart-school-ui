import { apiClient } from '../contexts/AuthContext'; // Uses your existing, working auth client

// --- TYPES ---
export interface AttendanceRecordPayload {
  studentId: string;
  morning: boolean;
  afternoon: boolean;
}

export interface MarkAttendancePayload {
  date: string;
  className: string;
  section: string;
  attendance: AttendanceRecordPayload[];
}

export interface AttendanceSummaryResponse {
  totalStudents: number;
  present: number;
  halfDay: number;
  absent: number;
  attendancePercentage: number;
}

// Adjust this base path to match your backend routes
// Based on StudentsService, it seems to be '/admin/...'
const BASE_ENDPOINT = '/admin/attendance'; 

export const attendanceApi = {
  // 1. Get existing records (matches what we need in Attendance.tsx)
  getRecords: async (className: string, section: string, date: string) => {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/by-class`, {
        params: { className, section, date }
      });
      return response.data;
    } catch (error) {
      console.error("API Error (getRecords):", error);
      throw error;
    }
  },

  // 2. Mark Attendance
  markAttendance: async (payload: MarkAttendancePayload) => {
    const response = await apiClient.post(`${BASE_ENDPOINT}/mark`, payload);
    return response.data;
  },

  // 3. Get Summary Stats
  getSummary: async (className: string, section: string, date: string) => {
    const response = await apiClient.get(`${BASE_ENDPOINT}/summary`, {
      params: { className, section, date }
    });
    return response.data as AttendanceSummaryResponse;
  }
};