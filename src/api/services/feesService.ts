// src/api/services/feesService.ts

/* =========================
   FEES SERVICE (Student/Parent perspective)
   Abstracts all fees-related API calls
========================= */

export interface FeeStructure {
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
    dueDate: string;
    category: 'tuition' | 'transport' | 'exam' | 'activity' | 'other';
  }
  
  export interface StudentFee {
    id: string;
    feeStructureId: string;
    feeName: string;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate: string;
    status: 'paid' | 'partial' | 'unpaid' | 'overdue';
    lastPaymentDate?: string;
  }
  
  export interface PaymentReceipt {
    id: string;
    receiptNumber: string;
    date: string;
    amount: number;
    paymentMethod: string;
    description: string;
    status: 'completed' | 'pending' | 'failed';
    downloadUrl?: string;
  }
  
  class FeesService {
    
    // TODO: Replace with actual API call: GET /api/fees/structure
    async getFeeStructure(): Promise<FeeStructure[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return Promise.resolve([
        {
          id: 'FEE-001',
          name: 'Tuition Fee',
          amount: 12000,
          frequency: 'monthly',
          dueDate: '5th of each month',
          category: 'tuition'
        },
        {
          id: 'FEE-002',
          name: 'Transport Fee',
          amount: 3000,
          frequency: 'monthly',
          dueDate: '5th of each month',
          category: 'transport'
        }
      ]);
    }
    
    // TODO: Replace with actual API call: GET /api/fees/student/{studentId}/dues
    async getStudentDues(studentId: string): Promise<StudentFee[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return Promise.resolve([
        {
          id: 'DUE-001',
          feeStructureId: 'FEE-001',
          feeName: 'Tuition Fee - January 2024',
          amount: 12000,
          paidAmount: 0,
          dueAmount: 12000,
          dueDate: '2024-01-15',
          status: 'overdue'
        },
        {
          id: 'DUE-002',
          feeStructureId: 'FEE-002',
          feeName: 'Transport Fee - January 2024',
          amount: 3000,
          paidAmount: 1500,
          dueAmount: 1500,
          dueDate: '2024-01-15',
          status: 'partial'
        }
      ]);
    }
    
    // TODO: Replace with actual API call: GET /api/fees/payment-history
    async getPaymentHistory(studentId: string): Promise<PaymentReceipt[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return Promise.resolve([
        {
          id: 'REC-001',
          receiptNumber: 'RC-2023-125',
          date: '2023-12-15',
          amount: 12000,
          paymentMethod: 'Online Payment',
          description: 'Tuition Fee - December 2023',
          status: 'completed',
          downloadUrl: '/receipts/RC-2023-125.pdf'
        }
      ]);
    }
    
    // TODO: Replace with actual API call: POST /api/fees/initiate-payment
    async initiatePayment(paymentData: {
      feeIds: string[];
      amount: number;
      paymentMethod: string;
    }): Promise<{ success: boolean; paymentId?: string; redirectUrl?: string }> {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Payment initiated (would call backend):', paymentData);
      
      return {
        success: true,
        paymentId: `PAY-${Date.now()}`,
        redirectUrl: '/payment-gateway/simulated'
      };
    }
  }
  
  export const feesService = new FeesService();