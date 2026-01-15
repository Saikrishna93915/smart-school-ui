// src/pages/fees/History.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  Receipt,
  RefreshCw,
  CheckCircle
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

const PaymentHistoryStudent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All Methods');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  const paymentHistory = [
    {
      id: 1,
      receiptNo: 'REC202411001',
      date: '2024-11-10',
      description: 'Tuition Fee - Installment 2',
      amount: 15000,
      paymentMethod: 'UPI',
      transactionId: 'TXN20241110001',
      status: 'completed'
    },
    {
      id: 2,
      receiptNo: 'REC202410005',
      date: '2024-10-25',
      description: 'Transport Fee - October',
      amount: 3000,
      paymentMethod: 'Net Banking',
      transactionId: 'TXN20241025001',
      status: 'completed'
    },
    {
      id: 3,
      receiptNo: 'REC202410003',
      date: '2024-10-15',
      description: 'Annual Charges',
      amount: 25000,
      paymentMethod: 'Credit Card',
      transactionId: 'TXN20241015001',
      status: 'completed'
    },
    {
      id: 4,
      receiptNo: 'REC202409008',
      date: '2024-09-20',
      description: 'Tuition Fee - Installment 1',
      amount: 35000,
      paymentMethod: 'Debit Card',
      transactionId: 'TXN20240920001',
      status: 'completed'
    },
    {
      id: 5,
      receiptNo: 'REC202408012',
      date: '2024-08-05',
      description: 'Admission Fee',
      amount: 50000,
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN20240805001',
      status: 'completed'
    }
  ];

  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const transactionsCount = paymentHistory.length;
  const currentYearTotal = paymentHistory
    .filter(p => p.date.startsWith('2024'))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return '📱';
      case 'Credit Card': return '💳';
      case 'Debit Card': return '💳';
      case 'Net Banking': return '🏦';
      case 'Bank Transfer': return '🏦';
      case 'Wallet': return '💰';
      default: return '💵';
    }
  };

  const handleDownloadReceipt = (receiptNo: string) => {
    alert(`Downloading receipt: ${receiptNo}`);
  };

  const handleExportHistory = () => {
    const csvContent = [
      ['Receipt No', 'Date', 'Description', 'Amount', 'Payment Method', 'Transaction ID', 'Status'],
      ...paymentHistory.map(p => [
        p.receiptNo,
        p.date,
        p.description,
        `₹${p.amount.toLocaleString('en-IN')}`,
        p.paymentMethod,
        p.transactionId,
        p.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Payment History</h2>
        <p className="text-muted-foreground">View and track all your fee payment transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid (2024)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentYearTotal)}
            </div>
            <p className="text-xs text-muted-foreground">{transactionsCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearTotal / transactionsCount)}
            </div>
            <p className="text-xs text-muted-foreground">Per payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paymentHistory[0]?.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(paymentHistory[0]?.date || '')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="this-year">This Year</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>All Payment Transactions</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        className="pl-10 w-48"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                      <SelectTrigger className="w-32">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3 w-3" />
                          <SelectValue placeholder="Method" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Methods">All Methods</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="Net Banking">Net Banking</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-28">
                        <Calendar className="h-3 w-3 mr-2" />
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportHistory}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">
                          <div>{payment.receiptNo}</div>
                          {payment.transactionId && (
                            <div className="text-xs text-muted-foreground truncate">
                              {payment.transactionId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMethodIcon(payment.paymentMethod)}</span>
                            <span className="text-sm">{payment.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadReceipt(payment.receiptNo)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="this-year">
          <Card>
            <CardHeader>
              <CardTitle>2024 Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Payment Trends</h3>
                <p className="text-muted-foreground mb-4">
                  View your payment pattern for the current year
                </p>
                <Button>
                  <Receipt className="h-4 w-4 mr-2" />
                  View Detailed Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Download Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{payment.receiptNo}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.description} • {formatDate(payment.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.receiptNo)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Receipts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {transactionsCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(Math.max(...paymentHistory.map(p => p.amount)))}
              </div>
              <div className="text-sm text-muted-foreground">Highest Payment</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(Math.min(...paymentHistory.map(p => p.amount)))}
              </div>
              <div className="text-sm text-muted-foreground">Lowest Payment</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistoryStudent;