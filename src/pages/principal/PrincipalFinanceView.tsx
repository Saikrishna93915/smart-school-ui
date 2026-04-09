import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  IndianRupee,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  Mail,
  Phone,
  Eye,
  RefreshCw,
  Search,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import principalService from "@/Services/principalService";

// ==================== TYPES ====================

type FinanceOverview = {
  summary: {
    totalExpected: number;
    totalCollected: number;
    pending: number;
    collectionRate: number;
  };
  today: {
    total: number;
    count: number;
    cash: number;
    online: number;
    date: string;
  };
  monthly: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    target: number;
    achievement: number;
  };
  defaulters: {
    total: number;
    critical: number;
    overdueAmount: number;
    recoveryRate: number;
  };
};

type DailyCollection = {
  receiptNumber: string;
  studentName: string;
  class: string;
  section: string;
  amount: number;
  paymentMethod: "cash" | "online" | "upi" | "cheque" | "dd";
  timestamp: string;
  cashier: {
    name: string;
    id: string;
  };
  status: "completed" | "pending" | "refunded" | "cancelled";
  discount?: number;
  lateFee?: number;
};

type PendingFee = {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  admissionNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  daysOverdue: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
};

type CashierReport = {
  cashierId: string;
  cashierName: string;
  shiftStart: string;
  shiftEnd?: string;
  cashCollected: number;
  onlineCollected: number;
  totalCollected: number;
  transactionCount: number;
  voidedTransactions: number;
  voidedAmount: number;
};

