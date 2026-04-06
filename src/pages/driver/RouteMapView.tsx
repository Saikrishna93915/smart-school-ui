import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

import { cn } from "@/lib/utils";

// Mock useGeolocation since hook doesn't exist
const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error] = useState<string | null>(null);
  const getLocation = useCallback(() => {
    setLocation({ lat: 17.4948, lng: 78.4014 });
  }, []);
  return { location, error, getLocation };
};

// Icons
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  User,
  Phone,
  Route,
  ChevronRight,
  Bus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Sunrise,
  Sunset,
  Sun,
  RefreshCw,
  Loader2,
  Eye,
  CloudRain,
  CloudFog,
  CloudLightning,
  Cloud,
  PlayCircle,
  LocateFixed,
  Map,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface Student {
  _id: string;
  name: string;
  className: string;
  section: string;
  phone?: string;
  parentPhone?: string;
  parentName?: string;
  photo?: string;
  specialNeeds?: string;
  hasBoarded?: boolean;
  hasDropped?: boolean;
  notes?: string;
}

interface Stop {
  stopId: string;
  stopName: string;
  order: number;
  location: {
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  };
  arrivalTime: string;
  departureTime?: string;
  actualArrivalTime?: string;
  actualDepartureTime?: string;
  students: Student[];
  distanceFromPrevious?: number; // km
  timeFromPrevious?: number; // minutes
  completed: boolean;
  skipped?: boolean;
  notes?: string;
}

interface RouteDetails {
  _id: string;
  routeId: string;
  routeName: string;
  description?: string;
  type: 'morning' | 'afternoon' | 'evening';
  totalDistance: number; // km
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  stops: Stop[];
  schoolLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  delayMinutes?: number;
  delayReason?: string;
  trafficConditions?: 'light' | 'moderate' | 'heavy';
  weatherConditions?: 'clear' | 'rain' | 'fog' | 'storm';
  alerts?: Array<{
    type: 'info' | 'warning' | 'danger';
    message: string;
    timestamp: string;
  }>;
}

interface RouteResponse {
  success: boolean;
  data: {
    routes: RouteDetails[];
    currentRoute?: RouteDetails;
    vehicle: {
      _id: string;
      vehicleNumber: string;
      currentOdometer: number;
      fuelLevel: number;
    };
    stats: {
      totalRoutes: number;
      totalStops: number;
      totalStudents: number;
      completedStops: number;
      pendingStops: number;
      estimatedCompletion: string;
    };
  };
  message?: string;
}

interface RouteFilter {
  type: 'all' | 'morning' | 'afternoon' | 'evening';
  status: 'all' | 'scheduled' | 'in_progress' | 'completed';
  date: string;
}

// ==================== UTILITY FUNCTIONS ====================

const formatTime = (timeString?: string): string => {
  if (!timeString) return '--:--';
  return format(parseISO(timeString), 'hh:mm a');
};

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'just now';
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

