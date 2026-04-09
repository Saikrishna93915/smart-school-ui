// src/services/feeDefaultersService.ts
import axios from 'axios';
import { getStoredToken } from '@/lib/auth/storage';

// Use the same API URL as the rest of the app
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken() || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Defaulter {
  _id?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  rollNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  amount: number;
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  daysOverdue: number;
  status: 'Critical' | 'High' | 'Moderate' | 'Low';
  priority: number;
  remindersSent: number;
  lastContact: string;
  lastPaymentDate?: string;
  dueInstallments: Array<{
    componentName: string;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate: string;
    status: string;
  }>;
  recentPayments: Array<{
    receiptNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }>;
  notes: string;
}

export interface PaginatedResponse {
  success: boolean;
  defaulters: Defaulter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalAmount: number;
    totalDefaulters: number;
    avgDaysOverdue: number;
    criticalCount: number;
    highCount: number;
    moderateCount: number;
    recoveryRate: number;
  };
  distributions: {
    overdueDistribution: Array<{
      range: string;
      count: number;
      amount: number;
    }>;
    classWiseDistribution: Array<{
      class: string;
      count: number;
      amount: number;
    }>;
  };
}

export interface ReminderRequest {
  defaulters: string[];
  message: string;
  method: 'sms' | 'email';
}

export interface StatisticsResponse {
  statistics: {
    overall: {
      totalAmount: number;
      totalDefaulters: number;
      avgDue: number;
    };
    priority: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    class: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    monthlyTrend: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    recoveryRate: number;
  };
}

// API Calls
export const feeDefaultersService = {
  // Get defaulters with filters
  getFeeDefaulters: async (params: {
    search?: string;
    className?: string;
    status?: string;
    priority?: string;
    daysOverdue?: string;
    minAmount?: string;
    maxAmount?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse> => {
    const response = await apiClient.get('/finance/fee-defaulters', { params });
    return response.data;
  },

  // Get defaulter details
  getDefaulterDetails: async (admissionNumber: string) => {
    const response = await apiClient.get(`/finance/fee-defaulters/${admissionNumber}`);
    return response.data;
  },

  // Send reminders
  sendReminders: async (data: ReminderRequest) => {
    const response = await apiClient.post('/finance/fee-defaulters/send-reminders', data);
    return response.data;
  },

  // Update defaulter notes
  updateDefaulterNotes: async (admissionNumber: string, notes: string, actionTaken?: string) => {
    const response = await apiClient.put(`/finance/fee-defaulters/${admissionNumber}/notes`, {
      notes,
      actionTaken
    });
    return response.data;
  },

  // Export to CSV
  exportFeeDefaulters: async (params: {
    search?: string;
    className?: string;
    status?: string;
    priority?: string;
    daysOverdue?: string;
  }) => {
    const response = await apiClient.get('/finance/fee-defaulters/export', {
      params,
      responseType: 'blob' // Important for file downloads
    });
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<StatisticsResponse> => {
    const response = await apiClient.get('/finance/fee-defaulters/statistics');
    return response.data;
  },

  // Mark as paid
  markAsPaid: async (admissionNumber: string, amount: number, paymentMethod: string, notes?: string) => {
    const response = await apiClient.post(`/finance/fee-defaulters/${admissionNumber}/mark-paid`, {
      amount,
      paymentMethod,
      notes
    });
    return response.data;
  }
};