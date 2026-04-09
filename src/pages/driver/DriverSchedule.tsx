import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronUp, ChevronDown, Sunrise, Sunset, Clock, XCircle, RefreshCw, Calendar, Loader2, Download, FileText, Printer, Bus, MapPin, Users, Eye, Play, Grid, List, CheckCircle, Phone, Home, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

// ==================== TYPES & INTERFACES ====================

interface Student {
  studentId: string;
  name: string;
  className: string;
  section: string;
  pickupPoint: string;
  dropPoint: string;
  pickupTime?: string;
  dropTime?: string;
  parentName?: string;
  parentPhone?: string;
  parentPhone2?: string;
  emergencyContact?: string;
  photo?: string;
  hasBoarded?: boolean;
  hasDropped?: boolean;
  notes?: string;
}

interface TripPoint {
  pointName: string;
  time: string;
  address: string;
  latitude?: number;
  longitude?: number;
  students: Student[];
  studentCount: number;
  completed: boolean;
  actualTime?: string;
}

interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  tripType: "morning" | "evening";
  date: string;
  startTime: string;
  endTime: string;
  startOdometer?: number;
  endOdometer?: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "delayed";
  pickupPoints: TripPoint[];
  dropPoints: TripPoint[];
  totalStudents: number;
  boardedStudents: string[]; // studentIds
  droppedStudents: string[]; // studentIds
  distance?: number;
  vehicleNumber?: string;
  vehicleId?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  delayMinutes?: number;
  delayReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleSummary {
  totalTrips: number;
  totalStudents: number;
  completedTrips: number;
  ongoingTrips: number;
  scheduledTrips: number;
  cancelledTrips: number;
  delayedTrips: number;
  onTimePercentage: number;
  totalDistance: number;
  averageDuration: number;
}

interface ScheduleData {
  date: string;
  trips: Trip[];
  morningTrip?: Trip;
  eveningTrip?: Trip;
  hasTrips: boolean;
  summary: ScheduleSummary;
  vehicleInfo?: {
    vehicleNumber: string;
    currentOdometer: number;
    fuelLevel: number;
  };
  lastUpdated: string;
}



// ==================== UTILITY FUNCTIONS ====================



const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), "dd MMM yyyy");
};



