// src/pages/finance/PaymentHistory.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  Wallet,
  Building,
  FileSignature,
  MoreVertical,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Interface for Payment
interface Payment {
  _id: string;
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  amount: number;
  discount: number;
  lateFee: number;
  netAmount: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'completed' | 'pending' | 'failed' | string;
  paymentDate: string;
  parentName: string;
  parentPhone: string;
  recordedBy?: {
    name: string;
    email: string;
    username: string;
  };
  recordedByName?: string;
  description?: string;
  bankName?: string;
  chequeNo?: string;
  utrNo?: string;
  referenceNo?: string;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
}

// Interface for API Response
interface PaymentHistoryResponse {
  success: boolean;
  payments?: Payment[];
  data?: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary?: {
      totalAmount: number;
      totalTransactions: number;
      completedPayments: number;
      successRate: number;
      avgTransaction: number;
    };
    methodDistribution?: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    weeklyTrend?: Array<{
      day: string;
      amount: number;
      transactions: number;
      date: string;
    }>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Interface for Statistics
interface StatisticsResponse {
  success: boolean;
  data?: {
    today: {
      totalAmount: number;
      count: number;
    };
    thisMonth: {
      totalAmount: number;
      count: number;
    };
    thisYear?: {
      totalAmount: number;
      count: number;
    };
    methodBreakdown?: Array<{
      _id: string;
      totalAmount: number;
      count: number;
    }>;
    classBreakdown?: Array<{
      _id: string;
      totalAmount: number;
      count: number;
    }>;
  };
  today?: {
    totalAmount: number;
    count: number;
  };
  thisMonth?: {
    totalAmount: number;
    count: number;
  };
}

const PaymentHistoryPage = () => {
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    completedPayments: 0,
    successRate: 0,
    avgTransaction: 0
  });
  const [statistics, setStatistics] = useState({
    today: { totalAmount: 0, count: 0 },
    thisMonth: { totalAmount: 0, count: 0 }
  });
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [methodDistribution, setMethodDistribution] = useState<any[]>([]);
  const [methodOptions, setMethodOptions] = useState<string[]>(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online']);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  
  // Fetch payment history
  const fetchPaymentHistory = async (page = 1) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }
      
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedMethod !== 'all') params.append('paymentMethod', selectedMethod);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedClass !== 'all') params.append('className', selectedClass);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      console.log('📤 GET', `${API_BASE_URL}/history/payments?${params.toString()}`);
      
      const response = await fetch(`${API_BASE_URL}/history/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PaymentHistoryResponse = await response.json();
      console.log('📊 Payment history response:', data);
      
      if (data.success) {
        // Handle different response structures
        let paymentsData: Payment[] = [];
        let paginationData = data.pagination;
        
        if (Array.isArray(data.payments)) {
          paymentsData = data.payments;
        } else if (data.data?.payments) {
          paymentsData = data.data.payments;
          paginationData = data.data.pagination;
        }
        
        // Process payments to ensure all fields exist
        const processedPayments = paymentsData.map(payment => ({
          ...payment,
          paymentMethod: payment.paymentMethod || 'cash',
          status: payment.status || 'completed',
          netAmount: payment.netAmount || payment.amount || payment.totalAmount || 0,
          amount: payment.amount || payment.totalAmount || 0,
          discount: payment.discount || 0,
          lateFee: payment.lateFee || 0,
          studentName: payment.studentName || 'Unknown Student',
          admissionNumber: payment.admissionNumber || 'N/A',
          className: payment.className || 'Unknown',
          section: payment.section || 'A',
          parentName: payment.parentName || 'N/A',
          parentPhone: payment.parentPhone || 'N/A',
          recordedByName: payment.recordedByName || payment.recordedBy?.name || 'System'
        }));
        
        setPayments(processedPayments);
        
        if (paginationData) {
          setPagination(paginationData);
        }
        
        // Calculate summary if not provided
        if (data.data?.summary) {
          setSummary(data.data.summary);
        } else {
          const totalAmount = processedPayments.reduce((sum, p) => sum + p.netAmount, 0);
          const totalTransactions = processedPayments.length;
          const completedPayments = processedPayments.filter(p => p.status === 'completed').length;
          const successRate = totalTransactions > 0 ? (completedPayments / totalTransactions) * 100 : 0;
          const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
          
          setSummary({
            totalAmount,
            totalTransactions,
            completedPayments,
            successRate,
            avgTransaction
          });
        }
        
        // Extract unique payment methods and classes
        const methods = Array.from(new Set(processedPayments.map(p => p.paymentMethod).filter(Boolean)));
        const classes = Array.from(new Set(processedPayments.map(p => p.className).filter(Boolean)));
        
        if (methods.length > 0) setMethodOptions(['all', ...methods]);
        if (classes.length > 0) setClassOptions(['all', ...classes]);
        
        // Calculate method distribution
        const distribution = methods.map(method => {
          const methodPayments = processedPayments.filter(p => p.paymentMethod === method);
          return {
            _id: method,
            count: methodPayments.length,
            totalAmount: methodPayments.reduce((sum, p) => sum + p.netAmount, 0)
          };
        });
        setMethodDistribution(distribution);
        
      } else {
        toast.error('Failed to fetch payment history');
      }
    } catch (error: any) {
      console.error('❌ Error fetching payment history:', error);
      toast.error(`Error loading payment history: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      console.log('📤 GET', `${API_BASE_URL}/history/statistics`);
      
      const response = await fetch(`${API_BASE_URL}/history/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data: StatisticsResponse = await response.json();
      console.log('📊 Statistics response:', data);
      
      if (data.success) {
        // Handle different response structures
        if (data.data) {
          setStatistics({
            today: data.data.today || { totalAmount: 0, count: 0 },
            thisMonth: data.data.thisMonth || { totalAmount: 0, count: 0 }
          });
        } else if (data.today || data.thisMonth) {
          setStatistics({
            today: data.today || { totalAmount: 0, count: 0 },
            thisMonth: data.thisMonth || { totalAmount: 0, count: 0 }
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error);
      // Continue without statistics - they're not critical
    }
  };
  
  // Export to CSV
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      toast.loading('Preparing export...');
      
      // Build query params for export
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedMethod !== 'all') params.append('paymentMethod', selectedMethod);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedClass !== 'all') params.append('className', selectedClass);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const response = await fetch(`${API_BASE_URL}/finance/payments/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback: generate CSV client-side
          generateClientSideCSV();
          return;
        }
        throw new Error(`Export failed: ${response.status}`);
      }
      
      // Get filename from headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export successful');
    } catch (error: any) {
      console.error('Export error:', error);
      // Try client-side generation
      generateClientSideCSV();
    }
  };
  
  // Client-side CSV generation fallback
  const generateClientSideCSV = () => {
    try {
      const headers = [
        'Receipt Number',
        'Student Name',
        'Admission Number',
        'Class',
        'Section',
        'Amount',
        'Discount',
        'Late Fee',
        'Net Amount',
        'Payment Method',
        'Status',
        'Payment Date',
        'Parent Name',
        'Parent Phone',
        'Collected By',
        'Description'
      ];
      
      const csvRows = [
        headers.join(','),
        ...payments.map(payment => [
          `"${payment.receiptNumber || ''}"`,
          `"${payment.studentName || ''}"`,
          `"${payment.admissionNumber || ''}"`,
          `"${payment.className || ''}"`,
          `"${payment.section || ''}"`,
          payment.amount,
          payment.discount,
          payment.lateFee,
          payment.netAmount,
          `"${payment.paymentMethod || ''}"`,
          `"${payment.status || ''}"`,
          `"${new Date(payment.paymentDate).toLocaleDateString()}"`,
          `"${payment.parentName || ''}"`,
          `"${payment.parentPhone || ''}"`,
          `"${payment.recordedByName || ''}"`,
          `"${payment.description || ''}"`
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed (client-side)');
    } catch (error) {
      console.error('Client-side export error:', error);
      toast.error('Export failed');
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
    fetchStatistics();
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchPaymentHistory(page);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchPaymentHistory(1); // Reset to page 1 when filters change
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMethod('all');
    setSelectedStatus('all');
    setSelectedClass('all');
    setDateRange({ start: '', end: '' });
    fetchPaymentHistory(1);
  };
  
  // Initial load
  useEffect(() => {
    fetchPaymentHistory();
    fetchStatistics();
    
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  }, []);
  
  // Format date time
  const formatDateTime = (dateInput: string | Date): string => {
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string = 'completed') => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get payment method icon
  const getPaymentMethodIcon = (method: string = 'cash') => {
    const methodLower = (method || '').toLowerCase();
    switch (methodLower) {
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank transfer':
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'cheque': return <FileSignature className="h-4 w-4" />;
      case 'online': return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };
  
  // FIXED: Get payment method color - Safe with null checks
  const getPaymentMethodColor = (method: string = 'cash') => {
    const methodLower = (method || '').toLowerCase();
    switch (methodLower) {
      case 'upi': return 'bg-blue-100 text-blue-600';
      case 'cash': return 'bg-green-100 text-green-600';
      case 'card': return 'bg-purple-100 text-purple-600';
      case 'bank transfer':
      case 'bank_transfer': return 'bg-amber-100 text-amber-600';
      case 'cheque': return 'bg-red-100 text-red-600';
      case 'online': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Handle view details
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };
  
  // View receipt in new window
  const handleViewReceipt = (receiptNumber: string) => {
    window.open(`/finance/receipt/${receiptNumber}`, '_blank');
  };
  
  // Get avatar color based on student name
  const getAvatarColor = (name: string = 'Unknown') => {
    const colors = [
      'bg-pink-100 text-pink-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-amber-100 text-amber-600',
      'bg-red-100 text-red-600',
      'bg-cyan-100 text-cyan-600',
      'bg-indigo-100 text-indigo-600',
    ];
    const index = (name.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };
  
  // Get initials from name
  const getInitials = (name: string = 'Unknown') => {
    return name
      .split(' ')
      .map(part => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string = 'cash') => {
    const methodLower = method.toLowerCase();
    switch (methodLower) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'upi': return 'UPI';
      case 'card': return 'Card';
      case 'cheque': return 'Cheque';
      case 'online': return 'Online';
      case 'cash': return 'Cash';
      default: return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  // Get payment method options
  const getPaymentMethodOptions = () => {
    const options = ['all', ...methodOptions];
    return options.map(method => ({
      value: method,
      label: method === 'all' ? 'All Methods' : formatPaymentMethod(method)
    }));
  };

  // Get status options
  const getStatusOptions = () => [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  // Get class options
  const getClassOptions = () => {
    const options = ['all', ...classOptions];
    return options.map(cls => ({
      value: cls,
      label: cls === 'all' ? 'All Classes' : cls
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/finance')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Payment History
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of all payment transactions and records
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button 
            variant="default"
            onClick={handleExport}
            disabled={loading || payments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Collected</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(summary.totalAmount)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  From {summary.totalTransactions} transactions
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600">
                {statistics.today.count} transactions today
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Success Rate</p>
                <p className="text-2xl font-bold text-green-900">
                  {summary.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {summary.completedPayments} successful payments
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress 
              value={summary.successRate} 
              className="h-2 mt-4 bg-green-200" 
            />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Average Transaction</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatCurrency(summary.avgTransaction)}
                </p>
                <p className="text-xs text-amber-600 mt-1">Per transaction</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">This Month</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(statistics.thisMonth.totalAmount)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {statistics.thisMonth.count} transactions
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Method Distribution Chart */}
      {methodDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payment Method Distribution
            </CardTitle>
            <CardDescription>Breakdown of payment methods used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalAmount" 
                    name="Collection Amount" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="count" 
                    name="Transaction Count" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filter Transactions</CardTitle>
              <CardDescription>Refine your search to find specific payments</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} disabled={loading}>
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, receipt, ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                disabled={loading}
              />
            </div>
            
            <Select value={selectedMethod} onValueChange={setSelectedMethod} disabled={loading}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Payment Method" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {getPaymentMethodOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {getClassOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={applyFilters} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `Showing ${payments.length} of ${pagination.total} payment records`}
              </CardDescription>
            </div>
            <Badge variant="outline">
              Total: {formatCurrency(summary.totalAmount)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/finance/record-payment')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Record New Payment
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{payment.receiptNumber}</div>
                          {payment.transactionId && (
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {payment.transactionId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-8 w-8 ${getAvatarColor(payment.studentName)}`}>
                              <AvatarFallback>
                                {getInitials(payment.studentName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium truncate max-w-[150px]">
                                {payment.studentName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.className} • {payment.admissionNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payment.netAmount)}
                          {payment.discount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              -{formatCurrency(payment.discount)} discount
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${getPaymentMethodColor(payment.paymentMethod)}`}>
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <span className="text-sm font-medium">
                              {formatPaymentMethod(payment.paymentMethod)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDateTime(payment.paymentDate)}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            by {payment.recordedByName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(payment)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(payment.receiptNumber)}
                              title="View Receipt"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(payment.receiptNumber)}
                                >
                                  Copy Receipt Number
                                </DropdownMenuItem>
                                {payment.parentPhone && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => window.open(`tel:${payment.parentPhone}`)}
                                    >
                                      Call Parent
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => navigator.clipboard.writeText(payment.parentPhone)}
                                    >
                                      Copy Phone Number
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-16 w-16 ${getAvatarColor(selectedPayment.studentName)}`}>
                    <AvatarFallback>
                      {getInitials(selectedPayment.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPayment.studentName}</h3>
                    <p className="text-muted-foreground">
                      Receipt: {selectedPayment.receiptNumber}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Admission Number</p>
                    <p className="font-medium">{selectedPayment.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class & Section</p>
                    <p className="font-medium">{selectedPayment.className} - {selectedPayment.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{selectedPayment.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Contact</p>
                    <p className="font-medium">{selectedPayment.parentPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collected By</p>
                    <p className="font-medium">
                      {selectedPayment.recordedByName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedPayment.description || 'N/A'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Transaction Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discount</p>
                      <p className="text-lg font-medium">
                        {formatCurrency(selectedPayment.discount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Late Fee</p>
                      <p className="text-lg font-medium">
                        {formatCurrency(selectedPayment.lateFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedPayment.netAmount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`p-2 rounded ${getPaymentMethodColor(selectedPayment.paymentMethod)}`}>
                          {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                        </div>
                        <span className="font-medium">
                          {formatPaymentMethod(selectedPayment.paymentMethod)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {formatDateTime(selectedPayment.paymentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-medium font-mono text-sm">
                        {selectedPayment.transactionId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {(selectedPayment.bankName || selectedPayment.chequeNo || selectedPayment.utrNo) && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2">Bank/Cheque Details</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedPayment.bankName && (
                          <div>
                            <span className="text-muted-foreground">Bank: </span>
                            <span>{selectedPayment.bankName}</span>
                          </div>
                        )}
                        {selectedPayment.chequeNo && (
                          <div>
                            <span className="text-muted-foreground">Cheque No: </span>
                            <span>{selectedPayment.chequeNo}</span>
                          </div>
                        )}
                        {selectedPayment.utrNo && (
                          <div>
                            <span className="text-muted-foreground">UTR No: </span>
                            <span>{selectedPayment.utrNo}</span>
                          </div>
                        )}
                        {selectedPayment.referenceNo && (
                          <div>
                            <span className="text-muted-foreground">Ref No: </span>
                            <span>{selectedPayment.referenceNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleViewReceipt(selectedPayment.receiptNumber)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;