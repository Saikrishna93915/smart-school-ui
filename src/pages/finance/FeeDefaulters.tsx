// src/pages/finance/FeeDefaulters.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Mail,
  AlertCircle,
  Download,
  Phone,
  User,
  RefreshCw,
  Send,
  Filter,
  Bell,
  DollarSign,
  TrendingDown,
  CalendarDays,
  Users,
  MessageSquare,
  MoreVertical,
  Clock,
  Eye,
  FileText,
  ShieldAlert,
  Target,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  MailWarning,
  PhoneCall,
  MailOpen,
  History,
  Settings,
  Zap,
  ArrowUpRight,
  ChevronRight,
  MessageCircle
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
  ResponsiveContainer
} from 'recharts';

// Mock data
const MOCK_DEFAULTERS = [
  {
    id: 1,
    studentId: 'STU2024001',
    studentName: 'Priya Patel',
    className: '10-A',
    rollNo: '25',
    parentName: 'Rakesh Patel',
    parentPhone: '+91 98765 43210',
    parentEmail: 'rakesh.patel@email.com',
    amount: 15000,
    dueDate: '2024-11-15',
    daysOverdue: 25,
    status: 'Critical',
    remindersSent: 2,
    lastContact: '2024-11-20',
    notes: 'Father traveling, will pay next week',
    avatarColor: 'bg-pink-100 text-pink-600',
    priority: 1
  },
  {
    id: 2,
    studentId: 'STU2024002',
    studentName: 'Amit Kumar',
    className: '10-B',
    rollNo: '12',
    parentName: 'Suresh Kumar',
    parentPhone: '+91 98765 43211',
    parentEmail: 'suresh.kumar@email.com',
    amount: 22500,
    dueDate: '2024-10-30',
    daysOverdue: 40,
    status: 'Critical',
    remindersSent: 3,
    lastContact: '2024-11-25',
    notes: 'Multiple reminders sent, needs follow-up call',
    avatarColor: 'bg-blue-100 text-blue-600',
    priority: 1
  },
  {
    id: 3,
    studentId: 'STU2024003',
    studentName: 'Karan Malhotra',
    className: '10-B',
    rollNo: '18',
    parentName: 'Sunil Malhotra',
    parentPhone: '+91 98765 43212',
    parentEmail: 'sunil.malhotra@email.com',
    amount: 8500,
    dueDate: '2024-11-20',
    daysOverdue: 20,
    status: 'High',
    remindersSent: 1,
    lastContact: '2024-11-22',
    notes: 'Partial payment promised this week',
    avatarColor: 'bg-green-100 text-green-600',
    priority: 2
  },
  {
    id: 4,
    studentId: 'STU2024004',
    studentName: 'Meera Nair',
    className: '9-A',
    rollNo: '15',
    parentName: 'Krishna Nair',
    parentPhone: '+91 98765 43213',
    parentEmail: 'krishna.nair@email.com',
    amount: 12000,
    dueDate: '2024-11-25',
    daysOverdue: 15,
    status: 'High',
    remindersSent: 0,
    lastContact: 'None',
    notes: 'New admission, may need payment plan',
    avatarColor: 'bg-purple-100 text-purple-600',
    priority: 2
  },
  {
    id: 5,
    studentId: 'STU2024005',
    studentName: 'Rahul Sharma',
    className: '11-A',
    rollNo: '08',
    parentName: 'Vikram Sharma',
    parentPhone: '+91 98765 43214',
    parentEmail: 'vikram.sharma@email.com',
    amount: 18000,
    dueDate: '2024-11-28',
    daysOverdue: 12,
    status: 'Moderate',
    remindersSent: 1,
    lastContact: '2024-11-29',
    notes: 'Payment scheduled for next week',
    avatarColor: 'bg-amber-100 text-amber-600',
    priority: 3
  },
  {
    id: 6,
    studentId: 'STU2024006',
    studentName: 'Sneha Reddy',
    className: '12-A',
    rollNo: '03',
    parentName: 'Vikram Reddy',
    parentPhone: '+91 98765 43215',
    parentEmail: 'vikram.reddy@email.com',
    amount: 28000,
    dueDate: '2024-12-01',
    daysOverdue: 9,
    status: 'Moderate',
    remindersSent: 0,
    lastContact: 'None',
    notes: 'Final year student, awaiting scholarship',
    avatarColor: 'bg-red-100 text-red-600',
    priority: 3
  },
];

