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
   * Uses /fees/my-fee-structure which works for all roles (parent, student)
   */
  async getStudentDues(studentId?: string): Promise<StudentDuesResponse> {
    // Directly use my-fee-structure endpoint which is role-aware
    // This avoids 404 errors from non-existent /fees/dues endpoint
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
   * Download receipt - opens formatted receipt in new window (same format as cashier receipt)
   */
  async downloadReceipt(paymentId: string): Promise<void> {
    const response = await apiClient.get(`/fees/receipts/download/${paymentId}`);
    const data = response.data?.data;
    if (!data) throw new Error('No receipt data found');

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const formatDate = (d: string) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getPaymentMethodLabel = (m: string) => {
      const labels: Record<string, string> = { cash: 'Cash', cheque: 'Cheque', dd: 'Demand Draft', online: 'Online Transfer', upi: 'UPI', card: 'Credit/Debit Card', 'bank-transfer': 'Bank Transfer' };
      return labels[m?.toLowerCase()] || m;
    };

    const SCHOOL_NAME = 'PMC Tech School';
    const SCHOOL_ADDRESS = 'Smart Education Campus';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt - ${data.receiptNumber}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .receipt { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,.1); }
  .header { text-align: center; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; padding: 30px 40px; }
  .header h1 { margin: 0; font-size: 28px; }
  .header p { margin: 5px 0; opacity: .9; font-size: 14px; }
  .header h2 { margin: 10px 0 0; font-size: 18px; font-weight: 400; letter-spacing: 1px; }
  .body { padding: 30px 40px; }
  .receipt-no { text-align: right; font-size: 16px; margin-bottom: 20px; }
  .receipt-no span { background: #f0f9ff; border: 2px solid #3b82f6; padding: 6px 16px; border-radius: 6px; font-weight: 700; color: #1e40af; }
  .section { background: #f8f9fa; padding: 15px 20px; border-radius: 6px; margin-bottom: 20px; }
  .section h3 { margin: 0 0 12px; color: #1e40af; font-size: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
  .info-item { display: flex; padding: 4px 0; }
  .info-label { font-weight: 600; color: #6b7280; min-width: 130px; font-size: 13px; }
  .info-value { color: #111827; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #1e40af; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .total { background: #f0f9ff; font-weight: 700; }
  .total td { font-size: 15px; color: #1e40af; }
  .amount-words { margin: 20px 0; padding: 12px 16px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0; }
  .amount-words strong { color: #1e40af; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-paid { background: #dcfce7; color: #166534; }
  .badge-partial { background: #fef3c7; color: #92400e; }
  .badge-pending { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; padding-top: 20px; }
  .signature { text-align: center; }
  .signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 6px; font-size: 12px; color: #6b7280; }
  .print-bar { text-align: center; padding: 15px; background: #fff; border-bottom: 1px solid #e5e7eb; }
  .print-btn { display: inline-block; padding: 10px 30px; background: #1e40af; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600; }
  .print-btn:hover { background: #1d4ed8; }
  .foot-note { text-align: center; padding: 15px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  @media print { body { background: #fff; padding: 0; } .print-bar { display: none; } .receipt { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="print-bar"><button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button></div>
  <div class="receipt">
    <div class="header">
      <h1>${SCHOOL_NAME}</h1>
      <p>${SCHOOL_ADDRESS}</p>
      <p>Phone: +91 XXXXXXXXXX | Email: office@pmctechschool.com</p>
      <h2>FEE PAYMENT RECEIPT</h2>
    </div>
    <div class="body">
      <div class="receipt-no"><span>Receipt No: ${data.receiptNumber}</span></div>

      <div class="section">
        <h3>Student Information</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${data.studentName}</span></div>
          <div class="info-item"><span class="info-label">Class:</span><span class="info-value">${data.className} — ${data.section || ''}</span></div>
          <div class="info-item"><span class="info-label">Admission No:</span><span class="info-value">${data.admissionNumber}</span></div>
          <div class="info-item"><span class="info-label">Academic Year:</span><span class="info-value">${data.academicYear || '—'}</span></div>
        </div>
      </div>

      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
        <tbody>
          ${data.breakdown && data.breakdown.length > 0 ? data.breakdown.map((b: any) => `<tr><td>${b.name || b.componentName || b.feeType || 'Fee Payment'}</td><td style="text-align:right">${formatCurrency(b.amount)}</td></tr>`).join('') : `<tr><td>${data.description || 'Fee Payment'}</td><td style="text-align:right">${formatCurrency(data.amount)}</td></tr>`}
          <tr class="total"><td style="text-align:right">Total Amount Paid:</td><td style="text-align:right">${formatCurrency(data.amount)}</td></tr>
        </tbody>
      </table>

      ${data.dueAmount > 0 ? `<div class="amount-words"><strong>Balance Due:</strong> ${formatCurrency(data.dueAmount)}</div>` : `<div class="amount-words"><strong>Paid in Full:</strong> No balance remaining ✓</div>`}

      <div class="section" style="margin-top:20px">
        <h3>Payment Details</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Payment Method:</span><span class="info-value">${getPaymentMethodLabel(data.paymentMethod)}</span></div>
          ${data.transactionId ? `<div class="info-item"><span class="info-label">Transaction ID:</span><span class="info-value">${data.transactionId}</span></div>` : ''}
          <div class="info-item"><span class="info-label">Payment Date:</span><span class="info-value">${formatDate(data.paymentDate)}</span></div>
          <div class="info-item"><span class="info-label">Status:</span><span class="info-value"><span class="badge badge-${data.status === 'completed' || data.status === 'paid' ? 'paid' : data.status === 'partial' ? 'partial' : 'pending'}">${data.status}</span></span></div>
          <div class="info-item"><span class="info-label">Collected By:</span><span class="info-value">${data.collectedBy}</span></div>
        </div>
      </div>

      <div class="footer">
        <div class="signature"><div class="signature-line">Cashier's Signature</div></div>
        <div class="signature"><div class="signature-line">Authorized Signature</div></div>
      </div>
    </div>
    <div class="foot-note">This is a system-generated receipt. For queries, contact the school accounts office.<br>© ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) throw new Error('Please allow popups to download the receipt');
    win.document.write(html);
    win.document.close();
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