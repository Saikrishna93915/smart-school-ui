import { apiHelpers, type ApiResponse } from '@/Services/apiClient';

export interface ReportConfig {
  reportType: string;
  format: string;
  startDate?: string;
  endDate?: string;
  className?: string;
  section?: string;
  paymentMethod?: string;
  status?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  emailRecipients?: string[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time?: string;
  };
}

export interface ReportStatistics {
  totalReports: number;
  mostUsedFormat: string;
  avgReportSize: number;
  timeSaved: number;
  recentActivity: Array<{
    date: string;
    transactions: number;
    amount: number;
  }>;
}

export interface RecentReport {
  id: number;
  name: string;
  date: string;
  size: string;
  type: string;
  status: string;
  url: string;
}

export const ReportService = {
  // Generate a new report
  generateReport: async (config: ReportConfig): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const response = await apiHelpers.post('/reports/generate', config);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add empty receiptNumber to fix type error
    };
  },

  // Get report statistics
  getStatistics: async (): Promise<ApiResponse<ReportStatistics>> => {
    const response = await apiHelpers.get('/reports/statistics');
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: ''
    };
  },

  // Get quick collection report
  getQuickCollectionReport: async (): Promise<ApiResponse<any>> => {
    const response = await apiHelpers.get('/reports/quick/collection');
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: ''
    };
  },

  // Get quick defaulter report
  getQuickDefaulterReport: async (): Promise<ApiResponse<any>> => {
    const response = await apiHelpers.get('/reports/quick/defaulters');
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: ''
    };
  },

  // Get recent reports
  getRecentReports: async (): Promise<ApiResponse<RecentReport[]>> => {
    const response = await apiHelpers.get('/reports/recent');
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: ''
    };
  },

  // Download report
  downloadReport: async (url: string, filename: string): Promise<{ success: boolean; error?: string }> => {
    return await apiHelpers.download(url, filename);
  }
};