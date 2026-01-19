// src/pages/finance/FeeDefaulters.tsx - UPDATED VERSION
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner'; // Using sonner for notifications
import {
  Search,
  Mail,
  AlertCircle,
  Download,
  Phone,
  RefreshCw,
  Send,
  Filter,
  Bell,
  DollarSign,
  TrendingDown,
  CalendarDays,
  Users,
  MoreVertical,
  Clock,
  Eye,
  FileText,
  ShieldAlert,
  Target,
  BarChart3,
  CheckCircle,
  MailWarning,
  PhoneCall,
  MailOpen,
  MessageSquare,
  History,
  Settings,
  ArrowUpRight,
  Loader2,
  X,
  Check,
  ExternalLink,
  CreditCard
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
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Import the service
import { 
  feeDefaultersService, 
  type Defaulter, 
  type PaginatedResponse,
  type StatisticsResponse 
} from '@/Services/feeDefaultersService';

const FeeDefaulters = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [daysOverdueFilter, setDaysOverdueFilter] = useState('All');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Data states
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalDefaulters: 0,
    avgDaysOverdue: 0,
    criticalCount: 0,
    highCount: 0,
    moderateCount: 0,
    recoveryRate: 78,
  });
  const [overdueDistribution, setOverdueDistribution] = useState<
    Array<{ range: string; count: number; amount: number }>
  >([]);
  const [classWiseDistribution, setClassWiseDistribution] = useState<
    Array<{ _id: string; count: number; totalAmount: number }>
  >([]);
  const [statistics, setStatistics] = useState<StatisticsResponse['statistics'] | null>(null);
  
  // UI states
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('Dear parent, kindly clear the outstanding fee amount at the earliest to avoid any inconvenience.');
  const [selectedDefaulter, setSelectedDefaulter] = useState<Defaulter | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Load defaulters data
  const loadDefaulters = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: searchTerm || undefined,
        className: selectedClass !== 'All Classes' ? selectedClass : undefined,
        status: selectedStatus !== 'All Status' ? selectedStatus : undefined,
        priority: selectedPriority !== 'All Priorities' ? selectedPriority.split(' ')[0] : undefined,
        daysOverdue: daysOverdueFilter !== 'All' ? daysOverdueFilter : undefined,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined,
        sortBy: 'daysOverdue',
        sortOrder: 'desc'
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await feeDefaultersService.getFeeDefaulters(params);
      
      setDefaulters(response.defaulters);
      setSummary(response.summary);
      setTotalPages(response.pagination.pages);
      
      // Set distribution data
      if (response.distributions) {
        setOverdueDistribution(response.distributions.overdueDistribution);
        // Map API shape { class, count, amount } to local shape { _id, count, totalAmount }
        setClassWiseDistribution(
          (response.distributions.classWiseDistribution || []).map((c: any) => ({
            _id: c.class ?? c._id ?? 'Unknown',
            count: c.count ?? 0,
            totalAmount: c.amount ?? c.totalAmount ?? 0,
          }))
        );
      }

      toast.success(`Loaded ${response.defaulters.length} defaulters`);
    } catch (error: any) {
      console.error('Error loading defaulters:', error);
      toast.error(error.response?.data?.message || 'Failed to load defaulters');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await feeDefaultersService.getStatistics();
      setStatistics(response.statistics);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
      // Don't show error toast for statistics, as it's not critical
    }
  };

  // Initial load
  useEffect(() => {
    loadDefaulters();
    loadStatistics();
  }, [page]);

  // Load when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadDefaulters();
      } else {
        setPage(1);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, selectedClass, selectedStatus, selectedPriority, daysOverdueFilter, minAmount, maxAmount]);

  // Load defaulter details
  const loadDefaulterDetails = async (admissionNumber: string) => {
    try {
      const response = await feeDefaultersService.getDefaulterDetails(admissionNumber);
      setSelectedDefaulter(response.defaulter);
      setShowDetailsDialog(true);
    } catch (error: any) {
      console.error('Error loading defaulter details:', error);
      toast.error(error.response?.data?.message || 'Failed to load details');
    }
  };

  // Send reminders
  const handleSendReminders = async () => {
    if (selectedDefaulters.length === 0) {
      toast.error('Please select at least one defaulter');
      return;
    }

    setReminderLoading(true);
    try {
      await feeDefaultersService.sendReminders({
        defaulters: selectedDefaulters,
        message: reminderMessage,
        method: 'sms'
      });
      
      toast.success(`Reminders sent to ${selectedDefaulters.length} parents`);
      setShowReminderDialog(false);
      setSelectedDefaulters([]);
      
      // Refresh data
      loadDefaulters();
    } catch (error: any) {
      console.error('Error sending reminders:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminders');
    } finally {
      setReminderLoading(false);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params: any = {
        search: searchTerm || undefined,
        className: selectedClass !== 'All Classes' ? selectedClass : undefined,
        status: selectedStatus !== 'All Status' ? selectedStatus : undefined,
        priority: selectedPriority !== 'All Priorities' ? selectedPriority.split(' ')[0] : undefined,
        daysOverdue: daysOverdueFilter !== 'All' ? daysOverdueFilter : undefined,
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const blob = await feeDefaultersService.exportFeeDefaulters(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error(error.response?.data?.message || 'Failed to export');
    } finally {
      setExportLoading(false);
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async () => {
    if (!selectedDefaulter) return;
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await feeDefaultersService.markAsPaid(
        selectedDefaulter.admissionNumber,
        parseFloat(paymentAmount),
        paymentMethod,
        paymentNotes
      );
      
      toast.success(`Payment of ₹${paymentAmount} recorded for ${selectedDefaulter.studentName}`);
      setShowMarkPaidDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Refresh data
      loadDefaulters();
      if (showDetailsDialog) {
        loadDefaulterDetails(selectedDefaulter.admissionNumber);
      }
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case 'High':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            High
          </Badge>
        );
      case 'Moderate':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
            <Clock className="h-3 w-3 mr-1" />
            Moderate
          </Badge>
        );
      case 'Low':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            <Bell className="h-3 w-3 mr-1" />
            Low
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50 border-red-200';
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 3: return 'text-amber-600 bg-amber-50 border-amber-200';
      case 4: return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const toggleSelectDefaulter = (admissionNumber: string) => {
    setSelectedDefaulters(prev =>
      prev.includes(admissionNumber) 
        ? prev.filter(item => item !== admissionNumber) 
        : [...prev, admissionNumber]
    );
  };

  const selectAllDefaulters = () => {
    if (selectedDefaulters.length === defaulters.length) {
      setSelectedDefaulters([]);
    } else {
      setSelectedDefaulters(defaulters.map(d => d.admissionNumber));
    }
  };

  // Prepare chart data
  const chartData = overdueDistribution.length > 0 
    ? overdueDistribution 
    : [
        { range: '0-15 days', count: 0, amount: 0 },
        { range: '16-30 days', count: 0, amount: 0 },
        { range: '31-45 days', count: 0, amount: 0 },
        { range: '45+ days', count: 0, amount: 0 },
      ];

  const classChartData = classWiseDistribution.length > 0
    ? classWiseDistribution
    : [];

  // Filter options
  const classOptions = ['All Classes', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const statusOptions = ['All Status', 'Critical', 'High', 'Moderate', 'Low'];
  const priorityOptions = ['All Priorities', 'Critical (1)', 'High (2)', 'Moderate (3)', 'Low (4)'];
  const daysOptions = ['All', '0-15 days', '16-30 days', '31-45 days', '45+ days'];
  const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'online', 'card'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Fee Defaulters
          </h1>
          <p className="text-muted-foreground mt-1">
            Track, manage, and recover overdue fee payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadDefaulters}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => setShowReminderDialog(true)}
            disabled={selectedDefaulters.length === 0 || reminderLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {reminderLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MailWarning className="h-4 w-4 mr-2" />
            )}
            Send Reminders ({selectedDefaulters.length})
          </Button>
          
          <Button 
            variant="default" 
            onClick={handleExport}
            disabled={exportLoading || defaulters.length === 0}
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Overdue</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalAmount)}</p>
                <p className="text-xs text-red-600 mt-1">Across {summary.totalDefaulters} students</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-600">Real-time data from database</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Critical Cases</p>
                <p className="text-2xl font-bold text-orange-900">{summary.criticalCount}</p>
                <p className="text-xs text-orange-600 mt-1">Immediate action needed</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShieldAlert className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress 
              value={summary.totalDefaulters > 0 ? (summary.criticalCount / summary.totalDefaulters) * 100 : 0} 
              className="h-2 mt-4 bg-orange-200" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Avg. Days Overdue</p>
                <p className="text-2xl font-bold text-amber-900">{Math.round(summary.avgDaysOverdue)} days</p>
                <p className="text-xs text-amber-600 mt-1">Across all defaulters</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Recovery Rate</p>
                <p className="text-2xl font-bold text-blue-900">{summary.recoveryRate}%</p>
                <p className="text-xs text-blue-600 mt-1">Successful collections</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600">Based on historical data</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overdue Amount Distribution
            </CardTitle>
            <CardDescription>Amount overdue by days range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Amount Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" name="Student Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class-wise Defaulters
            </CardTitle>
            <CardDescription>Distribution across classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {classChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Student Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalAmount" name="Amount Overdue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No class-wise data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Defaulters</CardTitle>
          <CardDescription>
            {defaulters.length} accounts with overdue payments • Total: {formatCurrency(defaulters.reduce((sum, d) => sum + d.totalDue, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or parent..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Class" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={daysOverdueFilter} onValueChange={setDaysOverdueFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Days Overdue" />
              </SelectTrigger>
              <SelectContent>
                {daysOptions.map((days) => (
                  <SelectItem key={days} value={days}>{days}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="min-amount">Minimum Amount</Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="₹0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max-amount">Maximum Amount</Label>
              <Input
                id="max-amount"
                type="number"
                placeholder="₹100000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaulters Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Loading defaulters...</p>
            </div>
          ) : defaulters.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No defaulters found!</h3>
              <p className="text-muted-foreground">All payments are up to date or no students match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDefaulters.length === defaulters.length && defaulters.length > 0}
                        onCheckedChange={selectAllDefaulters}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent Contact</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((defaulter) => (
                    <TableRow key={defaulter.admissionNumber} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedDefaulters.includes(defaulter.admissionNumber)}
                          onCheckedChange={() => toggleSelectDefaulter(defaulter.admissionNumber)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {defaulter.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{defaulter.studentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {defaulter.admissionNumber} • Roll: {defaulter.rollNo || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{defaulter.className}{defaulter.section ? `-${defaulter.section}` : ''}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{defaulter.parentName}</div>
                          <div className="text-sm text-muted-foreground">{defaulter.parentPhone}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {defaulter.parentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-red-600">{formatCurrency(defaulter.totalDue)}</div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatCurrency(defaulter.totalFee)} • Paid: {formatCurrency(defaulter.totalPaid)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={defaulter.daysOverdue > 30 ? "destructive" : "secondary"}>
                            {defaulter.daysOverdue} days
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {defaulter.remindersSent} reminders
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(defaulter.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {defaulter.lastContact || 'No contact yet'}
                        </div>
                        {defaulter.lastPaymentDate && (
                          <div className="text-xs text-muted-foreground">
                            Last payment: {new Date(defaulter.lastPaymentDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadDefaulterDetails(defaulter.admissionNumber)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`tel:${defaulter.parentPhone}`)}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => loadDefaulterDetails(defaulter.admissionNumber)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`tel:${defaulter.parentPhone}`)}>
                                <PhoneCall className="h-4 w-4 mr-2" />
                                Call Parent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedDefaulter(defaulter);
                                setShowMarkPaidDialog(true);
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(`Dear parent, your ward ${defaulter.studentName} has an outstanding fee of ${formatCurrency(defaulter.totalDue)}. Kindly clear it at the earliest.`);
                                toast.success('Reminder message copied to clipboard');
                              }}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Copy Reminder Text
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
          )}
          
          {/* Pagination */}
          {!loading && defaulters.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, summary.totalDefaulters)} of {summary.totalDefaulters} defaulters
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Reminders</DialogTitle>
            <DialogDescription>
              Send payment reminders to {selectedDefaulters.length} selected parents
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reminder-method">Reminder Method</Label>
              <Select defaultValue="sms">
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reminder-message">Message</Label>
              <Textarea
                id="reminder-message"
                rows={4}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter reminder message..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                This message will be sent to all selected parents
              </p>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This will send real reminders to parents. Make sure the message is appropriate.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendReminders}
              disabled={reminderLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {reminderLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminders
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Defaulter Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Defaulter Details</DialogTitle>
            <DialogDescription>
              Complete information and payment history
            </DialogDescription>
          </DialogHeader>
          
          {selectedDefaulter && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 bg-blue-100 text-blue-600">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedDefaulter.studentName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedDefaulter.studentName}</h3>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Admission No.</p>
                      <p className="font-medium">{selectedDefaulter.admissionNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <Badge variant="outline">{selectedDefaulter.className}{selectedDefaulter.section ? `-${selectedDefaulter.section}` : ''}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Roll No.</p>
                      <p className="font-medium">{selectedDefaulter.rollNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedDefaulter.status)}
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Fee</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedDefaulter.totalFee)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedDefaulter.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Due</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedDefaulter.totalDue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Days Overdue</p>
                    <p className="text-xl font-bold text-amber-600">{selectedDefaulter.daysOverdue} days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Parent Information */}
              <div>
                <h4 className="font-medium mb-3">Parent Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{selectedDefaulter.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{selectedDefaulter.parentPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-medium">{selectedDefaulter.parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Contact</p>
                    <p className="font-medium">{selectedDefaulter.lastContact || 'No contact yet'}</p>
                  </div>
                </div>
              </div>

              {/* Due Installments */}
              {selectedDefaulter.dueInstallments && selectedDefaulter.dueInstallments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Due Installments</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Paid Amount</TableHead>
                          <TableHead>Due Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDefaulter.dueInstallments.map((installment, index) => (
                          <TableRow key={index}>
                            <TableCell>{installment.componentName}</TableCell>
                            <TableCell>{formatCurrency(installment.amount)}</TableCell>
                            <TableCell>{formatCurrency(installment.paidAmount)}</TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {formatCurrency(installment.dueAmount)}
                            </TableCell>
                            <TableCell>
                              {new Date(installment.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={installment.status === 'completed' ? 'default' : 'secondary'}>
                                {installment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Recent Payments */}
              {selectedDefaulter.recentPayments && selectedDefaulter.recentPayments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recent Payments</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt No.</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDefaulter.recentPayments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{payment.receiptNumber}</TableCell>
                            <TableCell>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.paymentMethod}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedDefaulter.parentPhone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Parent
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(`Dear parent, your ward ${selectedDefaulter.studentName} has an outstanding fee of ${formatCurrency(selectedDefaulter.totalDue)}. Kindly clear it at the earliest.`);
                    toast.success('Reminder message copied to clipboard');
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Copy Reminder
                </Button>
                <Button 
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowMarkPaidDialog(true);
                    setShowDetailsDialog(false);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for {selectedDefaulter?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Total Due: <span className="font-bold">{formatCurrency(selectedDefaulter?.totalDue || 0)}</span>
              </p>
            </div>
            
            <div>
              <Label htmlFor="payment-amount">Amount Received *</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-notes">Notes (Optional)</Label>
              <Textarea
                id="payment-notes"
                rows={3}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeDefaulters;