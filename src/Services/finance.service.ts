// src/Services/finance.service.ts
import apiClient, { apiHelpers, type ApiResponse } from '@/Services/apiClient';

// Types for better TypeScript support
export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  paymentDate: string;
  collectedBy: string;
}

export interface StudentFeeDetails {
  summary: any;
  feeStructure: any;
  data: any;
  feeSummary: any;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string;
  totalDues: number;
  paidAmount: number;
  balanceAmount: number;
  feeBreakdown: Array<{
    type: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
}

export interface PaymentSummary {
  totalAmount: number;
  totalTransactions: number;
  successRate: number;
  pendingAmount: number;
  pendingCount: number;
}

export const FinanceService = {
  // ✅ 1. Student Search API
  searchStudents: async (query: string): Promise<ApiResponse<any[]>> => {
    const response = await apiHelpers.get(`/finance/students/search?query=${encodeURIComponent(query)}`);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // ✅ 2. Get Student Fee Details API
  getStudentFeeDetails: async (admissionNumber: string): Promise<ApiResponse<StudentFeeDetails>> => {
    const response = await apiHelpers.get(`/finance/students/${admissionNumber}/fee-details`);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // ✅ 3. Record Payment API
  recordPayment: async (paymentData: any): Promise<ApiResponse<{
    receiptNo: string; receiptNumber: string 
}>> => {
    const response = await apiHelpers.post('/finance/payments/record', paymentData);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: response.data?.receiptNumber || '' // Use actual receipt number if available
    };
  },

  // ✅ 4. Get All Payments API
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<{ data: Payment[]; total: number; page: number; limit: number }>> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
    
    const url = `/finance/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiHelpers.get(url);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // ✅ 5. Get Payment Summary API
  getPaymentSummary: async (params?: {
    startDate?: string;
    endDate?: string;
    class?: string;
  }): Promise<ApiResponse<PaymentSummary>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.class) queryParams.append('class', params.class);
    
    const url = `/finance/payments/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiHelpers.get(url);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // Get Fee Defaulters
  getFeeDefaulters: async (params?: {
    overdueDays?: number;
    class?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.overdueDays) queryParams.append('overdueDays', params.overdueDays.toString());
    if (params?.class) queryParams.append('class', params.class);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `/finance/fee-defaulters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiHelpers.get(url);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // Send reminder to defaulter
  sendReminder: async (studentId: string, reminderData: {
    type: 'sms' | 'email' | 'both';
    message?: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await apiHelpers.post(`/finance/fee-defaulters/${studentId}/remind`, reminderData);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // Generate report
  generateReport: async (reportType: string, params: any): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const response = await apiHelpers.post('/finance/reports/generate', {
      reportType,
      ...params
    });
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  },

  // Download receipt
  downloadReceipt: async (receiptNumber: string): Promise<{ success: boolean; error?: string }> => {
    const result = await apiHelpers.download(`/finance/receipts/${receiptNumber}/download`, `receipt-${receiptNumber}.pdf`);
    return {
      success: result.success,
      error: result.error
    };
  },

  // Get payment by receipt number
  getPaymentByReceipt: async (receiptNumber: string): Promise<ApiResponse<Payment>> => {
    const response = await apiHelpers.get(`/finance/payments/receipt/${receiptNumber}`);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: response.data?.receiptNumber || receiptNumber // Use the actual receipt number
    };
  },

  // Refund payment
  refundPayment: async (paymentId: string, refundData: {
    amount: number;
    reason: string;
  }): Promise<ApiResponse<{ refundId: string }>> => {
    const response = await apiHelpers.post(`/finance/payments/${paymentId}/refund`, refundData);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
      success: response.success,
      receiptNumber: '' // Add this to fix the error
    };
  }
};