import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FinanceService } from '@/Services/finance.service';

// Icons
import {
  CreditCard,
  Wallet,
  Building,
  Smartphone,
  Globe,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Search,
  Printer,
  Mail,
  FileText,
  IndianRupee,
  Receipt,
  FileSignature,
  Percent,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  Phone,
  School,
} from 'lucide-react';

// Types
interface UniversalStudent {
  _id: string;
  id?: string;
  admissionNumber: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  section?: string;
  class?: {
    className: string;
    section: string;
    academicYear?: string;
  };
  parents?: {
    father: { name: string; phone: string; email?: string };
    mother?: { name: string; phone: string; email?: string };
  };
  parentName?: string;
  fatherName?: string;
  phone?: string;
  contact?: string;
  email?: string;
  student?: {
    firstName: string;
    lastName: string;
    name?: string;
  };
  admissionNo?: string;
  fullName?: string;
  parentPhone?: string;
  [key: string]: any;
}

interface FeeBreakdown {
  id?: string;
  name?: string;
  type?: string;
  amount: number;
  value?: number;
  dueDate?: string;
  frequency?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'one_time';
  isMandatory?: boolean;
  description?: string;
}

interface FeeSummary {
  totalDue?: number;
  totalDues?: number;
  totalPaid?: number;
  paidAmount?: number;
  totalPending?: number;
  overdueAmount?: number;
  nextDueDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  feeBreakdown?: FeeBreakdown[];
  breakdown?: FeeBreakdown[];
  fees?: FeeBreakdown[];
  feeStructure?: {
    breakdown?: FeeBreakdown[];
    totalDue?: number;
    totalPaid?: number;
    totalFee?: number;
  };
  summary?: {
    totalDue?: number;
    totalPaid?: number;
    totalFee?: number;
  };
  feeSummary?: {
    totalDue?: number;
    totalPaid?: number;
  };
  data?: {
    feeBreakdown?: FeeBreakdown[];
    summary?: {
      totalDue?: number;
      totalPaid?: number;
    };
    feeStructure?: {
      totalDue?: number;
      totalPaid?: number;
    };
  };
}

interface PaymentFormData {
  studentId: string;
  admissionNumber: string;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'upi' | 'card' | 'online';
  amount: number;
  discount: number;
  discountReason: string;
  lateFee: number;
  lateFeeReason: string;
  netAmount: number;
  description: string;
  referenceNo: string;
  transactionId: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  utrNo: string;
  upiId: string;
  ifscCode: string;
  accountNumber: string;
  cardLast4: string;
  feesPaid: FeeBreakdown[];
  sendReceipt: boolean;
  sendSMS: boolean;
  sendEmail: boolean;
  printReceipt: boolean;
}

// ==================== PAYMENT VALIDATION ====================

/**
 * Validate payment method-specific required fields
 */
function validatePaymentMethodDetails(formData: PaymentFormData): string | null {
  const { paymentMethod, upiId, transactionId, utrNo, bankName, chequeNo, chequeDate, ifscCode, cardLast4, referenceNo } = formData;
  const errors: string[] = [];

  switch (paymentMethod) {
    case 'upi':
      if (!upiId || upiId.trim() === '') {
        errors.push('UPI ID is required');
      } else if (!/^[\w.-]+@[\w]+$/.test(upiId)) {
        errors.push('Invalid UPI ID format. Example: username@paytm');
      }

      if (!transactionId || transactionId.trim() === '') {
        errors.push('Transaction ID is required');
      } else if (!/^[A-Za-z0-9]{12,20}$/.test(transactionId.trim())) {
        errors.push('Transaction ID must be 12-20 alphanumeric characters');
      }
      break;

    case 'bank-transfer':
      if (!utrNo || utrNo.trim() === '') {
        errors.push('UTR number is required');
      } else if (!/^\d{12}$/.test(utrNo.trim())) {
        errors.push('UTR number must be exactly 12 digits');
      }

      if (!bankName || bankName.trim() === '') {
        errors.push('Bank name is required');
      }

      if (!transactionId || transactionId.trim() === '') {
        errors.push('Transaction ID is required');
      }

      if (!ifscCode || ifscCode.trim() === '') {
        errors.push('IFSC code is required');
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim().toUpperCase())) {
        errors.push('Invalid IFSC code format. Example: SBIN0001234');
      }

      if (formData.accountNumber && formData.accountNumber.trim() !== '') {
        if (!/^\d{9,18}$/.test(formData.accountNumber.trim())) {
          errors.push('Account number must be 9-18 digits');
        }
      }
      break;

    case 'cheque':
      if (!chequeNo || chequeNo.trim() === '') {
        errors.push('Cheque number is required');
      } else if (!/^\d{6,9}$/.test(chequeNo.trim())) {
        errors.push('Cheque number must be 6-9 digits');
      }

      if (!bankName || bankName.trim() === '') {
        errors.push('Bank name is required');
      }

      if (!chequeDate) {
        errors.push('Cheque date is required');
      } else {
        const cDate = new Date(chequeDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (cDate > today) {
          errors.push('Cheque date cannot be in the future');
        }
      }

      if (ifscCode && ifscCode.trim() !== '') {
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim().toUpperCase())) {
          errors.push('Invalid IFSC code format');
        }
      }
      break;

    case 'card':
      if (!transactionId || transactionId.trim() === '') {
        errors.push('Transaction ID is required');
      }

      if (!cardLast4 || cardLast4.trim() === '') {
        errors.push('Last 4 digits of card are required');
      } else if (!/^\d{4}$/.test(cardLast4.trim())) {
        errors.push('Card last 4 digits must be exactly 4 digits');
      }

      if (!referenceNo || referenceNo.trim() === '') {
        errors.push('Reference number is required');
      }
      break;

    case 'online':
      if (!transactionId || transactionId.trim() === '') {
        errors.push('Transaction ID is required');
      }

      if (!referenceNo || referenceNo.trim() === '') {
        errors.push('Reference number is required');
      }
      break;

    case 'cash':
      // Cash only requires amount, no additional validation
      break;

    default:
      errors.push(`Invalid payment method: ${paymentMethod}`);
  }

  return errors.length > 0 ? errors.join('. ') : null;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    receiptNumber?: string;
    receiptNo?: string;
    transactionId?: string;
    paymentDate?: string;
    amount?: number;
    status?: string;
  };
  receiptNumber?: string;
  message?: string | null;
}

// School Configuration
const SCHOOL_CONFIG = {
  name: "PMC Tech School",
  shortName: "PMC Tech",
  address: "Hosur - Krishnagiri Highways, Nallaganakothapalli, Near Koneripalli (PO), Hosur, Krishnagiri District, Tamil Nadu - 635 117",
  city: "Hosur",
  state: "Tamil Nadu",
  pincode: "635117",
  phone: "+91 9876543210",
  email: "office@pmctechschool.com",
  website: "www.pmctechschool.com",
  principal: "Principal Name",
  registrationNo: "REG-EDU-2024-001",
  gstin: "29AAACI0000A1Z5",
  bankDetails: {
    bankName: "State Bank of India",
    accountName: "PMC Tech School",
    accountNumber: "12345678901",
    ifscCode: "SBIN0001234",
    branch: "Hosur Main Branch"
  }
};

