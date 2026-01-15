// src/api/mock/financeData.ts

/* =========================
   API RESPONSE CONTRACTS
   (Matches what backend will return)
========================= */

export interface Transaction {
    id: string;
    studentId: string;
    studentName: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    status: 'completed' | 'pending' | 'failed';
    date: string;
    description: string;
    receiptNumber: string;
  }
  
  export interface FeeDefaulter {
    id: string;
    studentId: string;
    studentName: string;
    grade: string;
    section: string;
    parentName: string;
    parentPhone: string;
    totalDue: number;
    overdueDays: number;
    lastPaymentDate: string | null;
    outstandingItems: string[];
  }
  
  export interface FinancialStats {
    totalRevenue: number;
    totalCollections: number;
    pendingPayments: number;
    feeDefaultersCount: number;
    collectionRate: number;
    avgTransactionValue: number;
  }
  
  export interface MonthlyRevenue {
    month: string;
    revenue: number;
    target: number;
  }
  
  /* =========================
     MOCK DATA (Temporary - will be replaced by API calls)
  ========================= */
  
  export const mockTransactions: Transaction[] = [
    {
      id: 'TXN-001',
      studentId: 'STU-2024-001',
      studentName: 'John Doe',
      amount: 12500,
      paymentMethod: 'online',
      status: 'completed',
      date: '2024-01-15T10:30:00Z',
      description: 'Tuition Fee - January 2024',
      receiptNumber: 'RC-2024-001'
    },
    {
      id: 'TXN-002',
      studentId: 'STU-2024-002',
      studentName: 'Jane Smith',
      amount: 8500,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      date: '2024-01-14T14:45:00Z',
      description: 'Annual Fee',
      receiptNumber: 'RC-2024-002'
    },
    {
      id: 'TXN-003',
      studentId: 'STU-2024-003',
      studentName: 'Robert Johnson',
      amount: 6500,
      paymentMethod: 'card',
      status: 'pending',
      date: '2024-01-13T09:15:00Z',
      description: 'Transport Fee - Q1',
      receiptNumber: 'RC-2024-003'
    }
  ];
  
  export const mockFeeDefaulters: FeeDefaulter[] = [
    {
      id: 'DEF-001',
      studentId: 'STU-2024-010',
      studentName: 'Michael Brown',
      grade: '10',
      section: 'A',
      parentName: 'Sarah Brown',
      parentPhone: '+91 9876543210',
      totalDue: 18500,
      overdueDays: 15,
      lastPaymentDate: '2023-12-20',
      outstandingItems: ['Tuition Jan', 'Exam Fee']
    },
    {
      id: 'DEF-002',
      studentId: 'STU-2024-011',
      studentName: 'Emily Wilson',
      grade: '9',
      section: 'B',
      parentName: 'David Wilson',
      parentPhone: '+91 9876543211',
      totalDue: 12400,
      overdueDays: 8,
      lastPaymentDate: '2023-12-25',
      outstandingItems: ['Transport Fee']
    }
  ];
  
  export const mockFinancialStats: FinancialStats = {
    totalRevenue: 1245000,
    totalCollections: 985000,
    pendingPayments: 260000,
    feeDefaultersCount: 12,
    collectionRate: 79.2,
    avgTransactionValue: 12450
  };
  
  export const mockMonthlyRevenue: MonthlyRevenue[] = [
    { month: 'Jan', revenue: 245000, target: 250000 },
    { month: 'Feb', revenue: 285000, target: 270000 },
    { month: 'Mar', revenue: 312000, target: 290000 },
    { month: 'Apr', revenue: 275000, target: 280000 },
    { month: 'May', revenue: 298000, target: 300000 },
    { month: 'Jun', revenue: 265000, target: 275000 }
  ];