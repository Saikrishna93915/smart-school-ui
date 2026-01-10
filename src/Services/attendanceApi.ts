import apiClient from "@/Services/apiClient"; // Uses your existing, working auth client

// --- TYPES ---
export interface AttendanceRecordPayload {
  studentId: string;
  // Using optional strings to support dot-notation partial updates on the backend
  morning?: string;   
  afternoon?: string; 
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
  workingDays?: number; // Added to support dashboard metrics
}

export interface HolidayStatusResponse {
  isHoliday: boolean;
  reason: string;
}

export interface WorkingDaysResponse {
  workingDays: number;
}

// Adjust this base path to match your backend routes
const BASE_ENDPOINT = '/admin/attendance'; 

export const attendanceApi = {
  // 1. Get existing records for the attendance grid merge logic
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

  // 2. Mark or Update Attendance 
  // Supports partial updates (FN/AF) via dot notation on the server
  markAttendance: async (payload: MarkAttendancePayload) => {
    try {
      const response = await apiClient.post(`${BASE_ENDPOINT}/mark`, payload);
      return response.data;
    } catch (error) {
      console.error("API Error (markAttendance):", error);
      throw error;
    }
  },

  // 3. Get Summary Stats for Dashboard Cards
  getSummary: async (className: string, section: string, date: string) => {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/summary`, {
        params: { className, section, date }
      });
      return response.data as AttendanceSummaryResponse;
    } catch (error) {
      console.error("API Error (getSummary):", error);
      throw error;
    }
  },

  // 4. Check if a specific date is a declared holiday (Christmas, Sunday, etc.)
  // Required to fix TypeScript Error 2339 in Attendance.tsx
  getHolidayStatus: async (date: string): Promise<HolidayStatusResponse> => {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/holiday-status`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error("API Error (getHolidayStatus):", error);
      // Fallback to allow UI operation if check fails
      return { isHoliday: false, reason: "" }; 
    }
  },

  // 5. Get count of non-Sunday, non-Holiday days for a month/year
  // Required to fix TypeScript Error 2339 in Attendance.tsx
  getWorkingDaysCount: async (month: number, year: number): Promise<WorkingDaysResponse> => {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/working-days`, {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      console.error("API Error (getWorkingDaysCount):", error);
      return { workingDays: 0 };
    }
  },

  // 6. Admin function to declare a custom holiday in the system
  // Required to fix TypeScript Error 2339 in Attendance.tsx
  markHoliday: async (payload: { date: string; reason: string }) => {
    try {
      const response = await apiClient.post(`${BASE_ENDPOINT}/mark-holiday`, payload);
      return response.data;
    } catch (error) {
      console.error("API Error (markHoliday):", error);
      throw error;
    }
  }
};