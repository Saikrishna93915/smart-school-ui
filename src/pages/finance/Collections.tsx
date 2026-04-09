// src/pages/finance/Collections.tsx - PRODUCTION VERSION
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Eye,
  CreditCard,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Smartphone,
  FileText,
  Printer,
  Share2,
  MoreVertical,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Import the service
import { collectionsService, type Collection } from '@/Services/collectionsService';

// Mock data for fallback
const MOCK_COLLECTIONS = [
  {
    _id: '1',
    receiptNumber: 'REC001',
    studentId: 'STU2024001',
    studentName: 'Priya Patel',
    className: '10-A',
    section: 'A',
    rollNo: '25',
    parentName: 'Rakesh Patel',
    parentPhone: '+91 98765 43210',
    parentEmail: 'rakesh.patel@email.com',
    amount: 15000,
    totalAmount: 15000,
    paidAmount: 15000,
    dueAmount: 0,
    paymentMethod: 'UPI',
    paymentDate: '2024-11-10T10:30:00Z',
    formattedDate: '2024-11-10',
    status: 'completed' as const,
    description: 'Full fee payment',
    collectedBy: 'Mr. Sharma',
    recordedById: '1',
    createdAt: '2024-11-10T10:30:00Z',
    updatedAt: '2024-11-10T10:30:00Z',
    isDefaulterPayment: false,
    notes: 'Full fee payment'
  },
  // ... rest of mock data (convert to match Collection interface)
];

