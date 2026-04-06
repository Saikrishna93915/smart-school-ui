import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  Eye,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  IndianRupee,
  Calendar as CalendarIcon,
  XCircle,
  AlertCircle,
  QrCode,
  FileSpreadsheet,
  FileJson,
  CreditCard,
  Landmark,
  Smartphone,
  Loader2,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cashierService } from "@/Services/cashierService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type Receipt = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: "cash" | "online" | "cheque" | "dd" | "upi";
  paymentMode: string;
  status: "completed" | "paid" | "pending" | "failed" | "refunded" | "cancelled" | "void";
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
    contact: {
      phone: string;
      email: string;
      address?: string;
    };
    parent: {
      fatherName: string;
      motherName: string;
      fatherPhone: string;
      motherPhone: string;
      fatherEmail?: string;
      motherEmail?: string;
    };
  };
  feeType: Array<{
    name: string;
    amount: number;
    description?: string;
  }>;
  transactionId?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  upiId?: string;
  cardLastFour?: string;
  cardType?: string;
  receivedBy: {
    _id: string;
    name: string;
    role: string;
  };
  receivedAt: string;
  remarks?: string;
  voidReason?: string;
  voidedBy?: {
    _id: string;
    name: string;
  };
  voidedAt?: string;
  downloadedAt?: string;
  downloadedBy?: string;
  emailedAt?: string;
  emailedTo?: string;
  printedAt?: string;
  printedBy?: string;
  createdAt: string;
  updatedAt: string;
};

type ReceiptStats = {
  totalCount: number;
  totalAmount: number;
  cashTotal: number;
  onlineTotal: number;
  chequeTotal: number;
  upiTotal: number;
  averageAmount: number;
  todayCount: number;
  todayAmount: number;
  thisWeekCount: number;
  thisWeekAmount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
  voidCount: number;
  voidAmount: number;
};

type ReceiptFilters = {
  search: string;
  fromDate: Date | null;
  toDate: Date | null;
  paymentMethod: string;
  status: string;
  class: string;
  section: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
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

const getPaymentMethodLabel = (method: string): string => {
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
      return method;
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
    case "void":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Void</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || "PMC TECH SCHOOL";
const SCHOOL_ADDRESS = import.meta.env.VITE_SCHOOL_ADDRESS || "Hosur - Krishnagiri Highways, Tamil Nadu - 635 117";



// ==================== MAIN COMPONENT ====================

export default function CashierReceipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [filters, setFilters] = useState<ReceiptFilters>({
    search: "",
    fromDate: null,
    toDate: null,
    paymentMethod: "all",
    status: "all",
    class: "all",
    section: "all",
    minAmount: "",
    maxAmount: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });

  const availableClasses = useMemo(
    () =>
      Array.from(
        new Set(
          receipts
            .map((receipt) => receipt.studentId?.academic?.class)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [receipts]
  );

  const availableSections = useMemo(
    () =>
      Array.from(
        new Set(
          receipts
            .map((receipt) => receipt.studentId?.academic?.section)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [receipts]
  );

  // ==================== DATA LOADING ====================

  const loadReceipts = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Build query params
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate.toISOString().split("T")[0];
      if (filters.toDate) params.toDate = filters.toDate.toISOString().split("T")[0];
      if (filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.class !== "all") params.class = filters.class;
      if (filters.section !== "all") params.section = filters.section;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response = await cashierService.getCashierReceipts(params);
      const data = response.data?.data || {};
      
      setReceipts(data.receipts || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading receipts:", error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  // ==================== FILTER HANDLERS ====================

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadReceipts();
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      fromDate: null,
      toDate: null,
      paymentMethod: "all",
      status: "all",
      class: "all",
      section: "all",
      minAmount: "",
      maxAmount: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 20,
    });
    toast.success("Filters reset");
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // ==================== ACTION HANDLERS ====================

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDialog(true);
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowPrintDialog(true);
  };

  const handleEmailReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEmailAddress(receipt.studentId?.contact?.email || receipt.studentId?.parent?.fatherEmail || "");
    setShowEmailDialog(true);
  };

  const handleVoidReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowVoidDialog(true);
  };

  const confirmVoidReceipt = async () => {
    if (!selectedReceipt || !voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }

    try {
      await cashierService.voidTransaction(selectedReceipt._id, { reason: voidReason });
      toast.success("Receipt voided successfully");
      setShowVoidDialog(false);
      setVoidReason("");
      loadReceipts(true);
    } catch (error) {
      toast.error("Failed to void receipt");
    }
  };

  const confirmPrintReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      // Open print dialog
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow pop-ups to print");
        return;
      }

      // Generate receipt HTML
      const htmlContent = generateReceiptHTML(selectedReceipt);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();

      // Update print count and save to local drive
      await cashierService.markReceiptPrinted(selectedReceipt._id);
      
      setShowPrintDialog(false);
      toast.success("Receipt sent to printer");
    } catch (error) {
      toast.error("Failed to print receipt");
    }
  };

  const confirmEmailReceipt = async () => {
    if (!selectedReceipt || !emailAddress.trim()) {
      toast.error("Please provide an email address");
      return;
    }

    try {
      await cashierService.emailReceipt(selectedReceipt._id, { email: emailAddress });
      toast.success(`Receipt sent to ${emailAddress}`);
      setShowEmailDialog(false);
      setEmailAddress("");
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = [
      "Receipt No",
      "Date",
      "Student Name",
      "Class",
      "Section",
      "Admission No",
      "Amount",
      "Payment Method",
      "Status",
      "Received By",
    ];

    const rows = receipts.map((r) => [
      r.receiptNumber,
      formatDate(r.createdAt),
      `${r.studentId?.personal?.firstName} ${r.studentId?.personal?.lastName}`,
      r.studentId?.academic?.class || "-",
      r.studentId?.academic?.section || "-",
      r.studentId?.academic?.admissionNumber || "-",
      r.amount,
      r.paymentMethod,
      r.status,
      r.receivedBy?.name || "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    toast.success("Receipts exported successfully");
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
    setShowExportDialog(false);
  };

  // ==================== RECEIPT HTML GENERATOR ====================

  const generateReceiptHTML = (receipt: Receipt): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receiptNumber}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; }
          .receipt { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #2563eb; }
          .header p { margin: 5px 0; color: #666; }
          .receipt-no { font-size: 18px; font-weight: bold; text-align: right; margin-bottom: 20px; }
          .student-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .student-info h3 { margin: 0 0 10px 0; color: #333; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { display: flex; }
          .info-label { font-weight: bold; width: 120px; color: #666; }
          .info-value { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { background: #f8f9fa; font-weight: bold; }
          .amount-in-words { margin: 20px 0; padding: 10px; background: #f0f9ff; border-left: 4px solid #2563eb; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature { text-align: center; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 40px; padding-top: 5px; }
          .status-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-completed { background: #10b981; color: white; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${SCHOOL_NAME}</h1>
            <p>${SCHOOL_ADDRESS}</p>
            <p>Phone: +91 XXXXXXXXXX | Email: office@pmctechschool.com</p>
            <h2>FEE PAYMENT RECEIPT</h2>
          </div>

          <div class="receipt-no">
            Receipt No: ${receipt.receiptNumber}
          </div>

          <div class="student-info">
            <h3>Student Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${receipt.studentId?.personal?.firstName} ${receipt.studentId?.personal?.lastName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${receipt.studentId?.academic?.class} - ${receipt.studentId?.academic?.section}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Admission No:</span>
                <span class="info-value">${receipt.studentId?.academic?.admissionNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Roll No:</span>
                <span class="info-value">${receipt.studentId?.academic?.rollNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Father's Name:</span>
                <span class="info-value">${receipt.studentId?.parent?.fatherName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Mother's Name:</span>
                <span class="info-value">${receipt.studentId?.parent?.motherName}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Description</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.feeType?.map((fee) => `
                <tr>
                  <td>${fee.name}</td>
                  <td>${fee.description || '-'}</td>
                  <td>${fee.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="2" style="text-align: right;">Total Amount:</td>
                <td>₹ ${receipt.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-in-words">
            <strong>Amount in Words:</strong> ${numberToWords(receipt.amount)} Rupees Only
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${getPaymentMethodLabel(receipt.paymentMethod)}</span>
            </div>
            ${receipt.paymentMethod === 'cheque' ? `
              <div class="info-item">
                <span class="info-label">Cheque No:</span>
                <span class="info-value">${receipt.chequeNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Bank:</span>
                <span class="info-value">${receipt.bankName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cheque Date:</span>
                <span class="info-value">${receipt.chequeDate ? formatDate(receipt.chequeDate) : '-'}</span>
              </div>
            ` : ''}
            ${receipt.paymentMethod === 'upi' ? `
              <div class="info-item">
                <span class="info-label">UPI ID:</span>
                <span class="info-value">${receipt.upiId}</span>
              </div>
            ` : ''}
            ${receipt.transactionId ? `
              <div class="info-item">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${receipt.transactionId}</span>
              </div>
            ` : ''}
            <div class="info-item">
              <span class="info-label">Payment Date:</span>
              <span class="info-value">${formatDateTime(receipt.createdAt)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Received By:</span>
              <span class="info-value">${receipt.receivedBy?.name}</span>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <p>Cashier's Signature</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p>Authorized Signature</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>This is a computer generated receipt. Valid with signature.</p>
            <p>${SCHOOL_NAME} | ${SCHOOL_ADDRESS}</p>
            <p>Generated on: ${formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Simple number to words converter (you'd want a proper library in production)
  const numberToWords = (num: number): string => {
    // Simplified version - in production use a proper library
    return num.toString();
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{stats.totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount: {formatCurrency(stats.totalAmount)}
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
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.todayCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.todayAmount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeekCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.thisWeekAmount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.thisMonthCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.thisMonthAmount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by receipt no, student name, admission no..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>

          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filters.fromDate || filters.toDate || filters.paymentMethod !== "all" || 
              filters.status !== "all" || filters.class !== "all" || filters.minAmount) && (
              <Badge className="ml-2 bg-blue-600 text-white h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>

          <Button variant="outline" onClick={handleResetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <div className="flex items-center gap-2 ml-auto">
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
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={filters.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="20 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => loadReceipts(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fromDate ? format(filters.fromDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.fromDate || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, fromDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.toDate ? format(filters.toDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.toDate || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, toDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={filters.class}
                onValueChange={(value) => setFilters(prev => ({ ...prev, class: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={filters.section}
                onValueChange={(value) => setFilters(prev => ({ ...prev, section: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      Section {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Amount</Label>
              <Input
                type="number"
                placeholder="Min ₹"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Amount</Label>
              <Input
                type="number"
                placeholder="Max ₹"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full" onClick={handleSearch}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTable = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          Receipts List
          <Badge variant="outline" className="ml-2">
            {totalRecords} total
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No receipts found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("receiptNumber")}>
                      <div className="flex items-center">
                        Receipt No
                        {filters.sortBy === "receiptNumber" && (
                          filters.sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center">
                        Date
                        {filters.sortBy === "createdAt" && (
                          filters.sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                      <div className="flex items-center">
                        Amount
                        {filters.sortBy === "amount" && (
                          filters.sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt._id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs font-medium">
                        {receipt.receiptNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(receipt.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(receipt.createdAt), "hh:mm a")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(
                                receipt.studentId?.personal?.firstName || "",
                                receipt.studentId?.personal?.lastName || ""
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {receipt.studentId?.personal?.firstName} {receipt.studentId?.personal?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {receipt.studentId?.academic?.admissionNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {receipt.studentId?.academic?.class}-{receipt.studentId?.academic?.section}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(receipt.paymentMethod)}
                          <span className="text-xs capitalize">{receipt.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell>{receipt.receivedBy?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewReceipt(receipt)}
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintReceipt(receipt)}
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEmailReceipt(receipt)}
                            title="Email Receipt"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {(receipt.status === "completed" || receipt.status === "paid") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleVoidReceipt(receipt)}
                              title="Void Receipt"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((filters.page - 1) * filters.limit) + 1} to{" "}
                {Math.min(filters.page * filters.limit, totalRecords)} of {totalRecords} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {receipts.map((receipt) => (
        <Card key={receipt._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{receipt.receiptNumber}</p>
                <p className="font-medium">
                  {receipt.studentId?.personal?.firstName} {receipt.studentId?.personal?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {receipt.studentId?.academic?.class}-{receipt.studentId?.academic?.section} •{" "}
                  {receipt.studentId?.academic?.admissionNumber}
                </p>
              </div>
              {getStatusBadge(receipt.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(receipt.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-green-600">{formatCurrency(receipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <div className="flex items-center gap-1">
                  {getPaymentMethodIcon(receipt.paymentMethod)}
                  <span className="capitalize">{receipt.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
              <Button size="sm" variant="ghost" onClick={() => handleViewReceipt(receipt)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handlePrintReceipt(receipt)}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderReceiptDialog = () => (
    <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Receipt Details
          </DialogTitle>
        </DialogHeader>
        {selectedReceipt && (
          <div className="space-y-4 py-4">
            {/* Receipt Header */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-bold text-lg">{selectedReceipt.receiptNumber}</p>
                </div>
                {getStatusBadge(selectedReceipt.status)}
              </div>

              <Separator className="my-3" />

              {/* Student Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Student Name</p>
                  <p className="font-medium">
                    {selectedReceipt.studentId?.personal?.firstName}{" "}
                    {selectedReceipt.studentId?.personal?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">
                    {selectedReceipt.studentId?.academic?.class}-
                    {selectedReceipt.studentId?.academic?.section}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Admission No</p>
                  <p className="font-medium">{selectedReceipt.studentId?.academic?.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{selectedReceipt.studentId?.academic?.rollNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{selectedReceipt.studentId?.parent?.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mother's Name</p>
                  <p className="font-medium">{selectedReceipt.studentId?.parent?.motherName}</p>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReceipt.feeType?.map((fee, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{fee.name}</TableCell>
                      <TableCell>{fee.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(fee.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={2} className="text-right">
                      Total Amount
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(selectedReceipt.amount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <div className="flex items-center gap-2 mt-1">
                  {getPaymentMethodIcon(selectedReceipt.paymentMethod)}
                  <span className="font-medium capitalize">
                    {getPaymentMethodLabel(selectedReceipt.paymentMethod)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Payment Date & Time</p>
                <p className="font-medium">{formatDateTime(selectedReceipt.createdAt)}</p>
              </div>

              {selectedReceipt.paymentMethod === "cheque" && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700">Cheque Details</p>
                  <p className="text-sm mt-1">
                    Cheque No: {selectedReceipt.chequeNumber}<br />
                    Bank: {selectedReceipt.bankName}<br />
                    Date: {selectedReceipt.chequeDate && formatDate(selectedReceipt.chequeDate)}
                  </p>
                </div>
              )}

              {selectedReceipt.paymentMethod === "upi" && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-700">UPI Details</p>
                  <p className="text-sm mt-1">UPI ID: {selectedReceipt.upiId}</p>
                </div>
              )}

              {selectedReceipt.transactionId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">Transaction ID</p>
                  <p className="text-sm mt-1">{selectedReceipt.transactionId}</p>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Received By</p>
                <p className="font-medium">{selectedReceipt.receivedBy?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedReceipt.receivedBy?.role}</p>
              </div>
            </div>

            {/* Void Information */}
            {selectedReceipt.status === "void" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Void Information</p>
                </div>
                <p className="text-sm mt-1">Reason: {selectedReceipt.voidReason}</p>
                <p className="text-xs text-red-600 mt-1">
                  Voided by: {selectedReceipt.voidedBy?.name} on{" "}
                  {selectedReceipt.voidedAt && formatDateTime(selectedReceipt.voidedAt)}
                </p>
              </div>
            )}

            {/* Remarks */}
            {selectedReceipt.remarks && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">Remarks</p>
                <p className="text-sm mt-1">{selectedReceipt.remarks}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              setShowReceiptDialog(false);
              handlePrintReceipt(selectedReceipt!);
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderVoidDialog = () => (
    <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void Receipt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to void receipt {selectedReceipt?.receiptNumber}? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="void-reason">Reason for voiding</Label>
          <Textarea
            id="void-reason"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="e.g., Wrong amount, Duplicate entry, Payment failed..."
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowVoidDialog(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmVoidReceipt} className="bg-red-600 hover:bg-red-700">
            Void Receipt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderPrintDialog = () => (
    <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Receipt</DialogTitle>
          <DialogDescription>
            Choose print options for receipt {selectedReceipt?.receiptNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Print Size</Label>
            <Select defaultValue="a4">
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 Paper</SelectItem>
                <SelectItem value="a5">A5 Paper</SelectItem>
                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch id="include-logo" defaultChecked />
              <Label htmlFor="include-logo">Include School Logo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-signature" defaultChecked />
              <Label htmlFor="include-signature">Include Signature</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-qr" />
              <Label htmlFor="include-qr">Include QR Code</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
            Cancel
          </Button>
          <Button onClick={confirmPrintReceipt}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEmailDialog = () => (
    <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Email Receipt</DialogTitle>
          <DialogDescription>
            Send receipt {selectedReceipt?.receiptNumber} via email
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
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Enter any additional message..."
              className="min-h-[100px]"
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
  );

  const renderExportDialog = () => (
    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Receipts</DialogTitle>
          <DialogDescription>
            Choose export format and options
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
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              toast.info("JSON export coming soon");
              setShowExportDialog(false);
            }}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
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

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cashier Receipts</h1>
        <Button variant="outline" onClick={() => navigate("/cashier/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {renderStats()}
      {renderFilters()}

      {viewMode === "table" ? renderTable() : renderGridView()}

      {/* Dialogs */}
      {renderReceiptDialog()}
      {renderVoidDialog()}
      {renderPrintDialog()}
      {renderEmailDialog()}
      {renderExportDialog()}
    </div>
  );
}