// Payment Cycle Configuration (in days)
const PAYMENT_CYCLE_CONFIG = {
  standard: 60,        // Standard payment cycle (60 days)
  monthly: 30,         // Monthly payment cycle
  quarterly: 90,       // Quarterly payment cycle
  halfYearly: 180,     // Half-yearly payment cycle
  yearly: 365,         // Yearly payment cycle
};

// Utility Functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const calculateNextDueDate = (paymentDate: string, cycleDays: number = PAYMENT_CYCLE_CONFIG.standard): string => {
  const date = new Date(paymentDate);
  date.setDate(date.getDate() + cycleDays);
  return date.toISOString().split('T')[0];
};

const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getDueDateStatus = (dueDate: string): { status: 'urgent' | 'soon' | 'on_track' | 'overdue'; label: string; color: string } => {
  const days = getDaysUntilDue(dueDate);
  
  if (days < 0) {
    return { status: 'overdue', label: `${Math.abs(days)} days overdue`, color: 'text-red-700 bg-red-100 border-red-300' };
  } else if (days <= 7) {
    return { status: 'urgent', label: `${days} days remaining`, color: 'text-orange-700 bg-orange-100 border-orange-300' };
  } else if (days <= 15) {
    return { status: 'soon', label: `${days} days remaining`, color: 'text-amber-700 bg-amber-100 border-amber-300' };
  } else {
    return { status: 'on_track', label: `${days} days remaining`, color: 'text-green-700 bg-green-100 border-green-300' };
  }
};

// Get Payment Status for Board View
const getPaymentStatus = (totalDue: number, totalPaid: number, hasOverdue: boolean): {
  status: 'fully_paid' | 'partial_paid' | 'not_paid' | 'invalid';
  label: string;
  color: string;
  icon: string;
  message?: string;
} => {
  // Edge case: Both fee and paid are zero
  if (totalDue === 0 && totalPaid === 0) {
    return {
      status: 'invalid',
      label: 'Fee Structure Missing',
      color: 'text-gray-700 bg-gray-100 border-gray-300',
      icon: '⚠️',
      message: 'No fee structure found. Please contact administration to verify fee details.'
    };
  }
  
  // Edge case: Fee is zero but something was paid
  if (totalDue === 0 && totalPaid > 0) {
    return {
      status: 'invalid',
      label: 'Overpayment Detected',
      color: 'text-purple-700 bg-purple-100 border-purple-300',
      icon: '💰',
      message: `Student has paid ₹${totalPaid.toLocaleString()} but no fee is due. Please verify with accounts department.`
    };
  }
  
  // Fully paid
  if (totalDue === 0 && totalPaid > 0) {
    return {
      status: 'fully_paid',
      label: 'Fully Paid',
      color: 'text-green-700 bg-green-100 border-green-300',
      icon: '✅',
      message: 'All fees paid successfully'
    };
  }
  
  // Partial payment
  if (totalDue > 0 && totalPaid > 0) {
    const percentage = Math.round((totalPaid / (totalDue + totalPaid)) * 100);
    return {
      status: 'partial_paid',
      label: `${percentage}% Paid`,
      color: hasOverdue ? 'text-red-700 bg-red-100 border-red-300' : 'text-blue-700 bg-blue-100 border-blue-300',
      icon: hasOverdue ? '⚠️' : '📊',
      message: `₹${totalPaid.toLocaleString()} paid, ₹${totalDue.toLocaleString()} remaining`
    };
  }
  
  // No payment made
  if (totalDue > 0 && totalPaid === 0) {
    return {
      status: 'not_paid',
      label: 'Not Paid',
      color: hasOverdue ? 'text-red-700 bg-red-100 border-red-300' : 'text-amber-700 bg-amber-100 border-amber-300',
      icon: hasOverdue ? '🔴' : '⏳',
      message: `Full amount ₹${totalDue.toLocaleString()} is pending`
    };
  }
  
  // Default
  return {
    status: 'invalid',
    label: 'Unknown',
    color: 'text-gray-700 bg-gray-100 border-gray-300',
    icon: '❓',
    message: 'Unable to determine payment status'
  };
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const convertToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const padded = ('000000000' + Math.floor(Math.abs(num))).slice(-9);
  const n = padded.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  const twoDigitsWords = (s: string) => {
    const val = parseInt(s, 10);
    if (val === 0) return '';
    if (val < 20) return a[val];
    const tens = parseInt(s.charAt(0), 10);
    const ones = parseInt(s.charAt(1), 10);
    return (b[tens] ? b[tens] + ' ' : '') + (a[ones] || '');
  };
  
  let str = '';
  if (Number(n[1]) !== 0) str += `${twoDigitsWords(n[1])}Crore `;
  if (Number(n[2]) !== 0) str += `${twoDigitsWords(n[2])}Lakh `;
  if (Number(n[3]) !== 0) str += `${twoDigitsWords(n[3])}Thousand `;
  if (Number(n[4]) !== 0) str += `${a[Number(n[4])] || ''}Hundred `;
  if (Number(n[5]) !== 0) str += `${str !== '' ? 'and ' : ''}${twoDigitsWords(n[5])}`;
  
  return str.trim() + 'Rupees Only';
};

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getTotalDueFromDetails = (details: any): number => {
  if (!details || typeof details !== 'object') return 0;

  const candidates = [
    details.totalDues,
    details.totalDue,
    details.summary?.totalDue,
    details.feeStructure?.totalDue,
    details.feeSummary?.totalDue,
    details.data?.summary?.totalDue,
    details.data?.feeStructure?.totalDue,
  ];

  const parsed = candidates
    .map(parseAmount)
    .filter((amount) => amount >= 0);

  if (parsed.length === 0) return 0;

  const positive = parsed.find((amount) => amount > 0);
  return positive ?? 0;
};

const getTotalPaidFromDetails = (details: any): number => {
  if (!details || typeof details !== 'object') return 0;

  const candidates = [
    details.totalPaid,
    details.paidAmount,
    details.summary?.totalPaid,
    details.feeStructure?.totalPaid,
    details.feeSummary?.totalPaid,
    details.data?.summary?.totalPaid,
    details.data?.feeStructure?.totalPaid,
  ];

  const parsed = candidates
    .map(parseAmount)
    .filter((amount) => amount >= 0);

  if (parsed.length === 0) return 0;

  // Return the first positive value, or 0
  const positive = parsed.find((amount) => amount > 0);
  return positive ?? 0;
};

// Helper functions for student data extraction
const getStudentName = (student: UniversalStudent | null): string => {
  if (!student) return 'Unknown Student';
  
  if (student.student?.firstName || student.student?.lastName) {
    return `${student.student.firstName || ''} ${student.student.lastName || ''}`.trim();
  }
  
  if (student.name) return student.name;
  if (student.fullName) return student.fullName;
  if (student.firstName || student.lastName) {
    return `${student.firstName || ''} ${student.lastName || ''}`.trim();
  }
  
  return 'Unknown Student';
};

const getClassName = (student: UniversalStudent | null): string => {
  if (!student) return 'N/A';
  
  if (student.class?.className) return student.class.className;
  if (student.className) return student.className;
  
  return 'N/A';
};

