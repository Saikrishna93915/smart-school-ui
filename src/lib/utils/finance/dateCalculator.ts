/**
 * Date calculation utilities for financial operations
 */

export const calculateDaysOverdue = (dueDate: string | Date): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return due < today ? diffDays : 0;
  };
  
  export const getFinancialYear = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };
  
  export const formatDate = (date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
    const dateObj = new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
    };
    
    return dateObj.toLocaleDateString('en-IN', options);
  };
  
  export const formatDateTime = (date: string | Date): string => {
    const dateObj = new Date(date);
    
    return dateObj.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  export const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };
  
  export const getQuarter = (date: Date = new Date()): string => {
    const month = date.getMonth() + 1;
    
    if (month >= 1 && month <= 3) return 'Q4';
    if (month >= 4 && month <= 6) return 'Q1';
    if (month >= 7 && month <= 9) return 'Q2';
    return 'Q3'; // Oct-Dec
  };
  
  export const isOverdue = (dueDate: string | Date, gracePeriodDays: number = 0): boolean => {
    const daysOverdue = calculateDaysOverdue(dueDate);
    return daysOverdue > gracePeriodDays;
  };