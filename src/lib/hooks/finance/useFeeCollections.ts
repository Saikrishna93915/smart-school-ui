import { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/Services/finance/reportService';

interface FeeCollectionStats {
  totalCollected: number;
  monthlyCollection: number;
  outstandingBalance: number;
  collectionRate: number;
  pendingAccounts: number;
  overdueAmount: number;
}

interface UseFeeCollectionsReturn {
  stats: FeeCollectionStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
}

export const useFeeCollections = (initialYear?: number): UseFeeCollectionsReturn => {
  const [stats, setStats] = useState<FeeCollectionStats>({
    totalCollected: 0,
    monthlyCollection: 0,
    outstandingBalance: 0,
    collectionRate: 0,
    pendingAccounts: 0,
    overdueAmount: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch data from services
      const summary = await reportService.getFinancialSummary();
      const defaulters = await reportService.generateDefaulterReport(); // Fixed: use generateDefaulterReport
      
      // Calculate stats from API responses
      const totalCollected = summary.totalRevenue;
      const monthlyCollection = Math.floor(totalCollected / (new Date().getMonth() + 1));
      const outstandingBalance = summary.outstandingReceivables;
      const collectionRate = summary.collectionEfficiency;
      const pendingAccounts = defaulters.length;
      const overdueAmount = defaulters.reduce((sum: number, d: any) => sum + d.amountDue, 0); // Added types

      setStats({
        totalCollected,
        monthlyCollection,
        outstandingBalance,
        collectionRate,
        pendingAccounts,
        overdueAmount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collection data');
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialYear]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const refresh = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  const handleDateRangeChange = useCallback((range: { startDate: string; endDate: string }) => {
    setDateRange(range);
    // In real implementation, refetch data with new date range
    setTimeout(() => fetchCollections(), 100);
  }, [fetchCollections]);

  return {
    stats,
    isLoading,
    error,
    refresh,
    dateRange,
    setDateRange: handleDateRangeChange
  };
};

/**
 * Hook for monthly collection trends
 */
export const useMonthlyCollections = (year?: number) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collections = await reportService.getMonthlyCollections(year);
        setData(collections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch monthly collections');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return { data, loading, error };
};

/**
 * Hook for payment method distribution
 */
export const usePaymentMethodDistribution = (startDate: string, endDate: string) => {
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        setLoading(true);
        const data = await reportService.getPaymentMethodDistribution(startDate, endDate);
        setDistribution(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payment method distribution');
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, [startDate, endDate]);

  return { distribution, loading, error };
};