const formatDuration = (minutes: number): string => {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getTimeStatus = (scheduled: string, actual?: string): 'on_time' | 'late' | 'early' => {
  if (!actual) return 'on_time';
  const scheduledTime = new Date(scheduled).getTime();
  const actualTime = new Date(actual).getTime();
  const diffMinutes = Math.abs(actualTime - scheduledTime) / (1000 * 60);
  
  if (diffMinutes < 5) return 'on_time';
  return actualTime > scheduledTime ? 'late' : 'early';
};

const getTimeStatusColor = (status: 'on_time' | 'late' | 'early'): string => {
  switch (status) {
    case 'on_time':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'late':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'early':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getTimeStatusIcon = (status: 'on_time' | 'late' | 'early') => {
  switch (status) {
    case 'on_time':
      return CheckCircle;
    case 'late':
      return AlertTriangle;
    case 'early':
      return Clock;
    default:
      return Clock;
  }
};

const getRouteTypeIcon = (type: string) => {
  switch (type) {
    case 'morning':
      return <Sunrise className="h-5 w-5 text-orange-500" />;
    case 'afternoon':
      return <Sun className="h-5 w-5 text-amber-500" />;
    case 'evening':
      return <Sunset className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getRouteTypeColor = (type: string) => {
  switch (type) {
    case 'morning':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'afternoon':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'evening':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
      return 'bg-green-100 text-green-800 border-green-200 animate-pulse';
    case 'completed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTrafficIcon = (condition?: string) => {
  switch (condition) {
    case 'light':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'moderate':
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case 'heavy':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-400" />;
  }
};

const getWeatherIcon = (condition?: string) => {
  switch (condition) {
    case 'clear':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'rain':
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    case 'fog':
      return <CloudFog className="h-4 w-4 text-gray-500" />;
    case 'storm':
      return <CloudLightning className="h-4 w-4 text-purple-500" />;
    default:
      return <Cloud className="h-4 w-4 text-gray-400" />;
  }
};

// ==================== MOCK DATA ====================

const generateMockRoute = (type: 'morning' | 'afternoon' | 'evening', status: 'scheduled' | 'in_progress' | 'completed'): RouteDetails => {
  const now = new Date();
  const baseTime = new Date(now);
  
  if (type === 'morning') {
    baseTime.setHours(6, 30, 0);
  } else if (type === 'afternoon') {
    baseTime.setHours(14, 30, 0);
  } else {
    baseTime.setHours(17, 30, 0);
  }

  const stops: Stop[] = [
    {
      stopId: 'stop-001',
      stopName: 'Kukatpally Stop 1',
      order: 1,
      location: {
        lat: 17.4948,
        lng: 78.4014,
        address: 'Near Kukatpally Bus Stop, Main Road, Kukatpally',
      },
      arrivalTime: new Date(baseTime.getTime() + 0 * 60000).toISOString(),
      departureTime: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
      students: [
        {
          _id: 'stu-001',
          name: 'Aarav Kumar',
          className: '10',
          section: 'A',
          phone: '9876543210',
          parentPhone: '9876543210',
          parentName: 'Rajesh Kumar',
        },
        {
          _id: 'stu-002',
          name: 'Priya Sharma',
          className: '9',
          section: 'B',
          phone: '9876543211',
          parentPhone: '9876543211',
          parentName: 'Dinesh Sharma',
        },
      ],
      distanceFromPrevious: 0,
      timeFromPrevious: 0,
      completed: status === 'completed' || (status === 'in_progress' && Math.random() > 0.5),
    },
    {
      stopId: 'stop-002',
      stopName: 'Kukatpally Stop 2',
      order: 2,
      location: {
        lat: 17.4982,
        lng: 78.4056,
        address: 'Near JNTU, Kukatpally',
      },
      arrivalTime: new Date(baseTime.getTime() + 12 * 60000).toISOString(),
      departureTime: new Date(baseTime.getTime() + 17 * 60000).toISOString(),
      students: [
        {
          _id: 'stu-003',
          name: 'Rohan Singh',
          className: '8',
          section: 'A',
          phone: '9876543212',
          parentPhone: '9876543212',
          parentName: 'Vikram Singh',
        },
        {
          _id: 'stu-004',
          name: 'Sneha Reddy',
          className: '7',
          section: 'C',
          phone: '9876543213',
          parentPhone: '9876543213',
          parentName: 'Suresh Reddy',
        },
      ],
      distanceFromPrevious: 1.2,
      timeFromPrevious: 7,
      completed: status === 'completed' || (status === 'in_progress' && Math.random() > 0.3),
    },
    {
      stopId: 'stop-003',
      stopName: 'KPHB Colony',
      order: 3,
      location: {
        lat: 17.5021,
        lng: 78.4102,
        address: 'Near KPHB Colony, Kukatpally',
      },
      arrivalTime: new Date(baseTime.getTime() + 22 * 60000).toISOString(),
      departureTime: new Date(baseTime.getTime() + 27 * 60000).toISOString(),
      students: [
        {
          _id: 'stu-005',
          name: 'Arjun Patel',
          className: '6',
          section: 'B',
          phone: '9876543214',
          parentPhone: '9876543214',
          parentName: 'Mahesh Patel',
        },
      ],
      distanceFromPrevious: 1.5,
      timeFromPrevious: 8,
      completed: status === 'completed' || (status === 'in_progress' && Math.random() > 0.2),
    },
    {
      stopId: 'stop-004',
      stopName: 'School Main Gate',
      order: 4,
      location: {
        lat: 17.5112,
        lng: 78.4189,
        address: 'PMC TECH School, Kukatpally',
      },
      arrivalTime: new Date(baseTime.getTime() + 35 * 60000).toISOString(),
      departureTime: new Date(baseTime.getTime() + 40 * 60000).toISOString(),
      students: [], // Drop point
      distanceFromPrevious: 2.3,
      timeFromPrevious: 12,
      completed: status === 'completed',
    },
  ];

  const totalDistance = stops.reduce((sum, stop) => sum + (stop.distanceFromPrevious || 0), 0);
  const totalDuration = stops.reduce((sum, stop) => sum + (stop.timeFromPrevious || 0), 0);

  return {
    _id: `route-${type}-${Date.now()}`,
    routeId: `RTE-${type.toUpperCase()}`,
    routeName: `Kukatpally ${type.charAt(0).toUpperCase() + type.slice(1)} Route`,
    description: `Route covering Kukatpally area for ${type} trip`,
    type,
    totalDistance,
    estimatedDuration: totalDuration,
    actualDuration: status === 'completed' ? totalDuration + 5 : undefined,
    stops,
    schoolLocation: {
      lat: 17.5112,
      lng: 78.4189,
      address: 'PMC TECH School, Kukatpally',
    },
    vehicleId: 'veh-001',
    vehicleNumber: 'TS-07-AB-1234',
    driverId: 'drv-001',
    driverName: 'Rajesh Kumar',
    driverPhone: '9876543210',
    status,
    startedAt: status !== 'scheduled' ? new Date(baseTime.getTime() - 5 * 60000).toISOString() : undefined,
    completedAt: status === 'completed' ? new Date(baseTime.getTime() + totalDuration * 60000 + 5 * 60000).toISOString() : undefined,
    delayMinutes: status === 'in_progress' ? 5 : undefined,
    delayReason: status === 'in_progress' ? 'Traffic congestion' : undefined,
    trafficConditions: Math.random() > 0.5 ? 'moderate' : 'light',
    weatherConditions: 'clear',
    alerts: status === 'in_progress' ? [
      {
        type: 'info',
        message: 'Heavy traffic ahead on Main Road',
        timestamp: new Date().toISOString(),
      },
    ] : [],
  };
};

const mockRoutes: RouteDetails[] = [
  generateMockRoute('morning', 'in_progress'),
  generateMockRoute('afternoon', 'scheduled'),
  generateMockRoute('evening', 'scheduled'),
];

const mockVehicle = {
  _id: 'veh-001',
  vehicleNumber: 'TS-07-AB-1234',
  currentOdometer: 52345,
  fuelLevel: 65,
};

const mockStats = {
  totalRoutes: mockRoutes.length,
  totalStops: mockRoutes.reduce((sum, r) => sum + r.stops.length, 0),
  totalStudents: mockRoutes.reduce((sum, r) => sum + r.stops.reduce((s, stop) => s + stop.students.length, 0), 0),
  completedStops: mockRoutes.reduce((sum, r) => sum + r.stops.filter(s => s.completed).length, 0),
  pendingStops: mockRoutes.reduce((sum, r) => sum + r.stops.filter(s => !s.completed).length, 0),
  estimatedCompletion: '03:45 PM',
};

// ==================== MAIN COMPONENT ====================

export default function RouteMapView() {
  const queryClient = useQueryClient();
  const { getLocation } = useGeolocation();

  const [selectedRoute, setSelectedRoute] = useState<RouteDetails | null>(null);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [filters, setFilters] = useState<RouteFilter>({
    type: 'all',
    status: 'all',
    date: new Date().toISOString().split('T')[0],
  });
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callNumber, setCallNumber] = useState('');
  const [callName, setCallName] = useState('');
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapDestination, setMapDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // ==================== REACT QUERY ====================

  const { 
    data: routeData, 
    isLoading, 
    refetch,
    isFetching,
  } = useQuery<RouteResponse>({
    queryKey: ["driver-routes", filters],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getRoutes(filters);
      // return response.data;

      await new Promise(resolve => setTimeout(resolve, 800));

      let filtered = [...mockRoutes];

      if (filters.type !== 'all') {
        filtered = filtered.filter(r => r.type === filters.type);
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(r => r.status === filters.status);
      }

      return {
        success: true,
        data: {
          routes: filtered,
          currentRoute: filtered.find(r => r.status === 'in_progress'),
          vehicle: mockVehicle,
          stats: mockStats,
        },
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
  });

  const routes = routeData?.data.routes || [];
  const currentRoute = routeData?.data.currentRoute;
  const vehicle = routeData?.data.vehicle;
  const stats = routeData?.data.stats;

  // Set current route as selected by default
  useEffect(() => {
    if (currentRoute && !selectedRoute) {
      setSelectedRoute(currentRoute);
    } else if (routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [currentRoute, routes, selectedRoute]);

  // ==================== MUTATIONS ====================

  const markStopCompletedMutation = useMutation({
    mutationFn: async ({ routeId, stopId }: { routeId: string; stopId: string }) => {
      // await driverService.markStopCompleted(routeId, stopId);
      console.log('Marking stop as completed:', routeId, stopId);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onMutate: async ({ routeId, stopId }) => {
      await queryClient.cancelQueries({ queryKey: ["driver-routes"] });

      const previousData = queryClient.getQueryData<RouteResponse>(["driver-routes", filters]);

      if (previousData) {
        const updatedRoutes = previousData.data.routes.map(route => {
          if (route._id === routeId) {
            const updatedStops = route.stops.map(stop =>
              stop.stopId === stopId ? { ...stop, completed: true } : stop
            );
            return { ...route, stops: updatedStops };
          }
          return route;
        });

        queryClient.setQueryData(["driver-routes", filters], {
          ...previousData,
          data: {
            ...previousData.data,
            routes: updatedRoutes,
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["driver-routes", filters], context.previousData);
      }
      toast.error("Failed to mark stop as completed");
    },
    onSuccess: () => {
      toast.success("Stop marked as completed");
    },
  });

  // ==================== COMPUTED VALUES ====================

  const progress = useMemo(() => {
    if (!selectedRoute) return 0;
    const completed = selectedRoute.stops.filter(s => s.completed).length;
    return (completed / selectedRoute.stops.length) * 100;
  }, [selectedRoute]);

  const nextStop = useMemo(() => {
    if (!selectedRoute) return null;
    return selectedRoute.stops.find(s => !s.completed);
  }, [selectedRoute]);

  const estimatedTimeRemaining = useMemo(() => {
    if (!selectedRoute || !nextStop) return null;
    
    const remainingStops = selectedRoute.stops.filter(s => !s.completed);
    const remainingTime = remainingStops.reduce((sum, stop) => sum + (stop.timeFromPrevious || 0), 0);
    
    return formatDuration(remainingTime);
  }, [selectedRoute, nextStop]);

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing route data...");
  }, [refetch]);

  const handleSelectRoute = useCallback((route: RouteDetails) => {
    setSelectedRoute(route);
    setExpandedStop(null);
  }, []);

  const handleToggleStop = useCallback((stopId: string) => {
    setExpandedStop(prev => prev === stopId ? null : stopId);
  }, []);

  const handleMarkCompleted = useCallback((routeId: string, stopId: string) => {
    markStopCompletedMutation.mutate({ routeId, stopId });
  }, [markStopCompletedMutation]);

  const handleNavigateToStop = useCallback((stop: Stop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`;
    window.open(url, '_blank');
  }, []);

  const handleViewOnMap = useCallback((stop: Stop) => {
    setMapDestination(stop.location);
    setShowMapDialog(true);
  }, []);

  const handleViewStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  }, []);

  const handleCallParent = useCallback((phone: string, name: string) => {
    setCallNumber(phone);
    setCallName(name);
    setShowCallDialog(true);
  }, []);

  const confirmCall = useCallback(() => {
    window.location.href = `tel:${callNumber}`;
    setShowCallDialog(false);
  }, [callNumber]);

  const handleGetLocation = useCallback(() => {
    getLocation();
  }, [getLocation]);

  const handleStartRoute = useCallback((_routeId: string) => {
    toast.success("Route started", {
      description: "Navigation is now active",
    });
    // In production, call API to start route
  }, []);

  const handleCompleteRoute = useCallback((_routeId: string) => {
    toast.success("Route completed", {
      description: "All stops have been completed",
    });
    // In production, call API to complete route
  }, []);

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[600px] w-full lg:col-span-1 rounded-xl" />
          <Skeleton className="h-[600px] w-full lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Route Map & Navigation</h1>
        <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
          <MapPin className="h-4 w-4" />
          <span>View your routes and pickup stops</span>
          {currentRoute && (
            <Badge className="bg-green-600 text-white animate-pulse">
              Active Route
            </Badge>
          )}
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
              <p>Refresh route data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleGetLocation}>
                <LocateFixed className="h-4 w-4 mr-2" />
                My Location
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get current location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={filters.type}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Route Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            className="w-[150px]"
          />

          <div className="ml-auto text-sm text-muted-foreground">
            {stats?.totalStops} stops • {stats?.totalStudents} students
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRouteList = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Today's Routes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[500px] pr-4">
          {routes.map((route) => {
            const completedStops = route.stops.filter(s => s.completed).length;
            const progress = (completedStops / route.stops.length) * 100;

            return (
              <button
                key={route._id}
                onClick={() => handleSelectRoute(route)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all mb-3",
                  selectedRoute?._id === route._id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "hover:bg-muted",
                  route.status === 'in_progress' && "border-green-500 border-2"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getRouteTypeIcon(route.type)}
                    <Badge className={getRouteTypeColor(route.type)}>
                      {route.type.charAt(0).toUpperCase() + route.type.slice(1)}
                    </Badge>
                  </div>
                  <Badge className={getStatusColor(route.status)}>
                    {route.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <p className="font-semibold text-base mb-1">{route.routeName}</p>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(route.stops[0]?.arrivalTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {route.stops.length} stops
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {route.stops.reduce((sum, s) => sum + s.students.length, 0)} students
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {route.delayMinutes && route.delayMinutes > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Delayed by {route.delayMinutes} min</span>
                  </div>
                )}
              </button>
            );
          })}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderRouteDetails = () => {
    if (!selectedRoute) {
      return (
        <Card className="h-full">
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Select a route to view details</p>
          </CardContent>
        </Card>
      );
    }

    const completedStops = selectedRoute.stops.filter(s => s.completed).length;
    const pendingStops = selectedRoute.stops.filter(s => !s.completed).length;

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <CardTitle>{selectedRoute.routeName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRouteTypeColor(selectedRoute.type)}>
                {selectedRoute.type}
              </Badge>
              <Badge className={getStatusColor(selectedRoute.status)}>
                {selectedRoute.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trip Progress</span>
              <span className="text-sm font-bold text-blue-600">
                {completedStops}/{selectedRoute.stops.length} stops
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Completed: {completedStops}</span>
              <span>Pending: {pendingStops}</span>
              <span>ETA: {estimatedTimeRemaining}</span>
            </div>
          </div>

          {/* Vehicle Info */}
          {vehicle && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bus className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{vehicle.vehicleNumber}</p>
                    <p className="text-xs text-muted-foreground">Odometer: {vehicle.currentOdometer.toLocaleString()} km</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white">
                  Fuel: {vehicle.fuelLevel}%
                </Badge>
              </div>
            </div>
          )}

          {/* Next Stop Alert */}
          {nextStop && selectedRoute.status === 'in_progress' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center animate-pulse">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-700">Next Stop</p>
                  <p className="font-semibold text-green-800">{nextStop.stopName}</p>
                  <p className="text-xs text-green-600 mt-1">
                    ETA: {formatTime(nextStop.arrivalTime)} • {nextStop.students.length} students
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleNavigateToStop(nextStop)}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {selectedRoute.alerts && selectedRoute.alerts.length > 0 && (
            <div className="space-y-2">
              {selectedRoute.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg flex items-center gap-3",
                    alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                    alert.type === 'danger' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  )}
                >
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  {alert.type === 'danger' && <AlertCircle className="h-4 w-4 text-red-600" />}
                  {alert.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(alert.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-3">
            {selectedRoute.trafficConditions && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                {getTrafficIcon(selectedRoute.trafficConditions)}
                <div>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                  <p className="text-sm font-medium capitalize">{selectedRoute.trafficConditions}</p>
                </div>
              </div>
            )}
            {selectedRoute.weatherConditions && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                {getWeatherIcon(selectedRoute.weatherConditions)}
                <div>
                  <p className="text-xs text-muted-foreground">Weather</p>
                  <p className="text-sm font-medium capitalize">{selectedRoute.weatherConditions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stops List */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Route Stops ({selectedRoute.stops.length})
            </h3>

            <div className="space-y-3">
              {selectedRoute.stops.map((stop, index) => {
                const timeStatus = getTimeStatus(stop.arrivalTime, stop.actualArrivalTime);
                const TimeIcon = getTimeStatusIcon(timeStatus);
                const isExpanded = expandedStop === stop.stopId;

                return (
                  <div
                    key={stop.stopId}
                    className={cn(
                      "relative flex gap-4 p-4 rounded-lg border transition-all",
                      stop.completed && "bg-green-50 border-green-200",
                      !stop.completed && stop === nextStop && "border-green-500 border-2",
                      isExpanded && "shadow-md"
                    )}
                  >
                    {/* Stop Number */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        stop.completed
                          ? "bg-green-600 text-white"
                          : stop === nextStop
                          ? "bg-green-600 text-white animate-pulse"
                          : "bg-blue-600 text-white"
                      )}>
                        {index + 1}
                      </div>
                      {index < selectedRoute.stops.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-300 my-2"></div>
                      )}
                    </div>

                    {/* Stop Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {stop.stopName}
                            {stop.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {stop.location.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", getTimeStatusColor(timeStatus))}>
                            <TimeIcon className="h-3 w-3 mr-1" />
                            {formatTime(stop.arrivalTime)}
                          </Badge>
                          {stop.distanceFromPrevious && (
                            <Badge variant="outline" className="text-xs">
                              {stop.distanceFromPrevious} km
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expandable Student List */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleToggleStop(stop.stopId)}
                          className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground"
                        >
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {stop.students.length} Student{stop.students.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {stop.students.map((student) => (
                              <div
                                key={student._id}
                                className="bg-muted rounded-lg p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    {student.photo ? (
                                      <AvatarImage src={student.photo} />
                                    ) : null}
                                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Class {student.className}-{student.section}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {student.parentPhone && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCallParent(student.parentPhone!, student.name)}
                                    >
                                      <Phone className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleViewStudent(student)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stop Actions */}
                      <div className="flex gap-2 mt-3">
                        {!stop.completed && selectedRoute.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleMarkCompleted(selectedRoute._id, stop.stopId)}
                            disabled={markStopCompletedMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Completed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleNavigateToStop(stop)}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewOnMap(stop)}
                        >
                          <Map className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {selectedRoute.status === 'scheduled' && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleStartRoute(selectedRoute._id)}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Route
              </Button>
            )}
            {selectedRoute.status === 'in_progress' && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleCompleteRoute(selectedRoute._id)}
                disabled={pendingStops > 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Route
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRoute.schoolLocation.lat},${selectedRoute.schoolLocation.lng}`;
                window.open(url, '_blank');
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              School Location
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStudentDetailsDialog = () => (
    <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Student Details
          </DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {selectedStudent.photo ? (
                  <AvatarImage src={selectedStudent.photo} />
                ) : null}
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                <p className="text-base text-muted-foreground">
                  Class {selectedStudent.className}-{selectedStudent.section}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedStudent.parentName && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                  <p className="font-medium">{selectedStudent.parentName}</p>
                </div>
              )}
              
              {selectedStudent.parentPhone && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedStudent.parentPhone}</p>
                </div>
              )}

              {selectedStudent.specialNeeds && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium">Special Needs</p>
                  <p className="text-sm text-amber-700">{selectedStudent.specialNeeds}</p>
                </div>
              )}

              {selectedStudent.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedStudent.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStudentDetails(false)}>
            Close
          </Button>
          {selectedStudent?.parentPhone && (
            <Button onClick={() => {
              setShowStudentDetails(false);
              handleCallParent(selectedStudent.parentPhone!, selectedStudent.name);
            }}>
              <Phone className="h-4 w-4 mr-2" />
              Call Parent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderCallDialog = () => (
    <AlertDialog open={showCallDialog} onOpenChange={setShowCallDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Call Parent
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to call {callName}'s parent at {callNumber}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowCallDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmCall}>
            <Phone className="h-4 w-4 mr-2" />
            Call Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderMapDialog = () => (
    <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Preview
          </DialogTitle>
        </DialogHeader>
        {mapDestination && (
          <div className="space-y-4 py-4">
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">Map preview would appear here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lat: {mapDestination.lat.toFixed(4)}, Lng: {mapDestination.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <p className="text-sm">{mapDestination.address}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMapDialog(false)}>
            Close
          </Button>
          {mapDestination && (
            <Button
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${mapDestination.lat},${mapDestination.lng}`;
                window.open(url, '_blank');
              }}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Open in Maps
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {renderHeader()}
      {renderFilters()}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Route List */}
        <div className="lg:col-span-1">
          {renderRouteList()}
        </div>

        {/* Route Details */}
        <div className="lg:col-span-2">
          {renderRouteDetails()}
        </div>
      </div>

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
      {renderCallDialog()}
      {renderMapDialog()}
    </div>
  );
}