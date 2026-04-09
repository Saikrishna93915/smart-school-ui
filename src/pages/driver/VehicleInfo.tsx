import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

// Icons
import {
  Bus,
  Gauge,
  Fuel,
  Calendar as CalendarIcon,
  ShieldCheck,
  Wrench,
  FileText,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Camera,
  Phone,
  Mail,
  MapPin,
  FileDown,
  Share2,
  RefreshCw,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  HelpCircle,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Sparkles,
  Rocket,
  Zap,
  Shield,
  ShieldAlert,
  Cloud,
  FileSpreadsheet, // <-- Added import
  Printer, // <-- Fix: Import Printer icon
  PlayCircle, // <-- Fix: Import PlayCircle icon
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface Vehicle {
  id: string;
  vehicleNumber: string;
  registrationNumber: string;
  model: string;
  year: number;
  type: 'bus' | 'van' | 'mini_bus' | 'car';
  make: string;
  engineNumber: string;
  chassisNumber: string;
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  fuelTankCapacity: number;
  seatingCapacity: number;
  standingCapacity?: number;
  features: string[];
  currentStatus: 'active' | 'maintenance' | 'idle' | 'out_of_service';
  currentOdometer: number;
  fuelLevel: number;
  averageEfficiency: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceOdometer?: number;
  photos: Array<{
    id: string;
    url: string;
    type: 'front' | 'side' | 'interior' | 'damage' | 'other';
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface VehicleDocument {
  id: string;
  type: 'insurance' | 'fitness' | 'pollution' | 'registration' | 'other';
  documentNumber: string;
  provider?: string;
  issueDate: string;
  expiryDate: string;
  issuedBy?: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  odometer: number;
  type: 'routine' | 'repair' | 'emergency' | 'inspection';
  description: string;
  services: string[];
  cost: number;
  mechanic?: string;
  garage?: string;
  nextDueDate?: string;
  nextDueOdometer?: number;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FuelLog {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  amount: number;
  pricePerLiter: number;
  fuelStation?: string;
  efficiency?: number;
  createdAt: string;
}

interface VehicleStats {
  totalTrips: number;
  totalDistance: number;
  averageTripDistance: number;
  totalFuelConsumed: number;
  totalFuelCost: number;
  averageFuelEfficiency: number;
  bestFuelEfficiency: number;
  worstFuelEfficiency: number;
  maintenanceCost: number;
  incidents: number;
  onTimePercentage: number;
  lastUpdated: string;
}

interface VehicleResponse {
  success: boolean;
  vehicle: Vehicle;
  documents: VehicleDocument[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  stats: VehicleStats;
  message?: string;
}

type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired' | 'critical';

interface ExpiryInfo {
  status: ExpiryStatus;
  label: string;
  color: 'default' | 'destructive' | 'warning' | 'success';
  daysLeft: number;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
}

// ==================== UTILITY FUNCTIONS ====================

const getExpiryStatus = (expiryDate: string): ExpiryInfo => {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysLeft = differenceInDays(expiry, today);
  
  if (daysLeft < 0) {
    return {
      status: 'expired',
      label: 'Expired',
      color: 'destructive',
      daysLeft,
      variant: 'destructive',
    };
  } else if (daysLeft < 7) {
    return {
      status: 'critical',
      label: 'Critical',
      color: 'destructive',
      daysLeft,
      variant: 'destructive',
    };
  } else if (daysLeft < 30) {
    return {
      status: 'expiring_soon',
      label: 'Expiring Soon',
      color: 'warning',
      daysLeft,
      variant: 'secondary',
    };
  } else {
    return {
      status: 'valid',
      label: 'Valid',
      color: 'success',
      daysLeft,
      variant: 'default',
    };
  }
};

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'insurance':
      return <ShieldCheck className="h-5 w-5" />;
    case 'fitness':
      return <Award className="h-5 w-5" />;
    case 'pollution':
      return <Cloud className="h-5 w-5" />;
    case 'registration':
      return <FileText className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'idle':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'out_of_service':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getFuelLevelColor = (level: number): string => {
  if (level >= 75) return 'text-green-600';
  if (level >= 50) return 'text-blue-600';
  if (level >= 25) return 'text-yellow-600';
  return 'text-red-600';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'dd MMM yyyy');
};

// ==================== MOCK DATA (Replace with actual API) ====================

const mockVehicle: Vehicle = {
  id: 'veh-001',
  vehicleNumber: 'TS-07-AB-1234',
  registrationNumber: 'AP-31-TA-5678',
  model: 'Tata Starbus Urban',
  year: 2024,
  type: 'bus',
  make: 'Tata Motors',
  engineNumber: 'TATAD6X889922',
  chassisNumber: 'TATABUS77881122X',
  fuelType: 'diesel',
  fuelTankCapacity: 120,
  seatingCapacity: 42,
  standingCapacity: 0,
  features: ['AC', 'CCTV', 'GPS Tracking', 'Emergency Exit', 'Fire Extinguisher', 'First Aid Kit'],
  currentStatus: 'active',
  currentOdometer: 52345,
  fuelLevel: 65,
  averageEfficiency: 4.2,
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-05-15',
  nextMaintenanceOdometer: 54000,
  photos: [
    { id: 'p1', url: '', type: 'front', uploadedAt: new Date().toISOString() },
    { id: 'p2', url: '', type: 'side', uploadedAt: new Date().toISOString() },
    { id: 'p3', url: '', type: 'interior', uploadedAt: new Date().toISOString() },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDocuments: VehicleDocument[] = [
  {
    id: 'doc-001',
    type: 'insurance',
    documentNumber: 'INS-2026-001234',
    provider: 'National Insurance',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    issuedBy: 'National Insurance Co.',
    documentUrl: '#',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-002',
    type: 'fitness',
    documentNumber: 'FIT-2026-567890',
    provider: 'RTO',
    issueDate: '2026-01-15',
    expiryDate: '2026-06-30',
    issuedBy: 'Regional Transport Office',
    documentUrl: '#',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-003',
    type: 'pollution',
    documentNumber: 'PUC-2026-123456',
    provider: 'Pollution Control',
    issueDate: '2026-02-01',
    expiryDate: '2026-08-01',
    issuedBy: 'Pollution Control Board',
    documentUrl: '#',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-004',
    type: 'registration',
    documentNumber: 'RC-TS07-001234',
    provider: 'RTO',
    issueDate: '2024-01-15',
    expiryDate: '2029-01-14',
    issuedBy: 'Regional Transport Office',
    documentUrl: '#',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMaintenance: MaintenanceRecord[] = [
  {
    id: 'mnt-001',
    date: '2026-02-15',
    odometer: 52000,
    type: 'routine',
    description: 'Regular Service',
    services: ['Oil Change', 'Filter Replacement', 'Brake Inspection'],
    cost: 4500,
    mechanic: 'Rajesh Kumar',
    garage: 'Sai Motors, Kukatpally',
    nextDueDate: '2026-05-15',
    nextDueOdometer: 54000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mnt-002',
    date: '2026-01-10',
    odometer: 51200,
    type: 'repair',
    description: 'Battery Replacement',
    services: ['Battery Replacement', 'Electrical Check'],
    cost: 6200,
    mechanic: 'Suresh Reddy',
    garage: 'Auto Care, Hyderabad',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mnt-003',
    date: '2025-12-05',
    odometer: 50000,
    type: 'inspection',
    description: 'Fitness Certificate Inspection',
    services: ['Brake Test', 'Emission Test', 'Light Check'],
    cost: 2500,
    mechanic: 'RTO Inspector',
    garage: 'RTO Test Center',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFuelLogs: FuelLog[] = [
  {
    id: 'fuel-001',
    date: '2026-03-15',
    odometer: 52345,
    liters: 50.5,
    amount: 4500,
    pricePerLiter: 89.11,
    fuelStation: 'Indian Oil, Kukatpally',
    efficiency: 4.2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fuel-002',
    date: '2026-03-10',
    odometer: 52100,
    liters: 48.2,
    amount: 4200,
    pricePerLiter: 87.14,
    fuelStation: 'Bharat Petroleum, JNTU',
    efficiency: 4.5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fuel-003',
    date: '2026-03-05',
    odometer: 51850,
    liters: 52.0,
    amount: 4600,
    pricePerLiter: 88.46,
    fuelStation: 'HPCL, KPHB',
    efficiency: 3.9,
    createdAt: new Date().toISOString(),
  },
];

const mockStats: VehicleStats = {
  totalTrips: 452,
  totalDistance: 12500,
  averageTripDistance: 27.7,
  totalFuelConsumed: 2976,
  totalFuelCost: 265000,
  averageFuelEfficiency: 4.2,
  bestFuelEfficiency: 4.8,
  worstFuelEfficiency: 3.6,
  maintenanceCost: 13200,
  incidents: 0,
  onTimePercentage: 98.5,
  lastUpdated: new Date().toISOString(),
};

// ==================== MAIN COMPONENT ====================

export default function VehicleInfo() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showReportIssueDialog, setShowReportIssueDialog] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueType, setIssueType] = useState("mechanical");

  // React Query for data fetching
  const { 
    data: vehicleResponse, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useQuery<VehicleResponse>({
    queryKey: ["vehicle-info"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getMyVehicle();
      // return response.data;

      // Mock response
      return {
        success: true,
        vehicle: mockVehicle,
        documents: mockDocuments,
        maintenance: mockMaintenance,
        fuelLogs: mockFuelLogs,
        stats: mockStats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Mutations
  const reportIssueMutation = useMutation({
    mutationFn: async (data: { type: string; description: string }) => {
      // In production, call API
      // return await driverService.reportVehicleIssue(data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Issue reported successfully", {
        description: "The maintenance team has been notified.",
      });
      setShowReportIssueDialog(false);
      setIssueDescription("");
      setIssueType("mechanical");
    },
    onError: () => {
      toast.error("Failed to report issue", {
        description: "Please try again or contact support.",
      });
    },
  });

  const downloadDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // In production, trigger download
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Document download started");
    },
    onError: () => {
      toast.error("Failed to download document");
    },
  });

  // Memoized values
  const documentsByExpiry = useMemo(() => {
    if (!vehicleResponse?.documents) return [];

    return [...vehicleResponse.documents].sort((a, b) => {
      const aDays = differenceInDays(parseISO(a.expiryDate), new Date());
      const bDays = differenceInDays(parseISO(b.expiryDate), new Date());
      return aDays - bDays;
    });
  }, [vehicleResponse?.documents]);

  const criticalDocuments = useMemo(() => {
    return documentsByExpiry.filter(doc => {
      const days = differenceInDays(parseISO(doc.expiryDate), new Date());
      return days < 30;
    });
  }, [documentsByExpiry]);

  const maintenanceDue = useMemo(() => {
    if (!vehicleResponse?.vehicle.nextMaintenanceDate) return null;

    const dueDate = parseISO(vehicleResponse.vehicle.nextMaintenanceDate);
    const daysLeft = differenceInDays(dueDate, new Date());

    return {
      date: vehicleResponse.vehicle.nextMaintenanceDate,
      odometer: vehicleResponse.vehicle.nextMaintenanceOdometer,
      daysLeft,
      isOverdue: daysLeft < 0,
      isDueSoon: daysLeft >= 0 && daysLeft < 7,
    };
  }, [vehicleResponse?.vehicle]);

  const recentFuelLogs = useMemo(() => {
    if (!vehicleResponse?.fuelLogs) return [];
    return [...vehicleResponse.fuelLogs]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 5);
  }, [vehicleResponse?.fuelLogs]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Refreshing vehicle data...");
  }, [refetch]);

  const handleDownloadDocument = useCallback((document: VehicleDocument) => {
    downloadDocumentMutation.mutate(document.id);
  }, [downloadDocumentMutation]);

  const handleViewDocument = useCallback((document: VehicleDocument) => {
    setSelectedDocument(document);
    setShowDocumentDialog(true);
  }, []);

  const handleReportIssue = useCallback(() => {
    if (!issueDescription.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    
    reportIssueMutation.mutate({
      type: issueType,
      description: issueDescription,
    });
  }, [issueDescription, issueType, reportIssueMutation]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Failed to Load Vehicle Info</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An error occurred while loading vehicle information."}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicle = vehicleResponse?.vehicle;
  const documents = vehicleResponse?.documents || [];
  const maintenance = vehicleResponse?.maintenance || [];
  const fuelLogs = vehicleResponse?.fuelLogs || [];
  const stats = vehicleResponse?.stats;

  if (!vehicle) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Assigned Vehicle</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Bus className="h-3 w-3" /> Vehicle Health & Records Dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isFetching && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Syncing
            </Badge>
          )}
          
          <Badge variant="outline" className={cn("h-8", getStatusColor(vehicle.currentStatus))}>
            <span className={cn(
              "h-2 w-2 rounded-full mr-2",
              vehicle.currentStatus === 'active' ? 'bg-green-500' :
              vehicle.currentStatus === 'maintenance' ? 'bg-yellow-500' :
              vehicle.currentStatus === 'idle' ? 'bg-blue-500' : 'bg-red-500'
            )} />
            {vehicle.currentStatus.toUpperCase()}
          </Badge>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalDocuments.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-800 font-semibold">Document Expiry Alert</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalDocuments.length} document(s) expiring within 30 days. 
            Please renew immediately to avoid compliance issues.
          </AlertDescription>
        </Alert>
      )}

      {maintenanceDue?.isDueSoon && !maintenanceDue.isOverdue && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-semibold">Maintenance Due Soon</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Next service is due in {maintenanceDue.daysLeft} days or {maintenanceDue.odometer ? `${(maintenanceDue.odometer - vehicle.currentOdometer).toLocaleString()} km` : ''}.
            Please schedule maintenance.
          </AlertDescription>
        </Alert>
      )}

      {maintenanceDue?.isOverdue && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="text-red-800 font-semibold">Maintenance Overdue</AlertTitle>
          <AlertDescription className="text-red-700">
            Vehicle service is overdue by {Math.abs(maintenanceDue.daysLeft)} days. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Stats Card */}
      <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
            {/* Vehicle Identity */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-primary">
                    {vehicle.vehicleNumber}
                  </h2>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {vehicle.model} • {vehicle.year}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  <Bus className="h-7 w-7" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 capitalize">
                  {vehicle.fuelType}
                </Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                  AC Bus
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  CCTV
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  GPS
                </Badge>
              </div>
            </div>

            {/* Odometer & Fuel */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Odometer</span>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {formatNumber(vehicle.currentOdometer)} <span className="text-xs font-normal text-muted-foreground">km</span>
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>FUEL LEVEL</span>
                  <span className={getFuelLevelColor(vehicle.fuelLevel)}>{vehicle.fuelLevel}%</span>
                </div>
                <Progress value={vehicle.fuelLevel} className="h-2.5" />
                {vehicle.fuelLevel < 25 && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Low fuel! Please refill soon.
                  </p>
                )}
              </div>
            </div>

            {/* Next Service */}
            <div className="p-6 space-y-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Next Service</span>
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              {vehicle.nextMaintenanceDate ? (
                <>
                  <p className="text-2xl font-bold">{formatDate(vehicle.nextMaintenanceDate)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className={cn(
                      "font-medium",
                      maintenanceDue?.isOverdue ? 'text-red-600' :
                      maintenanceDue?.isDueSoon ? 'text-amber-600' : 'text-green-600'
                    )}>
                      {maintenanceDue?.isOverdue ? `Overdue by ${Math.abs(maintenanceDue.daysLeft)} days` :
                       maintenanceDue?.daysLeft === 0 ? 'Due today' :
                       `Due in ${maintenanceDue?.daysLeft} days`}
                    </span>
                  </div>
                  {vehicle.nextMaintenanceOdometer && (
                    <p className="text-xs text-muted-foreground">
                      or at {formatNumber(vehicle.nextMaintenanceOdometer)} km
                    </p>
                  )}
                </>
              ) : (
                <p className="text-lg text-muted-foreground">No scheduled service</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg font-bold text-xs uppercase">
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg font-bold text-xs uppercase relative">
            Documents
            {criticalDocuments.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                {criticalDocuments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg font-bold text-xs uppercase">
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg font-bold text-xs uppercase">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Technical Specifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4" /> Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-muted-foreground">Registration Number</span>
                  <span className="font-mono font-bold">{vehicle.registrationNumber}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-muted-foreground">Chassis Number</span>
                  <span className="font-mono font-bold">{vehicle.chassisNumber}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-muted-foreground">Engine Number</span>
                  <span className="font-mono font-bold">{vehicle.engineNumber}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-muted-foreground">Seating Capacity</span>
                  <span className="font-bold">{vehicle.seatingCapacity} + 1 Driver</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-muted-foreground">Fuel Tank Capacity</span>
                  <span className="font-bold">{vehicle.fuelTankCapacity} Liters</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Average Efficiency</span>
                  <span className="font-bold">{vehicle.averageEfficiency} km/L</span>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Features & Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Fuel Logs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Fuel className="h-4 w-4" /> Recent Fuel Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {recentFuelLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Fuel className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{formatDate(log.date)}</p>
                            <p className="text-xs text-muted-foreground">{log.liters} L • ₹{log.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        {log.efficiency && (
                          <Badge variant="outline" className="bg-green-50">
                            {log.efficiency} km/L
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button 
                  variant="link" 
                  className="w-full mt-2 text-xs font-bold"
                  onClick={() => window.location.href = '/driver/fuel-log'}
                >
                  View All Fuel Logs →
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => window.location.href = '/driver/fuel-log'}
                  >
                    <Fuel className="h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium">Log Fuel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => setShowReportIssueDialog(true)}
                  >
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <span className="text-xs font-medium">Report Issue</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => window.location.href = '/driver/start-trip'}
                  >
                    <PlayCircle className="h-6 w-6 text-green-600" />
                    <span className="text-xs font-medium">Start Trip</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => window.open('#', '_blank')}
                  >
                    <Camera className="h-6 w-6 text-purple-600" />
                    <span className="text-xs font-medium">Upload Photo</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {documentsByExpiry.map((doc) => {
              const expiry = getExpiryStatus(doc.expiryDate);
              return (
                <Card 
                  key={doc.id} 
                  className={cn(
                    "relative overflow-hidden group hover:shadow-md transition-all cursor-pointer",
                    expiry.status === 'expired' && 'border-red-200 bg-red-50/30',
                    expiry.status === 'critical' && 'border-red-300 bg-red-50/20',
                    expiry.status === 'expiring_soon' && 'border-amber-200 bg-amber-50/20',
                  )}
                  onClick={() => handleViewDocument(doc)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                          expiry.status === 'expired' && 'bg-red-100 text-red-600',
                          expiry.status === 'critical' && 'bg-red-100 text-red-600',
                          expiry.status === 'expiring_soon' && 'bg-amber-100 text-amber-600',
                          expiry.status === 'valid' && 'bg-emerald-100 text-emerald-600',
                        )}>
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight">
                            {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {doc.documentNumber}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={expiry.variant} className="text-[10px] h-5">
                              {expiry.label}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {expiry.daysLeft >= 0 ? `${expiry.daysLeft} days left` : 'Expired'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {documents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-muted-foreground">
                  No vehicle documents have been uploaded yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid gap-6">
            {/* Upcoming Maintenance */}
            {vehicle.nextMaintenanceDate && (
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Upcoming Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{formatDate(vehicle.nextMaintenanceDate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.nextMaintenanceOdometer && 
                          `or at ${formatNumber(vehicle.nextMaintenanceOdometer)} km`
                        }
                      </p>
                    </div>
                    <Badge className={cn(
                      "text-sm px-3 py-1",
                      maintenanceDue?.isOverdue ? 'bg-red-600' :
                      maintenanceDue?.isDueSoon ? 'bg-amber-600' : 'bg-green-600'
                    )}>
                      {maintenanceDue?.isOverdue ? 'Overdue' :
                       maintenanceDue?.isDueSoon ? 'Due Soon' : 'Scheduled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintenance History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Service Records</CardTitle>
                  <CardDescription className="text-xs">
                    Complete log of vehicle maintenance
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 text-xs font-bold uppercase"
                  onClick={() => setShowReportIssueDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Request Service
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {maintenance.length === 0 ? (
                  <div className="p-8 text-center">
                    <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No maintenance records found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {maintenance.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{record.description}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {formatDate(record.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3 w-3" />
                                    {formatNumber(record.odometer)} km
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {record.services.slice(0, 3).map((service, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px]">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black">{formatCurrency(record.cost)}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">
                                {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-blue-600 font-bold uppercase">Total Trips</p>
                    <p className="text-3xl font-black text-blue-700 mt-1">{formatNumber(stats.totalTrips)}</p>
                    <p className="text-xs text-blue-600 mt-1">{formatNumber(stats.totalDistance)} km total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-green-600 font-bold uppercase">Avg Efficiency</p>
                    <p className="text-3xl font-black text-green-700 mt-1">{stats.averageFuelEfficiency}</p>
                    <p className="text-xs text-green-600 mt-1">km per liter</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-600 font-bold uppercase">Fuel Cost</p>
                    <p className="text-3xl font-black text-purple-700 mt-1">{formatCurrency(stats.totalFuelCost)}</p>
                    <p className="text-xs text-purple-600 mt-1">{stats.totalFuelConsumed} L total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-amber-600 font-bold uppercase">On-Time Rate</p>
                    <p className="text-3xl font-black text-amber-700 mt-1">{stats.onTimePercentage}%</p>
                    <p className="text-xs text-amber-600 mt-1">{stats.incidents} incidents</p>
                  </CardContent>
                </Card>
              </div>

              {/* Efficiency Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-600" />
                    Fuel Efficiency Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center bg-muted/10 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Efficiency chart will be displayed here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Best: {stats.bestFuelEfficiency} km/L • Worst: {stats.worstFuelEfficiency} km/L
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-600" />
                    Maintenance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Maintenance Cost</p>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.maintenanceCost)}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Records</p>
                      <p className="text-2xl font-bold">{maintenance.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Pending Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.incidents === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 opacity-10 mb-2" />
                      <p className="text-sm">No active maintenance issues reported.</p>
                      <Button 
                        variant="link" 
                        className="text-xs font-bold text-primary mt-2"
                        onClick={() => setShowReportIssueDialog(true)}
                      >
                        REPORT NEW ISSUE
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">{stats.incidents} issues reported</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Document View Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Document Details
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  getExpiryStatus(selectedDocument.expiryDate).status === 'expired' ? 'bg-red-100' :
                  getExpiryStatus(selectedDocument.expiryDate).status === 'critical' ? 'bg-red-100' :
                  getExpiryStatus(selectedDocument.expiryDate).status === 'expiring_soon' ? 'bg-amber-100' :
                  'bg-emerald-100'
                )}>
                  {getDocumentIcon(selectedDocument.type)}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">{selectedDocument.type}</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedDocument.documentNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(selectedDocument.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="font-medium flex items-center gap-2">
                    {formatDate(selectedDocument.expiryDate)}
                    <Badge variant={getExpiryStatus(selectedDocument.expiryDate).variant}>
                      {getExpiryStatus(selectedDocument.expiryDate).label}
                    </Badge>
                  </p>
                </div>
                {selectedDocument.provider && (
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedDocument.provider}</p>
                  </div>
                )}
                {selectedDocument.issuedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground">Issued By</p>
                    <p className="font-medium">{selectedDocument.issuedBy}</p>
                  </div>
                )}
              </div>

              {selectedDocument.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedDocument.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Close
            </Button>
            {selectedDocument && (
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={showReportIssueDialog} onOpenChange={setShowReportIssueDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Report Vehicle Issue
            </DialogTitle>
            <DialogDescription>
              Describe the issue with your vehicle. The maintenance team will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue Type</Label>
              <select
                id="issue-type"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option value="mechanical">Mechanical Issue</option>
                <option value="electrical">Electrical Issue</option>
                <option value="body">Body/Damage</option>
                <option value="tyre">Tyre Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportIssueDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReportIssue}
              disabled={reportIssueMutation.isPending}
            >
              {reportIssueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Quick Actions Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:hidden z-50">
        <Button 
          className="rounded-full shadow-2xl h-14 w-14 p-0 bg-primary hover:bg-primary/90 ring-4 ring-primary/20"
          onClick={() => window.location.href = '/driver/fuel-log'}
        >
          <Fuel className="h-6 w-6" />
        </Button>
        <Button 
          className="rounded-full shadow-2xl h-14 w-14 p-0 bg-primary hover:bg-primary/90 ring-4 ring-primary/20"
          onClick={() => window.location.href = '/driver/start-trip'}
        >
          <PlayCircle className="h-6 w-6" />
        </Button>
        <Button 
          className="rounded-full shadow-2xl h-14 w-14 p-0 bg-primary hover:bg-primary/90 ring-4 ring-primary/20"
          onClick={() => setShowReportIssueDialog(true)}
        >
          <AlertTriangle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
