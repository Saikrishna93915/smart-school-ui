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

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";
// import { useGeolocation } from "@/hooks/useGeolocation"; // Hook doesn't exist yet
import { cn } from "@/lib/utils";

// Icons
import {
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin,
  Upload,
  Plus,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Trash2,
  WifiOff,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

type IncidentType = 
  | "accident" 
  | "near_miss" 
  | "student_injury" 
  | "student_misbehavior" 
  | "vehicle_breakdown" 
  | "route_deviation" 
  | "traffic_violation" 
  | "medical_emergency" 
  | "weather_related" 
  | "fire" 
  | "theft" 
  | "vandalism" 
  | "unauthorized_entry" 
  | "parent_incident" 
  | "other";

type IncidentSeverity = "critical" | "high" | "medium" | "low";
type IncidentStatus = "pending" | "under_review" | "investigating" | "resolved" | "closed" | "dismissed";

interface Location {
  lat: number;
  lng: number;
  address: string;
  accuracy?: number;
}

interface Witness {
  name: string;
  phone: string;
  email?: string;
  statement?: string;
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
  uploadedAt: string;
}

interface IncidentReport {
  _id: string;
  reportNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  location: Location;
  studentsInvolved: Array<{
    studentId?: string;
    name: string;
    class?: string;
    section?: string;
    injury?: string;
    parentNotified?: boolean;
  }>;
  actionTaken: string;
  witnesses: Witness[];
  attachments: Attachment[];
  reportedBy: {
    driverId: string;
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  resolutionNotes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  notified: {
    schoolAdmin: boolean;
    parents: boolean;
    emergency: boolean;
  };
  offlineId?: string;
  synced: boolean;
}

interface IncidentStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  averageResolutionTime?: number; // in hours
  thisMonth: number;
  lastMonth: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface IncidentFilter {
  search: string;
  type: string;
  severity: string;
  status: string;
  fromDate: string | null;
  toDate: string | null;
  sortBy: 'date' | 'severity' | 'status';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface IncidentResponse {
  success: boolean;
  data: {
    reports: IncidentReport[];
    stats: IncidentStats;
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

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'dd MMM yyyy');
};

const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a');
};

const formatTimeAgo = (dateString: string): string => {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

const generateReportNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INC-${year}${month}${day}-${random}`;
};

const getSeverityColor = (severity: IncidentSeverity): { bg: string; text: string; border: string } => {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
    case 'high':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' };
    case 'medium':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500' };
    case 'low':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
  }
};

const getSeverityBadge = (severity: IncidentSeverity) => {
  const colors = getSeverityColor(severity);
  return (
    <Badge className={`${colors.bg} ${colors.text} border-0`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
};

const getStatusColor = (status: IncidentStatus): { bg: string; text: string; icon: React.ElementType } => {
  switch (status) {
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
    case 'under_review':
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: Eye };
    case 'investigating':
      return { bg: 'bg-purple-100', text: 'text-purple-800', icon: Search };
    case 'resolved':
      return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
    case 'closed':
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle };
    case 'dismissed':
      return { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
  }
};

const getStatusBadge = (status: IncidentStatus) => {
  const { bg, text, icon: Icon } = getStatusColor(status);
  return (
    <Badge className={`${bg} ${text} border-0 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
};

const getTypeLabel = (type: IncidentType): string => {
  const labels: Record<IncidentType, string> = {
    accident: 'Accident/Collision',
    near_miss: 'Near Miss',
    student_injury: 'Student Injury',
    student_misbehavior: 'Student Misbehavior',
    vehicle_breakdown: 'Vehicle Breakdown',
    route_deviation: 'Route Deviation',
    traffic_violation: 'Traffic Violation',
    medical_emergency: 'Medical Emergency',
    weather_related: 'Weather-Related',
    fire: 'Fire',
    theft: 'Theft',
    vandalism: 'Vandalism',
    unauthorized_entry: 'Unauthorized Entry',
    parent_incident: 'Parent Incident',
    other: 'Other',
  };
  return labels[type] || type;
};

const incidentTypes: { value: IncidentType; label: string }[] = [
  { value: 'accident', label: 'Accident/Collision' },
  { value: 'near_miss', label: 'Near Miss' },
  { value: 'student_injury', label: 'Student Injury' },
  { value: 'student_misbehavior', label: 'Student Misbehavior' },
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown' },
  { value: 'route_deviation', label: 'Route Deviation' },
  { value: 'traffic_violation', label: 'Traffic Violation' },
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'weather_related', label: 'Weather-Related' },
  { value: 'fire', label: 'Fire' },
  { value: 'theft', label: 'Theft' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'unauthorized_entry', label: 'Unauthorized Entry' },
  { value: 'parent_incident', label: 'Parent Incident' },
  { value: 'other', label: 'Other' },
];

const severityLevels: { value: IncidentSeverity; label: string }[] = [
  { value: 'critical', label: 'Critical - Immediate Danger' },
  { value: 'high', label: 'High - Serious' },
  { value: 'medium', label: 'Medium - Requires Attention' },
  { value: 'low', label: 'Low - Minor Issue' },
];

// ==================== VALIDATION SCHEMA ====================

const incidentSchema = z.object({
  type: z.enum([
    'accident', 'near_miss', 'student_injury', 'student_misbehavior',
    'vehicle_breakdown', 'route_deviation', 'traffic_violation',
    'medical_emergency', 'weather_related', 'fire', 'theft',
    'vandalism', 'unauthorized_entry', 'parent_incident', 'other'
  ], { required_error: "Please select incident type" }),
  severity: z.enum(['critical', 'high', 'medium', 'low'], {
    required_error: "Please select severity level"
  }),
  location: z.object({
    address: z.string().min(5, "Location address is required"),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  description: z.string().min(20, "Description must be at least 20 characters"),
  studentsInvolved: z.array(z.object({
    name: z.string().optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    injury: z.string().optional(),
    parentNotified: z.boolean().default(false),
  })).optional(),
  actionTaken: z.string().min(10, "Please describe immediate action taken"),
  witnesses: z.array(z.object({
    name: z.string().min(2, "Witness name is required"),
    phone: z.string().min(10, "Valid phone number required"),
    email: z.string().email().optional(),
    statement: z.string().optional(),
  })).optional(),
  notifySchoolAdmin: z.boolean().default(true),
  notifyParents: z.boolean().default(false),
  notifyEmergency: z.boolean().default(false),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

// ==================== MOCK DATA ====================

const generateMockIncidents = (count: number): IncidentReport[] => {
  const incidents: IncidentReport[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const severity: IncidentSeverity[] = ['critical', 'high', 'medium', 'low'];
    const status: IncidentStatus[] = ['pending', 'under_review', 'investigating', 'resolved', 'closed'];
    const type: IncidentType[] = [
      'accident', 'near_miss', 'student_injury', 'vehicle_breakdown',
      'medical_emergency', 'traffic_violation', 'student_misbehavior'
    ];

    const selectedSeverity = severity[Math.floor(Math.random() * severity.length)];
    const selectedStatus = status[Math.floor(Math.random() * status.length)];
    const selectedType = type[Math.floor(Math.random() * type.length)];

    incidents.push({
      _id: `inc-${Date.now()}-${i}`,
      reportNumber: generateReportNumber(),
      type: selectedType,
      severity: selectedSeverity,
      status: selectedStatus,
      description: `Sample incident description for ${selectedType}. This is a detailed description of what happened.`,
      location: {
        lat: 17.4948 + (Math.random() * 0.1),
        lng: 78.4014 + (Math.random() * 0.1),
        address: `${Math.floor(Math.random() * 999)} Main Road, Kukatpally, Hyderabad`,
      },
      studentsInvolved: Math.random() > 0.5 ? [
        { name: 'Rahul Kumar', class: '10', section: 'A' },
        { name: 'Priya Singh', class: '9', section: 'B' },
      ] : [],
      actionTaken: 'Immediately stopped the vehicle, assessed the situation, and contacted school administration.',
      witnesses: Math.random() > 0.7 ? [
        { name: 'Rajesh Sharma', phone: '9876543210' },
      ] : [],
      attachments: [],
      reportedBy: {
        driverId: 'drv-001',
        name: 'Rajesh Kumar',
        phone: '9876543210',
        vehicleNumber: 'TS-07-AB-1234',
      },
      reportedAt: date.toISOString(),
      updatedAt: date.toISOString(),
      resolvedAt: selectedStatus === 'resolved' ? new Date(date.getTime() + 86400000).toISOString() : undefined,
      followUpRequired: Math.random() > 0.8,
      notified: {
        schoolAdmin: true,
        parents: Math.random() > 0.5,
        emergency: selectedSeverity === 'critical' || selectedSeverity === 'high',
      },
      synced: true,
    });
  }

  return incidents.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
};

const mockIncidents = generateMockIncidents(25);

const calculateIncidentStats = (incidents: IncidentReport[]): IncidentStats => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const thisMonthIncidents = incidents.filter(i => {
    const date = new Date(i.reportedAt);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });

  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonthIncidents = incidents.filter(i => {
    const date = new Date(i.reportedAt);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  const byType = {} as Record<IncidentType, number>;
  const bySeverity = {} as Record<IncidentSeverity, number>;

  incidents.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
  });

  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  const totalResolutionTime = resolvedIncidents.reduce((sum, i) => {
    if (i.resolvedAt) {
      const resolved = new Date(i.resolvedAt).getTime();
      const reported = new Date(i.reportedAt).getTime();
      return sum + (resolved - reported) / (1000 * 60 * 60); // hours
    }
    return sum;
  }, 0);

  return {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'pending').length,
    underReview: incidents.filter(i => i.status === 'under_review' || i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low: incidents.filter(i => i.severity === 'low').length,
    byType,
    bySeverity,
    averageResolutionTime: resolvedIncidents.length > 0 ? totalResolutionTime / resolvedIncidents.length : 0,
    thisMonth: thisMonthIncidents.length,
    lastMonth: lastMonthIncidents.length,
    trend: thisMonthIncidents.length > lastMonthIncidents.length ? 'increasing' 
      : thisMonthIncidents.length < lastMonthIncidents.length ? 'decreasing' : 'stable',
  };
};

const mockStats = calculateIncidentStats(mockIncidents);

// ==================== MAIN COMPONENT ====================

export default function IncidentReportPage() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus(); // Destructure to get boolean
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError] = useState<string | null>(null);
  const getLocation = () => {
    // Mock implementation for now
    setCurrentLocation({
      lat: 17.4948,
      lng: 78.4014,
      address: 'Kukatpally, Hyderabad'
    });
  };

  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  
  const [filters, setFilters] = useState<IncidentFilter>({
    search: '',
    type: 'all',
    severity: 'all',
    status: 'all',
    fromDate: null,
    toDate: null,
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [offlineQueue, setOfflineQueue] = useLocalStorage<IncidentReport[]>('incident-offline-queue', []);

  // ==================== REACT QUERY ====================

  const {
    data: incidentsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<IncidentResponse>({    queryKey: ["incident-reports", filters],
    queryFn: async () => {
      // In production, replace with actual API call with filters
      // const response = await driverService.getIncidentReports(filters);
      // return response.data;

      await new Promise(resolve => setTimeout(resolve, 800));

      let filtered = [...mockIncidents];

      // Apply search filter
      if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter(i => 
          i.reportNumber.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term) ||
          i.location.address.toLowerCase().includes(term)
        );
      }

      // Apply type filter
      if (filters.type !== 'all') {
        filtered = filtered.filter(i => i.type === filters.type);
      }

      // Apply severity filter
      if (filters.severity !== 'all') {
        filtered = filtered.filter(i => i.severity === filters.severity);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(i => i.status === filters.status);
      }

      // Apply date range
      if (filters.fromDate) {
        filtered = filtered.filter(i => new Date(i.reportedAt) >= new Date(filters.fromDate!));
      }
      if (filters.toDate) {
        filtered = filtered.filter(i => new Date(i.reportedAt) <= new Date(filters.toDate!));
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
            break;
          case 'severity':
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            comparison = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
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
          reports: paginated,
          stats: calculateIncidentStats(mockIncidents),
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

  const incidents = incidentsData?.data.reports || [];
  const stats = incidentsData?.data.stats || mockStats;
  const pagination = incidentsData?.data.pagination;

  // ==================== FORM ====================

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      type: undefined,
      severity: 'medium',
      location: {
        address: '',
        lat: 0,
        lng: 0,
      },
      description: '',
      studentsInvolved: [],
      actionTaken: '',
      witnesses: [],
      notifySchoolAdmin: true,
      notifyParents: false,
      notifyEmergency: false,
    },
  });

  // Auto-fill location when available
  useEffect(() => {
    if (currentLocation) {
      form.setValue('location.lat', currentLocation.lat);
      form.setValue('location.lng', currentLocation.lng);
      // In production, reverse geocode to get address
      form.setValue('location.address', `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
    }
  }, [currentLocation, form]);

  // ==================== MUTATIONS ====================

  const submitMutation = useMutation({
    mutationFn: async (data: IncidentFormValues) => {
      const reportData: Partial<IncidentReport> = {
        reportNumber: generateReportNumber(),
        type: data.type,
        severity: data.severity,
        location: {
          address: data.location.address,
          lat: data.location.lat || 0,
          lng: data.location.lng || 0,
        },
        description: data.description,
        actionTaken: data.actionTaken,
        studentsInvolved: (data.studentsInvolved || []).map(s => ({
          name: s.name || "Unknown",
          class: s.class,
          section: s.section,
          injury: s.injury,
          parentNotified: s.parentNotified || false,
        })),
        witnesses: data.witnesses || [],
        reportedBy: {
          driverId: 'drv-001', // From auth context
          name: 'Rajesh Kumar', // From auth context
          phone: '9876543210', // From auth context
          vehicleNumber: 'TS-07-AB-1234', // From vehicle data
        },
        reportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        attachments: [],
        notified: {
          schoolAdmin: data.notifySchoolAdmin || false,
          parents: data.notifyParents || false,
          emergency: data.notifyEmergency || false,
        },
        followUpRequired: false,
        synced: isOnline || false,
      };

      // If offline, add to queue
      if (!isOnline) {
        const offlineReport: IncidentReport = {
          ...reportData as IncidentReport,
          _id: `offline-${Date.now()}`,
          offlineId: `offline-${Date.now()}`,
          synced: false,
        };
        setOfflineQueue([...offlineQueue, offlineReport]);
        return { success: true, offline: true };
      }

      // Online - call API
      // const response = await driverService.submitIncidentReport(reportData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, id: `inc-${Date.now()}` };
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast.success("Incident report saved offline", {
          description: "Will sync when you're back online",
        });
      } else {
        toast.success("Incident report submitted successfully", {
          description: "School administration has been notified.",
        });

        // If emergency services notified
        if (form.getValues('notifyEmergency')) {
          toast.info("Emergency services have been alerted", {
            description: "Stay on the line for instructions.",
            duration: 10000,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["incident-reports"] });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to submit incident report", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncidentStatus }) => {
      // await driverService.updateIncidentStatus(id, status);
      console.log('Updating incident', id, 'to status', status);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: (_data, { status }) => {
      toast.success(`Status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ["incident-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id: string) => {
      // await driverService.deleteIncidentReport(_id);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Incident report deleted");
      queryClient.invalidateQueries({ queryKey: ["incident-reports"] });
      setShowDeleteDialog(false);
      setSelectedIncident(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      for (const report of offlineQueue) {
        try {
          // await driverService.submitIncidentReport(report);
          console.log('Syncing report:', report.offlineId);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          throw new Error(`Failed to sync report ${report.offlineId}`);
        }
      }
      return { success: true };
    },
    onSuccess: () => {
      setOfflineQueue([]);
      toast.success("All reports synced successfully");
      queryClient.invalidateQueries({ queryKey: ["incident-reports"] });
    },
    onError: (error) => {
      toast.error("Failed to sync some reports", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing incident reports...");
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

  const onSubmit = (values: IncidentFormValues) => {
    submitMutation.mutate(values);
  };

  const handleViewDetails = useCallback((incident: IncidentReport) => {
    setSelectedIncident(incident);
    setShowDetailsDialog(true);
  }, []);

  const handleDelete = useCallback((incident: IncidentReport) => {
    setSelectedIncident(incident);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedIncident) {
      deleteMutation.mutate(selectedIncident._id);
    }
  }, [selectedIncident, deleteMutation]);

  const handleUpdateStatus = useCallback((id: string, status: IncidentStatus) => {
    updateStatusMutation.mutate({ id, status });
  }, [updateStatusMutation]);

  const handleGetLocation = useCallback(() => {
    getLocation();
  }, [getLocation]);

  const handleAddWitness = useCallback(() => {
    const witnesses = form.getValues('witnesses') || [];
    form.setValue('witnesses', [
      ...witnesses,
      { name: '', phone: '' },
    ]);
  }, [form]);

  const handleRemoveWitness = useCallback((index: number) => {
    const witnesses = form.getValues('witnesses') || [];
    form.setValue('witnesses', witnesses.filter((_, i) => i !== index));
  }, [form]);

  const handleAddStudent = useCallback(() => {
    const students = form.getValues('studentsInvolved') || [];
    form.setValue('studentsInvolved', [
      ...students,
      { name: '', class: '', section: '', parentNotified: false },
    ]);
  }, [form]);

  const handleRemoveStudent = useCallback((index: number) => {
    const students = form.getValues('studentsInvolved') || [];
    form.setValue('studentsInvolved', students.filter((_, i) => i !== index));
  }, [form]);

  const handleEmergency = useCallback(() => {
    setShowSOSDialog(true);
  }, []);

  const confirmEmergency = useCallback(() => {
    form.setValue('severity', 'critical');
    form.setValue('notifyEmergency', true);
    setShowSOSDialog(false);
    setShowForm(true);
    toast.warning("Emergency Mode Activated", {
      description: "Fill the form quickly. Emergency services will be notified.",
      duration: 10000,
    });
  }, [form]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      severity: 'all',
      status: 'all',
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

  if (isLoading && !incidents.length) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Incident Reporting</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
          <AlertTriangle className="h-4 w-4" />
          Report accidents, injuries, or other incidents
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
              <p>Refresh incident reports</p>
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
                <p>Sync offline reports</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          onClick={handleEmergency}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          SOS Emergency
        </Button>

        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className={showForm ? 'bg-muted hover:bg-muted' : ''}
        >
          {showForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {showForm ? 'Cancel' : 'Report Incident'}
        </Button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">This Month</p>
              <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.trend === 'increasing' ? '▲' : stats.trend === 'decreasing' ? '▼' : '•'} 
                vs last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </div>
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
              placeholder="Search by report #, description..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-9"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filters.type !== 'all' || filters.severity !== 'all' || filters.status !== 'all' || 
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
              <SelectItem value="severity">Severity</SelectItem>
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
              <Label>Incident Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {incidentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
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
    <Card className="border-amber-500 shadow-lg animate-in slide-in-from-top duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          New Incident Report
        </CardTitle>
        <CardDescription>
          Please provide accurate details about the incident. All fields marked * are required.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentTypes.map(type => (
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
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {severityLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
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
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter address or location" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetLocation}
                        className="shrink-0"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Location
                      </Button>
                    </div>
                    {locationError && (
                      <p className="text-xs text-red-600 mt-1">{locationError}</p>
                    )}
                    {currentLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Incident Details</h3>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what happened in detail..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include what happened, when, and who was involved.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actionTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immediate Action Taken *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you do immediately after the incident?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Students Involved */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Students Involved</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStudent}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>

              {form.watch('studentsInvolved')?.map((_, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Student {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStudent(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`studentsInvolved.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Student name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`studentsInvolved.${index}.class`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 10" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`studentsInvolved.${index}.section`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., A" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name={`studentsInvolved.${index}.injury`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Injury (if any)</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe any injuries" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`studentsInvolved.${index}.parentNotified`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Parent Notified</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Witnesses</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWitness}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Witness
                </Button>
              </div>

              {form.watch('witnesses')?.map((_, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Witness {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWitness(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`witnesses.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Witness name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`witnesses.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`witnesses.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`witnesses.${index}.statement`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statement (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Witness statement..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Notifications</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="notifySchoolAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Notify School Admin
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyParents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Notify Parents
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyEmergency"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-red-500 data-[state=checked]:bg-red-600"
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-red-600">
                        Emergency Services
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-11"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5 mr-2" />
                )}
                Submit Report
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

  const renderIncidentCard = (incident: IncidentReport) => {
    const severityColors = getSeverityColor(incident.severity);
    const { icon: StatusIcon } = getStatusColor(incident.status);

    return (
      <Card
        key={incident._id}
        className="hover:shadow-md transition-all cursor-pointer border-l-4"
        style={{ borderLeftColor: severityColors.border }}
        onClick={() => handleViewDetails(incident)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn(severityColors.bg, severityColors.text, "border-0")}>
                  {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {incident.reportNumber}
                </Badge>
              </div>

              <p className="font-medium mb-1">{getTypeLabel(incident.type)}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {incident.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(incident.reportedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {incident.location.address.split(',')[0]}
                </span>
                {incident.studentsInvolved && incident.studentsInvolved.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {incident.studentsInvolved.length} student(s)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs">
                  <StatusIcon className="h-3 w-3" />
                  <span className="capitalize">{incident.status.replace('_', ' ')}</span>
                </div>
                {incident.followUpRequired && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    Follow-up Required
                  </Badge>
                )}
                {!incident.synced && (
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
                  handleViewDetails(incident);
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
                  handleDelete(incident);
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

  const renderIncidentList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Incident Reports</CardTitle>
        <Badge variant="outline">{pagination?.totalItems || incidents.length} total</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No incident reports found</p>
            <p className="text-sm mt-2">Click "Report Incident" to create your first report</p>
          </div>
        ) : (
          incidents.map(renderIncidentCard)
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
          {pagination.totalItems} reports
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
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Incident Report Details
          </DialogTitle>
        </DialogHeader>
        {selectedIncident && (
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Number</p>
                <p className="font-mono font-bold text-lg">{selectedIncident.reportNumber}</p>
              </div>
              <div className="flex gap-2">
                {getSeverityBadge(selectedIncident.severity)}
                {getStatusBadge(selectedIncident.status)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Incident Type</p>
                <p className="font-medium">{getTypeLabel(selectedIncident.type)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Reported By</p>
                <p className="font-medium">{selectedIncident.reportedBy.name}</p>
                <p className="text-xs text-muted-foreground">{selectedIncident.reportedBy.vehicleNumber}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="font-medium">{formatDateTime(selectedIncident.reportedAt)}</p>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(selectedIncident.reportedAt)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{selectedIncident.location.address}</p>
                {selectedIncident.location.lat && selectedIncident.location.lng && (
                  <p className="text-xs text-muted-foreground">
                    Lat: {selectedIncident.location.lat.toFixed(4)}, Lng: {selectedIncident.location.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedIncident.description}</p>
            </div>

            {/* Action Taken */}
            <div>
              <h3 className="font-medium mb-2">Immediate Action Taken</h3>
              <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedIncident.actionTaken}</p>
            </div>

            {/* Students Involved */}
            {selectedIncident.studentsInvolved && selectedIncident.studentsInvolved.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Students Involved</h3>
                <div className="space-y-2">
                  {selectedIncident.studentsInvolved.map((student, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{student.name || 'Unknown'}</p>
                        {student.parentNotified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Parent Notified
                          </Badge>
                        )}
                      </div>
                      {(student.class || student.section) && (
                        <p className="text-xs text-muted-foreground">
                          Class {student.class || ''} {student.section ? `- ${student.section}` : ''}
                        </p>
                      )}
                      {student.injury && (
                        <p className="text-xs text-red-600 mt-1">{student.injury}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Witnesses */}
            {selectedIncident.witnesses && selectedIncident.witnesses.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Witnesses</h3>
                <div className="space-y-2">
                  {selectedIncident.witnesses.map((witness, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium">{witness.name}</p>
                      <p className="text-xs text-muted-foreground">Phone: {witness.phone}</p>
                      {witness.email && (
                        <p className="text-xs text-muted-foreground">Email: {witness.email}</p>
                      )}
                      {witness.statement && (
                        <p className="text-xs mt-1 italic">"{witness.statement}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            <div>
              <h3 className="font-medium mb-2">Notifications</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-muted/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">School Admin</p>
                  {selectedIncident.notified.schoolAdmin ? (
                    <CheckCircle className="h-4 w-4 mx-auto mt-1 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 mx-auto mt-1 text-red-600" />
                  )}
                </div>
                <div className="p-2 bg-muted/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Parents</p>
                  {selectedIncident.notified.parents ? (
                    <CheckCircle className="h-4 w-4 mx-auto mt-1 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 mx-auto mt-1 text-red-600" />
                  )}
                </div>
                <div className="p-2 bg-muted/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Emergency</p>
                  {selectedIncident.notified.emergency ? (
                    <CheckCircle className="h-4 w-4 mx-auto mt-1 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 mx-auto mt-1 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Resolution Info */}
            {selectedIncident.status === 'resolved' && selectedIncident.resolvedAt && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700">Resolved on {formatDateTime(selectedIncident.resolvedAt)}</p>
                {selectedIncident.resolvedBy && (
                  <p className="text-xs text-green-600 mt-1">By: {selectedIncident.resolvedBy.name}</p>
                )}
                {selectedIncident.resolutionNotes && (
                  <p className="text-sm mt-2">{selectedIncident.resolutionNotes}</p>
                )}
              </div>
            )}

            {selectedIncident.followUpRequired && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Follow-up required by {selectedIncident.followUpDate ? formatDate(selectedIncident.followUpDate) : 'ASAP'}
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {selectedIncident && selectedIncident.status === 'pending' && (
            <Button
              onClick={() => {
                handleUpdateStatus(selectedIncident._id, 'under_review');
                setShowDetailsDialog(false);
              }}
            >
              Mark as Under Review
            </Button>
          )}
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
            Delete Incident Report
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this incident report? This action cannot be undone.
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

  const renderSOSDialog = () => (
    <AlertDialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Activate Emergency Mode?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will flag the incident as CRITICAL and notify emergency services immediately.
            Only use in genuine emergencies.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowSOSDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmEmergency} 
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Activate SOS
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}

      {showForm ? renderForm() : (
        <>
          {renderIncidentList()}
          {renderPagination()}
        </>
      )}

      {/* Dialogs */}
      {renderDetailsDialog()}
      {renderDeleteDialog()}
      {renderSOSDialog()}
    </div>
  );
}