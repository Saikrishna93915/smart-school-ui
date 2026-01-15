// src/hooks/useFinance.ts

import { useState, useEffect } from 'react';
import { financeService } from '@/api/services/financeService';
import { Transaction, FeeDefaulter, FinancialStats, MonthlyRevenue } from '@/api/mock/financeData';

/* =========================
   FINANCE HOOK
   Abstracts finance data fetching and state management
========================= */

export const useFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState({
    transactions: false,
    defaulters: false,
    stats: false,
    revenue: false
  });
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with real API calls when backend is ready
  const fetchTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const data = await financeService.getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchFeeDefaulters = async () => {
    setLoading(prev => ({ ...prev, defaulters: true }));
    try {
      const data = await financeService.getFeeDefaulters();
      setDefaulters(data);
    } catch (err) {
      setError('Failed to fetch fee defaulters');
      console.error('Defaulters fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, defaulters: false }));
    }
  };

  const fetchFinancialStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const data = await financeService.getFinancialStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch financial stats');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchMonthlyRevenue = async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    try {
      const data = await financeService.getMonthlyRevenue();
      setMonthlyRevenue(data);
    } catch (err) {
      setError('Failed to fetch monthly revenue');
      console.error('Revenue fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  };

  const recordPayment = async (paymentData: {
    studentId: string;
    amount: number;
    paymentMethod: string;
    description: string;
  }) => {
    // In production: This would trigger actual backend API call
    const result = await financeService.recordPayment(paymentData);
    
    if (result.success) {
      // Refresh data after successful payment
      fetchTransactions();
      fetchFinancialStats();
    }
    
    return result;
  };

  // Initial data fetch
  useEffect(() => {
    fetchFinancialStats();
    fetchMonthlyRevenue();
  }, []);

  return {
    transactions,
    defaulters,
    stats,
    monthlyRevenue,
    loading,
    error,
    fetchTransactions,
    fetchFeeDefaulters,
    recordPayment,
    refreshAll: () => {
      fetchFinancialStats();
      fetchMonthlyRevenue();
      fetchTransactions();
      fetchFeeDefaulters();
    }
  };
};