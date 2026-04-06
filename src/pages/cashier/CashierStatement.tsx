import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cashierService } from "@/Services/cashierService";
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Mail,
  IndianRupee,
  Calendar,
  Clock,
  User,
  FileText,
  CreditCard,
  Smartphone,
  QrCode,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Sun,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ==================== TYPES ====================

type Transaction = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: "cash" | "online" | "cheque" | "dd" | "upi";
  paymentMode: string;
  status: "completed" | "paid" | "pending" | "failed" | "refunded" | "cancelled";
  transactionDate: string;
  studentId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
      photo?: string;
    };
    academic?: {
      class: string;
      section: string;
      admissionNumber: string;
      rollNumber: string;
    };
    admissionNumber?: string;
    class?: string;
    section?: string;
  };
  feeDetails: {
    feeType: string;
    feeCategory: string;
    dueDate?: string;
    discount?: number;
    fine?: number;
  };
  cashier?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  shiftId?: string;
  upiId?: string;
  chequeNumber?: string;
  bankName?: string;
  remarks?: string;
};

type ShiftSession = {
  _id: string;
  shiftDate: string;
  openingTime: string;
  closingTime?: string;
  openingBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  transactions: {
    count: number;
    totalAmount: number;
    cash: number;
    online: number;
    upi: number;
    cheque: number;
  };
  cashier: {
    name: string;
    employeeId: string;
  };
};

type FilterState = {
  search: string;
  paymentMethod: string;
  status: string;
  shiftFilter: string;
  dateFrom: string;
  dateTo: string;
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "hh:mm a");
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "cash":
      return <IndianRupee className="h-4 w-4 text-green-600" />;
    case "online":
      return <Smartphone className="h-4 w-4 text-blue-600" />;
    case "cheque":
      return <Landmark className="h-4 w-4 text-purple-600" />;
    case "dd":
      return <FileText className="h-4 w-4 text-orange-600" />;
    case "upi":
      return <QrCode className="h-4 w-4 text-indigo-600" />;
    default:
      return <CreditCard className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const normalizeShift = (shift: any): ShiftSession => ({
  _id: shift._id,
  shiftDate: shift.shiftDate,
  openingTime: shift.openingTime,
  closingTime: shift.closingTime,
  openingBalance: shift.openingBalance || 0,
  closingBalance: shift.closingBalance,
  status: shift.status,
  transactions: {
    count: shift.transactions?.count || 0,
    totalAmount: shift.transactions?.totalAmount || 0,
    cash: shift.transactions?.cash || 0,
    online: shift.transactions?.online || 0,
    upi: shift.transactions?.upi || 0,
    cheque: shift.transactions?.cheque || 0,
  },
  cashier: {
    name: [shift.cashier?.firstName, shift.cashier?.lastName].filter(Boolean).join(" ") || shift.cashier?.name || "Cashier",
    employeeId: shift.cashier?.employeeId || "",
  },
});

// ==================== MAIN COMPONENT ====================

