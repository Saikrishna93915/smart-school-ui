import apiClient from "./apiClient";

interface DashboardData {
  success: boolean;
  data: {
    overview: {
      totalStudents: number;
      totalTeachers: number;
      totalUsers: number;
      activeUsers: number;
      defaulters: number;
      lowAttendanceStudents: number;
    };
    fees: {
      monthly: {
        totalCollected: number;
        totalTransactions: number;
        averagePerTransaction: number;
      };
      overall: {
        totalFeeAmount: number;
        totalPaidAmount: number;
        totalDueAmount: number;
      };
      byClass: Array<{
        _id: string;
        className: string;
        totalFee: number;
        paid: number;
        unpaid: number;
        studentCount: number;
        totalAmount: number;
      }>;
    };
    attendance: {
      today: {
        totalMarked: number;
        presentCount: number;
        absentCount: number;
      };
      trend: Array<{
        _id: string;
        total: number;
        present: number;
        absent: number;
        percentage: number;
      }>;
      byClass: Array<{
        _id: string;
        total: number;
        present: number;
        percentage: number;
      }>;
    };
    meta: {
      month: number;
      year: number;
      generatedAt: string;
    };
  };
}

interface AttendanceChart {
  _id: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface FeeChart {
  _id: string;
  totalAmount: number;
  count: number;
}

class DashboardService {
  /**
   * Get admin dashboard summary (fees + attendance)
   */
  async getAdminSummary(month?: number, year?: number): Promise<DashboardData> {
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month.toString());
      if (year) params.append("year", year.toString());

      const response = await apiClient.get(
        `/dashboard/admin-summary${params.toString() ? "?" + params.toString() : ""}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  }

  /**
   * Get fee collection chart data
   */
  async getFeeCollectionChart(days: number = 30): Promise<FeeChart[]> {
    try {
      const response = await apiClient.get(
        `/dashboard/fee-collection?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching fee collection chart:", error);
      throw error;
    }
  }

  /**
   * Get attendance statistics chart data
   */
  async getAttendanceStats(days: number = 30): Promise<AttendanceChart[]> {
    try {
      const response = await apiClient.get(
        `/dashboard/attendance-stats?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      throw error;
    }
  }

  /**
   * Format fee amount to Indian currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Calculate attendance percentage
   */
  calculateAttendancePercentage(present: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const data = await this.getAdminSummary();
      const { overview, fees, attendance } = data.data;

      return {
        statistics: {
          totalStudents: overview.totalStudents,
          attendanceToday: attendance.today.totalMarked
            ? this.calculateAttendancePercentage(
                attendance.today.presentCount,
                attendance.today.totalMarked
              )
            : 0,
          feeCollected: fees.monthly.totalCollected,
          atRiskStudents: overview.lowAttendanceStudents,
        },
        fees: {
          monthly: fees.monthly,
          overall: fees.overall,
          byClass: fees.byClass,
        },
        attendance: {
          today: attendance.today,
          trend: attendance.trend,
          byClass: attendance.byClass,
        },
      };
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      throw error;
    }
  }
}

export default new DashboardService();