const getSection = (student: UniversalStudent | null): string => {
  if (!student) return 'A';
  
  if (student.class?.section) return student.class.section;
  if (student.section) return student.section;
  
  return 'A';
};

const getParentName = (student: UniversalStudent | null): string => {
  if (!student) return 'N/A';
  
  if (student.parents?.father?.name) return student.parents.father.name;
  if (student.parentName) return student.parentName;
  if (student.fatherName) return student.fatherName;
  
  return 'N/A';
};

const getParentPhone = (student: UniversalStudent | null): string => {
  if (!student) return 'N/A';
  
  if (student.parents?.father?.phone) return student.parents.father.phone;
  if (student.phone) return student.phone;
  if (student.contact) return student.contact;
  if (student.parentPhone) return student.parentPhone;
  
  return 'N/A';
};

const getAdmissionNumber = (student: UniversalStudent | null): string => {
  if (!student) return 'N/A';
  return student.admissionNumber || student.admissionNo || 'N/A';
};

const getParentEmail = (student: UniversalStudent | null): string => {
  if (!student) return '';
  return student.parents?.father?.email || student.email || '';
};

// Main Component
export default function RecordPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UniversalStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UniversalStudent | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Form
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: '',
    admissionNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    amount: 0,
    discount: 0,
    discountReason: '',
    lateFee: 0,
    lateFeeReason: '',
    netAmount: 0,
    description: '',
    referenceNo: '',
    transactionId: '',
    bankName: '',
    chequeNo: '',
    chequeDate: '',
    utrNo: '',
    upiId: '',
    ifscCode: '',
    accountNumber: '',
    cardLast4: '',
    feesPaid: [],
    sendReceipt: true,
    sendSMS: true,
    sendEmail: true,
    printReceipt: true,
  });

  // Payment Cycle Selection
  const [paymentCycle, setPaymentCycle] = useState<number>(PAYMENT_CYCLE_CONFIG.standard);
  
  // Payment Methods Configuration
  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Wallet, requiresRef: false, fields: [] },
    { value: 'cheque', label: 'Cheque', icon: FileSignature, requiresRef: true, fields: ['bankName', 'chequeNo', 'chequeDate', 'ifscCode'] },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: Building, requiresRef: true, fields: ['utrNo', 'bankName', 'ifscCode', 'transactionId', 'accountNumber'] },
    { value: 'upi', label: 'UPI', icon: Smartphone, requiresRef: true, fields: ['upiId', 'transactionId'] },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, requiresRef: true, fields: ['transactionId', 'cardLast4', 'referenceNo'] },
    { value: 'online', label: 'Online Payment', icon: Globe, requiresRef: true, fields: ['transactionId', 'referenceNo'] },
  ];
  
  // Computed Values
  const selectedMethod = useMemo(() =>
    paymentMethods.find(m => m.value === formData.paymentMethod),
    [formData.paymentMethod]
  );

  const totalDues = useMemo(() => getTotalDueFromDetails(feeSummary), [feeSummary]);
  const totalPaid = useMemo(() => getTotalPaidFromDetails(feeSummary), [feeSummary]);
  const overdueAmount = useMemo(() => feeSummary?.overdueAmount || 0, [feeSummary]);
  const hasOverdue = overdueAmount > 0;
  
  // Payment Status for Board View
  const paymentStatus = useMemo(() => 
    getPaymentStatus(totalDues, totalPaid, hasOverdue),
    [totalDues, totalPaid, hasOverdue]
  );
  
  // Calculate Net Amount
  useEffect(() => {
    const amount = formData.amount || 0;
    const discount = formData.discount || 0;
    const lateFee = formData.lateFee || 0;
    const netAmount = amount - discount + lateFee;
    
    setFormData(prev => ({
      ...prev,
      netAmount: netAmount > 0 ? netAmount : 0
    }));
  }, [formData.amount, formData.discount, formData.lateFee]);
  
  // Auto-fill student info only (NOT amount) - let user enter amount manually
  useEffect(() => {
    if (selectedStudent && feeSummary) {
      setFormData(prev => ({
        ...prev,
        studentId: selectedStudent._id || selectedStudent.id || '',
        admissionNumber: getAdmissionNumber(selectedStudent)
      }));
    }
  }, [selectedStudent, feeSummary]);
  
  // Search Students
  const handleSearch = useCallback(async () => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await FinanceService.searchStudents(searchTerm);
      let students: UniversalStudent[] = [];
      
      if (response) {
        if (Array.isArray(response)) {
          students = response;
        } else if (response.data && Array.isArray(response.data)) {
          students = response.data;
        } else if (response.students && Array.isArray(response.students)) {
          students = response.students;
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            students = response.data;
          } else if (response.data !== null && typeof response.data === 'object') {
            Object.keys(response.data).forEach(key => {
              const val = (response.data as any)[key];
              if (Array.isArray(val)) {
                students = val;
              }
            });
          }
        }
      }
      
      students = students.filter(student => 
        student && typeof student === 'object' && 
        (student._id || student.id || getAdmissionNumber(student) || getStudentName(student))
      );
      
      setSearchResults(students);
      
      if (students.length === 0) {
        setSearchError('No students found matching your search criteria');
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      setSearchError(error.message || 'Failed to search students');
      toast({
        title: 'Search Failed',
        description: error.message || 'Unable to search students. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, toast]);
  
  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);
  
  // Fetch Fee Details when student is selected
  const fetchFeeDetails = useCallback(async (admissionNumber: string) => {
    try {
      const response = await FinanceService.getStudentFeeDetails(admissionNumber);
      const normalized: any = (response as any).data ?? response;
      setFeeSummary(normalized);
    } catch (error: any) {
      console.error('Failed to fetch fee details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee details for this student.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  // Handle Student Selection
  const handleSelectStudent = (student: UniversalStudent) => {
    setSelectedStudent(student);
    setSearchTerm('');
    setSearchResults([]);
    fetchFeeDetails(getAdmissionNumber(student));
    
    toast({
      title: 'Student Selected',
      description: `${getStudentName(student)} (${getAdmissionNumber(student)})`,
    });
  };
  
  // Handle Form Field Changes
  const handleFieldChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle Fee Selection
  const handleFeeSelection = (fee: FeeBreakdown, checked: boolean) => {
    setFormData(prev => {
      let updatedFees = [...prev.feesPaid];
      if (checked) {
        updatedFees.push(fee);
      } else {
        updatedFees = updatedFees.filter(f => f.id !== fee.id && f.type !== (fee.type || fee.name) && f.name !== (fee.type || fee.name));
      }
      
      const totalAmount = updatedFees.reduce((sum, f) => sum + (f.amount || f.value || 0), 0);
      
      return {
        ...prev,
        feesPaid: updatedFees,
        amount: totalAmount
      };
    });
  };
  
  // Generate Receipt
  const generateReceipt = useCallback((paymentResponse: PaymentResponse) => {
    if (!selectedStudent) return null;

    // Calculate remaining balance after this payment
    const previousTotalPaid = getTotalPaidFromDetails(feeSummary);
    const previousTotalDue = getTotalDueFromDetails(feeSummary);
    const totalFeeStructure = previousTotalPaid + previousTotalDue;
    const newTotalPaid = previousTotalPaid + formData.netAmount;
    const remainingBalance = Math.max(0, totalFeeStructure - newTotalPaid);

    return {
      receiptNumber: paymentResponse.data?.receiptNumber || paymentResponse.data?.receiptNo || paymentResponse.receiptNumber || `REC-${Date.now().toString().slice(-8)}`,
      transactionId: paymentResponse.data?.transactionId || `TXN${Date.now()}`,
      paymentDate: formData.paymentDate,
      studentName: getStudentName(selectedStudent),
      admissionNumber: getAdmissionNumber(selectedStudent),
      className: getClassName(selectedStudent),
      section: getSection(selectedStudent),
      parentName: getParentName(selectedStudent),
      parentPhone: getParentPhone(selectedStudent),
      parentEmail: getParentEmail(selectedStudent),
      paymentMethod: paymentMethods.find(m => m.value === formData.paymentMethod)?.label,
      
      // Fee details
      totalFeeStructure: totalFeeStructure,
      previousPaid: previousTotalPaid,
      currentPayment: formData.netAmount,
      newTotalPaid: newTotalPaid,
      remainingBalance: remainingBalance,
      
      // Payment breakdown
      amount: formData.amount,
      discount: formData.discount,
      lateFee: formData.lateFee,
      netAmount: formData.netAmount,
      amountInWords: convertToWords(formData.netAmount),
      referenceNo: formData.referenceNo || formData.transactionId || formData.chequeNo || formData.utrNo || 'N/A',
      description: formData.description,
      school: SCHOOL_CONFIG,
    };
  }, [selectedStudent, formData, feeSummary, paymentMethods]);
  
  // Handle Payment Submission
  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast({
        title: 'Validation Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    if (formData.netAmount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Net amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount doesn't exceed remaining due (prevent overpayment)
    if (feeSummary && formData.amount > totalDues + 1) {
      toast({
        title: 'Overpayment Warning',
        description: `Payment amount (${formatCurrency(formData.amount)}) exceeds remaining due (${formatCurrency(totalDues)}). Total fee: ${formatCurrency(totalDues + totalPaid)}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate payment method-specific required fields
    const validationError = validatePaymentMethodDetails(formData);
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const paymentData = {
        studentId: selectedStudent._id || selectedStudent.id,
        admissionNumber: getAdmissionNumber(selectedStudent),
        studentName: getStudentName(selectedStudent),
        className: getClassName(selectedStudent),
        section: getSection(selectedStudent),
        parentName: getParentName(selectedStudent),
        parentPhone: getParentPhone(selectedStudent),
        parentEmail: getParentEmail(selectedStudent),
        
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
        discount: formData.discount,
        discountReason: formData.discountReason,
        lateFee: formData.lateFee,
        lateFeeReason: formData.lateFeeReason,
        netAmount: formData.netAmount,
        description: formData.description,
        
        referenceNo: formData.referenceNo,
        transactionId: formData.transactionId,
        bankName: formData.bankName,
        chequeNo: formData.chequeNo,
        chequeDate: formData.chequeDate,
        utrNo: formData.utrNo,
        upiId: formData.upiId,
        ifscCode: formData.ifscCode,
        accountNumber: formData.accountNumber,
        cardLast4: formData.cardLast4,

        feesPaid: formData.feesPaid,
        
        sendReceipt: formData.sendReceipt,
        sendSMS: formData.sendSMS,
        sendEmail: formData.sendEmail,
        printReceipt: formData.printReceipt
      };
      
      const response = await FinanceService.recordPayment(paymentData);
      
      const receiptNumber = response.data?.receiptNumber || 
                           response.data?.receiptNo || 
                           response.receiptNumber || 
                           `REC-${Date.now().toString().slice(-8)}`;
      
      const receipt = generateReceipt({
        ...response,
        data: {
          ...response.data,
          receiptNumber
        }
      });
      
      setReceiptData(receipt);
      
      toast({
        title: 'Payment Recorded Successfully!',
        description: `Receipt Number: ${receiptNumber}\nAmount: ${formatCurrency(formData.netAmount)}`,
        variant: 'default',
      });
      
      if (formData.printReceipt) {
        setTimeout(() => handlePrintReceipt(receipt), 1000);
      }
      
      setTimeout(() => {
        setSelectedStudent(null);
        setFeeSummary(null);
        setPaymentCycle(PAYMENT_CYCLE_CONFIG.standard);
        setCurrentStep(1);
        setFormData({
          studentId: '',
          admissionNumber: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          amount: 0,
          discount: 0,
          discountReason: '',
          lateFee: 0,
          lateFeeReason: '',
          netAmount: 0,
          description: '',
          referenceNo: '',
          transactionId: '',
          bankName: '',
          chequeNo: '',
          chequeDate: '',
          utrNo: '',
          upiId: '',
          feesPaid: [],
          sendReceipt: true,
          sendSMS: true,
          sendEmail: true,
          printReceipt: true,
        });
      }, 3000);
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Print Receipt
  const handlePrintReceipt = (receipt: any) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { padding: 15px; background: #f5f5f5; }
          .container { display: flex; width: 100%; gap: 10px; }
          .receipt { width: 50%; border: 1px solid #000; padding: 12px; background: white; }
          .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 10px; padding-bottom: 8px; }
          .school-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .school-address { font-size: 9px; color: #666; line-height: 1.3; }
          .title { text-align: center; font-weight: bold; font-size: 14px; margin: 10px 0; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 10px; color: #666; margin-bottom: 8px; }
          .section { margin: 8px 0; }
          .section-title { font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #333; }
          .row { display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0; }
          .label { color: #666; font-weight: 600; }
          .value { font-weight: 600; color: #000; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
          table th, table td { border: 1px solid #000; padding: 5px; text-align: left; }
          table th { background: #f0f0f0; font-weight: 600; font-size: 9px; }
          .total-row { background: #dcfce7 !important; font-weight: bold; }
          .balance-row { background: #fef3c7 !important; font-weight: bold; }
          .balance-paid { background: #dcfce7 !important; font-weight: bold; }
          .footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #000; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature { text-align: center; border-top: 1px solid #000; padding-top: 3px; width: 120px; font-size: 9px; }
          .copy-label { text-align: center; font-weight: bold; font-size: 11px; margin-top: 10px; padding-top: 5px; border-top: 2px solid #000; }
          .cut-line { width: 2px; border-left: 2px dashed black; margin: 0 5px; }
          .print-btn { text-align: center; margin-top: 20px; }
          .print-btn button { background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; margin: 0 8px; }
          @media print {
            body { padding: 0; background: white; }
            .print-btn { display: none; }
            .container { gap: 5px; }
            .receipt { padding: 10px; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- ORIGINAL COPY (LEFT) -->
          <div class="receipt">
            <div class="header">
              <div class="school-name">${receipt.school.name}</div>
              <div class="school-address">${receipt.school.address}</div>
              <div class="school-address">Phone: ${receipt.school.phone} | Email: ${receipt.school.email}</div>
            </div>
            <div class="title">PAYMENT RECEIPT</div>
            <div class="subtitle">Transaction Confirmation</div>
            <div class="section">
              <div class="row"><span class="label">Receipt No:</span><span class="value">${receipt.receiptNumber}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${formatDate(receipt.paymentDate)}</span></div>
              <div class="row"><span class="label">Payment Method:</span><span class="value">${receipt.paymentMethod}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="row"><span class="label">Name:</span><span class="value">${receipt.studentName}</span></div>
              <div class="row"><span class="label">Admission No:</span><span class="value">${receipt.admissionNumber}</span></div>
              <div class="row"><span class="label">Class:</span><span class="value">${receipt.className} - ${receipt.section}</span></div>
              <div class="row"><span class="label">Parent:</span><span class="value">${receipt.parentName}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Payment Breakdown</div>
              <table>
                <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
                <tbody>
                  ${receipt.totalFeeStructure > 0 ? `<tr><td>Total Fee</td><td>${formatCurrency(receipt.totalFeeStructure)}</td></tr>` : ''}
                  ${receipt.previousPaid > 0 ? `<tr><td>Previously Paid</td><td>${formatCurrency(receipt.previousPaid)}</td></tr>` : ''}
                  <tr><td>Current Payment</td><td>${formatCurrency(receipt.netAmount)}</td></tr>
                  <tr class="total-row"><td>Total Amount Paid</td><td>${formatCurrency(receipt.newTotalPaid)}</td></tr>
                  ${receipt.remainingBalance > 0 
                    ? `<tr class="balance-row"><td>Remaining Balance</td><td>${formatCurrency(receipt.remainingBalance)}</td></tr>` 
                    : `<tr class="balance-paid"><td>Balance Due</td><td>₹0.00 (Fully Paid)</td></tr>`}
                </tbody>
              </table>
            </div>
            <div class="section">
              <div class="row"><span class="label">Amount in Words:</span></div>
              <div class="row" style="font-style: italic; font-size: 9px;">${receipt.amountInWords}</div>
            </div>
            <div class="footer">
              <div style="font-size: 9px;">
                <div class="label">Collected By:</div>
                <div>${receipt.recordedByName || 'System'}</div>
              </div>
              <div class="signature">Authorized Signatory</div>
            </div>
            <div class="copy-label">ORIGINAL COPY (Parent)</div>
          </div>

          <!-- Cut Line -->
          <div class="cut-line"></div>

          <!-- DUPLICATE COPY (RIGHT) -->
          <div class="receipt">
            <div class="header">
              <div class="school-name">${receipt.school.name}</div>
              <div class="school-address">${receipt.school.address}</div>
              <div class="school-address">Phone: ${receipt.school.phone} | Email: ${receipt.school.email}</div>
            </div>
            <div class="title">PAYMENT RECEIPT</div>
            <div class="subtitle">Transaction Confirmation</div>
            <div class="section">
              <div class="row"><span class="label">Receipt No:</span><span class="value">${receipt.receiptNumber}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${formatDate(receipt.paymentDate)}</span></div>
              <div class="row"><span class="label">Payment Method:</span><span class="value">${receipt.paymentMethod}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="row"><span class="label">Name:</span><span class="value">${receipt.studentName}</span></div>
              <div class="row"><span class="label">Admission No:</span><span class="value">${receipt.admissionNumber}</span></div>
              <div class="row"><span class="label">Class:</span><span class="value">${receipt.className} - ${receipt.section}</span></div>
              <div class="row"><span class="label">Parent:</span><span class="value">${receipt.parentName}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Payment Breakdown</div>
              <table>
                <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
                <tbody>
                  ${receipt.totalFeeStructure > 0 ? `<tr><td>Total Fee</td><td>${formatCurrency(receipt.totalFeeStructure)}</td></tr>` : ''}
                  ${receipt.previousPaid > 0 ? `<tr><td>Previously Paid</td><td>${formatCurrency(receipt.previousPaid)}</td></tr>` : ''}
                  <tr><td>Current Payment</td><td>${formatCurrency(receipt.netAmount)}</td></tr>
                  <tr class="total-row"><td>Total Amount Paid</td><td>${formatCurrency(receipt.newTotalPaid)}</td></tr>
                  ${receipt.remainingBalance > 0 
                    ? `<tr class="balance-row"><td>Remaining Balance</td><td>${formatCurrency(receipt.remainingBalance)}</td></tr>` 
                    : `<tr class="balance-paid"><td>Balance Due</td><td>₹0.00 (Fully Paid)</td></tr>`}
                </tbody>
              </table>
            </div>
            <div class="section">
              <div class="row"><span class="label">Amount in Words:</span></div>
              <div class="row" style="font-style: italic; font-size: 9px;">${receipt.amountInWords}</div>
            </div>
            <div class="footer">
              <div style="font-size: 9px;">
                <div class="label">Collected By:</div>
                <div>${receipt.recordedByName || 'System'}</div>
              </div>
              <div class="signature">Authorized Signatory</div>
            </div>
            <div class="copy-label">DUPLICATE COPY (Office)</div>
          </div>
        </div>
        <div class="print-btn">
          <button onclick="window.print()">🖨️ Print</button>
          <button onclick="window.close()">✖️ Close</button>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };
  
  // Handle Preview Receipt
  const handlePreviewReceipt = () => {
    if (!selectedStudent) {
      toast({
        title: 'No Student Selected',
        description: 'Please select a student first',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.netAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }
    
    const receipt = generateReceipt({
      success: true,
      data: {
        receiptNumber: `PREVIEW-${Date.now().toString().slice(-8)}`,
        transactionId: formData.transactionId || 'PREVIEW',
        paymentDate: formData.paymentDate,
        amount: formData.netAmount,
        status: 'success',
      },
      message: 'Preview'
    });
    
    setReceiptData(receipt);
    setShowPreviewDialog(true);
  };
  
  // Navigation
  const goToNextStep = () => {
    if (currentStep === 1 && !selectedStudent) {
      toast({
        title: 'Student Required',
        description: 'Please select a student to continue',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentStep === 2 && formData.netAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Reset Form
  const handleReset = () => {
    setSelectedStudent(null);
    setFeeSummary(null);
    setSearchTerm('');
    setSearchResults([]);
    setPaymentCycle(PAYMENT_CYCLE_CONFIG.standard);
    setFormData({
      studentId: '',
      admissionNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      amount: 0,
      discount: 0,
      discountReason: '',
      lateFee: 0,
      lateFeeReason: '',
      netAmount: 0,
      description: '',
      referenceNo: '',
      transactionId: '',
      bankName: '',
      chequeNo: '',
      chequeDate: '',
      utrNo: '',
      upiId: '',
      feesPaid: [],
      sendReceipt: true,
      sendSMS: true,
      sendEmail: true,
      printReceipt: true,
    });
    setCurrentStep(1);
    
    toast({
      title: 'Form Reset',
      description: 'All payment details have been cleared',
    });
  };
  
  // Render Step 1: Student Selection
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Student Search & Selection
        </h3>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Student Name, Admission Number, or Parent Name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {searchError && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Search Error</AlertTitle>
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
          
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <div className="p-3 bg-gray-50 border-b sticky top-0">
                <span className="text-sm text-gray-600">
                  Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              {searchResults.map((student) => (
                <div
                  key={student._id || student.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors"
                  onClick={() => handleSelectStudent(student)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(getStudentName(student))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{getStudentName(student)}</div>
                    <div className="text-sm text-gray-500">
                      Adm: {getAdmissionNumber(student)} • Class: {getClassName(student)}-{getSection(student)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Parent: {getParentName(student)} • {getParentPhone(student)}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedStudent && (
          <Card className="mt-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-green-200">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xl font-bold">
                      {getInitials(getStudentName(selectedStudent))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xl font-bold text-green-900">{getStudentName(selectedStudent)}</h4>
                    <p className="text-sm text-green-700">
                      Admission No: {getAdmissionNumber(selectedStudent)} • Class: {getClassName(selectedStudent)}-{getSection(selectedStudent)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Change Student
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-500">Father's Name</div>
                  <div className="font-medium">{getParentName(selectedStudent)}</div>
                  <div className="text-sm text-gray-500">{getParentPhone(selectedStudent)}</div>
                </div>
                {selectedStudent.parents?.mother && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-500">Mother's Name</div>
                    <div className="font-medium">{selectedStudent.parents.mother.name}</div>
                    <div className="text-sm text-gray-500">{selectedStudent.parents.mother.phone}</div>
                  </div>
                )}
              </div>
              
              {feeSummary && (
                <div className="mt-6 pt-6 border-t border-green-200">
                  {/* Payment Status Board */}
                  <div className={`mb-6 p-4 rounded-xl border-2 ${paymentStatus.color} transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{paymentStatus.icon}</span>
                        <div>
                          <div className="text-sm font-medium opacity-80">Payment Status</div>
                          <div className="text-xl font-bold">{paymentStatus.label}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-80">Fee Structure</div>
                        <div className="text-lg font-bold">
                          ₹{(totalDues + totalPaid).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {paymentStatus.message && (
                      <div className="mt-3 pt-3 border-t border-current opacity-90">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium">{paymentStatus.message}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-green-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Fee Summary
                    </h5>
                    {hasOverdue && (
                      <Badge variant="destructive" className="bg-red-100 text-red-700 shadow-sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue: {formatCurrency(overdueAmount)}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`rounded-lg p-4 text-center border-2 shadow-sm transition-all ${
                      totalDues > 0 
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        Total Due
                      </div>
                      <div className={`text-2xl font-bold ${
                        totalDues > 0 ? 'text-amber-700' : 'text-green-700'
                      }`}>
                        {formatCurrency(totalDues)}
                      </div>
                      {totalDues > 0 && (
                        <div className="text-xs text-amber-600 mt-1 font-medium">Pending</div>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-4 text-center border-2 shadow-sm transition-all ${
                      totalPaid > 0 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                    }`}>
                      <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Total Paid
                      </div>
                      <div className={`text-2xl font-bold ${
                        totalPaid > 0 ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {formatCurrency(totalPaid)}
                      </div>
                      {totalPaid > 0 ? (
                        <div className="text-xs text-green-600 mt-1 font-medium">Received</div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1 font-medium">No payment</div>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center border-2 border-blue-200 shadow-sm">
                      <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next Payment Due
                      </div>
                      {feeSummary.nextDueDate ? (
                        <>
                          <div className="text-lg font-bold text-blue-900 mb-1">
                            {formatDueDate(feeSummary.nextDueDate)}
                          </div>
                          <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${getDueDateStatus(feeSummary.nextDueDate).color}`}>
                            {getDueDateStatus(feeSummary.nextDueDate).label}
                          </div>
                        </>
                      ) : formData.paymentDate ? (
                        <>
                          <div className="text-lg font-bold text-blue-900 mb-1">
                            {formatDueDate(calculateNextDueDate(formData.paymentDate, paymentCycle))}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">
                            {paymentCycle}-day payment cycle
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Will be calculated on payment</div>
                      )}
                    </div>
                  </div>
                  
                  {(feeSummary.feeBreakdown || feeSummary.breakdown || feeSummary.fees) && (
                    <div className="space-y-3">
                      <h6 className="font-medium text-gray-700">Fee Breakdown</h6>
                      {(feeSummary.feeBreakdown || feeSummary.breakdown || feeSummary.fees || []).map((fee: FeeBreakdown, index: number) => (
                        <div key={fee.id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`fee-${fee.id || index}`}
                              checked={formData.feesPaid.some(f => f.id === fee.id || f.type === (fee.type || fee.name) || f.name === (fee.type || fee.name))}
                              onCheckedChange={(checked) => handleFeeSelection(fee, checked as boolean)}
                            />
                            <Label htmlFor={`fee-${fee.id || index}`} className="cursor-pointer">
                              <div className="font-medium">{fee.name || fee.type || 'Fee'}</div>
                              {fee.dueDate && (
                                <div className="text-sm text-gray-500">Due: {formatDate(fee.dueDate)}</div>
                              )}
                            </Label>
                          </div>
                          <div className="font-bold text-green-700">{formatCurrency(fee.amount || fee.value || 0)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button
          onClick={goToNextStep}
          disabled={!selectedStudent}
          className="px-8 py-6 text-lg"
        >
          Continue to Payment Details
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
  
  // Render Step 2: Payment Details
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Details
        </h3>
        <Button variant="ghost" size="sm" onClick={goToPreviousStep}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Student
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payment Date *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={formData.paymentDate}
              readOnly
              className="pl-10 bg-gray-50 cursor-not-allowed text-gray-700 font-medium border-gray-300"
              disabled
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Today
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Payment date is automatically set to current system date
          </p>
        </div>

        <div className="space-y-4">
          <Label className="font-medium">Payment Method *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value: any) => handleFieldChange('paymentMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee Breakdown Summary */}
      {feeSummary && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              Fee Breakdown
            </CardTitle>
            <CardDescription>
              Overview of student's fee payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Total Fee</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(totalDues + totalPaid)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Already Paid</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(totalPaid)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="text-sm text-gray-600 mb-1">Remaining Due</div>
                <div className="text-2xl font-bold text-amber-700">
                  {formatCurrency(totalDues)}
                </div>
              </div>
            </div>

            {/* Quick Payment Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFieldChange('amount', totalDues)}
                className="border-blue-300 hover:bg-blue-50"
              >
                Pay Full Fee
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFieldChange('amount', totalDues)}
                className="border-amber-300 hover:bg-amber-50"
              >
                Pay Remaining
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFieldChange('amount', 0)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Custom Amount
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Cycle Selector */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Payment Cycle Configuration
          </CardTitle>
          <CardDescription>
            Select when the next payment will be due based on today's payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Monthly', days: 30, icon: '📅' },
              { label: 'Standard', days: 60, icon: '✅' },
              { label: 'Quarterly', days: 90, icon: '📆' },
              { label: 'Half-Yearly', days: 180, icon: '🗓️' },
              { label: 'Yearly', days: 365, icon: '🎉' },
            ].map((cycle) => (
              <button
                key={cycle.days}
                onClick={() => setPaymentCycle(cycle.days)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  paymentCycle === cycle.days
                    ? 'border-blue-500 bg-blue-100 shadow-md scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-2xl mb-1">{cycle.icon}</div>
                <div className="text-sm font-semibold text-gray-700">{cycle.label}</div>
                <div className="text-xs text-gray-500">{cycle.days} days</div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-700">Next Payment Due:</span>{' '}
                <span className="font-medium">{formatDueDate(calculateNextDueDate(formData.paymentDate, paymentCycle))}</span>
              </div>
              <div className={`text-xs font-medium px-3 py-1 rounded-full ${getDueDateStatus(calculateNextDueDate(formData.paymentDate, paymentCycle)).color}`}>
                {getDueDateStatus(calculateNextDueDate(formData.paymentDate, paymentCycle)).label}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedMethod?.requiresRef && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Payment Reference Details</CardTitle>
            <CardDescription>Please provide the following information for verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMethod.fields.includes('bankName') && (
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input
                    placeholder="Enter bank name"
                    value={formData.bankName}
                    onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  />
                </div>
              )}
              
              {selectedMethod.fields.includes('chequeNo') && (
                <div className="space-y-2">
                  <Label>Cheque Number *</Label>
                  <Input
                    placeholder="Enter 6-9 digit cheque number"
                    value={formData.chequeNo}
                    maxLength={9}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleFieldChange('chequeNo', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">6-9 digits only</p>
                </div>
              )}
              
              {selectedMethod.fields.includes('chequeDate') && (
                <div className="space-y-2">
                  <Label>Cheque Date</Label>
                  <Input
                    type="date"
                    value={formData.chequeDate}
                    onChange={(e) => handleFieldChange('chequeDate', e.target.value)}
                  />
                </div>
              )}
              
              {selectedMethod.fields.includes('transactionId') && (
                <div className="space-y-2">
                  <Label>Transaction ID *</Label>
                  <Input
                    placeholder="Enter transaction ID (6-20 alphanumeric characters)"
                    value={formData.transactionId}
                    maxLength={20}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                      handleFieldChange('transactionId', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">Only alphanumeric characters allowed (max 20)</p>
                </div>
              )}
              
              {selectedMethod.fields.includes('utrNo') && (
                <div className="space-y-2">
                  <Label>UTR Number *</Label>
                  <Input
                    placeholder="Enter 12-digit UTR number"
                    value={formData.utrNo}
                    maxLength={12}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleFieldChange('utrNo', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">Exactly 12 digits required</p>
                </div>
              )}
              
              {selectedMethod.fields.includes('upiId') && (
                <div className="space-y-2">
                  <Label>UPI ID / Mobile Number *</Label>
                  <Input
                    placeholder="e.g., 9876543210@upi"
                    value={formData.upiId}
                    maxLength={50}
                    onChange={(e) => handleFieldChange('upiId', e.target.value)}
                  />
                </div>
              )}

              {selectedMethod.fields.includes('ifscCode') && (
                <div className="space-y-2">
                  <Label>IFSC Code *</Label>
                  <Input
                    placeholder="e.g., SBIN0001234"
                    value={formData.ifscCode}
                    maxLength={11}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      handleFieldChange('ifscCode', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">11 characters (4 letters + 0 + 6 alphanumeric)</p>
                </div>
              )}

              {selectedMethod.fields.includes('accountNumber') && (
                <div className="space-y-2">
                  <Label>Account Number (Optional)</Label>
                  <Input
                    placeholder="Enter 9-18 digit account number"
                    value={formData.accountNumber}
                    maxLength={18}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleFieldChange('accountNumber', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">9-18 digits</p>
                </div>
              )}

              {selectedMethod.fields.includes('cardLast4') && (
                <div className="space-y-2">
                  <Label>Last 4 Digits of Card *</Label>
                  <Input
                    placeholder="e.g., 1234"
                    value={formData.cardLast4}
                    maxLength={4}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleFieldChange('cardLast4', value);
                    }}
                  />
                  <p className="text-xs text-gray-500">Exactly 4 digits</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Reference Number (Optional)</Label>
                <Input
                  placeholder="Additional reference"
                  value={formData.referenceNo}
                  onChange={(e) => handleFieldChange('referenceNo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Amount Calculation</CardTitle>
          <CardDescription>Enter payment amount and applicable adjustments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fee Amount *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange('amount', value === '' ? 0 : Number(value));
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.discount || ''}
                  onChange={(e) => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
                />
              </div>
              {formData.discount > 0 && (
                <Input
                  placeholder="Discount reason"
                  className="mt-2"
                  value={formData.discountReason}
                  onChange={(e) => handleFieldChange('discountReason', e.target.value)}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Late Fee</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.lateFee || ''}
                onChange={(e) => handleFieldChange('lateFee', parseFloat(e.target.value) || 0)}
              />
              {formData.lateFee > 0 && (
                <Input
                  placeholder="Late fee reason"
                  className="mt-2"
                  value={formData.lateFeeReason}
                  onChange={(e) => handleFieldChange('lateFeeReason', e.target.value)}
                />
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Net Amount Payable</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(formData.netAmount)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 max-w-md">
                <div className="text-sm text-gray-500 mb-1">Amount in Words</div>
                <div className="text-gray-700 italic">
                  {convertToWords(formData.netAmount)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description / Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes about this payment..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={goToPreviousStep} className="px-8">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="px-8">
          Review & Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  // Render Step 3: Review & Confirm
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Review & Confirm
        </h3>
        <Button variant="ghost" size="sm" onClick={goToPreviousStep}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Edit
        </Button>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-xl text-green-900">Ready to Record Payment</h4>
            <p className="text-green-700">Please review all details before confirming the payment</p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
          <CardDescription>Complete transaction details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Student Name</div>
                <div className="font-bold text-lg">{getStudentName(selectedStudent)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Admission Number</div>
                <div className="font-bold text-lg">{getAdmissionNumber(selectedStudent)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Class & Section</div>
                <div className="font-bold text-lg">{getClassName(selectedStudent)} - {getSection(selectedStudent)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Parent Name</div>
                <div className="font-bold text-lg">{getParentName(selectedStudent)}</div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {selectedMethod && (
                  <>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {React.createElement(selectedMethod.icon, { className: "h-6 w-6 text-primary" })}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Payment Method</div>
                      <div className="font-bold">{selectedMethod.label}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Payment Date</div>
                <div className="font-bold">{formatDate(formData.paymentDate)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                <div className="text-sm text-gray-500">Reference Number / Transaction ID</div>
                <div className="font-mono text-sm">
                  {formData.referenceNo || formData.transactionId || formData.chequeNo || formData.utrNo || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount Breakdown
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="font-medium">Fee Amount</span>
                <span className="font-bold text-xl">{formatCurrency(formData.amount)}</span>
              </div>
              
              {formData.discount > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium text-red-700">Discount</span>
                    {formData.discountReason && (
                      <div className="text-sm text-red-600">{formData.discountReason}</div>
                    )}
                  </div>
                  <span className="font-bold text-xl text-red-700">- {formatCurrency(formData.discount)}</span>
                </div>
              )}
              
              {formData.lateFee > 0 && (
                <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                  <div>
                    <span className="font-medium text-amber-700">Late Fee</span>
                    {formData.lateFeeReason && (
                      <div className="text-sm text-amber-600">{formData.lateFeeReason}</div>
                    )}
                  </div>
                  <span className="font-bold text-xl text-amber-700">+ {formatCurrency(formData.lateFee)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <span className="font-bold text-xl">Total Amount Payable</span>
                <span className="font-bold text-3xl text-green-600">
                  {formatCurrency(formData.netAmount)}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Amount in Words</div>
                <div className="font-medium italic">
                  {convertToWords(formData.netAmount)}
                </div>
              </div>
              
              {formData.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Notes / Remarks</div>
                  <div className="text-gray-700">{formData.description}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receipt Options</CardTitle>
          <CardDescription>Choose how to deliver the receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer transition-all">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) => handleFieldChange('sendEmail', checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="sendEmail" className="font-medium cursor-pointer">Email Receipt</Label>
                <div className="text-sm text-gray-500 mt-1">
                  Send to {getParentEmail(selectedStudent) || 'parent@email.com'}
                </div>
              </div>
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer transition-all">
              <Checkbox
                id="sendSMS"
                checked={formData.sendSMS}
                onCheckedChange={(checked) => handleFieldChange('sendSMS', checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="sendSMS" className="font-medium cursor-pointer">Send SMS</Label>
                <div className="text-sm text-gray-500 mt-1">
                  To {getParentPhone(selectedStudent)}
                </div>
              </div>
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer transition-all">
              <Checkbox
                id="printReceipt"
                checked={formData.printReceipt}
                onCheckedChange={(checked) => handleFieldChange('printReceipt', checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="printReceipt" className="font-medium cursor-pointer">Print Receipt</Label>
                <div className="text-sm text-gray-500 mt-1">
                  Generate physical copy for records
                </div>
              </div>
              <Printer className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-4 pt-6">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          className="flex-1 py-6 text-lg"
          disabled={loading}
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to Edit
        </Button>
        
        <Button
          variant="outline"
          onClick={handlePreviewReceipt}
          className="flex-1 py-6 text-lg"
          disabled={loading}
        >
          <Eye className="mr-2 h-5 w-5" />
          Preview Receipt
        </Button>
        
        <Button
          onClick={handleSubmit}
          className="flex-1 py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Confirm & Save Payment
            </>
          )}
        </Button>
      </div>
      
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Important</AlertTitle>
        <AlertDescription className="text-amber-700">
          This will create a permanent transaction record in the database. 
          Please verify all details before confirming. Once recorded, changes can only be made through refund transactions.
        </AlertDescription>
      </Alert>
    </div>
  );
  
  // Main Render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Receipt className="h-8 w-8 text-primary" />
              Record Payment & Generate Receipt
            </h1>
            <p className="text-gray-600 text-lg">
              Record fee payments and generate professional receipts with complete transaction details
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <School className="h-3 w-3 mr-1" />
              {SCHOOL_CONFIG.shortName}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <User className="h-3 w-3 mr-1" />
              {user?.name || 'Admin'}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset Form</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="flex items-center justify-center">
          <div className="flex items-center w-full max-w-2xl">
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <div className={`flex flex-col items-center flex-1 ${currentStep >= step ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${currentStep > step ? 'bg-green-500 text-white' : ''}
                    ${currentStep === step ? 'bg-primary text-white shadow-lg scale-110' : ''}
                    ${currentStep < step ? 'bg-gray-100 text-gray-400' : ''}
                  `}>
                    {currentStep > step ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step === 1 ? <User className="h-6 w-6" /> :
                      step === 2 ? <CreditCard className="h-6 w-6" /> :
                      <FileText className="h-6 w-6" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {step === 1 ? 'Student Selection' : step === 2 ? 'Payment Details' : 'Review & Receipt'}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
      
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the payment receipt that will be generated
            </DialogDescription>
          </DialogHeader>
          
          {receiptData && (
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">{receiptData.school.name}</h2>
                  <p className="text-sm text-gray-600">{receiptData.school.address}</p>
                  <p className="text-sm text-gray-600">Phone: {receiptData.school.phone} | Email: {receiptData.school.email}</p>
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <h3 className="text-xl font-bold">PAYMENT RECEIPT</h3>
                    <p className="text-sm">Receipt No: {receiptData.receiptNumber}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-semibold">{receiptData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admission Number</p>
                    <p className="font-semibold">{receiptData.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class & Section</p>
                    <p className="font-semibold">{receiptData.className} - {receiptData.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-semibold">{formatDate(receiptData.paymentDate)}</p>
                  </div>
                </div>
                
                <table className="w-full mb-6 border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.totalFeeStructure > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Total Fee Structure</td>
                        <td className="text-right py-2">{formatCurrency(receiptData.totalFeeStructure)}</td>
                      </tr>
                    )}
                    {receiptData.previousPaid > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Previously Paid</td>
                        <td className="text-right py-2">{formatCurrency(receiptData.previousPaid)}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-2">Current Payment Amount</td>
                      <td className="text-right py-2">{formatCurrency(receiptData.amount)}</td>
                    </tr>
                    {receiptData.discount > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Discount {receiptData.discountReason && `(${receiptData.discountReason})`}</td>
                        <td className="text-right py-2 text-red-600">- {formatCurrency(receiptData.discount)}</td>
                      </tr>
                    )}
                    {receiptData.lateFee > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Late Fee {receiptData.lateFeeReason && `(${receiptData.lateFeeReason})`}</td>
                        <td className="text-right py-2 text-amber-600">+ {formatCurrency(receiptData.lateFee)}</td>
                      </tr>
                    )}
                    <tr className="border-b font-bold" style={{ background: '#dcfce7' }}>
                      <td className="py-2">Total Amount Paid (This Receipt)</td>
                      <td className="text-right py-2">{formatCurrency(receiptData.netAmount)}</td>
                    </tr>
                    {receiptData.newTotalPaid > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Cumulative Total Paid</td>
                        <td className="text-right py-2" style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(receiptData.newTotalPaid)}</td>
                      </tr>
                    )}
                    <tr style={{ background: receiptData.remainingBalance > 0 ? '#fef3c7' : '#dcfce7' }}>
                      <td className="py-2 font-bold">
                        {receiptData.remainingBalance > 0 ? 'Remaining Balance Due' : 'Balance Due'}
                      </td>
                      <td className="text-right py-2 font-bold" style={{ color: receiptData.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                        {receiptData.remainingBalance > 0 
                          ? formatCurrency(receiptData.remainingBalance) 
                          : '₹0.00 (Fully Paid)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-500 mb-1">Amount in Words</p>
                  <p className="italic">{receiptData.amountInWords}</p>
                </div>
                
                {receiptData.description && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-sm">{receiptData.description}</p>
                  </div>
                )}
                
                <div className="flex justify-between mt-8 pt-4 border-t">
                  <div className="text-center">
                    <div className="w-48 border-t border-gray-300 pt-2">
                      <p className="text-xs text-gray-500">Student/Parent Signature</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-t border-gray-300 pt-2">
                      <p className="text-xs text-gray-500">Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => receiptData && handlePrintReceipt(receiptData)}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-500">Please wait while we record the payment...</p>
              <Progress value={60} className="mt-4" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