const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getTripTypeIcon = (type: string) => {
  switch (type) {
    case "morning":
      return <Sunrise className="h-5 w-5 text-orange-500" />;
    case "evening":
      return <Sunset className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getTripTypeBadge = (type: string) => {
  switch (type) {
    case "morning":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Morning Trip</Badge>;
    case "evening":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Evening Trip</Badge>;
    default:
      return <Badge variant="outline">Trip</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>;
    case "ongoing":
      return <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">Ongoing</Badge>;
    case "completed":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    case "delayed":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Delayed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};



const calculateProgress = (trip: Trip): number => {
  if (trip.status === "completed") return 100;
  if (trip.status === "cancelled") return 0;
  
  const totalStops = trip.pickupPoints.length + trip.dropPoints.length;
  const completedStops = trip.pickupPoints.filter(p => p.completed).length + 
                         trip.dropPoints.filter(p => p.completed).length;
  
  return totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;
};

const getEstimatedArrival = (trip: Trip): string => {
  if (trip.status !== "ongoing") return "--:--";
  
  // Simple estimation based on current time and scheduled end time
  const now = new Date();
  const endTime = parseISO(`${trip.date}T${trip.endTime}`);
  
  if (now > endTime) return "Overdue";
  
  const minutesLeft = differenceInMinutes(endTime, now);
  if (minutesLeft < 60) return `${minutesLeft} min`;
  return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
};

// ==================== MOCK DATA ====================

const generateMockScheduleData = (): ScheduleData => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Mock students for morning trip
  const morningStudents: Student[] = [
    {
      studentId: "STU001",
      name: "Aarav Kumar",
      className: "10",
      section: "A",
      pickupPoint: "Kukatpally Stop 1",
      dropPoint: "School Main Gate",
      pickupTime: "07:15 AM",
      dropTime: "03:30 PM",
      parentName: "Rajesh Kumar",
      parentPhone: "9876543210",
    },
    {
      studentId: "STU002",
      name: "Sneha Reddy",
      className: "9",
      section: "B",
      pickupPoint: "Kukatpally Stop 2",
      dropPoint: "School Main Gate",
      pickupTime: "07:25 AM",
      dropTime: "03:30 PM",
      parentName: "Suresh Reddy",
      parentPhone: "9876543212",
    },
    {
      studentId: "STU003",
      name: "Rohan Singh",
      className: "8",
      section: "A",
      pickupPoint: "Kukatpally Stop 3",
      dropPoint: "School Main Gate",
      pickupTime: "07:35 AM",
      dropTime: "03:30 PM",
      parentName: "Vikram Singh",
      parentPhone: "9876543213",
    },
    {
      studentId: "STU004",
      name: "Priya Sharma",
      className: "7",
      section: "C",
      pickupPoint: "Kukatpally Stop 1",
      dropPoint: "School Main Gate",
      pickupTime: "07:15 AM",
      dropTime: "03:30 PM",
      parentName: "Dinesh Sharma",
      parentPhone: "9876543214",
    },
    {
      studentId: "STU005",
      name: "Arjun Patel",
      className: "6",
      section: "B",
      pickupPoint: "Kukatpally Stop 2",
      dropPoint: "School Main Gate",
      pickupTime: "07:25 AM",
      dropTime: "03:30 PM",
      parentName: "Mahesh Patel",
      parentPhone: "9876543215",
    },
  ];

  // Group students by pickup point for morning trip
  const morningPickupPoints: TripPoint[] = [
    {
      pointName: "Kukatpally Stop 1",
      time: "07:15 AM",
      address: "Near Kukatpally Bus Stop",
      students: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 1"),
      studentCount: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 1").length,
      completed: false,
    },
    {
      pointName: "Kukatpally Stop 2",
      time: "07:25 AM",
      address: "Near JNTU",
      students: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 2"),
      studentCount: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 2").length,
      completed: false,
    },
    {
      pointName: "Kukatpally Stop 3",
      time: "07:35 AM",
      address: "Near KPHB Colony",
      students: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 3"),
      studentCount: morningStudents.filter(s => s.pickupPoint === "Kukatpally Stop 3").length,
      completed: false,
    },
  ];

  // All students drop at same point in morning
  const morningDropPoints: TripPoint[] = [
    {
      pointName: "School Main Gate",
      time: "08:15 AM",
      address: "PMC TECH School",
      students: morningStudents,
      studentCount: morningStudents.length,
      completed: false,
    },
  ];

  // Mock students for evening trip (same students)
  const eveningStudents = morningStudents.map(s => ({
    ...s,
    pickupPoint: "School Main Gate",
    dropPoint: s.pickupPoint, // Reverse for evening
    pickupTime: "02:30 PM",
    dropTime: s.pickupTime === "07:15 AM" ? "03:45 PM" : (s.pickupTime === "07:25 AM" ? "03:55 PM" : "04:05 PM"),
  }));

  // Group by drop points for evening
  const eveningDropPoints: TripPoint[] = [
    {
      pointName: "Kukatpally Stop 1",
      time: "03:45 PM",
      address: "Near Kukatpally Bus Stop",
      students: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 1"),
      studentCount: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 1").length,
      completed: false,
    },
    {
      pointName: "Kukatpally Stop 2",
      time: "03:55 PM",
      address: "Near JNTU",
      students: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 2"),
      studentCount: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 2").length,
      completed: false,
    },
    {
      pointName: "Kukatpally Stop 3",
      time: "04:05 PM",
      address: "Near KPHB Colony",
      students: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 3"),
      studentCount: eveningStudents.filter(s => s.dropPoint === "Kukatpally Stop 3").length,
      completed: false,
    },
  ];

  const eveningPickupPoints: TripPoint[] = [
    {
      pointName: "School Main Gate",
      time: "02:30 PM",
      address: "PMC TECH School",
      students: eveningStudents,
      studentCount: eveningStudents.length,
      completed: false,
    },
  ];

  const morningTrip: Trip = {
    id: "TRP001M",
    routeId: "RTE001",
    routeName: "Kukatpally Route",
    tripType: "morning",
    date: todayStr,
    startTime: "07:00 AM",
    endTime: "08:30 AM",
    status: "ongoing",
    pickupPoints: morningPickupPoints,
    dropPoints: morningDropPoints,
    totalStudents: morningStudents.length,
    boardedStudents: ["STU001", "STU004"],
    droppedStudents: [],
    distance: 15,
    vehicleNumber: "TS-07-1234",
    driverName: "Rajesh Kumar",
    driverPhone: "9876543210",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const eveningTrip: Trip = {
    id: "TRP001E",
    routeId: "RTE001",
    routeName: "Kukatpally Route",
    tripType: "evening",
    date: todayStr,
    startTime: "02:30 PM",
    endTime: "04:30 PM",
    status: "scheduled",
    pickupPoints: eveningPickupPoints,
    dropPoints: eveningDropPoints,
    totalStudents: eveningStudents.length,
    boardedStudents: [],
    droppedStudents: [],
    distance: 15,
    vehicleNumber: "TS-07-1234",
    driverName: "Rajesh Kumar",
    driverPhone: "9876543210",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    date: todayStr,
    trips: [morningTrip, eveningTrip],
    morningTrip,
    eveningTrip,
    hasTrips: true,
    summary: {
      totalTrips: 2,
      totalStudents: morningStudents.length + eveningStudents.length,
      completedTrips: 0,
      ongoingTrips: 1,
      scheduledTrips: 1,
      cancelledTrips: 0,
      delayedTrips: 0,
      onTimePercentage: 100,
      totalDistance: 30,
      averageDuration: 90,
    },
    vehicleInfo: {
      vehicleNumber: "TS-07-1234",
      currentOdometer: 52345,
      fuelLevel: 65,
    },
    lastUpdated: new Date().toISOString(),
  };
};

// ==================== MAIN COMPONENT ====================

export default function DriverSchedule() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripDetailsDialog, setShowTripDetailsDialog] = useState(false);
  const [selectedStop] = useState<TripPoint | null>(null);
  const [showStopDetailsDialog, setShowStopDetailsDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetailsDialog, setShowStudentDetailsDialog] = useState(false);
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [activeTab, setActiveTab] = useState<"all" | "morning" | "evening">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  // ==================== REACT QUERY ====================

  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching,
    // dataUpdatedAt
  } = useQuery<ScheduleData>({
    queryKey: ["driver-schedule"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getTodaySchedule();
      // return response.data?.data;
      
      // Mock response with simulated network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockScheduleData();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
  });

  // ==================== MUTATIONS ====================

  const reportDelayMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Delay reported", {
        description: "School administration has been notified.",
      });
      setShowDelayDialog(false);
      setDelayReason("");
      setDelayMinutes(15);
      queryClient.invalidateQueries({ queryKey: ["driver-schedule"] });
    },
    onError: () => {
      toast.error("Failed to report delay");
    },
  });

  const markStopCompletedMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    },
    onMutate: async ({ tripId, stopName }: { tripId: string, stopName: string }) => {
      await queryClient.cancelQueries({ queryKey: ["driver-schedule"] });

      const previousData = queryClient.getQueryData<ScheduleData>(["driver-schedule"]);

      if (previousData) {
        const updatedTrips = previousData.trips.map(trip => {
          if (trip.id === tripId) {
            const updatedPickupPoints = trip.pickupPoints.map(point =>
              point.pointName === stopName ? { ...point, completed: true } : point
            );
            const updatedDropPoints = trip.dropPoints.map(point =>
              point.pointName === stopName ? { ...point, completed: true } : point
            );
            return {
              ...trip,
              pickupPoints: updatedPickupPoints,
              dropPoints: updatedDropPoints,
            };
          }
          return trip;
        });

        queryClient.setQueryData(["driver-schedule"], {
          ...previousData,
          trips: updatedTrips,
        });
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["driver-schedule"], context.previousData);
      }
      toast.error("Failed to update stop");
    },
  });

  // ==================== COMPUTED VALUES ====================

  const filteredTrips = useMemo(() => {
    if (!data) return [];
    
    if (activeTab === "morning") {
      return data.morningTrip ? [data.morningTrip] : [];
    } else if (activeTab === "evening") {
      return data.eveningTrip ? [data.eveningTrip] : [];
    } else {
      return data.trips;
    }
  }, [data, activeTab]);



  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing schedule...");
  }, [refetch]);

  const handleViewTrip = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setShowTripDetailsDialog(true);
  }, []);

  const handleCallParent = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const handleStartTrip = useCallback((trip: Trip) => {
    navigate("/driver/start-trip", { state: { tripId: trip.id } });
  }, [navigate]);

  const handleReportDelay = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setShowDelayDialog(true);
  }, []);

  const handleExportSchedule = useCallback(() => {
    toast.success("Schedule exported", {
      description: "Schedule has been downloaded as PDF.",
    });
  }, []);

  const handlePrintSchedule = useCallback(() => {
    window.print();
  }, []);

  const toggleTripExpand = useCallback((tripId: string) => {
    setExpandedTrip(prev => prev === tripId ? null : tripId);
  }, []);

  // ==================== LOADING STATE ====================

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Failed to Load Schedule</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An error occurred while loading the schedule."}
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

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Today's Schedule</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {data?.date ? formatDate(data.date) : "Loading..."}
          {isFetching && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Syncing
            </Badge>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
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
            <DropdownMenuItem onClick={handleExportSchedule}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintSchedule}>
              <Printer className="h-4 w-4 mr-2" />
              Print Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderSummary = () => {
    if (!data) return null;
    const s = data.summary;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Trips</p>
            <p className="text-2xl font-bold">{s.totalTrips}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold">{s.totalStudents}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">On-Time Rate</p>
            <p className="text-2xl font-bold text-green-600">{s.onTimePercentage}%</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Distance</p>
            <p className="text-2xl font-bold">{s.totalDistance} km</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderVehicleStatus = () => {
    if (!data?.vehicleInfo) return null;
    const v = data.vehicleInfo;

    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Your Vehicle</p>
                <p className="text-lg font-bold text-blue-900">{v.vehicleNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-blue-700">Odometer</p>
                <p className="font-bold">{v.currentOdometer.toLocaleString()} km</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-700">Fuel Level</p>
                <p className="font-bold">{v.fuelLevel}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatusCards = () => {
    if (!data) return null;
    const s = data.summary;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ongoing</p>
            <p className="text-xl font-bold text-green-600">{s.ongoingTrips}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-xl font-bold text-blue-600">{s.scheduledTrips}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-purple-600">{s.completedTrips}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Delayed</p>
            <p className="text-xl font-bold text-amber-600">{s.delayedTrips}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTripCard = (trip: Trip) => {
    const progress = calculateProgress(trip);
    const isExpanded = expandedTrip === trip.id;
    const estimatedArrival = getEstimatedArrival(trip);

    return (
      <Card 
        key={trip.id} 
        className={cn(
          "hover:shadow-md transition-shadow overflow-hidden",
          trip.status === "ongoing" && "border-2 border-green-500",
          trip.status === "delayed" && "border-2 border-amber-500",
        )}
      >
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  trip.tripType === "morning" ? "bg-orange-100" : "bg-blue-100"
                )}>
                  {getTripTypeIcon(trip.tripType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTripTypeBadge(trip.tripType)}
                    {getStatusBadge(trip.status)}
                    {trip.delayMinutes && trip.delayMinutes > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" />
                        +{trip.delayMinutes} min
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mt-1">{trip.routeName}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Start Time</p>
                <p className="text-lg font-bold">{trip.startTime}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">End Time</p>
                <p className="text-lg font-bold">{trip.endTime}</p>
              </div>
            </div>

            {trip.status === "ongoing" && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Trip Progress</span>
                  <span className="text-green-600 font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {trip.boardedStudents.length} boarded
                  </span>
                  <span className="font-medium text-blue-600">
                    ETA: {estimatedArrival}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{trip.pickupPoints.length} pickup points</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{trip.totalStudents} students</span>
              </div>
              {trip.vehicleNumber && (
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vehicle: {trip.vehicleNumber}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1 h-12 text-base"
                variant={trip.status === "ongoing" ? "default" : "outline"}
                onClick={() => handleViewTrip(trip)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              
              {trip.status === "scheduled" && (
                <Button 
                  className="h-12 px-4 bg-green-600 hover:bg-green-700"
                  onClick={() => handleStartTrip(trip)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              
              {trip.status === "ongoing" && (
                <Button 
                  variant="outline"
                  className="h-12 px-4 text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => handleReportDelay(trip)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="px-5 pb-5 pt-2 border-t bg-gray-50/50">
              <h4 className="font-medium mb-2">Stops</h4>
              <div className="space-y-2">
                {trip.pickupPoints.slice(0, 3).map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className={cn(
                        "h-3 w-3",
                        point.completed ? "text-green-600" : "text-blue-600"
                      )} />
                      <span>{point.pointName}</span>
                    </div>
                    <Badge variant={point.completed ? "default" : "outline"}>
                      {point.completed ? "Done" : `${point.studentCount} students`}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button 
                variant="link" 
                className="mt-2 p-0 h-auto text-xs"
                onClick={() => handleViewTrip(trip)}
              >
                View all stops →
              </Button>
            </div>
          )}

          <div 
            className="px-5 py-2 bg-gray-100/50 flex items-center justify-between cursor-pointer"
            onClick={() => toggleTripExpand(trip.id)}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {isExpanded ? "Show less" : "Show details"}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Stops</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.map((trip) => (
              <TableRow key={trip.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{trip.routeName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getTripTypeIcon(trip.tripType)}
                    <span className="capitalize">{trip.tripType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{trip.startTime} - {trip.endTime}</p>
                  </div>
                </TableCell>
                <TableCell>{trip.pickupPoints.length}</TableCell>
                <TableCell>{trip.totalStudents}</TableCell>
                <TableCell>{getStatusBadge(trip.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewTrip(trip)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {trip.status === "scheduled" && (
                      <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleStartTrip(trip)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderTripTabs = () => (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12">
            <TabsTrigger value="all" className="text-base">All Trips</TabsTrigger>
            <TabsTrigger value="morning" className="text-base">Morning</TabsTrigger>
            <TabsTrigger value="evening" className="text-base">Evening</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrips.map(renderTripCard)}
            </div>
          ) : (
            renderListView()
          )}
        </TabsContent>

        <TabsContent value="morning" className="mt-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrips.map(renderTripCard)}
            </div>
          ) : (
            renderListView()
          )}
        </TabsContent>

        <TabsContent value="evening" className="mt-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrips.map(renderTripCard)}
            </div>
          ) : (
            renderListView()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTripDetailsDialog = () => (
    <Dialog open={showTripDetailsDialog} onOpenChange={setShowTripDetailsDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {selectedTrip && getTripTypeIcon(selectedTrip.tripType)}
            Trip Details
          </DialogTitle>
        </DialogHeader>
        {selectedTrip && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedTrip.routeName}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {getTripTypeBadge(selectedTrip.tripType)}
                  {getStatusBadge(selectedTrip.status)}
                  {selectedTrip.delayMinutes && selectedTrip.delayMinutes > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Delayed by {selectedTrip.delayMinutes} min
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedTrip.status === "scheduled" && (
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 h-12 px-6"
                    onClick={() => {
                      setShowTripDetailsDialog(false);
                      handleStartTrip(selectedTrip);
                    }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Trip
                  </Button>
                )}
                {selectedTrip.status === "ongoing" && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-12 px-6 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => {
                      setShowTripDetailsDialog(false);
                      handleReportDelay(selectedTrip);
                    }}
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Report Delay
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Start Time</p>
                <p className="text-lg font-bold">{selectedTrip.startTime}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">End Time</p>
                <p className="text-lg font-bold">{selectedTrip.endTime}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-lg font-bold">{selectedTrip.vehicleNumber || "N/A"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="text-lg font-bold">{selectedTrip.driverName || "N/A"}</p>
              </div>
            </div>

            {selectedTrip.status === "ongoing" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trip Progress</span>
                  <span className="text-green-600 font-bold">
                    {calculateProgress(selectedTrip)}%
                  </span>
                </div>
                <Progress value={calculateProgress(selectedTrip)} className="h-3" />
              </div>
            )}

            <Tabs defaultValue="pickup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pickup">Pickup Points</TabsTrigger>
                <TabsTrigger value="drop">Drop Points</TabsTrigger>
              </TabsList>

              <TabsContent value="pickup" className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {selectedTrip.pickupPoints.map((point, index) => (
                    <AccordionItem key={index} value={`pickup-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center",
                              point.completed ? "bg-green-100" : "bg-blue-100"
                            )}>
                              <MapPin className={cn(
                                "h-3 w-3",
                                point.completed ? "text-green-600" : "text-blue-600"
                              )} />
                            </div>
                            <span className="font-medium">{point.pointName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="ml-2">
                              {point.studentCount} students
                            </Badge>
                            {point.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2 pl-8">
                          <p className="text-sm text-muted-foreground">{point.address}</p>
                          <p className="text-sm font-medium">Pickup Time: {point.time}</p>
                          {point.actualTime && (
                            <p className="text-sm text-green-600">Actual: {point.actualTime}</p>
                          )}
                          
                          <Separator className="my-2" />
                          
                          <p className="font-medium text-sm">Students:</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {point.students.map((student) => (
                              <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Class {student.className}-{student.section}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCallParent(student.parentPhone!)}
                                    title="Call Parent"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setShowStudentDetailsDialog(true);
                                    }}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {selectedTrip.status === "ongoing" && !point.completed && (
                            <Button 
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => {
                                markStopCompletedMutation.mutate({
                                  tripId: selectedTrip.id,
                                  stopName: point.pointName,
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Stop Completed
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="drop" className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {selectedTrip.dropPoints.map((point, index) => (
                    <AccordionItem key={index} value={`drop-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center",
                              point.completed ? "bg-green-100" : "bg-purple-100"
                            )}>
                              <Home className={cn(
                                "h-3 w-3",
                                point.completed ? "text-green-600" : "text-purple-600"
                              )} />
                            </div>
                            <span className="font-medium">{point.pointName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="ml-2">
                              {point.studentCount} students
                            </Badge>
                            {point.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2 pl-8">
                          <p className="text-sm text-muted-foreground">{point.address}</p>
                          <p className="text-sm font-medium">Drop Time: {point.time}</p>
                          
                          <Separator className="my-2" />
                          
                          <p className="font-medium text-sm">Students:</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {point.students.map((student) => (
                              <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Class {student.className}-{student.section}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowStudentDetailsDialog(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>

            {selectedTrip.notes && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
                <p className="text-sm text-amber-700">{selectedTrip.notes}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTripDetailsDialog(false)} size="lg">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderStopDetailsDialog = () => (
    <Dialog open={showStopDetailsDialog} onOpenChange={setShowStopDetailsDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Stop Details
          </DialogTitle>
        </DialogHeader>
        {selectedStop && (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-xl font-bold">{selectedStop.pointName}</h3>
              <p className="text-sm text-muted-foreground">{selectedStop.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-lg font-bold">{selectedStop.time}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-lg font-bold">{selectedStop.studentCount}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Student List</p>
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {selectedStop.students.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Class {student.className}-{student.section}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCallParent(student.parentPhone!)}
                          disabled={!student.parentPhone}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setShowStopDetailsDialog(false);
                            setSelectedStudent(student);
                            setShowStudentDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStopDetailsDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderStudentDetailsDialog = () => (
    <Dialog open={showStudentDetailsDialog} onOpenChange={setShowStudentDetailsDialog}>
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
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(selectedStudent.name)}
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
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Pickup Point</p>
                <p className="font-medium text-base">{selectedStudent.pickupPoint}</p>
                <p className="text-sm text-blue-600">{selectedStudent.pickupTime}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Drop Point</p>
                <p className="font-medium text-base">{selectedStudent.dropPoint}</p>
                <p className="text-sm text-blue-600">{selectedStudent.dropTime}</p>
              </div>

              {selectedStudent.parentName && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                  <p className="font-medium text-base">{selectedStudent.parentName}</p>
                  {selectedStudent.parentPhone && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-10"
                        onClick={() => handleCallParent(selectedStudent.parentPhone!)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      {selectedStudent.parentPhone2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10"
                          onClick={() => handleCallParent(selectedStudent.parentPhone2!)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedStudent.emergencyContact && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800">Emergency Contact</p>
                  <p className="font-medium text-amber-900">{selectedStudent.emergencyContact}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStudentDetailsDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDelayDialog = () => (
    <AlertDialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Report Trip Delay
          </AlertDialogTitle>
          <AlertDialogDescription>
            Let the school know about the delay. This will notify parents and administration.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delay-minutes">Delay Duration (minutes)</Label>
            <Input
              id="delay-minutes"
              type="number"
              min="1"
              max="120"
              value={delayMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelayMinutes(parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delay-reason">Reason for Delay (Optional)</Label>
            <Textarea
              id="delay-reason"
              placeholder="e.g., Traffic, breakdown, road closure..."
              value={delayReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDelayReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDelayDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              if (selectedTrip) {
                reportDelayMutation.mutate();
              }
            }}
            disabled={reportDelayMutation.isPending}
          >
            {reportDelayMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Report Delay
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
      {renderSummary()}
      {renderStatusCards()}
      {renderTripTabs()}

      {/* Dialogs */}
      {renderTripDetailsDialog()}
      {renderStopDetailsDialog()}
      {renderStudentDetailsDialog()}
      {renderDelayDialog()}
    </div>
  );
}