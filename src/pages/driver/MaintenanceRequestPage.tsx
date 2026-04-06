import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Icons
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Truck,
  X,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  Trash2,
  Info,
  XCircle,
  Upload,
  Gauge,
  WifiOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

type IssueType =
  | "engine"
  | "brakes"
  | "tires"
  | "lights"
  | "ac_heating"
  | "transmission"
  | "suspension"
  | "body_damage"
  | "fluid_leak"
  | "battery"
  | "electrical"
  | "cooling"
  | "exhaust"
  | "fuel_system"
  | "safety_equipment"
  | "other";

type Priority = "critical" | "high" | "medium" | "low";
type RequestStatus = "pending" | "approved" | "in_progress" | "completed" | "rejected" | "cancelled";

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  registrationNumber: string;
  model: string;
  year: number;
  type: string;
  currentOdometer: number;
  fuelLevel: number;
  fuelType: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  status: string;
}

interface MaintenanceRequest {
  _id: string;
  requestNumber: string;
  issueType: IssueType;
  priority: Priority;
  status: RequestStatus;
  description: string;
  odometer?: number;
  vehicleId: {
    _id: string;
    vehicleNumber: string;
    model: string;
  };
  reportedBy: {
    driverId: string;
    name: string;
    phone: string;
  };
  reportedAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: {
    mechanicId: string;
    name: string;
    phone: string;
  };
  notes?: string;
  adminNotes?: string;
  parts?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  followUpRequired: boolean;
  followUpDate?: string;
  offlineId?: string;
  synced: boolean;
}

interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<IssueType, number>;
  averageResolutionTime: number; // in days
  thisMonth: number;
  lastMonth: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  estimatedCostTotal: number;
  actualCostTotal: number;
}

interface MaintenanceFilter {
  search: string;
  status: string;
  priority: string;
  issueType: string;
  fromDate: string | null;
  toDate: string | null;
  sortBy: 'date' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface MaintenanceResponse {
  success: boolean;
  data: {
    requests: MaintenanceRequest[];
    stats: MaintenanceStats;
    vehicle: Vehicle;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message?: string;
}

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(parseISO(dateString), 'dd MMM yyyy');
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a');
};

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

const formatCurrency = (amount?: number): string => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const generateRequestNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MNT-${year}${month}${day}-${random}`;
};

const getPriorityColor = (priority: Priority): { bg: string; text: string; border: string; icon: React.ElementType } => {
  switch (priority) {
    case 'critical':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', icon: AlertTriangle };
    case 'high':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500', icon: AlertCircle };
    case 'medium':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500', icon: Clock };
    case 'low':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500', icon: Info };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500', icon: AlertCircle };
  }
};

const getPriorityBadge = (priority: Priority) => {
  const colors = getPriorityColor(priority);
  const Icon = colors.icon;
  return (
    <Badge className={`${colors.bg} ${colors.text} border-0 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const getStatusColor = (status: RequestStatus): { bg: string; text: string; icon: React.ElementType } => {
  switch (status) {
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
    case 'approved':
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle };
    case 'in_progress':
      return { bg: 'bg-purple-100', text: 'text-purple-800', icon: Wrench };
    case 'completed':
      return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
  }
};

