import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, isAfter, startOfMonth, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Icons
import {
  Fuel,
  Plus,
  IndianRupee,
  Gauge,
  Droplets,
  Calendar as CalendarIcon,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  FileText,
  Camera,
  Info,
  Bus,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  Printer,
  FileSpreadsheet,
  Upload,
  X,
  Search,
  Filter,
  Eye,
  Minus,
  CreditCard,
  Smartphone,
  Save,
  ArrowDown,
  ArrowUp,
  WifiOff,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  registrationNumber: string;
  model: string;
  year: number;
  type: 'bus' | 'van' | 'mini_bus' | 'car';
  currentOdometer: number;
  fuelLevel: number;
  fuelTankCapacity: number;
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  averageEfficiency: number;
  lastFuelDate?: string;
  lastFuelAmount?: number;
  lastFuelLiters?: number;
  lastFuelOdometer?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  status: 'active' | 'maintenance' | 'idle';
}

interface FuelLog {
  _id: string;
  date: string;
  odometer: number;
  liters: number;
  amount: number;
  pricePerLiter: number;
  fuelStation?: string;
  receiptPhoto?: string;
  receiptPhotoUrl?: string;
  receiptNumber?: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit' | 'fuelCard';
  cardNumber?: string;
  notes?: string;
  efficiency?: number; // km/L (calculated from previous log)
  distanceSinceLast?: number;
  daysSinceLast?: number;
  partialFill: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  createdBy?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

interface FuelLogResponse {
  success: boolean;
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  stats: FuelStats;
  message?: string;
}

interface FuelStats {
  currentMonth: {
    liters: number;
    amount: number;
    count: number;
    avgPrice: number;
    avgEfficiency: number;
    bestEfficiency: number;
    worstEfficiency: number;
    totalDistance: number;
  };
  previousMonth: {
    liters: number;
    amount: number;
    count: number;
    avgPrice: number;
    avgEfficiency: number;
  };
  allTime: {
    liters: number;
    amount: number;
    count: number;
    avgPrice: number;
    avgEfficiency: number;
    totalDistance: number;
  };
  trends: {
    efficiency: 'improving' | 'declining' | 'stable';
    consumption: 'increasing' | 'decreasing' | 'stable';
    price: 'rising' | 'falling' | 'stable';
  };
  projections: {
    nextRefuel: {
      estimatedOdometer: number;
      estimatedDays: number;
      estimatedCost: number;
    };
    monthlyAverage: {
      liters: number;
      amount: number;
    };
  };
}

interface OfflineFuelLog extends FuelLog {
  offlineId: string;
  pendingSync: boolean;
  syncError?: string;
  retryCount: number;
}

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd MMM yyyy');
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = differenceInDays(now, date);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getEfficiencyColor = (efficiency: number, baseline: number = 4.0): string => {
  if (efficiency >= baseline * 1.1) return 'text-green-600';
  if (efficiency >= baseline * 0.9) return 'text-blue-600';
  if (efficiency >= baseline * 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

const getEfficiencyBadge = (efficiency: number, baseline: number = 4.0) => {
  if (efficiency >= baseline * 1.1) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
  }
  if (efficiency >= baseline * 0.9) {
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
  }
  if (efficiency >= baseline * 0.7) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Average</Badge>;
  }
  return <Badge className="bg-red-100 text-red-800 border-red-200">Poor</Badge>;
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <IndianRupee className="h-4 w-4 text-green-600" />;
    case 'card':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'upi':
      return <Smartphone className="h-4 w-4 text-indigo-600" />;
    case 'credit':
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    case 'fuelCard':
      return <Fuel className="h-4 w-4 text-amber-600" />;
    default:
      return <IndianRupee className="h-4 w-4 text-gray-600" />;
  }
};

// ==================== VALIDATION SCHEMA ====================

const fuelLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  odometer: z.coerce.number()
    .min(1, "Odometer must be positive")
    .int("Odometer must be a whole number"),
  liters: z.coerce.number()
    .min(1, "Liters must be at least 1")
    .max(999, "Max 999 liters")
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val.toString()), "Maximum 2 decimal places"),
  amount: z.coerce.number()
    .min(10, "Minimum amount ₹10")
    .max(50000, "Max ₹50,000"),
  fuelStation: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'credit', 'fuelCard']).default('cash'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  partialFill: z.boolean().default(false),
});

type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

// ==================== MOCK DATA ====================

const generateMockFuelLogs = (count: number, startOdometer: number): FuelLog[] => {
  const logs: FuelLog[] = [];
  let currentOdo = startOdometer;
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 5));
    
    const liters = 45 + Math.random() * 15;
    const pricePerLiter = 85 + Math.random() * 10;
    const amount = liters * pricePerLiter;
    const prevOdo = currentOdo;
    currentOdo -= 400 + Math.random() * 200;
    
    const distance = prevOdo - currentOdo;
    const efficiency = distance / liters;

    logs.push({
      _id: `fuel-${Date.now()}-${i}`,
      date: date.toISOString().split('T')[0],
      odometer: prevOdo,
      liters: Number(liters.toFixed(2)),
      amount: Number(amount.toFixed(0)),
      pricePerLiter: Number(pricePerLiter.toFixed(2)),
      fuelStation: ['HPCL', 'BPCL', 'IOCL', 'Reliance', 'Shell'][Math.floor(Math.random() * 5)],
      paymentMethod: ['cash', 'card', 'upi', 'credit', 'fuelCard'][Math.floor(Math.random() * 5)] as any,
      receiptNumber: Math.random() > 0.3 ? `RCPT-${Math.floor(Math.random() * 10000)}` : undefined,
      efficiency: efficiency > 0 && efficiency < 10 ? Number(efficiency.toFixed(2)) : 4.2,
      distanceSinceLast: distance,
      daysSinceLast: 5,
      partialFill: Math.random() > 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
      approved: Math.random() > 0.7,
    });
  }

  return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mockVehicle: Vehicle = {
  _id: 'veh-001',
  vehicleNumber: 'TS-07-AB-1234',
  registrationNumber: 'AP-31-TA-5678',
  model: 'Tata Starbus Urban',
  year: 2024,
  type: 'bus',
  currentOdometer: 52345,
  fuelLevel: 65,
  fuelTankCapacity: 120,
  fuelType: 'diesel',
  averageEfficiency: 4.2,
  lastFuelDate: '2026-03-15',
  lastFuelAmount: 4500,
  lastFuelLiters: 50.5,
  lastFuelOdometer: 52345,
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-05-15',
  insuranceExpiry: '2026-12-31',
  fitnessExpiry: '2026-12-31',
  status: 'active',
};

const mockFuelLogs = generateMockFuelLogs(20, 52345);

const calculateFuelStats = (logs: FuelLog[], vehicle: Vehicle): FuelStats => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));

  const currentMonthLogs = logs.filter(log => isAfter(new Date(log.date), currentMonthStart));
  const prevMonthLogs = logs.filter(log => {
    const date = new Date(log.date);
    return isAfter(date, prevMonthStart) && !isAfter(date, currentMonthStart);
  });

  const calculateStats = (logList: FuelLog[]) => {
    const liters = logList.reduce((sum, l) => sum + l.liters, 0);
    const amount = logList.reduce((sum, l) => sum + l.amount, 0);
    const count = logList.length;
    const efficiencies = logList.map(l => l.efficiency || 0).filter(e => e > 0);
    const distances = logList.map(l => l.distanceSinceLast || 0).filter(d => d > 0);
    
    return {
      liters,
      amount,
      count,
      avgPrice: liters > 0 ? amount / liters : 0,
      avgEfficiency: efficiencies.length > 0 
        ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length 
        : 0,
      totalDistance: distances.reduce((a, b) => a + b, 0),
    };
  };

  const allEfficiencies = logs.map(l => l.efficiency || 0).filter(e => e > 0);
  const totalDistance = logs.length > 1 
    ? logs[0].odometer - logs[logs.length - 1].odometer 
    : 0;

  // Determine trends
  const currentEfficiency = calculateStats(currentMonthLogs).avgEfficiency;
  const prevEfficiency = calculateStats(prevMonthLogs).avgEfficiency;
  const efficiencyTrend = currentEfficiency > prevEfficiency * 1.05 ? 'improving'
    : currentEfficiency < prevEfficiency * 0.95 ? 'declining' : 'stable';

  const currentConsumption = calculateStats(currentMonthLogs).liters;
  const prevConsumption = calculateStats(prevMonthLogs).liters;
  const consumptionTrend = currentConsumption > prevConsumption * 1.1 ? 'increasing'
    : currentConsumption < prevConsumption * 0.9 ? 'decreasing' : 'stable';

  const currentPrice = calculateStats(currentMonthLogs).avgPrice;
  const prevPrice = calculateStats(prevMonthLogs).avgPrice;
  const priceTrend = currentPrice > prevPrice * 1.05 ? 'rising'
    : currentPrice < prevPrice * 0.95 ? 'falling' : 'stable';

  // Projections
  const avgDailyDistance = totalDistance / (logs.length * 5 || 1);
  const remainingFuel = (vehicle.fuelLevel / 100) * vehicle.fuelTankCapacity;
  const estimatedDistance = remainingFuel * (currentEfficiency || vehicle.averageEfficiency);
  const estimatedDays = Math.floor(estimatedDistance / avgDailyDistance);
  const avgCostPerLiter = logs.length > 0 
    ? logs.reduce((sum, l) => sum + l.amount, 0) / logs.reduce((sum, l) => sum + l.liters, 0)
    : 90;

  return {
    currentMonth: {
      ...calculateStats(currentMonthLogs),
      bestEfficiency: Math.max(...currentMonthLogs.map(l => l.efficiency || 0), 0),
      worstEfficiency: Math.min(...currentMonthLogs.map(l => l.efficiency || 0), Infinity),
      totalDistance: calculateStats(currentMonthLogs).totalDistance,
    },
    previousMonth: calculateStats(prevMonthLogs),
    allTime: {
      liters: logs.reduce((sum, l) => sum + l.liters, 0),
      amount: logs.reduce((sum, l) => sum + l.amount, 0),
      count: logs.length,
      avgPrice: logs.reduce((sum, l) => sum + l.amount, 0) / logs.reduce((sum, l) => sum + l.liters, 0),
      avgEfficiency: allEfficiencies.length > 0 
        ? allEfficiencies.reduce((a, b) => a + b, 0) / allEfficiencies.length 
        : 0,
      totalDistance,
    },
    trends: {
      efficiency: efficiencyTrend as any,
      consumption: consumptionTrend as any,
      price: priceTrend as any,
    },
    projections: {
      nextRefuel: {
        estimatedOdometer: vehicle.currentOdometer + estimatedDistance,
        estimatedDays,
        estimatedCost: estimatedDistance / (currentEfficiency || vehicle.averageEfficiency) * avgCostPerLiter,
      },
      monthlyAverage: {
        liters: calculateStats(logs).liters / 12,
        amount: calculateStats(logs).amount / 12,
      },
    },
  };
};

const mockStats = calculateFuelStats(mockFuelLogs, mockVehicle);

// ==================== MAIN COMPONENT ====================