// Chart data
const overdueDistributionData = [
  { range: '0-15 days', count: 8, amount: 85000 },
  { range: '16-30 days', count: 12, amount: 185000 },
  { range: '31-45 days', count: 5, amount: 125000 },
  { range: '45+ days', count: 3, amount: 95000 },
];

const classWiseData = [
  { class: '10-A', count: 8, amount: 120000 },
  { class: '10-B', count: 12, amount: 185000 },
  { class: '11-A', count: 6, amount: 95000 },
  { class: '11-B', count: 4, amount: 65000 },
  { class: '12-A', count: 3, amount: 85000 },
];

const FeeDefaulters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [daysOverdueFilter, setDaysOverdueFilter] = useState('All');
  const [selectedDefaulters, setSelectedDefaulters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('Kindly clear the outstanding fee amount at the earliest to avoid any inconvenience.');
  const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const defaulters = MOCK_DEFAULTERS;
  
  // Stats
  const totalDefaulters = defaulters.length;
  const totalAmount = defaulters.reduce((sum, defaulter) => sum + defaulter.amount, 0);
  const criticalCount = defaulters.filter(d => d.status === 'Critical').length;
  const highCount = defaulters.filter(d => d.status === 'High').length;
  const moderateCount = defaulters.filter(d => d.status === 'Moderate').length;
  const avgDaysOverdue = defaulters.reduce((sum, d) => sum + d.daysOverdue, 0) / totalDefaulters;
  
  const classOptions = ['All Classes', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const statusOptions = ['All Status', 'Critical', 'High', 'Moderate', 'Low'];
  const priorityOptions = ['All Priorities', 'Critical (1)', 'High (2)', 'Moderate (3)', 'Low (4)'];
  const daysOptions = ['All', '0-15 days', '16-30 days', '31-45 days', '45+ days'];

  // Filter defaulters
  useEffect(() => {
    let result = defaulters;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(defaulter =>
        defaulter.studentName.toLowerCase().includes(searchLower) ||
        defaulter.parentName.toLowerCase().includes(searchLower) ||
        defaulter.studentId.toLowerCase().includes(searchLower) ||
        defaulter.parentPhone.toLowerCase().includes(searchLower) ||
        defaulter.className.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedClass !== 'All Classes') {
      result = result.filter(defaulter => defaulter.className === selectedClass);
    }
    
    if (selectedStatus !== 'All Status') {
      result = result.filter(defaulter => defaulter.status === selectedStatus);
    }
    
    if (selectedPriority !== 'All Priorities') {
      const priorityNum = parseInt(selectedPriority.split('(')[1]);
      result = result.filter(defaulter => defaulter.priority === priorityNum);
    }
    
    if (daysOverdueFilter !== 'All') {
      const [min, max] = daysOverdueFilter.split(' ')[0].split('-');
      result = result.filter(defaulter => {
        const days = defaulter.daysOverdue;
        if (daysOverdueFilter === '45+ days') return days >= 45;
        return days >= parseInt(min) && days <= parseInt(max);
      });
    }
    
    setFilteredDefaulters(result);
    // Reset selection when filters change
    setSelectedDefaulters([]);
  }, [defaulters, searchTerm, selectedClass, selectedStatus, selectedPriority, daysOverdueFilter]);

  const [filteredDefaulters, setFilteredDefaulters] = useState(defaulters);
  
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  const handleSendReminder = (defaulter: any) => {
    alert(`Reminder sent to ${defaulter.parentName} (${defaulter.parentPhone})\n\nMessage: ${reminderMessage}`);
  };
  
  const handleBulkReminders = () => {
    if (selectedDefaulters.length === 0) {
      alert('Please select students to send reminders');
      return;
    }
    
    const confirmSend = window.confirm(
      `Send payment reminders to ${selectedDefaulters.length} selected parents?`
    );
    
    if (confirmSend) {
      alert(`Reminders sent successfully to ${selectedDefaulters.length} parents`);
    }
  };
  
  const handleExport = () => {
    const csvContent = [
      ['Student ID', 'Student Name', 'Class', 'Roll No', 'Parent Name', 'Parent Phone', 'Amount Due', 'Due Date', 'Days Overdue', 'Status', 'Priority', 'Last Contact', 'Reminders Sent'],
      ...filteredDefaulters.map(d => [
        d.studentId,
        d.studentName,
        d.className,
        d.rollNo,
        d.parentName,
        d.parentPhone,
        `₹${d.amount.toLocaleString('en-IN')}`,
        d.dueDate,
        d.daysOverdue,
        d.status,
        d.priority,
        d.lastContact,
        d.remindersSent
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case 'High':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            High
          </Badge>
        );
      case 'Moderate':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Moderate
          </Badge>
        );
      case 'Low':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
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
  
  const toggleSelectDefaulter = (id: number) => {
    setSelectedDefaulters(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const selectAllDefaulters = () => {
    if (selectedDefaulters.length === filteredDefaulters.length) {
      setSelectedDefaulters([]);
    } else {
      setSelectedDefaulters(filteredDefaulters.map(d => d.id));
    }
  };
  
  const handleCallParent = (phone: string, name: string) => {
    alert(`Calling ${name} at ${phone}...`);
  };
  
  const handleViewDetails = (defaulter: any) => {
    setSelectedDefaulter(defaulter);
    setShowDetails(true);
  };

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
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={handleBulkReminders}
            disabled={selectedDefaulters.length === 0}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <MailWarning className="h-4 w-4 mr-2" />
            Send Reminders ({selectedDefaulters.length})
          </Button>
          
          <Button variant="default" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
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
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-red-600 mt-1">Across {totalDefaulters} students</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-600">15% increase from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Critical Cases</p>
                <p className="text-2xl font-bold text-orange-900">{criticalCount}</p>
                <p className="text-xs text-orange-600 mt-1">Immediate action needed</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShieldAlert className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={(criticalCount / totalDefaulters) * 100} className="h-2 mt-4 bg-orange-200" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Avg. Days Overdue</p>
                <p className="text-2xl font-bold text-amber-900">{avgDaysOverdue.toFixed(0)} days</p>
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
                <p className="text-2xl font-bold text-blue-900">78%</p>
                <p className="text-xs text-blue-600 mt-1">Successful collections</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600">5% improvement</p>
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
                <BarChart data={overdueDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classWiseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="class" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Student Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="amount" name="Amount (₹ Lakhs)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Fee Defaulters Management</CardTitle>
              <CardDescription>
                {filteredDefaulters.length} accounts with overdue payments • Total: {formatCurrency(filteredDefaulters.reduce((sum, d) => sum + d.amount, 0))}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                >
                  Card View
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReminderSettings(!showReminderSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Reminder Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search defaulters..."
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

          {/* Reminder Settings */}
          {showReminderSettings && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MailOpen className="h-4 w-4" />
                    Reminder Configuration
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReminderSettings(false)}
                  >
                    Hide
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reminder-message" className="text-sm mb-2 block">Reminder Message</Label>
                    <textarea
                      id="reminder-message"
                      className="w-full p-3 border rounded-lg text-sm"
                      rows={3}
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      SMS
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Actions */}
          {selectedDefaulters.length > 0 && (
            <Card className="border-primary">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedDefaulters.length === filteredDefaulters.length}
                        onCheckedChange={selectAllDefaulters}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium">
                        {selectedDefaulters.length} students selected
                      </Label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total due: {formatCurrency(filteredDefaulters.filter(d => selectedDefaulters.includes(d.id)).reduce((sum, d) => sum + d.amount, 0))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Bulk SMS
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Bulk Email
                    </Button>
                    <Button size="sm" variant="default">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Schedule Calls
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Defaulters List */}
      <Card>
        <CardContent className="p-0">
          {filteredDefaulters.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No defaulters found!</h3>
              <p className="text-muted-foreground">All payments are up to date</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDefaulters.length === filteredDefaulters.length}
                        onCheckedChange={selectAllDefaulters}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent Contact</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDefaulters.map((defaulter) => (
                    <TableRow key={defaulter.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedDefaulters.includes(defaulter.id)}
                          onCheckedChange={() => toggleSelectDefaulter(defaulter.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-8 w-8 ${defaulter.avatarColor}`}>
                            <AvatarFallback className={defaulter.avatarColor.split(' ')[1]}>
                              {defaulter.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{defaulter.studentName}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {defaulter.studentId} • Roll: {defaulter.rollNo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{defaulter.className}</Badge>
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
                        <div className="font-bold text-red-600">{formatCurrency(defaulter.amount)}</div>
                        <div className="text-xs text-muted-foreground">Priority: 
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${getPriorityColor(defaulter.priority)}`}>
                            {defaulter.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{defaulter.dueDate}</div>
                        <div className="text-xs text-muted-foreground">
                          Last contact: {defaulter.lastContact}
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(defaulter)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Remind
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCallParent(defaulter.parentPhone, defaulter.parentName)}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleViewDetails(defaulter)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Custom Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="h-4 w-4 mr-2" />
                                View Payment History
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Payment Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Escalate to Management
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredDefaulters.map((defaulter) => (
                <Card key={defaulter.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 ${defaulter.avatarColor}`}>
                          <AvatarFallback className={defaulter.avatarColor.split(' ')[1]}>
                            {defaulter.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{defaulter.studentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {defaulter.className} • Roll: {defaulter.rollNo}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(defaulter.status)}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parent:</span>
                        <span className="font-medium">{defaulter.parentName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{defaulter.parentPhone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Due:</span>
                        <span className="font-bold text-red-600">{formatCurrency(defaulter.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overdue:</span>
                        <span className="font-medium">{defaulter.daysOverdue} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reminders:</span>
                        <span className="font-medium">{defaulter.remindersSent} sent</span>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendReminder(defaulter)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Remind
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCallParent(defaulter.parentPhone, defaulter.parentName)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(defaulter)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defaulter Details Modal */}
      {showDetails && selectedDefaulter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Defaulter Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-16 w-16 ${selectedDefaulter.avatarColor}`}>
                    <AvatarFallback className={selectedDefaulter.avatarColor.split(' ')[1]}>
                      {selectedDefaulter.studentName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedDefaulter.studentName}</h3>
                    <p className="text-muted-foreground">ID: {selectedDefaulter.studentId} • Class: {selectedDefaulter.className}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{selectedDefaulter.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedDefaulter.parentPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDefaulter.parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Roll No</p>
                    <p className="font-medium">{selectedDefaulter.rollNo}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Overdue Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Due</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedDefaulter.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{selectedDefaulter.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Overdue</p>
                      <p className="font-medium">{selectedDefaulter.daysOverdue} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedDefaulter.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <Badge className={getPriorityColor(selectedDefaulter.priority)}>
                        Priority {selectedDefaulter.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reminders Sent</p>
                      <p className="font-medium">{selectedDefaulter.remindersSent}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Communication History</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Last Contact</span>
                        <span className="text-muted-foreground">{selectedDefaulter.lastContact}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedDefaulter.notes}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleSendReminder(selectedDefaulter)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Payment Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <History className="h-4 w-4 mr-2" />
                    View History
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

export default FeeDefaulters;