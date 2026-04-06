import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cashierService } from "@/Services/cashierService";
import { format } from "date-fns";
import {
  IndianRupee,
  Receipt,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Landmark,
  Smartphone,
  BarChart3,
  ArrowUpRight,
  Eye,
  QrCode,
  XCircle,
  AlertCircle,
  Plus,
  Trophy,
  Medal,
  Target,
  Loader2,
  Printer,
  Sun,
  Moon,
  LogOut,
  CheckCircle,
  Clock
} from "lucide-react";
import { Label } from "@/components/ui/label";

// ==================== TYPES ====================

type Transaction = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: "cash" | "online" | "cheque" | "dd" | "upi";
  paymentMode: string;
  status: "completed" | "paid" | "pending" | "failed" | "refunded" | "cancelled";
  studentId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    academic?: {
      class: string;
      section: string;
      admissionNumber: string;
    };
    admissionNumber?: string;
    class?: string;
    section?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
  feeType: string[];
  transactionId?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  upiId?: string;
  cardLastFour?: string;
  receivedBy: {
    name: string;
    id: string;
  };
  receivedAt: string;
  remarks?: string;
  createdAt: string;
  paymentDate?: string;
};

type PaymentMethodBreakdown = {
  cash: { count: number; amount: number };
  online: { count: number; amount: number };
  cheque: { count: number; amount: number };
  dd: { count: number; amount: number };
  upi: { count: number; amount: number };
};

type PendingDue = {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  class: string;
  section: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  daysOverdue: number;
  parentPhone: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
};

type HourlyCollection = {
  hour: number;
  count: number;
  amount: number;
};

type DailyTarget = {
  target: number;
  achieved: number;
  percentage: number;
};

type DashboardData = {
  todayTotal: number;
  receiptCount: number;
  pendingCount: number;
  monthlyTotal: number;
  cashTotal: number;
  onlineTotal: number;
  chequeTotal: number;
  upiTotal: number;
  target: DailyTarget;
  methodBreakdown: PaymentMethodBreakdown;
  recentTransactions: Transaction[];
  pendingDues: PendingDue[] | { total: number; overdue: number };
  hourlyCollection: HourlyCollection[];
  topPayers: Array<{
    studentName: string;
    amount: number;
    count: number;
  }>;
  averageTransaction: number;
  peakHour: number;
  cashierName: string;
  shiftStart: string;
  shiftEnd?: string;
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return format(date, "hh:mm a");
};

