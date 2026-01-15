// src/pages/finance/Collections.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail,
  FileText,
  Printer,
  Share2,
  MoreVertical
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

// Mock data with more details
const MOCK_COLLECTIONS = [
  {
    id: 1,
    studentId: 'STU2024001',
    studentName: 'Priya Patel',
    className: '10-A',
    rollNo: '25',
    amount: 15000,
    paymentMethod: 'UPI',
    status: 'completed',
    date: '2024-11-10',
    receiptNo: 'REC001',
    collectedBy: 'Mr. Sharma',
    notes: 'Full fee payment',
    parentName: 'Rakesh Patel',
    parentPhone: '+91 98765 43210',
    parentEmail: 'rakesh.patel@email.com',
    avatarColor: 'bg-pink-100 text-pink-600'
  },
  {
    id: 2,
    studentId: 'STU2024002',
    studentName: 'Amit Kumar',
    className: '10-B',
    rollNo: '12',
    amount: 22500,
    paymentMethod: 'Cash',
    status: 'completed',
    date: '2024-11-09',
    receiptNo: 'REC002',
    collectedBy: 'Ms. Gupta',
    notes: 'Includes transport fee',
    parentName: 'Suresh Kumar',
    parentPhone: '+91 98765 43211',
    parentEmail: 'suresh.kumar@email.com',
    avatarColor: 'bg-blue-100 text-blue-600'
  },
  {
    id: 3,
    studentId: 'STU2024003',
    studentName: 'Rahul Sharma',
    className: '11-A',
    rollNo: '08',
    amount: 18000,
    paymentMethod: 'Card',
    status: 'pending',
    date: '2024-11-09',
    receiptNo: 'REC003',
    collectedBy: 'Mr. Sharma',
    notes: 'Installment payment',
    parentName: 'Sunil Sharma',
    parentPhone: '+91 98765 43212',
    parentEmail: 'sunil.sharma@email.com',
    avatarColor: 'bg-green-100 text-green-600'
  },
  {
    id: 4,
    studentId: 'STU2024004',
    studentName: 'Meera Nair',
    className: '9-A',
    rollNo: '15',
    amount: 12000,
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    date: '2024-11-08',
    receiptNo: 'REC004',
    collectedBy: 'Ms. Gupta',
    notes: 'Tuition fee only',
    parentName: 'Rajesh Nair',
    parentPhone: '+91 98765 43213',
    parentEmail: 'rajesh.nair@email.com',
    avatarColor: 'bg-purple-100 text-purple-600'
  },
  {
    id: 5,
    studentId: 'STU2024005',
    studentName: 'Karan Malhotra',
    className: '10-B',
    rollNo: '18',
    amount: 8500,
    paymentMethod: 'Cheque',
    status: 'failed',
    date: '2024-11-08',
    receiptNo: 'REC005',
    collectedBy: 'Mr. Sharma',
    notes: 'Cheque bounced',
    parentName: 'Sunil Malhotra',
    parentPhone: '+91 98765 43214',
    parentEmail: 'sunil.malhotra@email.com',
    avatarColor: 'bg-amber-100 text-amber-600'
  },
  {
    id: 6,
    studentId: 'STU2024006',
    studentName: 'Sneha Reddy',
    className: '12-A',
    rollNo: '03',
    amount: 28000,
    paymentMethod: 'UPI',
    status: 'completed',
    date: '2024-11-07',
    receiptNo: 'REC006',
    collectedBy: 'Ms. Gupta',
    notes: 'Final year fee',
    parentName: 'Vikram Reddy',
    parentPhone: '+91 98765 43215',
    parentEmail: 'vikram.reddy@email.com',
    avatarColor: 'bg-red-100 text-red-600'
  },
];

// Chart data
const monthlyData = [
  { month: 'Aug', amount: 185000, transactions: 42 },
  { month: 'Sep', amount: 210000, transactions: 48 },
  { month: 'Oct', amount: 195000, transactions: 45 },
  { month: 'Nov', amount: 235000, transactions: 52 },
];

