// src/api/services/financeService.ts

import {
    mockTransactions,
    mockFeeDefaulters,
    mockFinancialStats,
    mockMonthlyRevenue,
    Transaction,
    FeeDefaulter,
    FinancialStats,
    MonthlyRevenue
  } from '../mock/financeData';
  
  /* =========================
     FINANCE SERVICE
     Abstracts all finance-related API calls
  ========================= */
  
  class FinanceService {
    
    // TODO: Replace with actual API call: GET /api/finance/transactions
    async getTransactions(page = 1, limit = 10): Promise<Transaction[]> {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In production: return fetch(`/api/finance/transactions?page=${page}&limit=${limit}`)
      return Promise.resolve(mockTransactions);
    }
    
    // TODO: Replace with actual API call: GET /api/finance/defaulters
    async getFeeDefaulters(): Promise<FeeDefaulter[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve(mockFeeDefaulters);
    }
    
    // TODO: Replace with actual API call: GET /api/finance/stats
    async getFinancialStats(): Promise<FinancialStats> {
      await new Promise(resolve => setTimeout(resolve, 200));
      return Promise.resolve(mockFinancialStats);
    }
    
    // TODO: Replace with actual API call: GET /api/finance/revenue-monthly
    async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
      await new Promise(resolve => setTimeout(resolve, 200));
      return Promise.resolve(mockMonthlyRevenue);
    }
    
    // TODO: Replace with actual API call: POST /api/finance/record-payment
    async recordPayment(paymentData: {
      studentId: string;
      amount: number;
      paymentMethod: string;
      description: string;
    }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate backend validation and response
      if (paymentData.amount <= 0) {
        return { success: false, error: 'Amount must be greater than zero' };
      }
      
      console.log('Payment recorded (would be sent to backend):', paymentData);
      
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`
      };
    }
    
    // TODO: Replace with actual API call: POST /api/finance/generate-report
    async generateReport(type: 'monthly' | 'quarterly' | 'annual', date: string): Promise<{ success: boolean; reportUrl?: string }> {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log(`Generating ${type} report for ${date} (would call backend)`);
      
      return {
        success: true,
        reportUrl: `/reports/finance-${type}-${date}.pdf`
      };
    }
  }
  
  export const financeService = new FinanceService();