const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return format(date, "dd MMM yyyy");
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
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
    case "refunded":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
    case "cancelled":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ==================== MAIN COMPONENT ====================

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [emailAddress, setEmailAddress] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickStudent, setQuickStudent] = useState("");
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  
  // Shift Management State
  const [showOpenShiftDialog, setShowOpenShiftDialog] = useState(false);
  const [showCloseShiftDialog, setShowCloseShiftDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [cashInHand, setCashInHand] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [currentShift, setCurrentShift] = useState<{
    _id: string;
    status: "open" | "closed";
    openingTime: string;
    openingBalance: number;
    transactions?: { count: number; totalAmount: number };
  } | null>(null);

  // ==================== DATA LOADING ====================

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load current shift from API
      try {
        const shiftResponse = await cashierService.getCurrentShift();
        const shiftData = shiftResponse.data?.data?.currentShift;
        
        if (shiftData) {
          setCurrentShift({
            _id: shiftData._id,
            status: shiftData.status as "open" | "closed",
            openingTime: shiftData.openingTime ? format(new Date(shiftData.openingTime), "hh:mm a") : "N/A",
            openingBalance: shiftData.openingBalance,
            transactions: shiftData.transactions,
          });
        } else {
          setCurrentShift(null);
        }
      } catch (shiftError) {
        console.error('Error loading shift:', shiftError);
        setCurrentShift(null);
      }

      // Load dashboard stats
      try {
        const dashboardResponse = await cashierService.getDashboardStats();
        setData(dashboardResponse.data?.data || null);
      } catch (dashboardError) {
        console.error('Error loading dashboard:', dashboardError);
        // Set default data
        setData({
          todayTotal: 0,
          receiptCount: 0,
          pendingCount: 0,
          monthlyTotal: 0,
          cashTotal: 0,
          onlineTotal: 0,
          chequeTotal: 0,
          upiTotal: 0,
          target: {
            target: 50000,
            achieved: 0,
            percentage: 0,
          },
          methodBreakdown: {
            cash: { count: 0, amount: 0 },
            online: { count: 0, amount: 0 },
            cheque: { count: 0, amount: 0 },
            dd: { count: 0, amount: 0 },
            upi: { count: 0, amount: 0 },
          },
          recentTransactions: [],
          pendingDues: [],
          hourlyCollection: [],
          topPayers: [],
          averageTransaction: 0,
          peakHour: 0,
          cashierName: '',
          shiftStart: '',
          shiftEnd: undefined,
        });
      }

    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(false); // silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // ==================== FILTERED TRANSACTIONS ====================

  const filteredTransactions = useMemo(() => {
    if (!data?.recentTransactions) return [];

    return data.recentTransactions.filter((tx) => {
      // Search filter
      const admissionNum = tx.studentId?.admissionNumber || tx.studentId?.academic?.admissionNumber || "";
      const matchesSearch =
        searchTerm === "" ||
        tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.studentId?.personal?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.studentId?.personal?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admissionNum.toLowerCase().includes(searchTerm.toLowerCase());

      // Payment method filter
      const matchesMethod = paymentFilter === "all" || tx.paymentMethod === paymentFilter;

      return matchesSearch && matchesMethod;
    });
  }, [data?.recentTransactions, searchTerm, paymentFilter]);

  // ==================== HOURLY COLLECTION CHART DATA ====================

  const hourlyChartData = useMemo(() => {
    if (!data?.hourlyCollection) return [];
    return data.hourlyCollection.map((h) => ({
      hour: `${h.hour}:00`,
      amount: h.amount,
      count: h.count,
    }));
  }, [data?.hourlyCollection]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadDashboardData(true);
    toast.success("Dashboard refreshed");
  };

  const handleQuickCollect = () => {
    setShowQuickPayment(true);
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptDialog(true);
  };

  const handleVoidTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowVoidDialog(true);
  };

  const handleEmailReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEmailAddress(transaction.studentId?.parentEmail || "");
    setShowEmailDialog(true);
  };

  const confirmVoidTransaction = async () => {
    if (!selectedTransaction || !voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }

    try {
      await cashierService.voidTransaction(selectedTransaction._id, { reason: voidReason });
      toast.success("Transaction voided successfully");
      setShowVoidDialog(false);
      setVoidReason("");
      loadDashboardData(true);
    } catch (error) {
      toast.error("Failed to void transaction");
    }
  };

  const confirmEmailReceipt = async () => {
    if (!selectedTransaction || !emailAddress.trim()) {
      toast.error("Please provide an email address");
      return;
    }

    try {
      await cashierService.emailReceipt(selectedTransaction._id, { email: emailAddress });
      toast.success("Receipt emailed successfully");
      setShowEmailDialog(false);
      setEmailAddress("");
    } catch (error) {
      toast.error("Failed to email receipt");
    }
  };

  const confirmQuickPayment = async () => {
    if (!quickStudent || !quickAmount) {
      toast.error("Please select student and enter amount");
      return;
    }

    try {
      navigate("/cashier/collect-fee", {
        state: { studentId: quickStudent, amount: quickAmount },
      });
    } catch (error) {
      toast.error("Failed to process payment");
    }
  };

  // ==================== SHIFT MANAGEMENT HANDLERS ====================

  const handleOpenShift = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error("Please enter a valid opening balance");
      return;
    }

    try {
      const response = await cashierService.openShift({
        openingBalance: parseFloat(openingBalance)
      });
      
      const newShift = response.data?.data?.shift;
      
      if (newShift) {
        setCurrentShift({
          _id: newShift._id,
          status: "open",
          openingTime: format(new Date(newShift.openingTime), "hh:mm a"),
          openingBalance: newShift.openingBalance,
          transactions: newShift.transactions,
        });
        
        setShowOpenShiftDialog(false);
        setOpeningBalance("");
        toast.success("Shift opened successfully! You can now start collecting payments.");
        loadDashboardData(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to open shift";
      toast.error(errorMessage);
    }
  };

  const handleCloseShift = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast.error("Please enter a valid closing balance");
      return;
    }

    if (!currentShift) {
      toast.error("No active shift to close");
      return;
    }

    try {
      const variance = parseFloat(closingBalance) - parseFloat(cashInHand || closingBalance);
      
      const response = await cashierService.closeShift(currentShift._id, {
        closingBalance: parseFloat(closingBalance),
        cashInHand: parseFloat(cashInHand || closingBalance),
        notes: closingNotes,
        variance: variance,
      });
      
      const closedShift = response.data?.data?.shift;
      
      if (closedShift) {
        setCurrentShift(prev => prev ? {
          ...prev,
          status: "closed",
        } : null);
        
        setShowCloseShiftDialog(false);
        setClosingBalance("");
        setCashInHand("");
        setClosingNotes("");
        
        const varianceText = variance !== 0 ? `Variance: ${formatCurrency(Math.abs(variance))} ${variance < 0 ? 'shortage' : 'excess'}` : 'Perfect balance!';
        toast.success(`Shift closed successfully! ${varianceText}`);
        loadDashboardData(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to close shift";
      toast.error(errorMessage);
    }
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cashier dashboard...</p>
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
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {data?.cashierName || "Cashier"}
            {currentShift?.status === "open" && (
              <span> • Shift opened at {currentShift.openingTime}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/cashier/my-account")}>
            <FileText className="h-4 w-4 mr-2" />
            My Account
          </Button>
          <Button size="sm" onClick={handleQuickCollect}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Collect
          </Button>
        </div>
      </div>

      {/* ====== SHIFT STATUS CARD ====== */}
      <Card className={currentShift?.status === "open" ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${currentShift?.status === "open" ? "bg-green-100" : "bg-amber-100"}`}>
                {currentShift?.status === "open" ? (
                  <Sun className="h-6 w-6 text-green-600" />
                ) : (
                  <Moon className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {currentShift?.status === "open" ? "Shift is Currently Open" : "No Active Shift"}
                  </h3>
                  <Badge className={currentShift?.status === "open" ? "bg-green-600" : "bg-amber-600"}>
                    {currentShift?.status === "open" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Open</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> Closed</>
                    )}
                  </Badge>
                </div>
                {currentShift?.status === "open" ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Opened at {currentShift.openingTime} • Opening Balance: {formatCurrency(currentShift.openingBalance)}
                    {currentShift.transactions && (
                      <span> • Transactions: {currentShift.transactions.count} • Total: {formatCurrency(currentShift.transactions.totalAmount)}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Start your day by opening a new shift session to begin collecting payments
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {currentShift?.status === "open" ? (
                <>
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate("/cashier/my-account")}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowCloseShiftDialog(true)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Close Shift
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowOpenShiftDialog(true)}>
                  <Sun className="h-4 w-4 mr-2" />
                  Open Shift
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== TARGET PROGRESS ====== */}
      {data?.target && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Daily Collection Target</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.target.achieved)} / {formatCurrency(data.target.target)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-blue-700">Progress</p>
                  <p className="text-xl font-bold text-blue-800">{data.target.percentage}%</p>
                </div>
                <Progress value={data.target.percentage} className="w-32 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== STATS CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Collection</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.todayTotal || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{(data?.methodBreakdown?.cash?.amount || 0) > 0 ? " Cash" : ""}
                    {(data?.methodBreakdown?.online?.amount || 0) > 0 ? " + Online" : ""}
                  </span>
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
                <p className="text-sm text-muted-foreground">Receipts Today</p>
                <p className="text-2xl font-bold">{data?.receiptCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency(data?.averageTransaction || 0)} per receipt
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                {(() => {
                  let pendingDuesTotal = 0;
                  let pendingDuesOverdue = 0;
                  if (data?.pendingDues) {
                    if (Array.isArray(data.pendingDues)) {
                      pendingDuesTotal = data.pendingDues.length;
                    } else {
                      pendingDuesTotal = data.pendingDues.total || 0;
                      pendingDuesOverdue = data.pendingDues.overdue || 0;
                    }
                  }
                  return (
                    <>
                      <p className="text-2xl font-bold text-orange-600">{pendingDuesTotal || data?.pendingCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pendingDuesOverdue} overdue &gt;7 days
                      </p>
                    </>
                  );
                })()}
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data?.monthlyTotal || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Peak hour: {data?.peakHour || 10}:00
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== PAYMENT METHOD BREAKDOWN ====== */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Cash</span>
              </div>
              <Badge variant="outline" className="bg-green-50">
                {data?.methodBreakdown?.cash?.count || 0} txns
              </Badge>
            </div>
            <p className="text-lg font-bold text-green-600 mt-1">
              {formatCurrency(data?.methodBreakdown?.cash?.amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                {data?.methodBreakdown?.online?.count || 0} txns
              </Badge>
            </div>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formatCurrency(data?.methodBreakdown?.online?.amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Cheque</span>
              </div>
              <Badge variant="outline" className="bg-purple-50">
                {data?.methodBreakdown?.cheque?.count || 0} txns
              </Badge>
            </div>
            <p className="text-lg font-bold text-purple-600 mt-1">
              {formatCurrency(data?.methodBreakdown?.cheque?.amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">DD</span>
              </div>
              <Badge variant="outline" className="bg-orange-50">
                {data?.methodBreakdown?.dd?.count || 0} txns
              </Badge>
            </div>
            <p className="text-lg font-bold text-orange-600 mt-1">
              {formatCurrency(data?.methodBreakdown?.dd?.amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">UPI</span>
              </div>
              <Badge variant="outline" className="bg-indigo-50">
                {data?.methodBreakdown?.upi?.count || 0} txns
              </Badge>
            </div>
            <p className="text-lg font-bold text-indigo-600 mt-1">
              {formatCurrency(data?.methodBreakdown?.upi?.amount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ====== MAIN CONTENT WITH TABS ====== */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="pending">Pending Dues</TabsTrigger>
            <TabsTrigger value="hourly">Hourly Collection</TabsTrigger>
            <TabsTrigger value="top">Top Payers</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="dd">DD</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ====== TAB 1: ALL TRANSACTIONS ====== */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx._id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs font-medium">
                            {tx.receiptNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-blue-600 text-white">
                                  {getInitials(
                                    `${tx.studentId?.personal?.firstName || ""} ${
                                      tx.studentId?.personal?.lastName || ""
                                    }`
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {tx.studentId?.personal?.firstName} {tx.studentId?.personal?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.studentId?.academic?.admissionNumber || tx.studentId?.admissionNumber}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.studentId?.academic?.class || tx.studentId?.class}-{tx.studentId?.academic?.section || tx.studentId?.section}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPaymentMethodIcon(tx.paymentMethod)}
                              <span className="text-xs capitalize">{tx.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatTime(tx.paymentDate || tx.createdAt)}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(tx.paymentDate || tx.createdAt)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewReceipt(tx)}
                                title="View Receipt"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEmailReceipt(tx)}
                                title="Email Receipt"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleVoidTransaction(tx)}
                                title="Void Transaction"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB 2: PENDING DUES ====== */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Dues & Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(data?.pendingDues) || data.pendingDues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending dues found
                </div>
              ) : (
                <div className="space-y-3">
                  {data.pendingDues.map((due) => (
                    <div
                      key={due.studentId}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border ${
                        due.daysOverdue > 7
                          ? "bg-red-50 border-red-200"
                          : due.daysOverdue > 0
                          ? "bg-orange-50 border-orange-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-orange-600 text-white">
                              {getInitials(due.studentName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{due.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {due.admissionNumber} • Class {due.class}-{due.section}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Fee:</span>
                            <span className="ml-1 font-medium">{formatCurrency(due.totalFee)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Paid:</span>
                            <span className="ml-1 font-medium text-green-600">
                              {formatCurrency(due.paidAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending:</span>
                            <span className="ml-1 font-bold text-red-600">
                              {formatCurrency(due.pendingAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="ml-1 font-medium">
                              {formatDate(due.dueDate)}
                              {due.daysOverdue > 0 && (
                                <Badge className="ml-2 bg-red-100 text-red-800">
                                  {due.daysOverdue} days overdue
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          onClick={() => navigate("/cashier/collect-fee", { state: { studentId: due.studentId } })}
                        >
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Collect
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB 3: HOURLY COLLECTION ====== */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Hourly Collection Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {hourlyChartData.map((item, index) => {
                  const maxAmount = Math.max(...hourlyChartData.map((d) => d.amount));
                  const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
                          style={{ height: `${Math.max(height, 5)}px` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(item.amount)} ({item.count} txns)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs mt-2 text-muted-foreground">{item.hour}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB 4: TOP PAYERS ====== */}
        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top Payers Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.topPayers || data.topPayers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <div className="space-y-3">
                  {data.topPayers.map((payer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {index === 0 && <Trophy className="h-5 w-5 text-yellow-600" />}
                        {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                        {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                        <span className="font-medium">{payer.studentName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(payer.amount)}</p>
                        <p className="text-xs text-muted-foreground">{payer.count} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== QUICK ACTIONS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/cashier/collect-fee")}
        >
          <IndianRupee className="h-6 w-6 text-green-600" />
          <span className="text-sm">Collect Fee</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/cashier/receipts")}
        >
          <Receipt className="h-6 w-6 text-blue-600" />
          <span className="text-sm">View Receipts</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/cashier/fee-defaulters")}
        >
          <AlertCircle className="h-6 w-6 text-orange-600" />
          <span className="text-sm">Defaulters</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/cashier/daily-report")}
        >
          <FileText className="h-6 w-6 text-purple-600" />
          <span className="text-sm">Daily Report</span>
        </Button>
      </div>

      {/* ====== DIALOGS ====== */}

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Receipt Number</p>
                    <p className="font-mono font-bold">{selectedTransaction.receiptNumber}</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Paid</Badge>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student Name</p>
                    <p className="font-medium">
                      {selectedTransaction.studentId?.personal?.firstName} {" "}
                      {selectedTransaction.studentId?.personal?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-medium">
                      {selectedTransaction.studentId?.class}-{selectedTransaction.studentId?.section}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold text-green-600 text-lg">
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.paymentDate || selectedTransaction.createdAt)} at{" "}
                      {formatTime(selectedTransaction.paymentDate || selectedTransaction.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Received By</p>
                    <p className="font-medium">{selectedTransaction.receivedBy?.name}</p>
                  </div>
                </div>

                {selectedTransaction.paymentMethod === "cheque" && (
                  <div className="mt-3 p-3 bg-purple-50 rounded">
                    <p className="text-xs font-medium text-purple-800">Cheque Details</p>
                    <p className="text-sm">
                      Cheque No: {selectedTransaction.chequeNumber} | Bank:{" "}
                      {selectedTransaction.bankName} | Date:{" "}
                      {selectedTransaction.chequeDate && formatDate(selectedTransaction.chequeDate)}
                    </p>
                  </div>
                )}

                {selectedTransaction.paymentMethod === "upi" && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded">
                    <p className="text-xs font-medium text-indigo-800">UPI Details</p>
                    <p className="text-sm">UPI ID: {selectedTransaction.upiId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowReceiptDialog(false);
                handlePrintReceipt(selectedTransaction!);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Transaction Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="void-reason">Reason for voiding</Label>
            <Input
              id="void-reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g., Wrong amount, Duplicate entry"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowVoidDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoidTransaction} className="bg-red-600 hover:bg-red-700">
              Void Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Receipt Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Receipt</DialogTitle>
            <DialogDescription>
              Send receipt to parent's email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="parent@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEmailReceipt}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Dialog */}
      <Dialog open={showQuickPayment} onOpenChange={setShowQuickPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Fee Collection</DialogTitle>
            <DialogDescription>
              Enter student ID and amount to quickly collect fee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student ID / Admission Number</Label>
              <Input
                id="student"
                value={quickStudent}
                onChange={(e) => setQuickStudent(e.target.value)}
                placeholder="e.g., ADM2024001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickPayment(false)}>
              Cancel
            </Button>
            <Button onClick={confirmQuickPayment}>
              <IndianRupee className="h-4 w-4 mr-2" />
              Proceed to Collect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Shift Dialog */}
      <Dialog open={showOpenShiftDialog} onOpenChange={setShowOpenShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-600" />
              Open New Shift
            </DialogTitle>
            <DialogDescription>
              Start a new shift session. This will begin your daily collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opening-balance">Opening Balance (Cash in Hand)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the cash amount you're starting with (e.g., change fund)
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Once opened, you can start collecting payments. Remember to close the shift at the end of your session.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenShiftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenShift}>
              <Sun className="h-4 w-4 mr-2" />
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={showCloseShiftDialog} onOpenChange={setShowCloseShiftDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-600" />
              Close Shift Session
            </DialogTitle>
            <DialogDescription>
              End your current shift and generate a report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentShift && (
              <>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Shift Date</p>
                    <p className="font-medium">{format(new Date(), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opened At</p>
                    <p className="font-medium">{currentShift.openingTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opening Balance</p>
                    <p className="font-medium">{formatCurrency(currentShift.openingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="font-medium">{currentShift.transactions?.count || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash-in-hand">Actual Cash in Hand</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cash-in-hand"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={cashInHand}
                      onChange={(e) => setCashInHand(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Count the physical cash you have at the end of the shift
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closing-balance">Total Closing Amount (Cash + Digital)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="closing-balance"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include cash, UPI, online transfers, and cheques
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                    placeholder="Any discrepancies, issues, or notes for the next shift..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseShiftDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseShift}>
              <LogOut className="h-4 w-4 mr-2" />
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const handlePrintReceipt = (transaction: Transaction) => {
  // Placeholder: implement print logic or open print dialog
  toast.info(`Print receipt for ${transaction.receiptNumber}`);
};