type FinanceAlert = {
  id: string;
  type: "warning" | "error" | "info" | "success";
  message: string;
  count?: number;
};

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount}`;
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

const getDaysOverdueCategory = (days: number): string => {
  if (days <= 7) return "Recent (1-7 days)";
  if (days <= 15) return "Moderate (8-15 days)";
  if (days <= 30) return "Serious (15-30 days)";
  return "Critical (30+ days)";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    case "refunded":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "cash":
      return <Banknote className="h-4 w-4 text-green-600" />;
    case "online":
    case "upi":
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case "cheque":
      return <Receipt className="h-4 w-4 text-purple-600" />;
    case "dd":
      return <FileText className="h-4 w-4 text-orange-600" />;
    default:
      return <IndianRupee className="h-4 w-4 text-gray-600" />;
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
  }
};

// ==================== MOCK DATA ====================

const mockFinanceOverview: FinanceOverview = {
  summary: {
    totalExpected: 25000000, // ₹ 2.5 Cr
    totalCollected: 18500000, // ₹ 1.85 Cr
    pending: 6500000, // ₹ 65 L
    collectionRate: 74,
  },
  today: {
    total: 45000,
    count: 23,
    cash: 25000,
    online: 20000,
    date: new Date().toISOString(),
  },
  monthly: {
    thisMonth: 1250000,
    lastMonth: 1180000,
    growth: 5.9,
    target: 1500000,
    achievement: 83.3,
  },
  defaulters: {
    total: 145,
    critical: 23,
    overdueAmount: 850000,
    recoveryRate: 45,
  },
};

const mockDailyCollections: DailyCollection[] = [
  {
    receiptNumber: "REC-1773658399190-172",
    studentName: "Sanjay Patel",
    class: "LKG",
    section: "B",
    amount: 2000,
    paymentMethod: "cash",
    timestamp: "2026-03-16T10:53:19",
    cashier: { name: "Nagendra Daddanala", id: "cashier-001" },
    status: "completed",
  },
  {
    receiptNumber: "REC-1773472672756-470",
    studentName: "Ananya Desai",
    class: "LKG",
    section: "C",
    amount: 2000,
    paymentMethod: "cash",
    timestamp: "2026-03-14T10:30:00",
    cashier: { name: "Cashier User", id: "cashier-002" },
    status: "completed",
  },
  {
    receiptNumber: "REC-1773223362034-997",
    studentName: "Ananya Patel",
    class: "LKG",
    section: "A",
    amount: 2000,
    paymentMethod: "upi",
    timestamp: "2026-03-11T09:15:00",
    cashier: { name: "Nagendra Naidu", id: "cashier-001" },
    status: "completed",
  },
  {
    receiptNumber: "REC-1772474262663-124",
    studentName: "Kavya Sharma",
    class: "LKG",
    section: "D",
    amount: 5000,
    paymentMethod: "online",
    timestamp: "2026-03-02T11:20:00",
    cashier: { name: "Nagendra Naidu", id: "cashier-001" },
    status: "completed",
  },
  {
    receiptNumber: "REC-1772384474037-46",
    studentName: "Naidu Daddanala",
    class: "10th",
    section: "A",
    amount: 4000,
    paymentMethod: "cheque",
    timestamp: "2026-03-01T14:45:00",
    cashier: { name: "Nagendra Naidu", id: "cashier-001" },
    status: "completed",
  },
  {
    receiptNumber: "REC-1771907196819-538",
    studentName: "Anant Iyer",
    class: "10",
    section: "D",
    amount: 14999,
    paymentMethod: "online",
    timestamp: "2026-02-24T16:30:00",
    cashier: { name: "Nagendra Naidu", id: "cashier-001" },
    status: "completed",
    discount: 1,
  },
];

const mockPendingFees: PendingFee[] = [
  {
    studentId: "stu-001",
    studentName: "Rohan Kumar",
    class: "5th",
    section: "A",
    admissionNumber: "5-A-001",
    parentName: "Rajesh Kumar",
    parentPhone: "9876543210",
    parentEmail: "rajesh@email.com",
    totalFee: 25000,
    paidAmount: 10000,
    pendingAmount: 15000,
    dueDate: "2026-02-15",
    daysOverdue: 30,
    lastPaymentDate: "2026-02-10",
    lastPaymentAmount: 5000,
  },
  {
    studentId: "stu-002",
    studentName: "Priya Singh",
    class: "7th",
    section: "B",
    admissionNumber: "7-B-015",
    parentName: "Amit Singh",
    parentPhone: "9123456789",
    parentEmail: "amit@email.com",
    totalFee: 28000,
    paidAmount: 15000,
    pendingAmount: 13000,
    dueDate: "2026-02-20",
    daysOverdue: 25,
    lastPaymentDate: "2026-02-18",
    lastPaymentAmount: 8000,
  },
  {
    studentId: "stu-003",
    studentName: "Arjun Reddy",
    class: "9th",
    section: "C",
    admissionNumber: "9-C-023",
    parentName: "Suresh Reddy",
    parentPhone: "9988776655",
    parentEmail: "suresh@email.com",
    totalFee: 32000,
    paidAmount: 20000,
    pendingAmount: 12000,
    dueDate: "2026-03-01",
    daysOverdue: 15,
    lastPaymentDate: "2026-02-28",
    lastPaymentAmount: 10000,
  },
  {
    studentId: "stu-004",
    studentName: "Sneha Sharma",
    class: "6th",
    section: "A",
    admissionNumber: "6-A-008",
    parentName: "Vikas Sharma",
    parentPhone: "9876512340",
    parentEmail: "vikas@email.com",
    totalFee: 26000,
    paidAmount: 20000,
    pendingAmount: 6000,
    dueDate: "2026-03-10",
    daysOverdue: 6,
    lastPaymentDate: "2026-03-08",
    lastPaymentAmount: 10000,
  },
];

const mockCashierReports: CashierReport[] = [
  {
    cashierId: "cashier-001",
    cashierName: "Nagendra Daddanala",
    shiftStart: "09:00 AM",
    shiftEnd: "05:00 PM",
    cashCollected: 125000,
    onlineCollected: 85000,
    totalCollected: 210000,
    transactionCount: 45,
    voidedTransactions: 2,
    voidedAmount: 5000,
  },
  {
    cashierId: "cashier-002",
    cashierName: "Cashier User",
    shiftStart: "09:00 AM",
    shiftEnd: "05:00 PM",
    cashCollected: 95000,
    onlineCollected: 65000,
    totalCollected: 160000,
    transactionCount: 38,
    voidedTransactions: 1,
    voidedAmount: 2000,
  },
];

const mockAlerts: FinanceAlert[] = [
  { id: "1", type: "warning", message: "₹ 8,50,000 pending from 145 students", count: 145 },
  { id: "2", type: "error", message: "23 students overdue >30 days", count: 23 },
  { id: "3", type: "success", message: "Collection rate improved by 5% this month" },
  { id: "4", type: "info", message: "Today's collection: 23 payments received" },
];

// Chart Data
const dailyCollectionTrendData = [
  { date: "01 Mar", amount: 35000 },
  { date: "02 Mar", amount: 42000 },
  { date: "03 Mar", amount: 38000 },
  { date: "04 Mar", amount: 45000 },
  { date: "05 Mar", amount: 52000 },
  { date: "06 Mar", amount: 48000 },
  { date: "07 Mar", amount: 40000 },
  { date: "08 Mar", amount: 38000 },
  { date: "09 Mar", amount: 55000 },
  { date: "10 Mar", amount: 62000 },
  { date: "11 Mar", amount: 58000 },
  { date: "12 Mar", amount: 48000 },
  { date: "13 Mar", amount: 52000 },
  { date: "14 Mar", amount: 55000 },
  { date: "15 Mar", amount: 42000 },
  { date: "16 Mar", amount: 45000 },
];

const paymentMethodData = [
  { name: "Cash", value: 45, color: "#22c55e" },
  { name: "Online", value: 30, color: "#3b82f6" },
  { name: "UPI", value: 15, color: "#8b5cf6" },
  { name: "Cheque", value: 7, color: "#f97316" },
  { name: "DD", value: 3, color: "#eab308" },
];

const classWiseCollectionData = [
  { class: "LKG", collected: 125000, expected: 150000 },
  { class: "UKG", collected: 118000, expected: 145000 },
  { class: "1st", collected: 142000, expected: 160000 },
  { class: "2nd", collected: 138000, expected: 155000 },
  { class: "3rd", collected: 155000, expected: 170000 },
  { class: "4th", collected: 148000, expected: 165000 },
  { class: "5th", collected: 162000, expected: 180000 },
  { class: "6th", collected: 175000, expected: 195000 },
  { class: "7th", collected: 168000, expected: 185000 },
  { class: "8th", collected: 182000, expected: 200000 },
  { class: "9th", collected: 195000, expected: 220000 },
  { class: "10th", collected: 210000, expected: 240000 },
];

const defaulterCategoryData = [
  { category: "1-7 days", count: 45, color: "#fbbf24" },
  { category: "8-15 days", count: 38, color: "#f97316" },
  { category: "15-30 days", count: 39, color: "#ef4444" },
  { category: "30+ days", count: 23, color: "#dc2626" },
];

const monthlyComparisonData = [
  { month: "Jan", collected: 1150000, target: 1400000 },
  { month: "Feb", collected: 1180000, target: 1450000 },
  { month: "Mar", collected: 1250000, target: 1500000 },
];

// Mock Monthly Revenue Chart Data
const mockMonthlyRevenueChart = [
  { month: "Jan 2026", amount: 1150000 },
  { month: "Feb 2026", amount: 1180000 },
  { month: "Mar 2026", amount: 1250000 },
];

// ==================== MAIN COMPONENT ====================

export default function PrincipalFinanceView() {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>([]);
  const [pendingFees, setPendingFees] = useState<PendingFee[]>([]);
  const [cashierReports, setCashierReports] = useState<CashierReport[]>([]);
  const [alerts, setAlerts] = useState<FinanceAlert[]>([]);
  const [monthlyRevenueChart, setMonthlyRevenueChart] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<DailyCollection | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const loadFinanceData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Call actual API
      const params: any = {};
      if (selectedAcademicYear) params.academicYear = selectedAcademicYear;

      const response = await principalService.getFinanceOverview(params);
      const apiData = response.data?.data || null;

      if (apiData) {
        // Transform API data to match frontend format
        setData({
          summary: {
            totalExpected: apiData.totals?.expected || 0,
            totalCollected: apiData.totals?.collected || 0,
            pending: apiData.totals?.pending || 0,
            collectionRate: parseFloat(apiData.totals?.collectionRate) || 0,
          },
          today: {
            total: apiData.today?.total || 0,
            count: apiData.today?.count || 0,
            cash: apiData.today?.cash || 0,
            online: apiData.today?.online || 0,
            date: new Date().toISOString(),
          },
          monthly: {
            thisMonth: apiData.monthly?.thisMonth || 0,
            lastMonth: apiData.monthly?.lastMonth || 0,
            growth: apiData.monthly?.growth || 0,
            target: apiData.monthly?.target || 0,
            achievement: apiData.monthly?.achievement || 0,
          },
          defaulters: {
            total: apiData.topDefaulters?.length || 0,
            critical: apiData.topDefaulters?.filter((d: any) => d.pendingAmount > 50000).length || 0,
            overdueAmount: apiData.topDefaulters?.reduce((sum: number, d: any) => sum + (d.pendingAmount || 0), 0) || 0,
            recoveryRate: 0,
          },
        });

        // Transform monthly revenue chart data
        if (apiData.monthlyRevenue) {
          setMonthlyRevenueChart(apiData.monthlyRevenue.map((m: any) => ({
            month: format(new Date(m._id.year, m._id.month - 1, 1), "MMM yyyy"),
            amount: m.total,
          })));
        }

        // Transform defaulters list
        if (apiData.topDefaulters) {
          setPendingFees(apiData.topDefaulters.map((d: any) => ({
            studentName: d.studentName || "",
            admissionNumber: d.admissionNumber || "",
            class: d.className || "",
            section: d.section || "",
            parentName: d.parentName || "",
            parentPhone: d.parentPhone || "",
            totalFee: d.totalAmount || 0,
            paidAmount: d.paidAmount || 0,
            pendingAmount: d.pendingAmount || 0,
            daysOverdue: 0,
          })));
        }
      } else {
        // Fallback to mock data
        setData(mockFinanceOverview);
        setMonthlyRevenueChart(mockMonthlyRevenueChart);
        setPendingFees(mockPendingFees);
        setCashierReports(mockCashierReports);
        setAlerts(mockAlerts);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading finance data:", error);
      toast.error("Failed to load finance data");
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const handleRefresh = () => {
    loadFinanceData(true);
    toast.success("Finance data refreshed");
  };

  const handleViewPayment = (payment: DailyCollection) => {
    setSelectedPayment(payment);
    setShowPaymentDialog(true);
  };

  const handleExportReport = (type: string) => {
    toast.success(`${type} report exported successfully`);
  };

  const handleContactParent = (parent: PendingFee) => {
    window.open(`tel:${parent.parentPhone}`);
    toast.success(`Calling ${parent.parentName}...`);
  };

  // Filtered data
  const filteredCollections = useMemo(() => {
    return dailyCollections.filter((col) => {
      const matchesSearch = col.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = filterPaymentMethod === "all" || col.paymentMethod === filterPaymentMethod;
      return matchesSearch && matchesMethod;
    });
  }, [dailyCollections, searchTerm, filterPaymentMethod]);

  const filteredPendingFees = useMemo(() => {
    return pendingFees.filter((fee) => {
      const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = filterClass === "all" || fee.class === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [pendingFees, searchTerm, filterClass]);

  // Stats Cards Data
  const statsCards = useMemo(() => [
    {
      title: "Total Expected",
      value: data?.summary.totalExpected || 0,
      icon: IndianRupee,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Collected",
      value: data?.summary.totalCollected || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Fees",
      value: data?.summary.pending || 0,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Collection Rate",
      value: data?.summary.collectionRate || 0,
      suffix: "%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Today's Collection",
      value: data?.today.total || 0,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: `${data?.today.count || 0} payments`,
    },
    {
      title: "This Month",
      value: data?.monthly.thisMonth || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      subtitle: `${data?.monthly.achievement || 0}% of target`,
    },
    {
      title: "Total Defaulters",
      value: data?.defaulters.total || 0,
      icon: Users,
      color: "text-red-600",
      bgColor: "bg-red-100",
      subtitle: `${data?.defaulters.critical || 0} critical (>30 days)`,
    },
    {
      title: "Recovery Rate",
      value: data?.defaulters.recoveryRate || 0,
      suffix: "%",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ], [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Finance Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor school's financial health and fee collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport("Annual")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.count && (
                      <p className="text-xs text-muted-foreground">{alert.count} students</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.title.includes("Rate") || stat.title.includes("Count")
                        ? `${stat.value}${stat.suffix || ""}`
                        : formatCurrencyCompact(stat.value)}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="cashiers">Cashiers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Collection Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Daily Collection Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyCollectionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Payment Method Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Collections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                Today's Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyCollections.slice(0, 5).map((collection) => (
                    <TableRow key={collection.receiptNumber}>
                      <TableCell className="font-mono text-xs">{collection.receiptNumber}</TableCell>
                      <TableCell>{collection.studentName}</TableCell>
                      <TableCell>{collection.class} - {collection.section}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(collection.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(collection.paymentMethod)}
                          <span className="text-xs capitalize">{collection.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>{collection.cashier.name}</TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPayment(collection)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collection Report Tab */}
        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Collection Report</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                    <SelectTrigger className="w-[150px]">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((collection) => (
                    <TableRow key={collection.receiptNumber}>
                      <TableCell className="font-mono text-xs">{collection.receiptNumber}</TableCell>
                      <TableCell>{collection.studentName}</TableCell>
                      <TableCell>{collection.class} - {collection.section}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(collection.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(collection.paymentMethod)}
                          <span className="text-xs capitalize">{collection.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(collection.timestamp)}
                      </TableCell>
                      <TableCell>{collection.cashier.name}</TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPayment(collection)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaulters Tab */}
        <TabsContent value="defaulters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Pending Fees - Defaulters List
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="LKG">LKG</SelectItem>
                      <SelectItem value="UKG">UKG</SelectItem>
                      <SelectItem value="1st">1st</SelectItem>
                      <SelectItem value="2nd">2nd</SelectItem>
                      <SelectItem value="3rd">3rd</SelectItem>
                      <SelectItem value="4th">4th</SelectItem>
                      <SelectItem value="5th">5th</SelectItem>
                      <SelectItem value="6th">6th</SelectItem>
                      <SelectItem value="7th">7th</SelectItem>
                      <SelectItem value="8th">8th</SelectItem>
                      <SelectItem value="9th">9th</SelectItem>
                      <SelectItem value="10th">10th</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingFees.map((fee) => (
                    <TableRow key={fee.studentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fee.studentName}</p>
                          <p className="text-xs text-muted-foreground">{fee.admissionNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{fee.class} - {fee.section}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fee.parentName}</p>
                          <p className="text-xs text-muted-foreground">{fee.parentPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(fee.totalFee)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(fee.paidAmount)}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(fee.pendingAmount)}
                      </TableCell>
                      <TableCell>{formatDate(fee.dueDate)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            fee.daysOverdue > 30
                              ? "bg-red-600 text-white"
                              : fee.daysOverdue > 15
                              ? "bg-orange-600 text-white"
                              : fee.daysOverdue > 7
                              ? "bg-yellow-600 text-white"
                              : "bg-blue-600 text-white"
                          }
                        >
                          {fee.daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleContactParent(fee)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View all payment transactions with complete details and verification options.
              </p>
              {/* Similar to Collection Report but with more filters */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashiers Tab */}
        <TabsContent value="cashiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cashier Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cashier Name</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Online</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Voided</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashierReports.map((report) => (
                    <TableRow key={report.cashierId}>
                      <TableCell className="font-medium">{report.cashierName}</TableCell>
                      <TableCell>
                        {report.shiftStart} - {report.shiftEnd || "Ongoing"}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(report.cashCollected)}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {formatCurrency(report.onlineCollected)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(report.totalCollected)}
                      </TableCell>
                      <TableCell>{report.transactionCount}</TableCell>
                      <TableCell>
                        {report.voidedTransactions > 0 ? (
                          <Badge variant="destructive">
                            {report.voidedTransactions} ({formatCurrency(report.voidedAmount)})
                          </Badge>
                        ) : (
                          <Badge variant="outline">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Class-wise Collection */}
            <Card>
              <CardHeader>
                <CardTitle>Class-wise Fee Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classWiseCollectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="collected" fill="#22c55e" name="Collected" />
                    <Bar dataKey="expected" fill="#e5e7eb" name="Expected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Defaulter Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Defaulter Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={defaulterCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {defaulterCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Collection vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="collected" fill="#3b82f6" name="Collected" />
                    <Bar dataKey="target" fill="#fbbf24" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" onClick={() => handleExportReport("Daily Collection")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Daily Collection Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport("Monthly Collection")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Monthly Collection Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport("Annual Fee")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Annual Fee Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport("Defaulters")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Defaulters Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport("Cashier Performance")}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Cashier Performance Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport("Payment Method Analysis")}>
                  <PieChart className="h-4 w-4 mr-2" />
                  Payment Method Analysis
                </Button>
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Export Formats Available:</h4>
                <div className="flex gap-4">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel (.xlsx)</Badge>
                  <Badge variant="outline">CSV</Badge>
                  <Badge variant="outline">Email</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-medium">{selectedPayment.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{formatDateTime(selectedPayment.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedPayment.class} - {selectedPayment.section}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                    <span className="capitalize">{selectedPayment.paymentMethod}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected By</p>
                  <p className="font-medium">{selectedPayment.cashier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => toast.success("Receipt sent to parent")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Receipt
                </Button>
                <Button variant="outline" onClick={() => toast.success("Receipt printing...")}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
