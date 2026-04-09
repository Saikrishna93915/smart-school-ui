import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays, subMonths } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import driverService from "@/Services/driverService";
import { useDebounce } from "@/hooks/useDebounce";

// Icons
import {
  History,
  Bus,
  Clock,
  Users,
  Gauge,
  ArrowLeft,
  Download,
  Search,
  Loader2,
  RefreshCw,
  Sunrise,
  Sunset,
  Sun,
  Calendar,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface TripRecord {
  _id: string;
  tripId: string;
  date: string;
  tripType: 'morning' | 'afternoon' | 'evening';
  startTime: string;
  endTime?: string;
  startOdometer: number;
  endOdometer?: number;
  distance?: number;
  duration?: number;
  boardedStudents?: string[];
  totalStudents: number;
  routeId: string;
  routeName: string;
  stops: Array<{
    stopName: string;
    scheduledTime: string;
    actualTime?: string;
    students: string[];
    completed: boolean;
  }>;
  incidents?: Array<{
    type: string;
    description: string;
    time: string;
  }>;
  status: 'completed' | 'in_progress' | 'cancelled' | 'delayed';
  delayMinutes?: number;
  delayReason?: string;
  fuelConsumed?: number;
  averageSpeed?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TripStats {
  totalTrips: number;
  totalDistance: number;
  totalStudents: number;
  averageDistance: number;
  onTimePercentage: number;
  delayedTrips: number;
  cancelledTrips: number;
  morningTrips: number;
  afternoonTrips: number;
  eveningTrips: number;
}

interface TripFilter {
  search: string;
  tripType: 'all' | 'morning' | 'afternoon' | 'evening';
  status: 'all' | 'completed' | 'delayed' | 'cancelled' | 'in_progress';
  dateRange: 'all' | 'week' | 'month' | 'custom';
  fromDate: string;
  toDate: string;
  sortBy: 'date' | 'distance' | 'students' | 'duration';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'dd MMM yyyy');
};

const formatTime = (dateString: string): string => {
  return format(parseISO(dateString), 'hh:mm a');
};

const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a');
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getTripTypeIcon = (type: string) => {
  switch (type) {
    case 'morning':
      return <Sunrise className="h-4 w-4 text-orange-500" />;
    case 'afternoon':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'evening':
      return <Sunset className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string, delayMinutes?: number) => {
  if (status === 'completed') {
    if (delayMinutes) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Delayed</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">On Time</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
  }
  return <Badge variant="outline">Unknown</Badge>;
};

// ==================== MOCK DATA ====================

const generateMockTrips = (count: number): TripRecord[] => {
  const trips: TripRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const tripType = i % 3 === 0 ? 'morning' : (i % 3 === 1 ? 'afternoon' : 'evening');
    const status = i % 10 === 0 ? 'cancelled' : (i % 8 === 0 ? 'in_progress' : 'completed');
    const delayed = status === 'completed' && i % 5 === 0;
    
    const startTime = new Date(date);
    if (tripType === 'morning') startTime.setHours(6, 30, 0);
    else if (tripType === 'afternoon') startTime.setHours(14, 30, 0);
    else startTime.setHours(17, 30, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 75 + (delayed ? 15 : 0));

    const distance = 15 + (i % 5) * 2;
    const students = 35 + (i % 15);

    trips.push({
      _id: `trip-${String(i).padStart(3, '0')}`,
      tripId: `TRP-${String(i + 1000).padStart(4, '0')}`,
      date: date.toISOString(),
      tripType: tripType as any,
      startTime: startTime.toISOString(),
      endTime: status === 'completed' ? endTime.toISOString() : undefined,
      startOdometer: 50000 + (i * 120),
      endOdometer: status === 'completed' ? 50000 + (i * 120) + distance : undefined,
      distance: status === 'completed' ? distance : undefined,
      duration: status === 'completed' ? 75 + (delayed ? 15 : 0) : undefined,
      boardedStudents: status === 'completed' ? Array(students).fill('stu-id') : undefined,
      totalStudents: students,
      routeId: `route-${i % 3 + 1}`,
      routeName: ['Kukatpally Route', 'JNTU Route', 'KPHB Route'][i % 3],
      stops: [
        {
          stopName: 'Stop 1',
          scheduledTime: formatTime(startTime.toISOString()),
          actualTime: status === 'completed' ? formatTime(startTime.toISOString()) : undefined,
          students: Array(Math.floor(students / 4)).fill('stu-id'),
          completed: status === 'completed',
        },
        {
          stopName: 'Stop 2',
          scheduledTime: formatTime(new Date(startTime.getTime() + 15 * 60000).toISOString()),
          actualTime: status === 'completed' ? formatTime(new Date(startTime.getTime() + 17 * 60000).toISOString()) : undefined,
          students: Array(Math.floor(students / 4)).fill('stu-id'),
          completed: status === 'completed',
        },
        {
          stopName: 'School Gate',
          scheduledTime: formatTime(new Date(startTime.getTime() + 60 * 60000).toISOString()),
          actualTime: status === 'completed' ? formatTime(new Date(startTime.getTime() + 75 * 60000).toISOString()) : undefined,
          students: Array(students).fill('stu-id'),
          completed: status === 'completed',
        },
      ],
      incidents: delayed ? [{
        type: 'traffic',
        description: 'Heavy traffic due to accident',
        time: formatTime(new Date(startTime.getTime() + 25 * 60000).toISOString()),
      }] : [],
      status: status as any,
      delayMinutes: delayed ? 15 : undefined,
      delayReason: delayed ? 'Traffic congestion' : undefined,
      fuelConsumed: status === 'completed' ? distance / 4.2 : undefined,
      averageSpeed: status === 'completed' ? distance / 1.25 : undefined,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }

  return trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mockTrips = generateMockTrips(50);

const calculateTripStats = (trips: TripRecord[]): TripStats => {
  const completedTrips = trips.filter(t => t.status === 'completed');
  
  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const totalStudents = completedTrips.reduce((sum, t) => sum + t.totalStudents, 0);
  
  const onTimeTrips = completedTrips.filter(t => !t.delayMinutes).length;
  const delayedTrips = completedTrips.filter(t => t.delayMinutes).length;
  
  const morningTrips = trips.filter(t => t.tripType === 'morning').length;
  const afternoonTrips = trips.filter(t => t.tripType === 'afternoon').length;
  const eveningTrips = trips.filter(t => t.tripType === 'evening').length;

  return {
    totalTrips: trips.length,
    totalDistance,
    totalStudents,
    averageDistance: completedTrips.length > 0 ? totalDistance / completedTrips.length : 0,
    onTimePercentage: completedTrips.length > 0 ? (onTimeTrips / completedTrips.length) * 100 : 0,
    delayedTrips,
    cancelledTrips: trips.filter(t => t.status === 'cancelled').length,
    morningTrips,
    afternoonTrips,
    eveningTrips,
  };
};

// ==================== MAIN COMPONENT ====================

export default function TripHistory() {
  const navigate = useNavigate();
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState<TripFilter>({
    search: '',
    tripType: 'all',
    status: 'all',
    dateRange: 'all',
    fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const searchDebounced = useDebounce(filters.search, 300);

  // ==================== REACT QUERY ====================

  const { 
    data: trips, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching
  } = useQuery<TripRecord[]>({
    queryKey: ["trip-history"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getTripHistory();
      // return response.data?.data?.trips || [];
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockTrips;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const stats = useMemo(() => trips ? calculateTripStats(trips) : calculateTripStats(mockTrips), [trips]);

  // ==================== FILTERED TRIPS ====================

  const filteredTrips = useMemo(() => {
    if (!trips) return [];

    let filtered = [...trips];

    // Apply search
    if (searchDebounced) {
      const term = searchDebounced.toLowerCase();
      filtered = filtered.filter(t => 
        t.routeName.toLowerCase().includes(term) ||
        t.tripId.toLowerCase().includes(term) ||
        t.tripType.toLowerCase().includes(term)
      );
    }

    // Apply trip type filter
    if (filters.tripType !== 'all') {
      filtered = filtered.filter(t => t.tripType === filters.tripType);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'completed') {
        filtered = filtered.filter(t => t.status === 'completed' && !t.delayMinutes);
      } else if (filters.status === 'delayed') {
        filtered = filtered.filter(t => t.status === 'completed' && t.delayMinutes);
      } else {
        filtered = filtered.filter(t => t.status === filters.status);
      }
    }

    // Apply date range
    const now = new Date();
    if (filters.dateRange === 'week') {
      const weekAgo = subDays(now, 7);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (filters.dateRange === 'month') {
      const monthAgo = subDays(now, 30);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    } else if (filters.dateRange === 'custom') {
      if (filters.fromDate && filters.toDate) {
        filtered = filtered.filter(t => {
          const tripDate = new Date(t.date);
          return tripDate >= new Date(filters.fromDate) && tripDate <= new Date(filters.toDate);
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'distance':
          comparison = (b.distance || 0) - (a.distance || 0);
          break;
        case 'students':
          comparison = (b.totalStudents || 0) - (a.totalStudents || 0);
          break;
        case 'duration':
          comparison = (b.duration || 0) - (a.duration || 0);
          break;
      }
      return filters.sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [trips, searchDebounced, filters]);

  const paginatedTrips = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    return filteredTrips.slice(start, start + filters.limit);
  }, [filteredTrips, filters.page, filters.limit]);

  const totalPages = Math.ceil(filteredTrips.length / filters.limit);

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing trip history...");
  }, [refetch]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Trip ID', 'Type', 'Route', 'Distance (km)', 'Students', 'Status', 'Duration'];
    const rows = filteredTrips.map(t => [
      formatDate(t.date),
      t.tripId,
      t.tripType,
      t.routeName,
      t.distance || 0,
      t.totalStudents,
      t.status === 'completed' ? (t.delayMinutes ? 'Delayed' : 'On Time') : t.status,
      formatDuration(t.duration),
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Trip history exported successfully");
  }, [filteredTrips]);

  const handleViewTrip = useCallback((trip: TripRecord) => {
    setSelectedTrip(trip);
    setShowDetailsDialog(true);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      tripType: 'all',
      status: 'all',
      dateRange: 'all',
      fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
    toast.success("Filters cleared");
  }, []);

  const handleSort = useCallback((column: 'date' | 'distance' | 'students' | 'duration') => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  }, []);

  const getSortIcon = useCallback((column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return filters.sortOrder === 'desc' ? 
      <ArrowDown className="h-4 w-4 ml-1" /> : 
      <ArrowUp className="h-4 w-4 ml-1" />;
  }, [filters.sortBy, filters.sortOrder]);

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
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load trip history</h2>
        <p className="text-muted-foreground mb-4">{(error as Error)?.message || 'Please try again later'}</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trip History</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <History className="h-4 w-4" />
              Review past trips and performance
              {isFetching && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Updating
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh trip history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export as CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Total Trips</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalTrips}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Bus className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {stats.morningTrips} morning • {stats.afternoonTrips} afternoon • {stats.eveningTrips} evening
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">Total Distance</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{stats.totalDistance.toFixed(1)} km</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Avg {stats.averageDistance.toFixed(1)} km per trip
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-bold uppercase">Total Students</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Avg {stats.totalTrips > 0 ? (stats.totalStudents / stats.totalTrips).toFixed(0) : 0} per trip
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-bold uppercase">On-Time Rate</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{stats.onTimePercentage.toFixed(1)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              {stats.delayedTrips} delayed • {stats.cancelledTrips} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by route, ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.tripType}
              onValueChange={(value: any) => setFilters(prev => ({ ...prev, tripType: value, page: 1 }))}
            >
              <SelectTrigger className="w-[130px]">
                <Bus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trip Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger className="w-[130px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">On Time</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value, page: 1 }))}
            >
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {filters.dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
                  className="w-[150px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
                  className="w-[150px]"
                />
              </>
            )}

            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('date')}
              className="flex items-center"
            >
              Date {getSortIcon('date')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('distance')}
              className="flex items-center"
            >
              Distance {getSortIcon('distance')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('students')}
              className="flex items-center"
            >
              Students {getSortIcon('students')}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Showing {paginatedTrips.length} of {filteredTrips.length} trips
            </span>
            {filteredTrips.length > 0 && (
              <span>
                Page {filters.page} of {totalPages}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      <div className="space-y-4">
        {paginatedTrips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trips found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Try adjusting your filters or search criteria to find what you're looking for.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          paginatedTrips.map((trip) => (
            <Card 
              key={trip._id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewTrip(trip)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getTripTypeIcon(trip.tripType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{trip.routeName}</h3>
                        {getStatusBadge(trip.status, trip.delayMinutes)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trip.tripId} • {formatDateTime(trip.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTime(trip.startTime)}
                        {trip.endTime && ` - ${formatTime(trip.endTime)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{trip.totalStudents} students</span>
                    </div>
                    
                    {trip.distance && (
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{trip.distance} km</span>
                      </div>
                    )}
                    
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                {expandedTrip === trip._id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Stops</h4>
                        <div className="space-y-2">
                          {trip.stops.map((stop, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{stop.stopName}</span>
                                  {stop.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  Scheduled: {stop.scheduledTime}
                                  {stop.actualTime && ` • Actual: ${stop.actualTime}`}
                                </div>
                                <div className="text-muted-foreground">
                                  {stop.students.length} students
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {trip.incidents && trip.incidents.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Incidents</h4>
                          <div className="space-y-2">
                            {trip.incidents.map((incident, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium">{incident.type}</div>
                                  <div className="text-muted-foreground">{incident.description}</div>
                                  <div className="text-muted-foreground text-xs">{incident.time}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {trip.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{trip.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (filters.page <= 3) {
                pageNum = i + 1;
              } else if (filters.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = filters.page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={filters.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Trip Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTrip && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Trip Details - {selectedTrip.tripId}
                </DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedTrip.date)} • {selectedTrip.routeName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Trip Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTrip.status, selectedTrip.delayMinutes)}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Trip Type</p>
                    <div className="flex items-center gap-2">
                      {getTripTypeIcon(selectedTrip.tripType)}
                      <span className="capitalize">{selectedTrip.tripType}</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium">{formatDuration(selectedTrip.duration)}</p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="font-medium">{selectedTrip.distance || '--'} km</p>
                  </div>
                </div>

                {/* Timing Information */}
                <div>
                  <h4 className="font-semibold mb-3">Timing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium">{formatDateTime(selectedTrip.startTime)}</p>
                      <p className="text-xs text-muted-foreground">
                        Odometer: {selectedTrip.startOdometer} km
                      </p>
                    </div>
                    {selectedTrip.endTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">End Time</p>
                        <p className="font-medium">{formatDateTime(selectedTrip.endTime)}</p>
                        <p className="text-xs text-muted-foreground">
                          Odometer: {selectedTrip.endOdometer} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stops */}
                <div>
                  <h4 className="font-semibold mb-3">Route Stops</h4>
                  <div className="space-y-3">
                    {selectedTrip.stops.map((stop, index) => (
                      <div key={index} className="flex items-start gap-3 border-l-2 border-muted pl-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{stop.stopName}</p>
                            {stop.completed ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Missed
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Scheduled</p>
                              <p>{stop.scheduledTime}</p>
                            </div>
                            {stop.actualTime && (
                              <div>
                                <p className="text-muted-foreground">Actual</p>
                                <p>{stop.actualTime}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stop.students.length} students boarding
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                {(selectedTrip.fuelConsumed || selectedTrip.averageSpeed) && (
                  <div>
                    <h4 className="font-semibold mb-3">Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTrip.fuelConsumed && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Fuel Consumed</p>
                          <p className="text-lg font-semibold">{selectedTrip.fuelConsumed.toFixed(2)} L</p>
                        </div>
                      )}
                      {selectedTrip.averageSpeed && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Average Speed</p>
                          <p className="text-lg font-semibold">{selectedTrip.averageSpeed.toFixed(1)} km/h</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Incidents */}
                {selectedTrip.incidents && selectedTrip.incidents.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Incidents</h4>
                    <div className="space-y-3">
                      {selectedTrip.incidents.map((incident, index) => (
                        <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <p className="font-medium text-amber-800">{incident.type}</p>
                          </div>
                          <p className="text-sm text-amber-700">{incident.description}</p>
                          <p className="text-xs text-amber-600 mt-1">{incident.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delay Information */}
                {selectedTrip.delayMinutes && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Trip Delayed</h4>
                    </div>
                    <p className="text-sm text-red-700 mb-1">
                      Delay: {selectedTrip.delayMinutes} minutes
                    </p>
                    {selectedTrip.delayReason && (
                      <p className="text-sm text-red-600">Reason: {selectedTrip.delayReason}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedTrip.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedTrip.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}