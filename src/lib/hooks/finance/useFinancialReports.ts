import { useState, useCallback } from 'react';
import { reportService, ReportOptions } from '@/Services/finance/reportService';

interface UseFinancialReportsReturn {
  generating: boolean;
  error: string | null;
  generateCollectionReport: (options: ReportOptions) => Promise<any[]>;
  generateDefaulterReport: (classFilter?: string) => Promise<any[]>;
  exportReport: (reportType: string, options: ReportOptions) => Promise<Blob>;
  downloadReport: (reportType: string, options: ReportOptions, filename: string) => Promise<void>;
}

export const useFinancialReports = (): UseFinancialReportsReturn => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCollectionReport = useCallback(async (options: ReportOptions): Promise<any[]> => {
    setGenerating(true);
    setError(null);
    
    try {
      const report = await reportService.generateCollectionReport(options);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate collection report';
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const generateDefaulterReport = useCallback(async (classFilter?: string): Promise<any[]> => {
    setGenerating(true);
    setError(null);
    
    try {
      const report = await reportService.generateDefaulterReport(classFilter);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate defaulter report';
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const exportReport = useCallback(async (reportType: string, options: ReportOptions): Promise<Blob> => {
    setGenerating(true);
    setError(null);
    
    try {
      const blob = await reportService.exportReport(reportType, options);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const downloadReport = useCallback(async (
    reportType: string,
    options: ReportOptions,
    filename: string
  ): Promise<void> => {
    try {
      const blob = await exportReport(reportType, options);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw err;
    }
  }, [exportReport]);

  return {
    generating,
    error,
    generateCollectionReport,
    generateDefaulterReport,
    exportReport,
    downloadReport
  };
};

/**
 * Hook for report templates and configurations
 */
export const useReportTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from API
      const mockTemplates = [
        {
          id: 'collection-report',
          name: 'Monthly Collection Report',
          description: 'Detailed monthly collection performance',
          format: 'pdf',
          fields: ['date', 'student', 'amount', 'payment_method']
        },
        {
          id: 'defaulter-report',
          name: 'Fee Defaulter Report',
          description: 'List of students with overdue payments',
          format: 'excel',
          fields: ['student', 'class', 'amount_due', 'days_overdue']
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    templates,
    loading,
    fetchTemplates
  };
};