export default function CashierStatement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<ShiftSession[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    paymentMethod: "all",
    status: "all",
    shiftFilter: "all",
    dateFrom: "",
    dateTo: "",
  });

  // ==================== DATA LOADING ====================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching transaction history from backend...');
      
      const [statementResponse, shiftsResponse] = await Promise.all([
        cashierService.getStatement({ page: 1, limit: 500 }),
        cashierService.getShifts({ limit: 100 }),
      ]);

      console.log('📦 Statement Response:', statementResponse);
      console.log('📦 Shifts Response:', shiftsResponse);

      // Handle different response structures
      const transactions = statementResponse.data?.data?.transactions || 
                          statementResponse.data?.transactions || 
                          statementResponse.data || [];
      
      const shiftsData = (shiftsResponse.data?.data?.shifts || 
                         shiftsResponse.data?.shifts || 
                         shiftsResponse.data || []);

      console.log('✅ Loaded', transactions.length, 'transactions');
      
      setTransactions(Array.isArray(transactions) ? transactions : []);
      setShifts((Array.isArray(shiftsData) ? shiftsData : []).map(normalizeShift));
    } catch (error: any) {
      console.error('❌ Error loading transactions:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load transaction history";
      toast.error(errorMessage);
      setTransactions([]);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing transaction data...');
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing transaction data...');
    try {
      await loadData();
      toast.success("Statement refreshed with latest data");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  // ==================== FILTERED TRANSACTIONS ====================

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        filters.search === "" ||
        tx.receiptNumber.toLowerCase().includes(searchLower) ||
        tx.studentId.personal.firstName.toLowerCase().includes(searchLower) ||
        tx.studentId.personal.lastName.toLowerCase().includes(searchLower) ||
        tx.studentId.academic?.admissionNumber.toLowerCase().includes(searchLower);

      const matchesMethod = filters.paymentMethod === "all" || tx.paymentMethod === filters.paymentMethod;
      const matchesStatus = filters.status === "all" || tx.status === filters.status;
      const matchesShift = filters.shiftFilter === "all" || tx.shiftId === filters.shiftFilter;

      let matchesDate = true;
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const txDate = new Date(tx.transactionDate);
        matchesDate = matchesDate && txDate >= fromDate;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        const txDate = new Date(tx.transactionDate);
        matchesDate = matchesDate && txDate <= toDate;
      }

      return matchesSearch && matchesMethod && matchesStatus && matchesShift && matchesDate;
    });
  }, [transactions, filters]);

  // ==================== SUMMARY CALCULATIONS ====================

  const summary = useMemo(() => {
    const total = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const cash = filteredTransactions.filter(tx => tx.paymentMethod === "cash").reduce((sum, tx) => sum + tx.amount, 0);
    const online = filteredTransactions.filter(tx => tx.paymentMethod === "online" || tx.paymentMethod === "upi").reduce((sum, tx) => sum + tx.amount, 0);
    const cheque = filteredTransactions.filter(tx => tx.paymentMethod === "cheque" || tx.paymentMethod === "dd").reduce((sum, tx) => sum + tx.amount, 0);
    const completed = filteredTransactions.filter(tx => tx.status === "completed" || tx.status === "paid").length;
    const pending = filteredTransactions.filter(tx => tx.status === "pending").length;
    const refunded = filteredTransactions.filter(tx => tx.status === "refunded").length;

    return { total, cash, online, cheque, completed, pending, refunded };
  }, [filteredTransactions]);

  // ==================== HANDLERS ====================

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const handlePrintReceipt = (transaction: Transaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the receipt");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${transaction.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .card { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; padding: 24px; }
            .row { margin: 8px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Cashier Receipt</h2>
            <div class="row"><span class="label">Receipt:</span> ${transaction.receiptNumber}</div>
            <div class="row"><span class="label">Student:</span> ${transaction.studentId.personal.firstName} ${transaction.studentId.personal.lastName}</div>
            <div class="row"><span class="label">Admission No:</span> ${transaction.studentId.academic?.admissionNumber || "-"}</div>
            <div class="row"><span class="label">Class:</span> ${transaction.studentId.academic?.class || "-"}-${transaction.studentId.academic?.section || "-"}</div>
            <div class="row"><span class="label">Fee Type:</span> ${transaction.feeDetails.feeType}</div>
            <div class="row"><span class="label">Payment Method:</span> ${transaction.paymentMethod}</div>
            <div class="row"><span class="label">Amount:</span> ${formatCurrency(transaction.amount)}</div>
            <div class="row"><span class="label">Date:</span> ${formatDate(transaction.transactionDate)} ${formatTime(transaction.transactionDate)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailReceipt = (transaction: Transaction) => {
    toast.error(`Email receipt is not configured yet for ${transaction.receiptNumber}`);
  };

  const handleExportStatement = () => {
    const headers = ["Receipt No", "Date", "Student", "Admission No", "Class", "Fee Type", "Method", "Amount", "Status"];
    const rows = filteredTransactions.map((tx) => [
      tx.receiptNumber,
      formatDate(tx.transactionDate),
      `${tx.studentId.personal.firstName} ${tx.studentId.personal.lastName}`.trim(),
      tx.studentId.academic?.admissionNumber || "",
      `${tx.studentId.academic?.class || ""}-${tx.studentId.academic?.section || ""}`.replace(/-$/, ""),
      tx.feeDetails.feeType,
      tx.paymentMethod,
      tx.amount,
      tx.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cashier-statement-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Statement exported to CSV");
  };

  const handlePrintStatement = () => {
    window.print();
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View all transactions collected by you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintStatement}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportStatement}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* ====== SUMMARY CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collection</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">{filteredTransactions.length} transactions</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.cash)}</p>
                <p className="text-xs text-muted-foreground mt-1">Physical cash collected</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Digital</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.online)}</p>
                <p className="text-xs text-muted-foreground mt-1">Online + UPI</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{summary.completed}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.pending} pending • {summary.refunded} refunded
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== FILTERS ====== */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt, student name, or admission no..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="dd">DD</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.shiftFilter} onValueChange={(value) => setFilters({ ...filters, shiftFilter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift._id} value={shift._id}>
                    {formatDate(shift.shiftDate)} - {shift.openingTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-40"
              />
            </div>
            {(filters.search || filters.paymentMethod !== "all" || filters.status !== "all" || filters.shiftFilter !== "all" || filters.dateFrom || filters.dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ search: "", paymentMethod: "all", status: "all", shiftFilter: "all", dateFrom: "", dateTo: "" })}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ====== TRANSACTIONS TABLE ====== */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        {transactions.length === 0 ? (
                          <>
                            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-lg font-medium text-muted-foreground mb-2">No Transactions Yet</p>
                            <p className="text-sm text-muted-foreground max-w-md">
                              {loading 
                                ? "Loading your transaction data..."
                                : "Start collecting fees to see transactions here. New payments will appear automatically with real-time updates."}
                            </p>
                            {!loading && (
                              <Button 
                                onClick={handleRefresh} 
                                variant="outline" 
                                className="mt-4"
                                disabled={refreshing}
                              >
                                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Loading...' : 'Refresh Data'}
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-lg font-medium text-muted-foreground mb-2">No Matching Transactions</p>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters or date range
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{tx.receiptNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getInitials(tx.studentId.personal.firstName, tx.studentId.personal.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {tx.studentId.personal.firstName} {tx.studentId.personal.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{tx.studentId.academic?.admissionNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Class {tx.studentId.academic?.class}-{tx.studentId.academic?.section}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{tx.feeDetails.feeType}</p>
                          <p className="text-xs text-muted-foreground">{tx.feeDetails.feeCategory}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(tx.paymentMethod)}
                          <span className="text-sm capitalize">{tx.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(tx.transactionDate)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(tx.transactionDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(tx)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintReceipt(tx)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEmailReceipt(tx)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ====== TRANSACTION DETAILS DIALOG ====== */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">Receipt Number</p>
                  <p className="font-bold text-blue-900">{selectedTransaction.receiptNumber}</p>
                </div>
                {getStatusBadge(selectedTransaction.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">
                    {selectedTransaction.studentId.personal.firstName} {selectedTransaction.studentId.personal.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{selectedTransaction.studentId.academic?.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class & Section</p>
                  <p className="font-medium">
                    Class {selectedTransaction.studentId.academic?.class}-{selectedTransaction.studentId.academic?.section}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Date</p>
                  <p className="font-medium">
                    {formatDate(selectedTransaction.transactionDate)} {formatTime(selectedTransaction.transactionDate)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Payment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <span className="font-medium capitalize">{selectedTransaction.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="font-bold text-green-600 text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  {selectedTransaction.feeDetails.discount && selectedTransaction.feeDetails.discount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Discount</p>
                      <p className="font-medium text-green-600">-{formatCurrency(selectedTransaction.feeDetails.discount)}</p>
                    </div>
                  )}
                  {selectedTransaction.feeDetails.fine && selectedTransaction.feeDetails.fine > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fine</p>
                      <p className="font-medium text-red-600">+{formatCurrency(selectedTransaction.feeDetails.fine)}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.paymentMethod === "upi" && selectedTransaction.upiId && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-medium text-indigo-800">UPI Details</p>
                  <p className="text-sm">UPI ID: {selectedTransaction.upiId}</p>
                </div>
              )}

              {selectedTransaction.paymentMethod === "cheque" && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs font-medium text-purple-800">Cheque Details</p>
                  <p className="text-sm">Cheque No: {selectedTransaction.chequeNumber}</p>
                  <p className="text-sm">Bank: {selectedTransaction.bankName}</p>
                </div>
              )}

              {selectedTransaction.cashier && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700">Collected By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-600" />
                    <p className="text-sm font-medium">{selectedTransaction.cashier.name}</p>
                    <Badge variant="outline" className="text-xs">{selectedTransaction.cashier.employeeId}</Badge>
                  </div>
                </div>
              )}

              {selectedTransaction.shiftId && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs font-medium text-amber-800">Shift Information</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Sun className="h-4 w-4 text-amber-600" />
                    <p className="text-sm">Shift ID: {selectedTransaction.shiftId}</p>
                  </div>
                </div>
              )}

              {selectedTransaction.remarks && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700">Remarks</p>
                  <p className="text-sm mt-1">{selectedTransaction.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => handlePrintReceipt(selectedTransaction!)}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button variant="outline" onClick={() => handleEmailReceipt(selectedTransaction!)}>
              <Mail className="h-4 w-4 mr-2" />
              Email Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
