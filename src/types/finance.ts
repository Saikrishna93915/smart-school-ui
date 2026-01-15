// src/types/finance.ts
export interface FeeDefaulter {
    id: number;
    initials: string;
    name: string;
    className: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    remindersSent: number;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    status: 'Critical' | 'High' | 'Moderate' | 'Low';
  }
  
  export interface RecentPayment {
    id: number;
    studentName: string;
    className: string;
    amount: number;
    date: string;
    paymentMethod: 'UPI' | 'Card' | 'Cash' | 'Bank Transfer';
    receiptNumber: string;
    status: 'completed' | 'pending' | 'refunded';
  }
  
  export interface PaymentMethodData {
    method: string;
    value: number;
    color: string;
  }
  
  export interface MonthlyCollectionData {
    month: string;
    collected: number;
    pending: number;
    target: number;
  }
  
  export interface KPIStat {
    title: string;
    value: string;
    description: string;
    icon: string;
    trend?: {
      value: number;
      isPositive: boolean;
      label: string;
    };
    isWarning?: boolean;
  }