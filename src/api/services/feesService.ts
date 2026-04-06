// src/api/services/feesService.ts

import apiClient from "../../Services/apiClient";

/* =========================
   COMPLETE FEES SERVICE
   ========================= */

// ===== INTERFACES =====

export interface FeeComponent {
  componentName: string;
  amount: number;
  dueDate?: string;
  isMandatory: boolean;
  isRecurring: boolean;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidAmount: number;
}

export interface Installment {
  installmentNo: number;
  dueDate: string;
  amount: number;
  penalty: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  receiptNo?: string;
}

export interface PaymentSchedule {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  receiptNo?: string;
}

export interface MyFeeStructure {
  admissionNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  feeComponents: FeeComponent[];
  transportOpted: boolean;
  transportFee: number;
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  discountApplied: number;
  discountReason?: string;
  paymentSchedule: PaymentSchedule[];
  overallStatus: 'active' | 'completed' | 'cancelled';
  summary?: {
    totalFee: number;
    totalPaid: number;
    totalDue: number;
    paidPercentage: number;
    discount: number;
  };
}

export interface StudentDue {
  installmentNo: number;
  amount: number;
  penalty: number;
  total: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  daysOverdue: number;
}

export interface StudentDuesResponse {
  studentFee: MyFeeStructure;
  dues: {
    totalDue: number;
    totalPenalty: number;
    totalWithPenalty: number;
    penalties: StudentDue[];
  };
  student: {
    name: string;
    admissionNumber: string;
    className: string;
    section: string;
  };
}

export interface PaymentRequest {
  studentId: string;
  amount: number;
  paymentMethod: 'cash' | 'cheque' | 'online' | 'upi' | 'card' | 'bank-transfer' | 'wallet';
  transactionId?: string;
  description?: string;
  duesIds?: string[];
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: {
      _id: string;
      receiptNumber: string;
      amount: number;
      paymentMethod: string;
      status: string;
      paymentDate: string;
    };
    receipt: {
      _id: string;
      receiptNo: string;
    };
    receiptNumber: string;
  };
}

export interface Receipt {
  _id: string;
  receiptNo: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: 'generated' | 'sent' | 'downloaded';
  studentName?: string;
}

export interface PaymentHistory {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

export interface FeesAnalytics {
  totalRevenue: number;
  totalDues: number;
  collectionRate: string;
  paymentTrend: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
}

// ===== FEES SERVICE CLASS =====

class FeesService {
  
  // ===== FEE STRUCTURE =====

  /**
   * Get current student's fee structure
   */
  async getMyFeeStructure(): Promise<MyFeeStructure> {
    const response = await apiClient.get<{ success: boolean; data: MyFeeStructure }>('/fees/my-fee-structure');
    if (!response.data.success) {
      throw new Error('Failed to fetch fee structure');
    }
    return response.data.data;
  }

  /**
   * Get fee structure by student ID
   */
  async getFeeStructureByStudent(studentId: string): Promise<MyFeeStructure> {
    const response = await apiClient.get<{ success: boolean; data: MyFeeStructure }>(`/fees/structure/${studentId}`);
    if (!response.data.success) {
      throw new Error('Failed to fetch fee structure');
    }
    return response.data.data;
  }

  /**
   * Get all fee structures (Admin only)
   */
  async getAllFeeStructures(academicYear?: string, className?: string) {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (className) params.append('className', className);

    const response = await apiClient.get(`/fees/structures?${params.toString()}`);
    return response.data;
  }

  // ===== STUDENT DUES =====

  /**
   * Get student dues with penalties
   */
  async getStudentDues(studentId?: string): Promise<StudentDuesResponse> {
    try {
      const url = studentId ? `/fees/student/${studentId}/dues` : '/fees/dues';
      const response = await apiClient.get<{ success: boolean; data: StudentDuesResponse }>(url);
      
      if (!response.data.success) {
        throw new Error(response.data.data?.message || 'Failed to fetch student dues');
      }
      
      return response.data.data;
    } catch (error) {
      // If endpoint doesn't exist, fallback to my-fee-structure for current student
      const feeStructure = await this.getMyFeeStructure();
      return {
        studentFee: feeStructure,
        dues: {
          totalDue: feeStructure.totalDue || 0,
          totalPenalty: 0,
          totalWithPenalty: feeStructure.totalDue || 0,
          penalties: [],
        },
        student: {
          name: feeStructure.studentName,
          admissionNumber: feeStructure.admissionNumber,
          className: feeStructure.className,
          section: feeStructure.section,
        },
      };
    }
  }

  // ===== PAYMENTS =====

  /**
   * Process student payment
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const response = await apiClient.post<PaymentResponse>('/fees/pay', paymentData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Payment processing failed');
    }
    
    return response.data;
  }

  /**
   * Get payment history for student
   */
  async getPaymentHistory(studentId?: string): Promise<PaymentHistory[]> {
    try {
      const url = studentId ? `/fees/history/${studentId}` : '/fees/history';
      const response = await apiClient.get<{ success: boolean; data: PaymentHistory[] }>(url);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch payment history');
      }
      
      return response.data.data;
    } catch (error) {
      console.warn('Could not fetch payment history:', error);
      return [];
    }
  }

  // ===== RECEIPTS =====

  /**
   * Get student receipts
   */
  async getReceipts(studentId?: string): Promise<Receipt[]> {
    try {
      const url = studentId ? `/fees/receipts/${studentId}` : '/fees/receipts';
      const response = await apiClient.get<{ success: boolean; data: Receipt[] }>(url);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch receipts');
      }
      
      return response.data.data;
    } catch (error) {
      console.warn('Could not fetch receipts:', error);
      return [];
    }
  }

  /**
   * Download receipt as PDF
   */
  async downloadReceipt(paymentId: string): Promise<Blob> {
    const response = await apiClient.get(`/fees/receipts/download/${paymentId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Email receipt to student
   */
  async emailReceipt(paymentId: string, email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/fees/receipts/email/${paymentId}`, { email });
    return response.data;
  }

  // ===== ANALYTICS =====

  /**
   * Get fees analytics (Admin/Accountant only)
   */
  async getFeesAnalytics(academicYear?: string): Promise<FeesAnalytics> {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await apiClient.get<{ success: boolean; data: FeesAnalytics }>(`/fees/analytics${params}`);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch analytics');
    }
    
    return response.data.data;
  }

  // ===== EXPORTS =====

  /**
   * Export payments as CSV
   */
  async exportPaymentsCSV(academicYear?: string): Promise<Blob> {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await apiClient.get(`/fees/export/csv${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Helper: Download file
   */
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper: Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Helper: Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  /**
   * Helper: Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const feesService = new FeesService();