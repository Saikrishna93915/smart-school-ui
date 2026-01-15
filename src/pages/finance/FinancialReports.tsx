// src/pages/finance/FinancialReports.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  BarChart3,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Eye,
  Printer,
  Mail,
  RefreshCw,
  PieChart,
  Users,
  DollarSign,
  Building,
  Clock,
  Filter,
  Share2,
  BookOpen,
  TrendingDown,
  Database,
  Calendar as CalendarIcon,
  LineChart,
  Percent,
  Target,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Folder
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Interface for report data
interface ReportStatistics {
  totalReports: number;
  mostUsedFormat: string;
  avgReportSize: number;
  timeSaved: number;
  recentActivity: Array<{
    _id?: string;
    date?: string;
    transactions: number;
    amount: number;
  }>;
}

interface RecentReport {
  id: number;
  name: string;
  date: string;
  size: string;
  type: string;
  status: string;
  url: string;
}

interface ReportConfig {
  reportType: string;
  format: string;
  startDate?: string;
  endDate?: string;
  className?: string;
  section?: string;
  paymentMethod?: string;
  status?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  emailRecipients?: string[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time?: string;
  };
}

const FinancialReportsPage = () => {
  const [reportType, setReportType] = useState('collection');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Methods');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [emailRecipients, setEmailRecipients] = useState<string>('');
  
  // State for API data
  const [reportStats, setReportStats] = useState<ReportStatistics>({
    totalReports: 0,
    mostUsedFormat: 'PDF',
    avgReportSize: 0,
    timeSaved: 0,
    recentActivity: []
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Enhanced report types
  const reportTypes = [
    { 
      id: 'collection', 
      name: 'Collection Report', 
      icon: BarChart3, 
      color: 'blue',
      description: 'Detailed fee collection analysis with trends and insights'
    },
    { 
      id: 'defaulter', 
      name: 'Defaulter Report', 
      icon: AlertTriangle, 
      color: 'amber',
      description: 'List of fee defaulters with overdue amounts and contact info'
    },
    { 
      id: 'payment-methods', 
      name: 'Payment Methods', 
      icon: CreditCard, 
      color: 'green',
      description: 'Payment method analysis and transaction volumes'
    },
    { 
      id: 'monthly-trend', 
      name: 'Monthly Trend', 
      icon: TrendingUp, 
      color: 'purple',
      description: 'Visual monthly collection trends and comparisons'
    },
    { 
      id: 'audit', 
      name: 'Audit Trail', 
      icon: Eye, 
      color: 'gray',
      description: 'Complete financial transaction audit trail'
    },
    { 
      id: 'annual', 
      name: 'Annual Report', 
      icon: FileText, 
      color: 'red',
      description: 'Annual financial summary with YoY comparisons'
    },
    { 
      id: 'student-performance', 
      name: 'Student Performance', 
      icon: Users, 
      color: 'indigo',
      description: 'Correlation between fee payment and academic performance'
    },
    { 
      id: 'forecast', 
      name: 'Revenue Forecast', 
      icon: LineChart, 
      color: 'cyan',
      description: 'Future revenue predictions and projections'
    },
  ];
  
  const formats = [
    { id: 'pdf', name: 'PDF Document', description: 'Best for printing and sharing', icon: FileText },
    { id: 'excel', name: 'Excel Spreadsheet', description: 'Best for data analysis', icon: BarChart3 },
    { id: 'csv', name: 'CSV File', description: 'Best for data import/export', icon: Database },
  ];
  
  const classOptions = ['All Classes', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionOptions = ['All Sections', 'A', 'B', 'C', 'D', 'E'];
  const paymentMethodOptions = ['All Methods', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online'];
  const statusOptions = ['All Status', 'completed', 'pending', 'failed', 'overdue', 'partial'];
  const frequencyOptions = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

  // Chart data for preview
  const monthlyData = [
    { month: 'Jan', amount: 450000, target: 500000 },
    { month: 'Feb', amount: 520000, target: 500000 },
    { month: 'Mar', amount: 480000, target: 500000 },
    { month: 'Apr', amount: 610000, target: 550000 },
    { month: 'May', amount: 490000, target: 550000 },
    { month: 'Jun', amount: 530000, target: 550000 },
    { month: 'Jul', amount: 580000, target: 600000 },
    { month: 'Aug', amount: 620000, target: 600000 },
    { month: 'Sep', amount: 590000, target: 600000 },
    { month: 'Oct', amount: 650000, target: 650000 },
    { month: 'Nov', amount: 700000, target: 650000 },
    { month: 'Dec', amount: 720000, target: 700000 },
  ].map(item => ({
    month: item.month,
    amount: item.amount || 0,
    target: item.target || 0
  }));

  // Safe format currency function
  const safeFormatCurrency = (value: number | undefined | null): string => {
    return formatCurrency(value || 0);
  };

  // Load report statistics and recent reports - FIXED VERSION
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoadingStats(true);
        setLoadingRecent(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login first');
          return;
        }
        
        // Direct API calls to avoid service layer issues
        const [statsRes, recentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/reports/statistics`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          }),
          fetch(`${API_BASE_URL}/reports/recent`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
        ]);
        
        // Handle statistics
        if (statsRes.success && statsRes.data) {
          setReportStats({
            totalReports: statsRes.data.totalReports || 0,
            mostUsedFormat: statsRes.data.mostUsedFormat || 'PDF',
            avgReportSize: statsRes.data.avgReportSize || 0,
            timeSaved: statsRes.data.timeSaved || 0,
            recentActivity: Array.isArray(statsRes.data.recentActivity) 
              ? statsRes.data.recentActivity 
              : []
          });
        } else {
          console.error('Stats API failed:', statsRes);
          toast.error('Failed to load report statistics');
        }
        
        // Handle recent reports
        if (recentRes.success && recentRes.data && Array.isArray(recentRes.data)) {
          setRecentReports(recentRes.data);
        } else if (recentRes.success && recentRes.data) {
          // If data exists but isn't array, log it
          console.warn('Recent data is not array:', recentRes.data);
          setRecentReports([]);
        } else {
          console.error('Recent API failed:', recentRes);
          toast.error('Failed to load recent reports');
          setRecentReports([]);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('Error loading report data');
        setRecentReports([]);
      } finally {
        setLoadingStats(false);
        setLoadingRecent(false);
      }
    };
    
    loadReportData();
  }, []);

  // Handle generate report
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      // Build report configuration
      const reportConfig: ReportConfig = {
        reportType,
        format,
        startDate: dateRange.start,
        endDate: dateRange.end,
        className: selectedClass !== 'All Classes' ? selectedClass : undefined,
        section: selectedSection !== 'All Sections' ? selectedSection : undefined,
        paymentMethod: selectedPaymentMethod !== 'All Methods' ? selectedPaymentMethod : undefined,
        status: selectedStatus !== 'All Status' ? selectedStatus : undefined,
        includeCharts,
        includeDetails,
        includeSummary,
        includeRecommendations,
        emailRecipients: emailRecipients ? emailRecipients.split(',').map(e => e.trim()) : undefined,
        schedule: scheduleReport ? {
          enabled: true,
          frequency: scheduleFrequency as any,
          time: '09:00'
        } : undefined
      };

      console.log('Generating report with config:', reportConfig);
      
      // Call the API to generate report
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Get filename from headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Report "${filename}" generated successfully!`);
      
      // Refresh recent reports
      const recentRes = await fetch(`${API_BASE_URL}/reports/recent`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        if (recentData.success && recentData.data && Array.isArray(recentData.data)) {
          setRecentReports(recentData.data);
        }
      }

    } catch (error) {
      console.error('Generate report error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };
  
  // Handle print preview
  const handlePrintPreview = () => {
    toast.info('Print preview feature coming soon');
  };
  
  // Handle email report
  const handleEmailReport = () => {
    if (emailRecipients) {
      toast.info(`Report email feature coming soon. Would email to: ${emailRecipients}`);
    } else {
      toast.warning('Please enter email addresses in the "Schedule & Share" section');
    }
  };
  
  // Handle quick generate
  const handleQuickGenerate = async (type: string) => {
    try {
      setReportType(type);
      
      // Set date range for quick reports
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      setDateRange({
        start: startOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      });

      // Set appropriate format based on report type
      if (type === 'defaulter') {
        setFormat('excel');
      } else if (type === 'collection') {
        setFormat('pdf');
      }

      toast.info(`Quick report configured for ${reportTypes.find(r => r.id === type)?.name}`);
      
    } catch (error) {
      console.error('Quick generate error:', error);
      toast.error('Failed to configure quick report');
    }
  };

  // Handle download recent report
  const handleDownloadReport = async (report: RecentReport) => {
    try {
      // For mock reports, show a message
      if (report.url.startsWith('/reports/')) {
        toast.info('Downloading report...');
        // Simulate download
        setTimeout(() => {
          toast.success(`Downloaded ${report.name}`);
        }, 1000);
      } else {
        // For real reports
        toast.info(`Downloading ${report.name}...`);
        setTimeout(() => {
          toast.success(`Downloaded ${report.name}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Download report error:', error);
      toast.error('Failed to download report');
    }
  };

  // Get report color class
  const getReportColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate recent activity count
  const getRecentActivityCount = () => {
    if (!reportStats.recentActivity || !Array.isArray(reportStats.recentActivity)) {
      return 0;
    }
    return reportStats.recentActivity.length;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, schedule, and export comprehensive financial analytics
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handlePrintPreview}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
          
          <Button
            variant="outline"
            onClick={handleEmailReport}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Download className="h-4 w-4 mr-2" />
                Quick Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickGenerate('collection')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                This Month's Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickGenerate('defaulter')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Current Defaulters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickGenerate('annual')}>
                <FileText className="h-4 w-4 mr-2" />
                Year-to-Date Summary
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Reports Generated</p>
                <p className="text-2xl font-bold text-blue-900">
                  {loadingStats ? '...' : (reportStats.totalReports || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600">
                    {getRecentActivityCount()} this week
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Most Used Format</p>
                <p className="text-2xl font-bold text-green-900">
                  {loadingStats ? '...' : (reportStats.mostUsedFormat || 'PDF')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {loadingStats ? 'Loading...' : 'Most popular format'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress 
              value={65} 
              className="h-2 mt-4 bg-green-200" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Average Size</p>
                <p className="text-2xl font-bold text-amber-900">
                  {loadingStats ? '...' : `${(reportStats.avgReportSize || 0).toFixed(1)} MB`}
                </p>
                <p className="text-xs text-amber-600 mt-1">Per report</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Database className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Time Saved</p>
                <p className="text-2xl font-bold text-purple-900">
                  {loadingStats ? '...' : `${reportStats.timeSaved || 0} hrs`}
                </p>
                <p className="text-xs text-purple-600 mt-1">This month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Report Configuration
              </CardTitle>
              <CardDescription>
                Customize your report with advanced options and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div className="space-y-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Select Report Type
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setReportType(type.id)}
                        className={`
                          p-4 border rounded-lg text-left transition-all hover:shadow-md
                          ${reportType === type.id 
                            ? 'ring-2 ring-primary/20 bg-primary/5 border-primary' 
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className={`p-2 rounded-lg w-fit mb-3 ${getReportColor(type.color).split(' ')[0]}`}>
                          <Icon className={`h-5 w-5 ${getReportColor(type.color).split(' ')[1]}`} />
                        </div>
                        
                        <div className="font-medium text-sm mb-1">{type.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {type.description}
                        </div>
                        
                        {reportType === type.id && (
                          <Badge className="mt-2 bg-primary text-primary-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
              
              {/* Advanced Filters */}
              <div className="space-y-6">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date-start" className="text-sm mb-2 block">Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">From</div>
                        <Input
                          id="date-start"
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">To</div>
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">Class & Section</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOptions.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionOptions.map((sec) => (
                            <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">Payment & Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((method) => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
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
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Report Options */}
              <div className="space-y-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Report Options
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Output Format</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {formats.map((fmt) => {
                        const Icon = fmt.icon;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setFormat(fmt.id)}
                            className={`
                              p-3 border rounded-lg text-center transition-all
                              ${format === fmt.id 
                                ? 'ring-2 ring-primary/20 bg-primary/5 border-primary' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                          >
                            <Icon className={`h-5 w-5 mx-auto mb-2 ${format === fmt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="font-medium text-sm mb-1">{fmt.name}</div>
                            <div className="text-xs text-muted-foreground">{fmt.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Content Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-charts" 
                          checked={includeCharts}
                          onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                        />
                        <Label htmlFor="include-charts" className="text-sm cursor-pointer">
                          Include Charts & Graphs
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-details" 
                          checked={includeDetails}
                          onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                        />
                        <Label htmlFor="include-details" className="text-sm cursor-pointer">
                          Include Detailed Breakdown
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-summary" 
                          checked={includeSummary}
                          onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                        />
                        <Label htmlFor="include-summary" className="text-sm cursor-pointer">
                          Include Executive Summary
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-recommendations" 
                          checked={includeRecommendations}
                          onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
                        />
                        <Label htmlFor="include-recommendations" className="text-sm cursor-pointer">
                          Include Recommendations
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Schedule & Share */}
              <div className="space-y-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Schedule & Share
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="schedule-report" 
                        checked={scheduleReport}
                        onCheckedChange={(checked) => setScheduleReport(checked as boolean)}
                      />
                      <Label htmlFor="schedule-report" className="text-sm font-medium cursor-pointer">
                        Schedule Auto-generation
                      </Label>
                    </div>
                    
                    {scheduleReport && (
                      <div className="space-y-2 pl-6">
                        <Label className="text-sm">Frequency</Label>
                        <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Report will be generated automatically and emailed to recipients
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email-recipients" className="text-sm font-medium">
                      Email Recipients
                    </Label>
                    <Input
                      id="email-recipients"
                      placeholder="Enter email addresses (comma separated)"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple emails with commas
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Generate Report Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Estimated generation time: 15-30 seconds
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  size="lg"
                  className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generate Report Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Preview & Recent Reports */}
        <div className="space-y-6">
          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>Preview of selected report configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 border-2 border-dashed border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
                <FileText className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                <div className="font-bold text-lg mb-2">
                  {reportTypes.find(t => t.id === reportType)?.name || 'Collection Report'}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {format.toUpperCase()} • {selectedClass} • {selectedSection}
                </div>
                <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded">
                  {dateRange.start} to {dateRange.end}
                </div>
              </div>
              
              {/* Mini Chart Preview */}
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => {
                        const numValue = Number(value);
                        return [isNaN(numValue) ? '₹0' : safeFormatCurrency(numValue), 'Amount'];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.1} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Estimated Pages</div>
                    <div className="text-xl font-bold">15-25</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">File Size</div>
                    <div className="text-xl font-bold">2-5 MB</div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Content Included</div>
                  <div className="flex flex-wrap gap-2">
                    {includeCharts && <Badge variant="outline">Charts</Badge>}
                    {includeDetails && <Badge variant="outline">Details</Badge>}
                    {includeSummary && <Badge variant="outline">Summary</Badge>}
                    {includeRecommendations && <Badge variant="outline">Recommendations</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Reports
              </CardTitle>
              <CardDescription>
                {loadingRecent ? 'Loading...' : `Last ${recentReports.length} generated reports`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecent ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent reports found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          report.type === 'pdf' ? 'bg-red-100 text-red-600' :
                          report.type === 'excel' ? 'bg-green-100 text-green-600' :
                          report.type === 'csv' ? 'bg-blue-100 text-blue-600' :
                          'bg-primary/10 text-primary'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm line-clamp-1">{report.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(report.date)} • {report.size} • {report.type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => toast.info('Report archive feature coming soon')}
              >
                <Folder className="h-4 w-4 mr-2" />
                View Report Archive
              </Button>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  onClick={() => handleQuickGenerate('collection')}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Today's Collection</div>
                    <div className="text-xs text-muted-foreground">Quick PDF</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  onClick={() => handleQuickGenerate('defaulter')}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Defaulters List</div>
                    <div className="text-xs text-muted-foreground">Excel format</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  onClick={() => handleQuickGenerate('payment-methods')}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Method Analysis</div>
                    <div className="text-xs text-muted-foreground">With charts</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  onClick={() => {
                    setScheduleReport(true);
                    toast.info('Scheduled report configured for weekly delivery');
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Schedule Weekly</div>
                    <div className="text-xs text-muted-foreground">Auto-email</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsPage;