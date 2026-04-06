import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cashierService } from "@/Services/cashierService";
import { format, parseISO, subDays } from "date-fns";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  RefreshCw,
  Filter,
  Download,
  Printer,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  QrCode,
  History,
  FileSpreadsheet,
  CreditCard,
  Landmark,
  Smartphone,
  Loader2,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type PaymentMethod = "cash" | "online" | "cheque" | "dd" | "upi" | "other";

type Transaction = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: "completed" | "pending" | "failed" | "refunded" | "cancelled";
  studentId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    academic: {
      class: string;
      section: string;
      admissionNumber: string;
      rollNumber: string;
    };
  };
  feeType: Array<{
    name: string;
    amount: number;
  }>;
  receivedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  remarks?: string;
};

type DailySummary = {
  total: number;
  cash: number;
  online: number;
  cheque: number;
  dd: number;
  upi: number;
  other: number;
  count: number;
  cashCount: number;
  onlineCount: number;
  chequeCount: number;
  ddCount: number;
  upiCount: number;
  otherCount: number;
  averageTransaction: number;
  highestTransaction: number;
  lowestTransaction: number;
};

type PaymentMethodBreakdown = {
  method: PaymentMethod;
  amount: number;
  count: number;
  percentage: number;
  color: string;
};

type HourlyBreakdown = {
  hour: number;
  amount: number;
  count: number;
};

type ReportData = {
  summary: DailySummary;
  payments: Transaction[];
  hourlyBreakdown: HourlyBreakdown[];
  paymentMethods: PaymentMethodBreakdown[];
  previousDayComparison: {
    date: string;
    total: number;
    difference: number;
    percentageChange: number;
  };
  weekToDate: {
    total: number;
    average: number;
  };
  cashierStats?: {
    cashierId: string;
    cashierName: string;
    amount: number;
    count: number;
  }[];
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy");
  } catch {
    return 'Invalid Date';
  }
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy, hh:mm a");
  } catch {
    return 'N/A';
  }
};