const getStatusBadge = (status: RequestStatus) => {
  const { bg, text, icon: Icon } = getStatusColor(status);
  return (
    <Badge className={`${bg} ${text} border-0 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
};

const issueTypes: { value: IssueType; label: string; category: string }[] = [
  { value: 'engine', label: 'Engine Problem', category: 'Engine' },
  { value: 'brakes', label: 'Brakes', category: 'Brakes' },
  { value: 'tires', label: 'Tires/Wheels', category: 'Tires' },
  { value: 'lights', label: 'Lights/Electrical', category: 'Electrical' },
  { value: 'ac_heating', label: 'AC/Heating', category: 'HVAC' },
  { value: 'transmission', label: 'Transmission', category: 'Drivetrain' },
  { value: 'suspension', label: 'Suspension/Steering', category: 'Suspension' },
  { value: 'body_damage', label: 'Body Damage', category: 'Body' },
  { value: 'fluid_leak', label: 'Fluid Leak', category: 'Fluids' },
  { value: 'battery', label: 'Battery', category: 'Electrical' },
  { value: 'electrical', label: 'Electrical System', category: 'Electrical' },
  { value: 'cooling', label: 'Cooling System', category: 'Engine' },
  { value: 'exhaust', label: 'Exhaust System', category: 'Exhaust' },
  { value: 'fuel_system', label: 'Fuel System', category: 'Fuel' },
  { value: 'safety_equipment', label: 'Safety Equipment', category: 'Safety' },
  { value: 'other', label: 'Other', category: 'Other' },
];

const priorities: { value: Priority; label: string }[] = [
  { value: 'critical', label: 'Critical - Safety Hazard' },
  { value: 'high', label: 'High - Urgent' },
  { value: 'medium', label: 'Medium - Soon' },
  { value: 'low', label: 'Low - Can Wait' },
];

// ==================== VALIDATION SCHEMA ====================

const maintenanceSchema = z.object({
  issueType: z.enum([
    'engine', 'brakes', 'tires', 'lights', 'ac_heating', 'transmission',
    'suspension', 'body_damage', 'fluid_leak', 'battery', 'electrical',
    'cooling', 'exhaust', 'fuel_system', 'safety_equipment', 'other'
  ], { required_error: "Please select issue type" }),
  priority: z.enum(['critical', 'high', 'medium', 'low'], {
    required_error: "Please select priority"
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  odometer: z.coerce.number().optional(),
  additionalNotes: z.string().optional(),
  attachPhotos: z.boolean().default(false),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// ==================== MOCK DATA ====================

const mockVehicle: Vehicle = {
  _id: 'veh-001',
  vehicleNumber: 'TS-07-AB-1234',
  registrationNumber: 'AP-31-TA-5678',
  model: 'Tata Starbus 2024',
  year: 2024,
  type: 'bus',
  currentOdometer: 52345,
  fuelLevel: 65,
  fuelType: 'diesel',
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-05-15',
  insuranceExpiry: '2026-12-31',
  fitnessExpiry: '2026-12-31',
  status: 'active',
};

const generateMockRequests = (count: number): MaintenanceRequest[] => {
  const requests: MaintenanceRequest[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 2);
    
    const statuses: RequestStatus[] = ['pending', 'approved', 'in_progress', 'completed', 'rejected'];
    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
    const types: IssueType[] = [
      'engine', 'brakes', 'tires', 'lights', 'ac_heating',
      'transmission', 'suspension', 'fluid_leak', 'battery', 'electrical'
    ];

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const hasCost = status === 'completed' || status === 'in_progress';

    requests.push({
      _id: `mnt-${Date.now()}-${i}`,
      requestNumber: generateRequestNumber(),
      issueType: type,
      priority,
      status,
      description: `${issueTypes.find(t => t.value === type)?.label || type} issue detected. Vehicle needs immediate attention.`,
      odometer: 50000 + Math.floor(Math.random() * 5000),
      vehicleId: {
        _id: 'veh-001',
        vehicleNumber: 'TS-07-AB-1234',
        model: 'Tata Starbus',
      },
      reportedBy: {
        driverId: 'drv-001',
        name: 'Rajesh Kumar',
        phone: '9876543210',
      },
      reportedAt: date.toISOString(),
      updatedAt: date.toISOString(),
      scheduledDate: status !== 'pending' ? new Date(date.getTime() + 86400000).toISOString() : undefined,
      completedAt: status === 'completed' ? new Date(date.getTime() + 86400000 * 2).toISOString() : undefined,
      estimatedCost: hasCost ? 2000 + Math.floor(Math.random() * 8000) : undefined,
      actualCost: status === 'completed' ? 1800 + Math.floor(Math.random() * 9000) : undefined,
      assignedTo: status !== 'pending' ? {
        mechanicId: 'mech-001',
        name: 'Suresh Reddy',
        phone: '9876543211',
      } : undefined,
      notes: 'Please check thoroughly. Issue started yesterday.',
      adminNotes: status !== 'pending' ? 'Inspected and scheduled for repair.' : undefined,
      parts: status === 'completed' ? [
        { name: 'Brake Pad', quantity: 2, cost: 1200 },
        { name: 'Oil Filter', quantity: 1, cost: 350 },
      ] : undefined,
      followUpRequired: Math.random() > 0.8,
      followUpDate: Math.random() > 0.8 ? new Date(date.getTime() + 86400000 * 7).toISOString() : undefined,
      synced: true,
    });
  }

  return requests.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
};

const mockRequests = generateMockRequests(20);

const calculateMaintenanceStats = (requests: MaintenanceRequest[]): MaintenanceStats => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthRequests = requests.filter(r => {
    const date = new Date(r.reportedAt);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });

  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonthRequests = requests.filter(r => {
    const date = new Date(r.reportedAt);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  const byType = {} as Record<IssueType, number>;
  const completedRequests = requests.filter(r => r.status === 'completed');
  
  const totalResolutionTime = completedRequests.reduce((sum, r) => {
    if (r.completedAt && r.reportedAt) {
      const completed = new Date(r.completedAt).getTime();
      const reported = new Date(r.reportedAt).getTime();
      return sum + (completed - reported) / (1000 * 60 * 60 * 24); // days
    }
    return sum;
  }, 0);

  requests.forEach(r => {
    byType[r.issueType] = (byType[r.issueType] || 0) + 1;
  });

  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'approved' || r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    critical: requests.filter(r => r.priority === 'critical').length,
    high: requests.filter(r => r.priority === 'high').length,
    medium: requests.filter(r => r.priority === 'medium').length,
    low: requests.filter(r => r.priority === 'low').length,
    byType,
    averageResolutionTime: completedRequests.length > 0 ? totalResolutionTime / completedRequests.length : 0,
    thisMonth: thisMonthRequests.length,
    lastMonth: lastMonthRequests.length,
    trend: thisMonthRequests.length > lastMonthRequests.length ? 'increasing' 
      : thisMonthRequests.length < lastMonthRequests.length ? 'decreasing' : 'stable',
    estimatedCostTotal: requests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0),
    actualCostTotal: requests.reduce((sum, r) => sum + (r.actualCost || 0), 0),
  };
};

const mockStats = calculateMaintenanceStats(mockRequests);

// ==================== MAIN COMPONENT ====================

export default function MaintenanceRequestPage() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [filters, setFilters] = useState<MaintenanceFilter>({
    search: '',
    status: 'all',
    priority: 'all',
    issueType: 'all',
    fromDate: null,
    toDate: null,
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [offlineQueue, setOfflineQueue] = useLocalStorage<MaintenanceRequest[]>('maintenance-offline-queue', []);

  // ==================== REACT QUERY ====================

  const {
    data: maintenanceData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<MaintenanceResponse>({    queryKey: ["maintenance-requests", filters],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getMaintenanceRequests(filters);
      // return response.data;

      await new Promise(resolve => setTimeout(resolve, 800));

      let filtered = [...mockRequests];

      // Apply search filter
      if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter(r => 
          r.requestNumber.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term) ||
          issueTypes.find(t => t.value === r.issueType)?.label.toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(r => r.status === filters.status);
      }

      // Apply priority filter
      if (filters.priority !== 'all') {
        filtered = filtered.filter(r => r.priority === filters.priority);
      }

      // Apply issue type filter
      if (filters.issueType !== 'all') {
        filtered = filtered.filter(r => r.issueType === filters.issueType);
      }

      // Apply date range
      if (filters.fromDate) {
        filtered = filtered.filter(r => new Date(r.reportedAt) >= new Date(filters.fromDate!));
      }
      if (filters.toDate) {
        filtered = filtered.filter(r => new Date(r.reportedAt) <= new Date(filters.toDate!));
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
            break;
          case 'priority':
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            break;
          case 'status':
            const statusOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            comparison = (statusOrder[b.priority] || 0) - (statusOrder[a.priority] || 0);
            break;
        }
        return filters.sortOrder === 'desc' ? comparison : -comparison;
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / filters.limit);
      const start = (filters.page - 1) * filters.limit;
      const paginated = filtered.slice(start, start + filters.limit);

      return {
        success: true,
        data: {
          requests: paginated,
          stats: mockStats,
          vehicle: mockVehicle,
          pagination: {
            currentPage: filters.page,
            totalPages,
            totalItems,
            itemsPerPage: filters.limit,
          },
        },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const requests = maintenanceData?.data.requests || [];
  const stats = maintenanceData?.data.stats || mockStats;
  const vehicle = maintenanceData?.data.vehicle || mockVehicle;
  const pagination = maintenanceData?.data.pagination;

  // ==================== FORM ====================

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      issueType: undefined,
      priority: 'medium',
      description: '',
      odometer: vehicle?.currentOdometer,
      additionalNotes: '',
      attachPhotos: false,
    },
  });

  // Update odometer when vehicle data loads
  useEffect(() => {
    if (vehicle?.currentOdometer) {
      form.setValue('odometer', vehicle.currentOdometer);
    }
  }, [vehicle, form]);

  // ==================== MUTATIONS ====================

  const submitMutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const requestData: Partial<MaintenanceRequest> = {
        requestNumber: generateRequestNumber(),
        ...data,
        vehicleId: {
          _id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          model: vehicle.model,
        },
        reportedBy: {
          driverId: 'drv-001', // From auth
          name: 'Rajesh Kumar', // From auth
          phone: '9876543210', // From auth
        },
        reportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        synced: isOnline,
      };

      // If offline, add to queue
      if (!isOnline) {
        const offlineRequest: MaintenanceRequest = {
          ...requestData as MaintenanceRequest,
          _id: `offline-${Date.now()}`,
          offlineId: `offline-${Date.now()}`,
          synced: false,
        };
        setOfflineQueue([...offlineQueue, offlineRequest]);
        return { success: true, offline: true };
      }

      // Online - call API
      // const response = await driverService.submitMaintenanceRequest(requestData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, id: `mnt-${Date.now()}` };
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast.success("Maintenance request saved offline", {
          description: "Will sync when you're back online",
        });
      } else {
        toast.success("Maintenance request submitted successfully", {
          description: "The maintenance team has been notified.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to submit request", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id: string) => {
      // await driverService.deleteMaintenanceRequest(_id);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Request deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setShowDeleteDialog(false);
      setSelectedRequest(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      for (const request of offlineQueue) {
        try {
          // await driverService.submitMaintenanceRequest(request);
          console.log('Syncing request:', request.offlineId);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          throw new Error(`Failed to sync request ${request.offlineId}`);
        }
      }
      return { success: true };
    },
    onSuccess: () => {
      setOfflineQueue([]);
      toast.success("All requests synced successfully");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
    onError: (error) => {
      toast.error("Failed to sync some requests", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing maintenance requests...");
  }, [refetch]);

  const handleSync = useCallback(() => {
    if (!isOnline) {
      toast.error("You are offline", {
        description: "Please connect to the internet to sync",
      });
      return;
    }
    syncMutation.mutate();
  }, [isOnline, syncMutation]);

  const onSubmit = (values: MaintenanceFormValues) => {
    submitMutation.mutate(values);
  };

  const handleViewDetails = useCallback((request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  }, []);

  const handleDelete = useCallback((request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedRequest) {
      deleteMutation.mutate(selectedRequest._id);
    }
  }, [selectedRequest, deleteMutation]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      issueType: 'all',
      fromDate: null,
      toDate: null,
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
    toast.success("Filters cleared");
    }, []);

    const pendingSyncCount = offlineQueue.length;
  // ==================== LOADING STATE ====================

  if (isLoading && !requests.length) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Maintenance Requests</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
          <Wrench className="h-4 w-4" />
          Report vehicle issues and track repairs
          {!isOnline && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {pendingSyncCount > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {pendingSyncCount} pending sync
            </Badge>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isFetching && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Updating
          </Badge>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh requests</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {pendingSyncCount > 0 && isOnline && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Sync ({pendingSyncCount})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sync offline requests</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className={showForm ? 'bg-muted hover:bg-muted' : ''}
        >
          {showForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Wrench className="h-4 w-4 mr-2" />
          )}
          {showForm ? 'Cancel' : 'New Request'}
        </Button>
      </div>
    </div>
  );

  const renderVehicleInfo = () => (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-800">Current Vehicle</p>
              <p className="text-xl font-bold text-blue-900">{vehicle.vehicleNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-blue-700">Odometer</p>
              <p className="text-lg font-bold">{vehicle.currentOdometer.toLocaleString()} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Last Service</p>
              <p className="text-lg font-bold">{vehicle.lastMaintenanceDate ? formatDate(vehicle.lastMaintenanceDate) : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Next Service</p>
              <p className="text-lg font-bold">{vehicle.nextMaintenanceDate ? formatDate(vehicle.nextMaintenanceDate) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStats = () => (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPriorityStats = () => (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Critical</p>
          <p className="text-xl font-bold text-red-600">{stats.critical}</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">High</p>
          <p className="text-xl font-bold text-orange-600">{stats.high}</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Medium</p>
          <p className="text-xl font-bold text-amber-600">{stats.medium}</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="text-xl font-bold text-blue-600">{stats.low}</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by request #, description..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-9"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filters.status !== 'all' || filters.priority !== 'all' || filters.issueType !== 'all' || 
              filters.fromDate || filters.toDate) && (
              <Badge className="ml-2 bg-primary text-white h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-[130px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' 
            }))}
          >
            {filters.sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>

          <Select
            value={filters.limit.toString()}
            onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select
                value={filters.issueType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, issueType: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {issueTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderForm = () => (
    <Card className="border-blue-500 shadow-lg animate-in slide-in-from-top duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          New Maintenance Request
        </CardTitle>
        <CardDescription>
          Report any issues with your vehicle. The maintenance team will be notified.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Vehicle Info Summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{vehicle.vehicleNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.model} • Odometer: {vehicle.currentOdometer.toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {issueTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odometer Reading (km)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Current odometer" {...field} />
                  </FormControl>
                  <FormDescription>
                    Current odometer reading at time of issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include when the issue started, how it affects driving, and any unusual sounds/symptoms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other relevant information..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachPhotos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Attach Photos</FormLabel>
                    <FormDescription>
                      You can add photos after submitting
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-11"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-5 w-5 mr-2" />
                )}
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-11 px-6"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );

  const renderRequestCard = (request: MaintenanceRequest) => {
    const priorityColors = getPriorityColor(request.priority);
    const PriorityIcon = priorityColors.icon;
    const StatusIcon = getStatusColor(request.status).icon;

    return (
      <Card
        key={request._id}
        className="hover:shadow-md transition-all cursor-pointer border-l-4"
        style={{ borderLeftColor: priorityColors.border }}
        onClick={() => handleViewDetails(request)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${priorityColors.bg} ${priorityColors.text} border-0 flex items-center gap-1`}>
                  <PriorityIcon className="h-3 w-3" />
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {request.requestNumber}
                </Badge>
              </div>

              <p className="font-medium mb-1">{issueTypes.find(t => t.value === request.issueType)?.label || request.issueType}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {request.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(request.reportedAt)}
                </span>
                {request.odometer && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {request.odometer.toLocaleString()} km
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs">
                  <StatusIcon className="h-3 w-3" />
                  <span className="capitalize">{request.status.replace('_', ' ')}</span>
                </div>
                {request.estimatedCost && (
                  <Badge variant="outline" className="text-xs">
                    Est: {formatCurrency(request.estimatedCost)}
                  </Badge>
                )}
                {!request.synced && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">
                    Pending Sync
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(request);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(request);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestsList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
        <Badge variant="outline">{pagination?.totalItems || requests.length} total</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No maintenance requests found</p>
            <p className="text-sm mt-2">Click "New Request" to report an issue</p>
          </div>
        ) : (
          requests.map(renderRequestCard)
        )}
      </CardContent>
    </Card>
  );

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
          {pagination.totalItems} requests
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage - 1 }))}
            disabled={pagination.currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}>
                1
              </Button>
              {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
            </>
          )}

          {pages.map(page => (
            <Button
              key={page}
              variant={page === pagination.currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page }))}
            >
              {page}
            </Button>
          ))}

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.totalPages }))}
              >
                {pagination.totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage + 1 }))}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Maintenance Request Details
          </DialogTitle>
        </DialogHeader>
        {selectedRequest && (
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Request Number</p>
                <p className="font-mono font-bold text-lg">{selectedRequest.requestNumber}</p>
              </div>
              <div className="flex gap-2">
                {getPriorityBadge(selectedRequest.priority)}
                {getStatusBadge(selectedRequest.status)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Issue Type</p>
                <p className="font-medium">{issueTypes.find(t => t.value === selectedRequest.issueType)?.label}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-medium">{selectedRequest.vehicleId.vehicleNumber}</p>
                <p className="text-xs text-muted-foreground">{selectedRequest.vehicleId.model}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Reported By</p>
                <p className="font-medium">{selectedRequest.reportedBy.name}</p>
                <p className="text-xs text-muted-foreground">{selectedRequest.reportedBy.phone}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="font-medium">{formatDateTime(selectedRequest.reportedAt)}</p>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(selectedRequest.reportedAt)}</p>
              </div>
              {selectedRequest.odometer && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Odometer</p>
                  <p className="font-medium">{selectedRequest.odometer.toLocaleString()} km</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedRequest.description}</p>
            </div>

            {selectedRequest.notes && (
              <div>
                <h3 className="font-medium mb-2">Driver Notes</h3>
                <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest.adminNotes && (
              <div>
                <h3 className="font-medium mb-2">Admin Notes</h3>
                <p className="text-sm p-3 bg-blue-50 rounded-lg">{selectedRequest.adminNotes}</p>
              </div>
            )}

            {/* Assignment */}
            {selectedRequest.assignedTo && (
              <div>
                <h3 className="font-medium mb-2">Assigned To</h3>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">{selectedRequest.assignedTo.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.assignedTo.phone}</p>
                </div>
              </div>
            )}

            {/* Schedule & Cost */}
            {(selectedRequest.scheduledDate || selectedRequest.estimatedCost || selectedRequest.actualCost) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedRequest.scheduledDate && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">{formatDate(selectedRequest.scheduledDate)}</p>
                  </div>
                )}
                {selectedRequest.estimatedCost && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Estimated Cost</p>
                    <p className="font-medium">{formatCurrency(selectedRequest.estimatedCost)}</p>
                  </div>
                )}
                {selectedRequest.actualCost && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700">Actual Cost</p>
                    <p className="font-medium text-green-800">{formatCurrency(selectedRequest.actualCost)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Parts */}
            {selectedRequest.parts && selectedRequest.parts.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Parts Used</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.parts.map((part, index) => (
                        <TableRow key={index}>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.quantity}</TableCell>
                          <TableCell>{formatCurrency(part.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Follow-up */}
            {selectedRequest.followUpRequired && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Follow-up required by {selectedRequest.followUpDate ? formatDate(selectedRequest.followUpDate) : 'ASAP'}
                </p>
              </div>
            )}

            {/* Completion */}
            {selectedRequest.completedAt && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700">Completed on {formatDateTime(selectedRequest.completedAt)}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Maintenance Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this maintenance request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDelete} 
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {renderHeader()}
      {renderVehicleInfo()}
      {renderStats()}
      {renderPriorityStats()}
      {renderFilters()}

      {showForm ? renderForm() : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="requests">All Requests</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              {renderRequestsList()}
              {renderPagination()}
            </TabsContent>

            <TabsContent value="pending">
              {requests.filter(r => r.status === 'pending').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {renderRequestsList()}
                  {renderPagination()}
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialogs */}
      {renderDetailsDialog()}
      {renderDeleteDialog()}
    </div>
  );
}