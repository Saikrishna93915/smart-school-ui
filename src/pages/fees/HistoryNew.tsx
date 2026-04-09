// src/pages/fees/HistoryNew.tsx - Production-ready
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { feesService, PaymentHistory } from '@/api/services/feesService';
import { useToast } from '@/hooks/use-toast';

const History = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        const data = await feesService.getPaymentHistory();
        setPayments(data);
        setFilteredPayments(data);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load payment history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [toast]);

  useEffect(() => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Payment method filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === filterMethod);
    }

    setFilteredPayments(filtered);
  }, [searchTerm, filterStatus, filterMethod, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getTotalPaid = () => {
    return payments
      .filter(p => p.status.toLowerCase() === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">Track all your payments and transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalPaid())}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status.toLowerCase() === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Transaction ID or Receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-12 text-center space-y-4">
            <Filter className="h-12 w-12 text-amber-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Payments Found</h3>
              <p className="text-amber-800">No payments match your current filter criteria.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Status & Receipt */}
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt</p>
                      <p className="font-semibold">{payment.receiptNumber}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-semibold capitalize">{payment.paymentMethod}</p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-sm">{formatDate(payment.paymentDate)}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <p>Reference ID: <span className="font-mono font-semibold">{payment._id}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      {payments.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 flex gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Payment History</p>
              <p>All your completed and pending payments are listed here. Click on any payment to view more details or download the receipt.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