const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, "hh:mm a");
  } catch {
    return 'N/A';
  }
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const getPaymentMethodIcon = (method: PaymentMethod) => {
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

const getPaymentMethodColor = (method: PaymentMethod): string => {
  switch (method) {
    case "cash":
      return "bg-green-100 text-green-800 border-green-200";
    case "online":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cheque":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "dd":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "upi":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case "cash":
      return "Cash";
    case "online":
      return "Online Transfer";
    case "cheque":
      return "Cheque";
    case "dd":
      return "Demand Draft";
    case "upi":
      return "UPI";
    default:
      return "Other";
  }
};

const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || "PMC TECH SCHOOL";
const SCHOOL_ADDRESS = import.meta.env.VITE_SCHOOL_ADDRESS || "Hosur - Krishnagiri Highways, Tamil Nadu - 635 117";

// ==================== MAIN COMPONENT ====================

export default function DailyCollectionReport() {
  const navigate = useNavigate();

  // Initialize with today's date (backend now returns IST-aware dates)
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  // ==================== DATA LOADING ====================

  const loadReport = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await cashierService.getDailyCollectionReport(selectedDate);
      setData(response.data?.data || null);
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Failed to load daily collection report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ==================== FILTERED TRANSACTIONS ====================

  const filteredTransactions = useMemo(() => {
    if (!data?.payments) return [];

    return data.payments.filter((tx) => {
      // Payment method filter
      const matchesMethod = paymentMethodFilter === "all" || tx.paymentMethod === paymentMethodFilter;

      // Amount filter
      const matchesMin = minAmount === "" || tx.amount >= parseFloat(minAmount);
      const matchesMax = maxAmount === "" || tx.amount <= parseFloat(maxAmount);

      return matchesMethod && matchesMin && matchesMax;
    });
  }, [data?.payments, paymentMethodFilter, minAmount, maxAmount]);

  // ==================== CHART DATA ====================

  const paymentMethodChartData = useMemo(() => {
    if (!data?.paymentMethods) return [];
    return data.paymentMethods;
  }, [data?.paymentMethods]);

  const hourlyChartData = useMemo(() => {
    if (!data?.hourlyBreakdown) return [];
    return data.hourlyBreakdown.map((h) => ({
      hour: `${h.hour}:00`,
      amount: h.amount,
      count: h.count,
    }));
  }, [data?.hourlyBreakdown]);

  // ==================== HANDLERS ====================

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handlePreviousDay = () => {
    const prevDate = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prevDate, "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    const nextDate = subDays(parseISO(selectedDate), -1);
    if (nextDate <= new Date()) {
      setSelectedDate(format(nextDate, "yyyy-MM-dd"));
    }
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleViewTransaction = (transaction: Transaction) => {
    try {
      setSelectedTransaction(transaction);
      setShowTransactionDialog(true);
    } catch (error) {
      console.error('Error opening transaction dialog:', error);
      toast.error('Failed to open transaction details');
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Create CSV content
    const headers = [
      "Receipt No",
      "Time",
      "Student Name",
      "Class",
      "Admission No",
      "Amount",
      "Payment Method",
      "Received By",
    ];

    const rows = data.payments.map((p) => [
      p.receiptNumber,
      formatTime(p.createdAt),
      `${p.studentId?.personal?.firstName || ""} ${p.studentId?.personal?.lastName || ""}`,
      `${p.studentId?.academic?.class || ""}-${p.studentId?.academic?.section || ""}`,
      p.studentId?.academic?.admissionNumber || "",
      p.amount,
      p.paymentMethod,
      p.receivedBy?.name || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collection-report-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    toast.success("Report exported successfully");
  };

  const handleExportPDF = () => {
    if (!data) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const htmlContent = generateReportHTML(data, selectedDate);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();

    setShowExportDialog(false);
    toast.success("Report generated for printing");
  };

  const generateReportHTML = (reportData: ReportData, date: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Collection Report - ${formatDate(date)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .report { max-width: 1200px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #2563eb; }
          .header p { margin: 5px 0; color: #666; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa; }
          .summary-card .label { font-size: 12px; color: #666; }
          .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .method-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 30px; }
          .method-card { padding: 15px; border-radius: 8px; text-align: center; }
          .method-cash { background: #d1fae5; }
          .method-online { background: #dbeafe; }
          .method-cheque { background: #f3e8ff; }
          .method-dd { background: #fff3cd; }
          .method-upi { background: #e0f2fe; }
          .method-other { background: #f3f4f6; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total-row { background: #f8f9fa; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>${SCHOOL_NAME}</h1>
            <p>${SCHOOL_ADDRESS}</p>
            <h2>Daily Collection Report</h2>
            <p>Date: ${formatDate(date)}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="label">Total Collection</div>
              <div class="value">₹ ${reportData.summary.total.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="label">Transactions</div>
              <div class="value">${reportData.summary.count}</div>
            </div>
            <div class="summary-card">
              <div class="label">Average</div>
              <div class="value">₹ ${reportData.summary.averageTransaction.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="label">Highest</div>
              <div class="value">₹ ${reportData.summary.highestTransaction.toLocaleString()}</div>
            </div>
          </div>

          <div class="method-grid">
            <div class="method-card method-cash">
              <div class="label">Cash</div>
              <div style="font-size: 18px; font-weight: bold;">₹ ${reportData.summary.cash.toLocaleString()}</div>
              <div style="font-size: 12px;">${reportData.summary.cashCount} txns</div>
            </div>
            <div class="method-card method-online">
              <div class="label">Online</div>
              <div style="font-size: 18px; font-weight: bold;">₹ ${reportData.summary.online.toLocaleString()}</div>
              <div style="font-size: 12px;">${reportData.summary.onlineCount} txns</div>
            </div>
            <div class="method-card method-cheque">
              <div class="label">Cheque</div>
              <div style="font-size: 18px; font-weight: bold;">₹ ${reportData.summary.cheque.toLocaleString()}</div>
              <div style="font-size: 12px;">${reportData.summary.chequeCount} txns</div>
            </div>
            <div class="method-card method-dd">
              <div class="label">DD</div>
              <div style="font-size: 18px; font-weight: bold;">₹ ${reportData.summary.dd.toLocaleString()}</div>
              <div style="font-size: 12px;">${reportData.summary.ddCount} txns</div>
            </div>
            <div class="method-card method-upi">
              <div class="label">UPI</div>
              <div style="font-size: 18px; font-weight: bold;">₹ ${reportData.summary.upi.toLocaleString()}</div>
              <div style="font-size: 12px;">${reportData.summary.upiCount} txns</div>
            </div>
          </div>

          <h3>Transaction Details</h3>
          <table>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Time</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.payments.map((p) => `
                <tr>
                  <td>${p.receiptNumber}</td>
                  <td>${formatTime(p.createdAt)}</td>
                  <td>${p.studentId?.personal?.firstName || ""} ${p.studentId?.personal?.lastName || ""}</td>
                  <td>${p.studentId?.academic?.class || ""}-${p.studentId?.academic?.section || ""}</td>
                  <td>₹ ${p.amount.toLocaleString()}</td>
                  <td>${p.paymentMethod}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total</td>
                <td>₹ ${reportData.summary.total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on: ${formatDateTime(new Date().toISOString())}</p>
            <p>This is a computer generated report.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Daily Collection Report</h1>
        <p className="text-muted-foreground mt-1">
          View and analyze daily fee collections
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => loadReport(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowPrintDialog(true)}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );

  const renderDateSelector = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(parseISO(selectedDate), "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISO(selectedDate)}
                  onSelect={(date) => date && handleDateChange(format(date, "yyyy-MM-dd"))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSummary = () => {
    if (!data) return null;

    return (
      <>
        {/* Main Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collection</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.summary.total)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">{data.summary.count} transactions</span>
                <span className="text-muted-foreground">
                  Avg: {formatCurrency(data.summary.averageTransaction)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Highest Transaction</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.summary.highestTransaction)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Previous Day</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(data.previousDayComparison?.total || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <History className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              {data.previousDayComparison && (
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {data.previousDayComparison.difference > 0 ? (
                    <>
                      <ArrowUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        +{formatCurrency(data.previousDayComparison.difference)} (
                        {data.previousDayComparison.percentageChange.toFixed(1)}%)
                      </span>
                    </>
                  ) : data.previousDayComparison.difference < 0 ? (
                    <>
                      <ArrowDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">
                        {formatCurrency(data.previousDayComparison.difference)} (
                        {data.previousDayComparison.percentageChange.toFixed(1)}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600">No change</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Week to Date</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.weekToDate?.total || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg: {formatCurrency(data.weekToDate?.average || 0)} per day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Payment Method Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Cash</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(data.summary.cash)}</span>
                </div>
                <Progress 
                  value={(data.summary.cash / data.summary.total) * 100} 
                  className="h-2 bg-gray-200" 
                />
                <p className="text-xs text-muted-foreground">{data.summary.cashCount} transactions</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Online</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(data.summary.online)}</span>
                </div>
                <Progress 
                  value={(data.summary.online / data.summary.total) * 100} 
                  className="h-2 bg-gray-200" 
                />
                <p className="text-xs text-muted-foreground">{data.summary.onlineCount} transactions</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Cheque</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(data.summary.cheque)}</span>
                </div>
                <Progress 
                  value={(data.summary.cheque / data.summary.total) * 100} 
                  className="h-2 bg-gray-200" 
                />
                <p className="text-xs text-muted-foreground">{data.summary.chequeCount} transactions</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">DD</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(data.summary.dd)}</span>
                </div>
                <Progress 
                  value={(data.summary.dd / data.summary.total) * 100} 
                  className="h-2 bg-gray-200" 
                />
                <p className="text-xs text-muted-foreground">{data.summary.ddCount} transactions</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm">UPI</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(data.summary.upi)}</span>
                </div>
                <Progress 
                  value={(data.summary.upi / data.summary.total) * 100} 
                  className="h-2 bg-gray-200" 
                />
                <p className="text-xs text-muted-foreground">{data.summary.upiCount} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Breakdown */}
        {data.hourlyBreakdown && data.hourlyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Hourly Collection Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-1">
                {hourlyChartData.map((item, index) => {
                  const maxAmount = Math.max(...hourlyChartData.map((d) => d.amount));
                  const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
                          style={{ height: `${Math.max(height, 5)}px`, minHeight: "20px" }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
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
        )}
      </>
    );
  };

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment Method" />
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

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min Amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-[120px]"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max Amount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-[120px]"
            />
          </div>

          {(paymentMethodFilter !== "all" || minAmount || maxAmount) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPaymentMethodFilter("all");
                setMinAmount("");
                setMaxAmount("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          <div className="ml-auto">
            <Badge variant="outline">
              {filteredTransactions.length} of {data?.payments?.length || 0} transactions
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTransactions = () => {
    if (!data) return null;

    return viewMode === "table" ? (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions found for this date</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Received By</TableHead>
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
                        <div className="text-sm">
                          <p>{formatTime(tx.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(
                                tx.studentId?.personal?.firstName || "",
                                tx.studentId?.personal?.lastName || ""
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {tx.studentId?.personal?.firstName || ""} {tx.studentId?.personal?.lastName || ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.studentId?.academic?.admissionNumber || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.studentId?.academic?.class || ""}-{tx.studentId?.academic?.section || ""}
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
                      <TableCell>{tx.receivedBy?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTransaction(tx)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={4} className="text-right">
                      Total
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(
                        filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
                      )}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransactions.map((tx) => (
          <Card key={tx._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{tx.receiptNumber}</p>
                  <p className="font-medium">
                    {tx.studentId?.personal?.firstName || ""} {tx.studentId?.personal?.lastName || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.studentId?.academic?.class || ""}-{tx.studentId?.academic?.section || ""} •{" "}
                    {tx.studentId?.academic?.admissionNumber || ""}
                  </p>
                </div>
                <Badge className={getPaymentMethodColor(tx.paymentMethod)}>
                  {getPaymentMethodLabel(tx.paymentMethod)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-green-600">{formatCurrency(tx.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>{formatTime(tx.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received By</span>
                  <span>{tx.receivedBy?.name || "-"}</span>
                </div>
              </div>

              <div className="flex justify-end mt-3 pt-2 border-t">
                <Button size="sm" variant="ghost" onClick={() => handleViewTransaction(tx)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderTransactionDialog = () => {
    if (!selectedTransaction) return null;

    try {
      const tx = selectedTransaction;
      const method = tx.paymentMethod || 'cash';
      const firstName = tx.studentId?.personal?.firstName || '';
      const lastName = tx.studentId?.personal?.lastName || '';
      const className = tx.studentId?.academic?.class || '';
      const section = tx.studentId?.academic?.section || '';
      const admissionNo = tx.studentId?.academic?.admissionNumber || '';
      const receivedByName = tx.receivedBy?.name || '-';
      const dateTime = tx.createdAt ? formatDateTime(tx.createdAt) : 'N/A';

      return (
        <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Receipt Number</p>
                    <p className="font-mono font-bold">{tx.receiptNumber || 'N/A'}</p>
                  </div>
                  <Badge className={getPaymentMethodColor(method)}>
                    {getPaymentMethodLabel(method)}
                  </Badge>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student Name</p>
                    <p className="font-medium">{firstName} {lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-medium">{className}-{section}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admission No</p>
                    <p className="font-medium">{admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold text-green-600">{formatCurrency(tx.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{dateTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Received By</p>
                    <p className="font-medium">{receivedByName}</p>
                  </div>
                </div>

                {tx.feeType && tx.feeType.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-muted-foreground mb-2">Fee Breakdown</p>
                    <div className="space-y-1">
                      {tx.feeType.map((fee, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{fee.name}</span>
                          <span className="font-medium">{formatCurrency(fee.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tx.remarks && (
                  <>
                    <Separator className="my-3" />
                    <div>
                      <p className="text-xs text-muted-foreground">Remarks</p>
                      <p className="text-sm mt-1">{tx.remarks}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    } catch (error) {
      console.error('Error rendering transaction dialog:', error);
      return (
        <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <p>Failed to load transaction details.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
  };

  const renderExportDialog = () => (
    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose export format for the daily collection report
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV (Excel)
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportPDF}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF (Print)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowExportDialog(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderPrintDialog = () => (
    <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Report</DialogTitle>
          <DialogDescription>
            Configure print options for the daily collection report
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input defaultValue="Daily Collection Report" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch id="include-summary" defaultChecked />
              <Label htmlFor="include-summary">Include Summary</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-breakdown" defaultChecked />
              <Label htmlFor="include-breakdown">Include Payment Breakdown</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-transactions" defaultChecked />
              <Label htmlFor="include-transactions">Include Transaction List</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowPrintDialog(false);
            handleExportPDF();
          }}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== LOADING STATE ====================

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading daily collection report...</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderDateSelector()}

      {data ? (
        <>
          {renderSummary()}
          {renderFilters()}
          {renderTransactions()}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for selected date</p>
            <Button variant="outline" className="mt-4" onClick={handleToday}>
              View Today's Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {renderTransactionDialog()}
      {renderExportDialog()}
      {renderPrintDialog()}
    </div>
  );
}
