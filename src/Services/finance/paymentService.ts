/**
 * Payment service for handling financial transactions
 */

export interface PaymentRecord {
    id: string;
    studentId: string;
    studentName: string;
    className: string;
    amount: number;
    paymentMethod: 'UPI' | 'Card' | 'Cash' | 'BankTransfer' | 'Cheque' | 'NetBanking';
    transactionId?: string;
    referenceNumber: string;
    transactionDate: string;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    notes?: string;
    recordedBy: string;
    recordedAt: string;
    receiptSent: boolean;
    parentEmail?: string;
    parentPhone?: string;
  }
  
  export interface PaymentRequest {
    studentId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    transactionDate: string;
    notes?: string;
    sendReceipt: boolean;
  }
  
  export interface PaymentResponse {
    success: boolean;
    paymentId?: string;
    receiptNumber: string;
    message: string;
    errors?: string[];
  }
  
  export interface ReceiptData {
    receiptNumber: string;
    studentName: string;
    className: string;
    amount: number;
    paymentMethod: string;
    transactionDate: string;
    academicYear: string;
    transactionId?: string;
  }
  
  class PaymentService {
    private baseUrl: string;
    
    constructor(baseUrl: string = '/api/finance') {
      this.baseUrl = baseUrl;
    }
    
    /**
     * Record a new payment
     */
    async recordPayment(payment: PaymentRequest): Promise<PaymentResponse> {
      try {
        const response = await fetch(`${this.baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({
            ...payment,
            recordedBy: this.getCurrentUser(),
            recordedAt: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Payment recording failed');
        }
        
        const data = await response.json();
        return {
          success: true,
          paymentId: data.paymentId,
          receiptNumber: data.receiptNumber,
          message: 'Payment recorded successfully'
        };
      } catch (error) {
        console.error('Payment recording error:', error);
        return {
          success: false,
          receiptNumber: '',
          message: error instanceof Error ? error.message : 'Payment recording failed',
          errors: ['Network error or server unavailable']
        };
      }
    }
    
    /**
     * Get payment history for a student
     */
    async getStudentPayments(studentId: string): Promise<PaymentRecord[]> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/student/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment history');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    }
    
    /**
     * Get recent payments across all students
     */
    async getRecentPayments(limit: number = 10): Promise<PaymentRecord[]> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/recent?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recent payments');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent payments:', error);
        return [];
      }
    }
    
    /**
     * Generate receipt for a payment
     */
    async generateReceipt(paymentId: string): Promise<ReceiptData | null> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/${paymentId}/receipt`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate receipt');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error generating receipt:', error);
        return null;
      }
    }
    
    /**
     * Send receipt via email
     */
    async sendReceipt(paymentId: string, email: string): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/${paymentId}/send-receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send receipt');
        }
        
        return true;
      } catch (error) {
        console.error('Error sending receipt:', error);
        return false;
      }
    }
    
    /**
     * Get payment statistics
     */
    async getPaymentStats(): Promise<{
      totalCollected: number;
      monthlyCollection: number;
      pendingAmount: number;
      collectionRate: number;
    }> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/stats`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment statistics');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching payment stats:', error);
        return {
          totalCollected: 0,
          monthlyCollection: 0,
          pendingAmount: 0,
          collectionRate: 0
        };
      }
    }
    
    /**
     * Refund a payment
     */
    async refundPayment(paymentId: string, reason: string): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/payments/${paymentId}/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
          throw new Error('Failed to process refund');
        }
        
        return true;
      } catch (error) {
        console.error('Error processing refund:', error);
        return false;
      }
    }
    
    private getAuthToken(): string {
      // In real implementation, get from auth context or localStorage
      return localStorage.getItem('authToken') || '';
    }
    
    private getCurrentUser(): string {
      // In real implementation, get from auth context
      return 'admin@school.com';
    }
  }
  
  export const paymentService = new PaymentService();