export default function FuelLogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const [showForm, setShowForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'efficiency'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [offlineQueue, setOfflineQueue] = useLocalStorage<OfflineFuelLog[]>('fuel-offline-queue', []);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);

  const searchDebounced = useDebounce(searchTerm, 300);

  // ==================== REACT QUERY ====================

  const {
    data: fuelData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<FuelLogResponse>({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getFuelLogs();
      // return response.data;

      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
        vehicle: mockVehicle,
        fuelLogs: mockFuelLogs,
        stats: mockStats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });

  const vehicle = fuelData?.vehicle;
  const fuelLogs = fuelData?.fuelLogs || [];
  const stats = fuelData?.stats;

  // ==================== MUTATIONS ====================

  const logMutation = useMutation({
    mutationFn: async (data: FuelLogFormValues) => {
      // Calculate price per liter
      const pricePerLiter = data.liters > 0 ? data.amount / data.liters : 0;
      
      const logData = {
        ...data,
        pricePerLiter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: isOnline,
      };

      // If offline, add to queue
      if (!isOnline) {
        const offlineLog: OfflineFuelLog = {
          ...logData,
          _id: `offline-${Date.now()}`,
          offlineId: `offline-${Date.now()}`,
          pendingSync: true,
          synced: false,
          efficiency: 0,
          retryCount: 0,
        };
        setOfflineQueue([...offlineQueue, offlineLog]);
        return { success: true, offline: true };
      }

      // Online - call API
      // const response = await driverService.logFuel(logData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, id: `fuel-${Date.now()}` };
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast.success("Fuel log saved offline", {
          description: "Will sync when you're back online",
        });
      } else {
        toast.success("Fuel log saved successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to save fuel log", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (_args: { id: string; data: FuelLogFormValues }) => {
      // await driverService.updateFuelLog(id, data);
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: (_data, { id }) => {
      toast.success("Fuel log updated successfully");
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      setShowEditDialog(false);
      setEditingLog(null);
      console.log('Updated fuel log:', id);
    },
    onError: () => {
      toast.error("Failed to update fuel log");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_logId: string) => {
      // await driverService.deleteFuelLog(_logId);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Fuel log deleted");
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      setShowDeleteDialog(false);
      setSelectedLog(null);
    },
    onError: () => {
      toast.error("Failed to delete fuel log");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      for (const log of offlineQueue) {
        try {
          // await driverService.logFuel(log);
          console.log('Syncing log:', log.offlineId);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          throw new Error(`Failed to sync log ${log.offlineId}`);
        }
      }
      return { success: true };
    },
    onSuccess: () => {
      setOfflineQueue([]);
      toast.success("All logs synced successfully");
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
    onError: (error) => {
      toast.error("Failed to sync some logs", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // ==================== FORM ====================

  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      odometer: vehicle?.currentOdometer || 0,
      liters: 0,
      amount: 0,
      fuelStation: "",
      paymentMethod: 'cash',
      receiptNumber: "",
      notes: "",
      partialFill: false,
    },
  });

  const editForm = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      date: "",
      odometer: 0,
      liters: 0,
      amount: 0,
      fuelStation: "",
      paymentMethod: 'cash',
      receiptNumber: "",
      notes: "",
      partialFill: false,
    },
  });

  const onSubmit = (values: FuelLogFormValues) => {
    // Business Rule: Odometer must be > last reading
    const lastLog = fuelLogs[0];
    if (lastLog && values.odometer <= lastLog.odometer) {
      form.setError("odometer", { 
        message: `Must be greater than last reading (${lastLog.odometer.toLocaleString()} km)` 
      });
      return;
    }

    // Business Rule: Odometer must be > current vehicle odometer
    if (vehicle && values.odometer <= vehicle.currentOdometer) {
      form.setError("odometer", { 
        message: `Must be greater than current odometer (${vehicle.currentOdometer.toLocaleString()} km)` 
      });
      return;
    }

    logMutation.mutate(values);
  };

  const onEditSubmit = (values: FuelLogFormValues) => {
    if (!editingLog) return;
    updateMutation.mutate({ id: editingLog._id, data: values });
  };

  // ==================== COMPUTED VALUES ====================

  const processedLogs = useMemo(() => {
    if (!fuelLogs.length) return [];
    
    return fuelLogs.map((log, index, arr) => {
      const nextLog = arr[index + 1];
      let efficiency = log.efficiency;
      
      // Calculate efficiency if not present
      if (!efficiency && nextLog) {
        const distance = log.odometer - nextLog.odometer;
        efficiency = distance > 0 ? Number((distance / log.liters).toFixed(2)) : 0;
      }
      
      return { ...log, efficiency };
    });
  }, [fuelLogs]);

  const chartData = useMemo(() => {
    return processedLogs.slice(0, 10).map(log => ({
      date: format(new Date(log.date), 'dd MMM'),
      efficiency: log.efficiency || 0,
      liters: log.liters,
      amount: log.amount,
      price: log.pricePerLiter,
    })).reverse();
  }, [processedLogs]);

  const filteredLogs = useMemo(() => {
    let filtered = [...processedLogs];

    // Apply date range filter
    if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(l => new Date(l.date) > monthAgo);
    } else if (dateRange === 'quarter') {
      const quarterAgo = new Date();
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      filtered = filtered.filter(l => new Date(l.date) > quarterAgo);
    } else if (dateRange === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filtered = filtered.filter(l => new Date(l.date) > yearAgo);
    }

    // Apply search filter
    if (searchDebounced) {
      const term = searchDebounced.toLowerCase();
      filtered = filtered.filter(l => 
        l.fuelStation?.toLowerCase().includes(term) ||
        l.notes?.toLowerCase().includes(term) ||
        l.receiptNumber?.toLowerCase().includes(term) ||
        l.paymentMethod?.toLowerCase().includes(term)
      );
    }

    // Apply payment method filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(l => l.paymentMethod === paymentFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'efficiency':
          comparison = (b.efficiency || 0) - (a.efficiency || 0);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [processedLogs, dateRange, searchDebounced, paymentFilter, sortBy, sortOrder]);

  const pendingSyncCount = offlineQueue.length;

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing fuel logs...");
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

  const handleViewDetails = useCallback((log: FuelLog) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  }, []);

  const handleEdit = useCallback((log: FuelLog) => {
    setEditingLog(log);
    editForm.reset({
      date: log.date,
      odometer: log.odometer,
      liters: log.liters,
      amount: log.amount,
      fuelStation: log.fuelStation || "",
      paymentMethod: log.paymentMethod,
      receiptNumber: log.receiptNumber || "",
      notes: log.notes || "",
      partialFill: log.partialFill,
    });
    setShowEditDialog(true);
  }, [editForm]);

  const handleDelete = useCallback((log: FuelLog) => {
    setSelectedLog(log);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedLog) {
      deleteMutation.mutate(selectedLog._id);
    }
  }, [selectedLog, deleteMutation]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Odometer (km)', 'Liters', 'Amount (₹)', 'Price/L (₹)', 'Efficiency (km/L)', 'Station', 'Payment Method', 'Receipt No', 'Notes'];
    const rows = filteredLogs.map(l => [
      formatDate(l.date),
      l.odometer,
      l.liters.toFixed(2),
      l.amount,
      l.pricePerLiter.toFixed(2),
      l.efficiency?.toFixed(2) || '',
      l.fuelStation || '',
      l.paymentMethod || '',
      l.receiptNumber || '',
      l.notes || '',
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel-logs-${vehicle?.vehicleNumber}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Fuel logs exported successfully");
  }, [filteredLogs, vehicle]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] w-full lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fuel Management</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Bus className="h-4 w-4" />
            {vehicle?.vehicleNumber} • {vehicle?.model} • {vehicle?.fuelType}
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
              <p>Refresh fuel logs</p>
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
                <p>Sync offline logs</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "transition-all",
            showForm && "bg-muted hover:bg-muted"
          )}
        >
          {showForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {showForm ? 'Cancel' : 'Log Fuel'}
        </Button>
      </div>
    </div>
  );

  const renderVehicleStatus = () => (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-800">Current Vehicle</p>
              <p className="text-xl font-bold text-blue-900">{vehicle?.vehicleNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-blue-700">Odometer</p>
              <p className="text-lg font-bold">{vehicle?.currentOdometer.toLocaleString()} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Fuel Level</p>
              <div className="flex items-center gap-2">
                <Progress value={vehicle?.fuelLevel} className="w-20 h-2" />
                <span className="font-bold">{vehicle?.fuelLevel}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Avg Efficiency</p>
              <p className="text-lg font-bold">{vehicle?.averageEfficiency} km/L</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStats = () => {
    if (!stats) return null;

    const efficiencyTrend = stats.trends.efficiency;
    const consumptionTrend = stats.trends.consumption;
    const priceTrend = stats.trends.price;

    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">This Month</p>
                <p className="text-2xl font-bold">{stats.currentMonth.liters.toFixed(1)} L</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.currentMonth.amount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              {consumptionTrend === 'increasing' ? (
                <TrendingUp className="h-3 w-3 text-red-600" />
              ) : consumptionTrend === 'decreasing' ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-muted-foreground">
                vs last month ({stats.previousMonth.liters.toFixed(1)} L)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Avg Efficiency</p>
                <p className="text-2xl font-bold">{stats?.currentMonth.avgEfficiency.toFixed(2)} km/L</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Best: {stats?.currentMonth.bestEfficiency.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              {efficiencyTrend === 'improving' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : efficiencyTrend === 'declining' ? (
                <TrendingDown className="h-3 w-3 text-red-600" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              {getEfficiencyBadge(stats?.currentMonth.avgEfficiency, vehicle?.averageEfficiency)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Avg Price</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.currentMonth.avgPrice)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  per liter
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              {priceTrend === 'rising' ? (
                <TrendingUp className="h-3 w-3 text-red-600" />
              ) : priceTrend === 'falling' ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-muted-foreground">
                vs last month ({formatCurrency(stats.previousMonth.avgPrice)})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Next Refuel</p>
                <p className="text-2xl font-bold">~{stats.projections.nextRefuel.estimatedDays} days</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.projections.nextRefuel.estimatedOdometer.toLocaleString()} km
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Gauge className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Est. cost {formatCurrency(stats.projections.nextRefuel.estimatedCost)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderForm = () => (
    <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          New Fuel Entry
        </CardTitle>
        <CardDescription>
          Enter details from your fuel receipt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Purchase</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Reading (km)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder={vehicle?.currentOdometer.toString()} 
                          {...field} 
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          km
                        </span>
                      </div>
                    </FormControl>
                    {vehicle && (
                      <FormDescription>
                        Last reading: {vehicle.currentOdometer.toLocaleString()} km
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="liters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (Liters)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          L
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          ₹
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fuelStation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Station (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IOCL, Kukatpally" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="fuelCard">Fuel Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., RCPT-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partialFill"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Partial Fill</FormLabel>
                      <FormDescription>
                        Check if tank wasn't filled completely
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes..." 
                      {...field} 
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2 flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base"
                disabled={logMutation.isPending}
              >
                {logMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Save Fuel Entry
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
                className="h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderChart = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Efficiency Trend (km/L)
        </CardTitle>
        <Badge variant="outline" className="bg-blue-50">
          Last {chartData.length} entries
        </Badge>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#888888"
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              tick={{ fontSize: 12 }}
              stroke="#888888"
            />
            <RechartsTooltip
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
              }}
              formatter={(value: number) => [`${value.toFixed(2)} km/L`, 'Efficiency']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
        <SelectTrigger className="w-[130px] h-8">
          <CalendarIcon className="h-3 w-3 mr-2" />
          <SelectValue placeholder="Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Last Month</SelectItem>
          <SelectItem value="quarter">Last Quarter</SelectItem>
          <SelectItem value="year">Last Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>

      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
        <SelectTrigger className="w-[140px] h-8">
          <Filter className="h-3 w-3 mr-2" />
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="card">Card</SelectItem>
          <SelectItem value="upi">UPI</SelectItem>
          <SelectItem value="credit">Credit</SelectItem>
          <SelectItem value="fuelCard">Fuel Card</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by station, receipt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant={sortBy === 'date' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setSortBy('date');
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
          }}
          className="h-8"
        >
          Date
          {sortBy === 'date' && (
            sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />
          )}
        </Button>
        <Button
          variant={sortBy === 'amount' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setSortBy('amount');
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
          }}
          className="h-8"
        >
          Amount
          {sortBy === 'amount' && (
            sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />
          )}
        </Button>
      </div>
    </div>
  );

  const renderLogsTable = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Fuel History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Liters</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No fuel logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(log.date)}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(log.date)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.odometer.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.liters.toFixed(2)} L
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(log.amount)}
                    </TableCell>
                    <TableCell>
                      {log.efficiency ? (
                        <span className={getEfficiencyColor(log.efficiency, vehicle?.averageEfficiency)}>
                          {log.efficiency.toFixed(2)} km/L
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.fuelStation ? (
                        <Badge variant="outline">{log.fuelStation}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon(log.paymentMethod)}
                        <span className="text-xs capitalize">{log.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(log)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(log)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-xs text-muted-foreground">
            Showing {filteredLogs.length} of {processedLogs.length} logs
          </p>
          <Badge variant="outline" className="text-xs">
            Page 1 of 1
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderAlerts = () => (
    <Card className="bg-amber-50/50 border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          Insights & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats?.currentMonth?.avgEfficiency && stats?.currentMonth.avgEfficiency < (vehicle?.averageEfficiency || 4) * 0.9 && (
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900">Low Efficiency Detected</p>
                <p className="text-amber-700 mt-1">
                  Current efficiency {stats?.currentMonth.avgEfficiency.toFixed(2)} km/L is
                  {((1 - stats?.currentMonth.avgEfficiency / (vehicle?.averageEfficiency || 4)) * 100).toFixed(0)}%
                  below average. Check tire pressure and engine.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats?.trends.price === 'rising' && (
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900">Fuel Price Increasing</p>
                <p className="text-amber-700 mt-1">
                  Average price is up by {formatCurrency(stats.currentMonth.avgPrice - stats.previousMonth.avgPrice)} 
                  from last month. Consider filling at cheaper stations.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Last Recorded</span>
            <span className="font-bold">{vehicle?.lastFuelDate ? formatDate(vehicle.lastFuelDate) : 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Avg Price/L</span>
            <span className="font-bold">{formatCurrency(stats?.currentMonth.avgPrice || 0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Next Refuel</span>
            <span className="font-bold">~{stats?.projections.nextRefuel.estimatedDays} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <div className="grid grid-cols-2 gap-3">
      <Button 
        variant="outline" 
        className="h-auto py-4 flex flex-col items-center gap-2"
        onClick={() => toast.info("Camera feature coming soon")}
      >
        <Camera className="h-5 w-5 text-primary" />
        <span className="text-xs font-medium">Scan Receipt</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto py-4 flex flex-col items-center gap-2"
        onClick={handlePrintReport}
      >
        <FileText className="h-5 w-5 text-primary" />
        <span className="text-xs font-medium">Print Report</span>
      </Button>
    </div>
  );

  const renderGuidelines = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Info className="h-4 w-4" />
          Fueling Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 shrink-0">
            1
          </div>
          <p>Always fill to full tank for accurate efficiency tracking</p>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 shrink-0">
            2
          </div>
          <p>Keep receipts for monthly audit verification</p>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 shrink-0">
            3
          </div>
          <p>Log entries immediately to ensure odometer accuracy</p>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 shrink-0">
            4
          </div>
          <p>Sudden drop in efficiency may indicate mechanical issues</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-blue-600" />
            Fuel Log Details
          </DialogTitle>
        </DialogHeader>
        {selectedLog && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(selectedLog.date)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Odometer</p>
                <p className="font-medium">{selectedLog.odometer.toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Liters</p>
                <p className="font-medium">{selectedLog.liters.toFixed(2)} L</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium text-green-600">{formatCurrency(selectedLog.amount)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Price/L</p>
                <p className="font-medium">{formatCurrency(selectedLog.pricePerLiter)}</p>
              </div>
              {selectedLog.efficiency && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Efficiency</p>
                  <p className={getEfficiencyColor(selectedLog.efficiency)}>
                    {selectedLog.efficiency.toFixed(2)} km/L
                  </p>
                </div>
              )}
            </div>

            {selectedLog.fuelStation && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Fuel Station</p>
                <p className="font-medium">{selectedLog.fuelStation}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <div className="flex items-center gap-2 mt-1">
                  {getPaymentMethodIcon(selectedLog.paymentMethod)}
                  <span className="font-medium capitalize">{selectedLog.paymentMethod}</span>
                </div>
              </div>
              {selectedLog.receiptNumber && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Receipt Number</p>
                  <p className="font-mono text-sm">{selectedLog.receiptNumber}</p>
                </div>
              )}
            </div>

            {selectedLog.partialFill && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Partial Fill - Efficiency may not be accurate
                </p>
              </div>
            )}

            {selectedLog.notes && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{selectedLog.notes}</p>
              </div>
            )}

            {selectedLog.distanceSinceLast && (
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-3">
                <div>
                  <span className="font-medium">Distance since last:</span> {selectedLog.distanceSinceLast} km
                </div>
                <div>
                  <span className="font-medium">Days since last:</span> {selectedLog.daysSinceLast} days
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {selectedLog && (
            <Button onClick={() => handleEdit(selectedLog)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEditDialog = () => (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Fuel Log
          </DialogTitle>
        </DialogHeader>
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={editForm.control}
                name="liters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liters</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={editForm.control}
                name="fuelStation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Station</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="fuelCard">Fuel Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={editForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Fuel Log
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this fuel log? This action cannot be undone.
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
      {renderVehicleStatus()}
      {renderStats()}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {showForm ? renderForm() : (
            <>
              {renderChart()}
              {renderFilters()}
              {renderLogsTable()}
            </>
          )}
        </div>

        <div className="space-y-6">
          {renderAlerts()}
          {renderQuickActions()}
          {renderGuidelines()}
        </div>
      </div>

      {/* Dialogs */}
      {renderDetailsDialog()}
      {renderEditDialog()}
      {renderDeleteDialog()}
    </div>
  );
}