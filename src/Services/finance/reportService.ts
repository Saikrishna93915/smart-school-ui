/**
 * Report generation service for financial data
 */
import { getStoredToken } from '@/lib/auth/storage';

export interface ReportOptions {
    startDate: string;
    endDate: string;
    class?: string;
    paymentMethod?: string;
    format: 'pdf' | 'excel' | 'csv';
  }
  
  export interface CollectionReport {
    date: string;
    studentName: string;
    className: string;
    amount: number;
    paymentMethod: string;
    receiptNumber: string;
    transactionId?: string;
  }
  
  export interface DefaulterReport {
    studentId: string;
    studentName: string;
    className: string;
    parentName: string;
    parentContact: string;
    amountDue: number;
    dueDate: string;
    daysOverdue: number;
    status: 'Critical' | 'High' | 'Moderate' | 'Low';
  }
  
  export interface PaymentMethodDistribution {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }
  
  export interface MonthlyCollection {
    month: string;
    collected: number;
    pending: number;
    target: number;
  }
  
  class ReportService {
    private baseUrl: string;
    
    constructor(baseUrl: string = '/api/finance') {
      this.baseUrl = baseUrl;
    }
    
    /**
     * Generate collection report
     */
    async generateCollectionReport(options: ReportOptions): Promise<CollectionReport[]> {
      try {
        const queryParams = new URLSearchParams({
          startDate: options.startDate,
          endDate: options.endDate,
          format: options.format,
          ...(options.class && { class: options.class }),
          ...(options.paymentMethod && { paymentMethod: options.paymentMethod })
        });
        
        const response = await fetch(`${this.baseUrl}/reports/collection?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate collection report');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error generating collection report:', error);
        return [];
      }
    }
    
    /**
     * Generate defaulter report
     */
    async generateDefaulterReport(classFilter?: string): Promise<DefaulterReport[]> {
      try {
        const url = classFilter 
          ? `${this.baseUrl}/reports/defaulters?class=${classFilter}`
          : `${this.baseUrl}/reports/defaulters`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate defaulter report');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error generating defaulter report:', error);
        return [];
      }
    }
    
    /**
     * Get payment method distribution
     */
    async getPaymentMethodDistribution(startDate: string, endDate: string): Promise<PaymentMethodDistribution[]> {
      try {
        const response = await fetch(
          `${this.baseUrl}/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment method distribution');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching payment method distribution:', error);
        return [];
      }
    }
    
    /**
     * Get monthly collection data
     */
    async getMonthlyCollections(year: number = new Date().getFullYear()): Promise<MonthlyCollection[]> {
      try {
        const response = await fetch(`${this.baseUrl}/reports/monthly-collections?year=${year}`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch monthly collections');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching monthly collections:', error);
        return [];
      }
    }
    
    /**
     * Export report to file
     */
    async exportReport(reportType: string, options: ReportOptions): Promise<Blob> {
      try {
        const response = await fetch(`${this.baseUrl}/reports/export/${reportType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(options)
        });
        
        if (!response.ok) {
          throw new Error('Failed to export report');
        }
        
        return await response.blob();
      } catch (error) {
        console.error('Error exporting report:', error);
        throw error;
      }
    }
    
    /**
     * Get financial summary
     */
    async getFinancialSummary(): Promise<{
      totalRevenue: number;
      totalExpenses: number;
      netProfit: number;
      outstandingReceivables: number;
      collectionEfficiency: number;
    }> {
      try {
        const response = await fetch(`${this.baseUrl}/reports/summary`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch financial summary');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching financial summary:', error);
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          outstandingReceivables: 0,
          collectionEfficiency: 0
        };
      }
    }
    
    private getAuthToken(): string {
      return getStoredToken() || '';
    }
  }
  
  export const reportService = new ReportService();