const paymentMethodData = [
  { name: 'UPI', value: 45, color: '#3b82f6' },
  { name: 'Cash', value: 25, color: '#10b981' },
  { name: 'Card', value: 15, color: '#8b5cf6' },
  { name: 'Bank Transfer', value: 10, color: '#f59e0b' },
  { name: 'Cheque', value: 5, color: '#ef4444' },
];

const Collections = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedView, setSelectedView] = useState<'table' | 'card'>('table');
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const collections = MOCK_COLLECTIONS;

  // Calculate statistics
  const totalAmount = collections.reduce((sum, item) => sum + item.amount, 0);
  const completedCollections = collections.filter(item => item.status === 'completed');
  const pendingCollections = collections.filter(item => item.status === 'pending');
  
  const completedAmount = completedCollections.reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = pendingCollections.reduce((sum, item) => sum + item.amount, 0);
  const successRate = (completedCollections.length / collections.length) * 100;

  const classOptions = ['All Classes', '9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];
  const statusOptions = ['All Status', 'completed', 'pending', 'failed'];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // In a real app, this would generate a CSV or PDF
    alert('Exporting collection report...');
  };

  const handleViewDetails = (collection: any) => {
    setSelectedCollection(collection);
    setShowDetails(true);
  };

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
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return <Smartphone className="h-4 w-4" />;
      case 'Cash': return <DollarSign className="h-4 w-4" />;
      case 'Card': return <CreditCard className="h-4 w-4" />;
      case 'Bank Transfer': return <Building className="h-4 w-4" />;
      case 'Cheque': return <FileText className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'UPI': return 'bg-blue-100 text-blue-600';
      case 'Cash': return 'bg-green-100 text-green-600';
      case 'Card': return 'bg-purple-100 text-purple-600';
      case 'Bank Transfer': return 'bg-amber-100 text-amber-600';
      case 'Cheque': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = 
      searchTerm === '' ||
      collection.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'All Classes' || collection.className === selectedClass;
    const matchesStatus = selectedStatus === 'All Status' || collection.status === selectedStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
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
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-blue-600 mt-1">This month</p>
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
                <p className="text-2xl font-bold text-green-900">{completedCollections.length} payments</p>
                <p className="text-xs text-green-600 mt-1">{formatCurrency(completedAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={successRate} className="h-2 mt-4 bg-green-200" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{pendingCollections.length} payments</p>
                <p className="text-xs text-amber-600 mt-1">{formatCurrency(pendingAmount)}</p>
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
                <p className="text-2xl font-bold text-purple-900">{successRate.toFixed(1)}%</p>
                <p className="text-xs text-purple-600 mt-1">Higher than last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-2 rounded-full ${successRate > 90 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <p className="text-xs text-purple-600">
                {successRate > 90 ? 'Excellent' : 'Needs improvement'}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Collection Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="transactions" name="Transactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                    {classOptions.map((cls) => (
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
          {selectedView === 'table' ? (
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
                    <TableRow key={collection.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-8 w-8 ${collection.avatarColor}`}>
                            <AvatarFallback className={collection.avatarColor.split(' ')[1]}>
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
                          <span className="text-sm">{collection.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{collection.date}</div>
                        <div className="text-xs text-muted-foreground">{collection.collectedBy}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(collection)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Email Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Details
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
                <Card key={collection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 ${collection.avatarColor}`}>
                          <AvatarFallback className={collection.avatarColor.split(' ')[1]}>
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
                          <span>{collection.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{collection.date}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Collected by:</span>
                        <span>{collection.collectedBy}</span>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetails(collection)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-3 w-3 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {filteredCollections.length === 0 && (
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

      {/* Collection Details Modal */}
      {showDetails && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Collection Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-16 w-16 ${selectedCollection.avatarColor}`}>
                    <AvatarFallback className={selectedCollection.avatarColor.split(' ')[1]}>
                      {selectedCollection.studentName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCollection.studentName}</h3>
                    <p className="text-muted-foreground">Student ID: {selectedCollection.studentId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{selectedCollection.className}</p>
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
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Payment Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt Number</p>
                      <p className="font-medium">{selectedCollection.receiptNo}</p>
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
                        <span>{selectedCollection.paymentMethod}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedCollection.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{selectedCollection.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Collected By</p>
                      <p className="font-medium">{selectedCollection.collectedBy}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedCollection.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Collections;