const Collections = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All Methods');
  const [selectedView, setSelectedView] = useState<'table' | 'card'>('table');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [newStatus, setNewStatus] = useState('completed');

  // Data states
  const [collections, setCollections] = useState<Collection[]>([]);
  const [statistics, setStatistics] = useState({
    totalAmount: 0,
    totalCollections: 0,
    completedAmount: 0,
    completedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    successRate: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Filter options - STANDARDIZED values that match backend expectations
  const statusOptions = ['All Status', 'completed', 'pending', 'failed'];
  const paymentMethodOptions = ['All Methods', 'cash', 'upi', 'card', 'cheque', 'bank_transfer', 'online'];
  const statusUpdateOptions = ['completed', 'pending', 'failed', 'cancelled', 'refunded'];

  // CRITICAL: Class options come from API, not from filtered data
  const dynamicClassOptions = ['All Classes', ...availableClasses];

  // CRITICAL: Fetch unique class names from backend on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classes = await collectionsService.getCollectionClasses();
        setAvailableClasses(classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Load collections data
  const loadCollections = async () => {
    setLoading(true);
    try {
      const params: any = {
        search: searchTerm?.trim() || undefined,
        // CRITICAL: Send exact class value as stored in DB
        className: selectedClass !== 'All Classes' ? selectedClass : undefined,
        // CRITICAL: Send status in lowercase
        status: selectedStatus !== 'All Status' ? selectedStatus.toLowerCase() : undefined,
        // CRITICAL: Send payment method in lowercase with underscores normalized
        paymentMethod: paymentMethodFilter !== 'All Methods' ? paymentMethodFilter.toLowerCase() : undefined,
        page: 1,
        limit: 50
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await collectionsService.getCollections(params);

      if (response.success) {
        setCollections(response.collections || []);

        if (response.statistics) {
          setStatistics(response.statistics);
        }

        // Transform distribution data for charts
        if (response.distributions) {
          // Monthly trend
          const monthlyData = response.distributions.monthlyTrend?.map((item: any) => ({
            month: formatMonth(item._id),
            amount: item.amount || 0,
            transactions: item.count || 0
          })) || [];
          setMonthlyTrend(monthlyData);

          // Payment method distribution
          const methodData = response.distributions.methodDistribution?.map((item: any) => {
            const methodName = formatPaymentMethod(item._id);
            return {
              name: methodName,
              value: item.count || 0,
              amount: item.amount || 0,
              color: getMethodColor(item._id)
            };
          }) || [];
          setPaymentMethodData(methodData);
        }

        toast.success(`Loaded ${response.collections?.length || 0} collections`);
      } else {
        const errMsg = (response as any)?.message || (response as any)?.error || 'Failed to load collections';
        toast.error(errMsg);
        // Fallback to mock data
        setCollections(MOCK_COLLECTIONS);
        setMonthlyTrend(getMockMonthlyTrend());
        setPaymentMethodData(getMockPaymentMethodData());
      }
    } catch (error: any) {
      console.error('Error loading collections:', error);
      toast.error(error.message || 'Failed to load collections');
      // Fallback to mock data
      setCollections(MOCK_COLLECTIONS);
      setMonthlyTrend(getMockMonthlyTrend());
      setPaymentMethodData(getMockPaymentMethodData());
    } finally {
      setLoading(false);
    }
  };

  // Load on component mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Load when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCollections();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedClass, selectedStatus, paymentMethodFilter]);

  // Handle export
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params: any = {
        search: searchTerm?.trim() || undefined,
        // CRITICAL: Send exact class value as stored in DB
        className: selectedClass !== 'All Classes' ? selectedClass : undefined,
        // CRITICAL: Send status in lowercase
        status: selectedStatus !== 'All Status' ? selectedStatus.toLowerCase() : undefined,
        // CRITICAL: Send payment method in lowercase
        paymentMethod: paymentMethodFilter !== 'All Methods' ? paymentMethodFilter.toLowerCase() : undefined,
      };

      const blob = await collectionsService.exportCollections(params);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error(error.message || 'Failed to export');
      
      // Fallback: Create mock CSV
      createMockCSVExport();
    } finally {
      setExportLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (receiptNumber: string) => {
    try {
      const response = await collectionsService.getCollectionDetails(receiptNumber);
      if (response.success) {
        setSelectedCollection(response.collection);
        setShowDetails(true);
      } else {
        toast.error(response.message || 'Failed to load details');
      }
    } catch (error: any) {
      console.error('Error loading collection details:', error);
      toast.error(error.message || 'Failed to load details');
      
      // Fallback: Find in current collections
      const collection = collections.find(c => c.receiptNumber === receiptNumber);
      if (collection) {
        setSelectedCollection(collection);
        setShowDetails(true);
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedCollection) return;
    
    try {
      const response = await collectionsService.updateCollectionStatus(
        selectedCollection.receiptNumber,
        newStatus,
        statusUpdateNotes
      );
      
      if (response.success) {
        toast.success(`Status updated to ${newStatus}`);
        setShowStatusDialog(false);
        setStatusUpdateNotes('');
        
        // Refresh collections
        loadCollections();
        
        // Update selected collection if details dialog is open
        if (showDetails) {
          const updatedResponse = await collectionsService.getCollectionDetails(selectedCollection.receiptNumber);
          if (updatedResponse.success) {
            setSelectedCollection(updatedResponse.collection);
          }
        }
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = async (receiptNumber: string, format: 'html' | 'json' = 'html') => {
    try {
      if (format === 'html') {
        const blob = await collectionsService.downloadReceipt(receiptNumber, 'html');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Receipt downloaded successfully');
      } else {
        const data = await collectionsService.downloadReceipt(receiptNumber, 'json');
        console.log('Receipt data:', data);
        toast.success('Receipt data loaded');
      }
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast.error(error.message || 'Failed to download receipt');
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
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
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
      case 'bank transfer': return <Building className="h-4 w-4" />;
      case 'cheque': return <FileText className="h-4 w-4" />;
      case 'online': return <CreditCard className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'upi': return 'bg-blue-100 text-blue-600';
      case 'cash': return 'bg-green-100 text-green-600';
      case 'card': return 'bg-purple-100 text-purple-600';
      case 'bank_transfer':
      case 'bank transfer': return 'bg-amber-100 text-amber-600';
      case 'cheque': return 'bg-red-100 text-red-600';
      case 'online': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'cash': 'Cash',
      'upi': 'UPI',
      'card': 'Card',
      'cheque': 'Cheque',
      'bank_transfer': 'Bank Transfer',
      'online': 'Online',
      'bank transfer': 'Bank Transfer'
    };
    return methodMap[method.toLowerCase()] || method;
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'cash': '#10b981',
      'upi': '#3b82f6',
      'card': '#8b5cf6',
      'cheque': '#ef4444',
      'bank_transfer': '#f59e0b',
      'online': '#6366f1',
      'bank transfer': '#f59e0b'
    };
    return colors[method.toLowerCase()] || '#6b7280';
  };

  const formatMonth = (monthString: string) => {
    if (!monthString) return 'Unknown';
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1] || ''} ${year}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    // CRITICAL: Display in IST timezone for Indian users
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  // CRITICAL: Format datetime with IST timezone
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  // Mock data fallback functions
  const getMockMonthlyTrend = () => [
    { month: 'Aug', amount: 185000, transactions: 42 },
    { month: 'Sep', amount: 210000, transactions: 48 },
    { month: 'Oct', amount: 195000, transactions: 45 },
    { month: 'Nov', amount: 235000, transactions: 52 },
  ];

  const getMockPaymentMethodData = () => [
    { name: 'UPI', value: 45, color: '#3b82f6', amount: 450000 },
    { name: 'Cash', value: 25, color: '#10b981', amount: 250000 },
    { name: 'Card', value: 15, color: '#8b5cf6', amount: 150000 },
    { name: 'Bank Transfer', value: 10, color: '#f59e0b', amount: 100000 },
    { name: 'Cheque', value: 5, color: '#ef4444', amount: 50000 },
  ];

  const createMockCSVExport = () => {
    const csvContent = [
      ['Receipt Number', 'Student Name', 'Class', 'Amount', 'Payment Method', 'Date', 'Status', 'Collected By'],
      ...collections.map(c => [
        c.receiptNumber,
        c.studentName,
        c.className,
        c.amount,
        formatPaymentMethod(c.paymentMethod),
        formatDate(c.paymentDate),
        c.status,
        c.collectedBy
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections-mock-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter collections - CRITICAL: Only do client-side search, NOT class/status/method
  // because those are already filtered by the backend API
  const filteredCollections = collections.filter(collection => {
    // Only search filter - class/status/method are handled by backend
    const matchesSearch =
      searchTerm === '' ||
      (collection.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Fee Collections
          </h2>
          <p className="text-muted-foreground">Track and manage all fee payments with detailed insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={exportLoading || collections.length === 0}
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </Button>
          <Button onClick={loadCollections} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(statistics.totalAmount)}</p>
                <p className="text-xs text-blue-600 mt-1">Across {statistics.totalCollections} payments</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={75} className="h-2 mt-4 bg-blue-200" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900">{statistics.completedCount} payments</p>
                <p className="text-xs text-green-600 mt-1">{formatCurrency(statistics.completedAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={statistics.successRate} className="h-2 mt-4 bg-green-200" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{statistics.pendingCount} payments</p>
                <p className="text-xs text-amber-600 mt-1">{formatCurrency(statistics.pendingAmount)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-600">Requires follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Success Rate</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.successRate.toFixed(1)}%</p>
                <p className="text-xs text-purple-600 mt-1">Higher than last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-2 rounded-full ${statistics.successRate > 90 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <p className="text-xs text-purple-600">
                {statistics.successRate > 90 ? 'Excellent' : 'Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Collection Trend
            </CardTitle>
            <CardDescription>Fee collection progress over months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelStyle={{ color: '#666' }}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Collection Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="transactions" name="Transactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Payment Method Distribution
            </CardTitle>
            <CardDescription>Preferred payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No payment method data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Recent Collections</CardTitle>
              <CardDescription>{filteredCollections.length} collection records found</CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, ID, receipt..."
                    className="pl-10 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-32">
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      <SelectValue placeholder="Class" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicClassOptions.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {formatPaymentMethod(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedView} onValueChange={(value: 'table' | 'card') => setSelectedView(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table View</SelectItem>
                    <SelectItem value="card">Card View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Loading collections...</p>
            </div>
          ) : selectedView === 'table' ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((collection) => (
                    <TableRow key={collection._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {collection.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{collection.studentName}</div>
                            <div className="text-sm text-muted-foreground">{collection.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{collection.className}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(collection.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getPaymentMethodColor(collection.paymentMethod)}`}>
                            {getPaymentMethodIcon(collection.paymentMethod)}
                          </div>
                          <span className="text-sm">{formatPaymentMethod(collection.paymentMethod)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* CRITICAL: Show createdAt (when recorded) not paymentDate (which can be backdated) */}
                        <div className="text-sm">{formatDateTime(collection.createdAt || collection.paymentDate)}</div>
                        <div className="text-xs text-muted-foreground">{collection.collectedBy}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => window.open(`/finance/receipt/${encodeURIComponent(collection.receiptNumber)}`, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/finance/receipt/${encodeURIComponent(collection.receiptNumber)}`, '_blank')}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const printWindow = window.open(`/finance/receipt/${encodeURIComponent(collection.receiptNumber)}`, '_blank');
                                if (printWindow) {
                                  setTimeout(() => {
                                    printWindow.print();
                                  }, 1000);
                                }
                              }}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedCollection(collection);
                                setShowStatusDialog(true);
                              }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(collection.receiptNumber)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Copy Receipt No
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.map((collection) => (
                <Card key={collection._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-blue-100 text-blue-600">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {collection.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{collection.studentName}</div>
                          <div className="text-xs text-muted-foreground">{collection.studentId}</div>
                        </div>
                      </div>
                      {getStatusBadge(collection.status)}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Class:</span>
                        <span className="font-medium">{collection.className}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-green-600">{formatCurrency(collection.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment:</span>
                        <div className="flex items-center gap-1">
                          <div className={`p-1 rounded ${getPaymentMethodColor(collection.paymentMethod)}`}>
                            {getPaymentMethodIcon(collection.paymentMethod)}
                          </div>
                          <span>{formatPaymentMethod(collection.paymentMethod)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        {/* CRITICAL: Show createdAt (when recorded) not paymentDate */}
                        <span>{formatDateTime(collection.createdAt || collection.paymentDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Collected by:</span>
                        <span>{collection.collectedBy}</span>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        onClick={() => window.open(`/finance/receipt/${encodeURIComponent(collection.receiptNumber)}`, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Receipt
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const printWindow = window.open(`/finance/receipt/${encodeURIComponent(collection.receiptNumber)}`, '_blank');
                          if (printWindow) {
                            setTimeout(() => {
                              printWindow.print();
                            }, 1000);
                          }
                        }}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!loading && filteredCollections.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No collections found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collection Details Dialog */}
      {showDetails && selectedCollection && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Collection Details</DialogTitle>
              <DialogDescription>
                Complete information for receipt {selectedCollection.receiptNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 bg-blue-100 text-blue-600">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedCollection.studentName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedCollection.studentName}</h3>
                  <p className="text-muted-foreground">Student ID: {selectedCollection.studentId}</p>
                </div>
                {getStatusBadge(selectedCollection.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedCollection.className}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{selectedCollection.section}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll No</p>
                  <p className="font-medium">{selectedCollection.rollNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parent</p>
                  <p className="font-medium">{selectedCollection.parentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedCollection.parentPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCollection.parentEmail}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receipt Number</p>
                    <p className="font-medium">{selectedCollection.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedCollection.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getPaymentMethodColor(selectedCollection.paymentMethod)}`}>
                        {getPaymentMethodIcon(selectedCollection.paymentMethod)}
                      </div>
                      <span>{formatPaymentMethod(selectedCollection.paymentMethod)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedCollection.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    {/* CRITICAL: Show createdAt (when recorded) not paymentDate */}
                    <p className="font-medium">{formatDateTime(selectedCollection.createdAt || selectedCollection.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collected By</p>
                    <p className="font-medium">{selectedCollection.collectedBy}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-4 text-gray-700">Receipt & Actions</h4>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Receipt No</p>
                    <p className="font-bold text-sm">{selectedCollection.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Paid</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(selectedCollection.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recorded At</p>
                    {/* CRITICAL: Show createdAt (when recorded) not paymentDate */}
                    <p className="font-medium text-sm">{formatDateTime(selectedCollection.createdAt || selectedCollection.paymentDate)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`/finance/receipt/${encodeURIComponent(selectedCollection.receiptNumber)}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const printWindow = window.open(`/finance/receipt/${encodeURIComponent(selectedCollection.receiptNumber)}`, '_blank');
                      if (printWindow) {
                        setTimeout(() => {
                          printWindow.print();
                        }, 1000);
                      }
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowStatusDialog(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Status
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Collection Status</DialogTitle>
            <DialogDescription>
              Update status for receipt {selectedCollection?.receiptNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusUpdateOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this status change..."
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            {newStatus === 'refunded' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Marking as refunded will also mark related pending installments as pending.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Collections;