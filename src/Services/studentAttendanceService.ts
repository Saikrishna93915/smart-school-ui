// src/Services/studentAttendanceService.ts
import apiClient from './apiClient';

interface AttendanceRecord {
  date: string;
  morning: boolean | null;
  afternoon: boolean | null;
  status: 'present' | 'absent' | 'partial' | 'pending';
  markedAt?: string;
  markedBy?: string;
}

interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  section: string;
  profilePic?: string;
  email?: string;
  phone?: string;
}

interface MonthlySummary {
  month: string;
  totalDays: number;
  present: number;
  absent: number;
  partial: number;
  pending: number;
  attendanceRate: number;
}

interface YearlySummary {
  year: number;
  totalDays: number;
  months: Array<{
    month: string;
    present: number;
    absent: number;
    partial: number;
    pending: number;
    totalDays: number;
    attendanceRate: number;
  }>;
}

const BASE_PATH = '/attendance';

/**
 * Student Attendance Service
 * Handles all student-specific attendance viewing operations
 * Note: Students can ONLY view their own attendance, not others'
 * 
 * Note: BASE_PATH is '/attendance' because apiClient base URL already includes '/api'
 */
export const studentAttendanceService = {
  /**
   * Get current authenticated student's info
   * @returns Student profile information
   */
  async getCurrentStudent() {
    try {
      const response = await apiClient.get(`${BASE_PATH}/student/me`);
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error: any) {
      console.error('Error fetching current student:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get student attendance records for a date range
   * Students can only view their own attendance
   * 
   * @param studentId - The student's ID (must match authenticated user's ID)
   * @param startDate - Start date in format YYYY-MM-DD
   * @param endDate - End date in format YYYY-MM-DD
   * @returns Array of attendance records
   */
  async getStudentAttendance(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    data: AttendanceRecord[] | null;
    error?: string;
  }> {
    try {
      if (!studentId) {
        return {
          success: false,
          data: null,
          error: 'Student ID is required'
        };
      }

      if (!startDate || !endDate) {
        return {
          success: false,
          data: null,
          error: 'Start and end dates are required'
        };
      }

      const response = await apiClient.get(
        `${BASE_PATH}/student/${studentId}`,
        {
          params: {
            startDate,
            endDate
          }
        }
      );

      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error: any) {
      console.error('Error fetching student attendance:', error);
      
      // Handle 403 Forbidden (authorization error)
      if (error.response?.status === 403) {
        return {
          success: false,
          data: null,
          error: 'You can only view your own attendance records'
        };
      }

      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch attendance records'
      };
    }
  },

  /**
   * Get student monthly attendance summary
   * 
   * @param studentId - The student's ID
   * @param month - Month number (1-12)
   * @param year - Year number (YYYY)
   * @returns Monthly summary with statistics
   */
  async getStudentMonthlySummary(
    studentId: string,
    month: number,
    year: number
  ): Promise<{
    success: boolean;
    data: MonthlySummary | null;
    error?: string;
  }> {
    try {
      if (!studentId || !month || !year) {
        return {
          success: false,
          data: null,
          error: 'Student ID, month, and year are required'
        };
      }

      const response = await apiClient.get(
        `${BASE_PATH}/student/${studentId}/summary`,
        {
          params: { month, year }
        }
      );

      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error: any) {
      console.error('Error fetching monthly summary:', error);
      
      if (error.response?.status === 403) {
        return {
          success: false,
          data: null,
          error: 'You can only view your own attendance summary'
        };
      }

      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch monthly summary'
      };
    }
  },

  /**
   * Get student yearly attendance summary
   * 
   * @param studentId - The student's ID
   * @param year - Year number (YYYY)
   * @returns Yearly summary broken down by month
   */
  async getStudentYearlySummary(
    studentId: string,
    year: number
  ): Promise<{
    success: boolean;
    data: YearlySummary | null;
    error?: string;
  }> {
    try {
      if (!studentId || !year) {
        return {
          success: false,
          data: null,
          error: 'Student ID and year are required'
        };
      }

      const response = await apiClient.get(
        `${BASE_PATH}/student/${studentId}/yearly`,
        {
          params: { year }
        }
      );

      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error: any) {
      console.error('Error fetching yearly summary:', error);
      
      if (error.response?.status === 403) {
        return {
          success: false,
          data: null,
          error: 'You can only view your own attendance summary'
        };
      }

      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch yearly summary'
      };
    }
  }
};

export default studentAttendanceService;
