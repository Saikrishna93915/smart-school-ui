import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
// Removed unused Select imports
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
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
  Play,
  Square,
  Bus,
  Clock,
  Gauge,
  CheckCircle2,
  ArrowLeft,
  AlertOctagon,
  Users,
  MapPin,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Navigation,
  Sunrise,
  Sun,
  Loader2,
  RefreshCw,
  Eye,
  AlertCircle,
  WifiOff,
  ChevronRight,
  User,
  LocateFixed,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface Student {
  _id: string;
  name: string;
  className: string;
  section: string;
  stopName: string;
  stopOrder: number;
  pickupTime: string;
  dropTime?: string;
  parentName?: string;
  parentPhone?: string;
  parentPhone2?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  photo?: string;
  hasBoarded?: boolean;
  hasDropped?: boolean;
  specialNeeds?: string;
  notes?: string;
}

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  registrationNumber: string;
  model: string;
  currentOdometer: number;
  fuelLevel: number;
  fuelTankCapacity: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
}

interface Trip {
  _id: string;
  tripType: 'morning' | 'afternoon';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  startOdometer?: number;
  endOdometer?: number;
  routeId: string;
  routeName: string;
  students: Student[];
  boardedStudents: string[];
  droppedStudents: string[];
  totalStudents: number;
  estimatedDuration?: number;
  distance?: number;
  delayMinutes?: number;
  delayReason?: string;
  notes?: string;
  safetyChecks?: SafetyChecklist;
}

interface SafetyChecklist {
  brakes: boolean;
  lights: boolean;
  tires: boolean;
  fuel: boolean;
  firstAid: boolean;
  fireExtinguisher: boolean;
  horn: boolean;
  seatbelts: boolean;
  emergencyExit: boolean;
  mirrors: boolean;
  windshield: boolean;
  wipers: boolean;
  inspectedAt?: string;
  inspectedBy?: string;
}

interface DashboardData {
  driverName: string;
  vehicle: Vehicle;
  todayTrips: Trip[];
  activeTrip: Trip | null;
  students: Student[];
  vehicleNumber: string;
  currentOdometer: number;
}

// ==================== UTILITY FUNCTIONS ====================

const formatTime = (dateString?: string): string => {
  if (!dateString) return '--:--';
  return format(parseISO(dateString), 'hh:mm a');
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getTripTypeIcon = (type: string) => {
  switch (type) {
    case 'morning':
      return <Sunrise className="h-5 w-5 text-orange-500" />;
    case 'afternoon':
      return <Sun className="h-5 w-5 text-amber-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

// ==================== MOCK DATA ====================

const mockStudents: Student[] = [
  {
    _id: 'stu-001',
    name: 'Aarav Kumar',
    className: '10',
    section: 'A',
    stopName: 'Kukatpally Stop 1',
    stopOrder: 1,
    pickupTime: '07:15 AM',
    dropTime: '03:30 PM',
    parentName: 'Rajesh Kumar',
    parentPhone: '9876543210',
    emergencyContact: '9876543219',
  },
  {
    _id: 'stu-002',
    name: 'Sneha Reddy',
    className: '9',
    section: 'B',
    stopName: 'Kukatpally Stop 2',
    stopOrder: 2,
    pickupTime: '07:25 AM',
    dropTime: '03:30 PM',
    parentName: 'Suresh Reddy',
    parentPhone: '9876543212',
  },
  {
    _id: 'stu-003',
    name: 'Rohan Singh',
    className: '8',
    section: 'A',
    stopName: 'Kukatpally Stop 3',
    stopOrder: 3,
    pickupTime: '07:35 AM',
    dropTime: '03:30 PM',
    parentName: 'Vikram Singh',
    parentPhone: '9876543213',
    specialNeeds: 'Requires assistance boarding',
  },
  {
    _id: 'stu-004',
    name: 'Priya Sharma',
    className: '7',
    section: 'C',
    stopName: 'Kukatpally Stop 1',
    stopOrder: 1,
    pickupTime: '07:15 AM',
    dropTime: '03:30 PM',
    parentName: 'Dinesh Sharma',
    parentPhone: '9876543214',
  },
  {
    _id: 'stu-005',
    name: 'Arjun Patel',
    className: '6',
    section: 'B',
    stopName: 'Kukatpally Stop 2',
    stopOrder: 2,
    pickupTime: '07:25 AM',
    dropTime: '03:30 PM',
    parentName: 'Mahesh Patel',
    parentPhone: '9876543215',
  },
];

const mockActiveTrip: Trip = {
  _id: 'trip-001',
  tripType: 'morning',
  status: 'in_progress',
  startTime: new Date().toISOString(),
  startOdometer: 52345,
  routeId: 'route-001',
  routeName: 'Kukatpally Route',
  students: mockStudents,
  boardedStudents: ['stu-001', 'stu-004'],
  droppedStudents: [],
  totalStudents: mockStudents.length,
  estimatedDuration: 90,
  distance: 15,
};

const mockVehicle: Vehicle = {
  _id: 'veh-001',
  vehicleNumber: 'TS-07-AB-1234',
  registrationNumber: 'AP-31-TA-5678',
  model: 'Tata Starbus 2024',
  currentOdometer: 52345,
  fuelLevel: 65,
  fuelTankCapacity: 120,
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-05-15',
  insuranceExpiry: '2026-12-31',
  fitnessExpiry: '2026-12-31',
};

const mockDashboardData: DashboardData = {
  driverName: 'Rajesh Kumar',
  vehicle: mockVehicle,
  todayTrips: [mockActiveTrip],
  activeTrip: mockActiveTrip,
  students: mockStudents,
  vehicleNumber: 'TS-07-AB-1234',
  currentOdometer: 52345,
};

// ==================== MAIN COMPONENT ====================

export default function StartTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { location: currentLocation, getLocation } = useGeolocation();
  const isOnline = useNetworkStatus();

  // State
  const [odometer, setOdometer] = useState("");
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [tripType, setTripType] = useState<'morning' | 'afternoon'>('morning');
  const [checklist, setChecklist] = useState<SafetyChecklist>({
    brakes: false,
    lights: false,
    tires: false,
    fuel: false,
    firstAid: false,
    fireExtinguisher: false,
    horn: false,
    seatbelts: false,
    emergencyExit: false,
    mirrors: false,
    windshield: false,
    wipers: false,
  });
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});

  // --- Queries ---

  const { data, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ["driver-dashboard"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getDashboard();
      // return response.data?.data;

      await new Promise(resolve => setTimeout(resolve, 800));
      return mockDashboardData;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const activeTrip = data?.activeTrip;
  const students = data?.students || [];
  const vehicle = data?.vehicle;

  const boardedCount = activeTrip?.boardedStudents?.length || 0;
  const progress = students.length > 0 ? (boardedCount / students.length) * 100 : 0;

  // Group students by stop
  const studentsByStop = useMemo(() => {
    const stops = new Map<string, Student[]>();
    students.forEach(student => {
      if (!stops.has(student.stopName)) {
        stops.set(student.stopName, []);
      }
      stops.get(student.stopName)!.push(student);
    });
    return Array.from(stops.entries()).map(([stopName, students]) => ({
      stopName,
      students: students.sort((a, b) => a.stopOrder - b.stopOrder),
      boardedCount: students.filter(s => activeTrip?.boardedStudents?.includes(s._id)).length,
      totalCount: students.length,
    }));
  }, [students, activeTrip]);

  const nextStop = useMemo(() => {
    return studentsByStop.find(stop => 
      stop.students.some(s => !activeTrip?.boardedStudents?.includes(s._id))
    );
  }, [studentsByStop, activeTrip]);

  // --- Mutations ---

  const startMutation = useMutation({
    mutationFn: async (_data: any) => {
      // await driverService.startTrip(data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Trip Started", {
        description: "Safe driving! Your trip is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
      setShowSafetyModal(false);
      setOdometer("");
    },
    onError: () => {
      toast.error("Failed to start trip", {
        description: "Please try again or contact support.",
      });
    },
  });

  const endMutation = useMutation({
    mutationFn: async (_data: any) => {
      // await driverService.endTrip(activeTrip?._id, data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Trip Completed", {
        description: "All data has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
      setOdometer("");
    },
    onError: () => {
      toast.error("Failed to end trip", {
        description: "Please try again or contact support.",
      });
    },
  });

  const markBoardedMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      // await driverService.markStudentBoarded(activeTrip?._id, studentId, status);
      console.log('Marking student boarded:', studentId, status);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    },
    onMutate: async ({ studentId }) => {
      await queryClient.cancelQueries({ queryKey: ["driver-dashboard"] });

      const previousData = queryClient.getQueryData<DashboardData>(["driver-dashboard"]);

      if (previousData && previousData.activeTrip) {
        const updatedBoarded = previousData.activeTrip.boardedStudents.includes(studentId)
          ? previousData.activeTrip.boardedStudents.filter(id => id !== studentId)
          : [...previousData.activeTrip.boardedStudents, studentId];

        queryClient.setQueryData(["driver-dashboard"], {
          ...previousData,
          activeTrip: {
            ...previousData.activeTrip,
            boardedStudents: updatedBoarded,
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["driver-dashboard"], context.previousData);
      }
      toast.error("Failed to update student status");
    },
  });

  const emergencyMutation = useMutation({
    mutationFn: async (_reason: string) => {
      // await driverService.reportEmergency(reason, currentLocation);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.error("EMERGENCY REPORTED", {
        description: "School administration has been notified. Stay calm.",
        duration: 10000,
      });
      setShowEmergencyDialog(false);
      setEmergencyReason("");
    },
  });

  // --- Handlers ---

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing trip data...");
  }, [refetch]);

  const handleStartRequest = () => {
    if (!odometer) {
      toast.error("Odometer Required", {
        description: "Please enter starting odometer reading",
      });
      return;
    }

    const odometerNum = Number(odometer);
    if (isNaN(odometerNum) || odometerNum <= 0) {
      toast.error("Invalid Reading", {
        description: "Please enter a valid odometer reading",
      });
      return;
    }

    if (vehicle && odometerNum <= vehicle.currentOdometer) {
      toast.error("Invalid Reading", {
        description: `Must be greater than last recorded odometer (${vehicle.currentOdometer} km)`,
      });
      return;
    }

    setShowSafetyModal(true);
  };

  const confirmStart = () => {
    const allChecked = Object.values(checklist).every(v => v);
    if (!allChecked) {
      toast.error("Safety Checks Required", {
        description: "Please complete all safety checks before starting",
      });
      return;
    }

    startMutation.mutate({
      tripType,
      startOdometer: Number(odometer),
      startTime: new Date().toISOString(),
      startLocation: currentLocation,
      safetyChecks: {
        ...checklist,
        inspectedAt: new Date().toISOString(),
      },
    });
  };

  const handleEndTrip = () => {
    if (!odometer) {
      toast.error("Odometer Required", {
        description: "Please enter closing odometer reading",
      });
      return;
    }

    const odometerNum = Number(odometer);
    if (isNaN(odometerNum) || odometerNum <= 0) {
      toast.error("Invalid Reading", {
        description: "Please enter a valid odometer reading",
      });
      return;
    }

    if (activeTrip?.startOdometer && odometerNum <= activeTrip.startOdometer) {
      toast.error("Invalid Reading", {
        description: `Must be greater than starting odometer (${activeTrip.startOdometer} km)`,
      });
      return;
    }

    // Check for pending students
    if (boardedCount < students.length) {
      if (!window.confirm(`Warning: Only ${boardedCount}/${students.length} students were marked. End trip anyway?`)) {
        return;
      }
    }

    endMutation.mutate({
      endOdometer: Number(odometer),
      endTime: new Date().toISOString(),
      endLocation: currentLocation,
    });
  };

  const handleMarkStudent = (studentId: string, currentStatus: boolean) => {
    if (!activeTrip) return;
    markBoardedMutation.mutate({
      studentId,
      status: currentStatus ? 'not_boarded' : 'boarded',
    });
  };

  const handleCallParent = (phone: string, _name: string) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDialog(true);
  };

  const handleEmergency = () => {
    setShowEmergencyDialog(true);
  };

  const confirmEmergency = () => {
    if (!emergencyReason.trim()) {
      toast.error("Please describe the emergency");
      return;
    }
    emergencyMutation.mutate(emergencyReason);
  };

  const handleGetLocation = () => {
    getLocation();
    if (currentLocation) {
      toast.success(`Location captured: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
    }
  };

  const toggleStopExpand = (stopName: string) => {
    setExpandedStops(prev => ({
      ...prev,
      [stopName]: !prev[stopName],
    }));
  };

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // --- Render Functions ---

  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Control</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Bus className="h-4 w-4" />
            {vehicle?.vehicleNumber} • {vehicle?.model}
            {!isOnline && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
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
              <p>Refresh trip data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const renderActiveTripBadge = () => {
    if (!activeTrip) return null;

    return (
      <div className="fixed top-20 right-6 z-10">
        <Badge className="bg-green-600 text-white animate-pulse shadow-lg px-4 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-white mr-2 animate-ping" />
          Trip Active • {activeTrip.tripType === 'morning' ? 'Morning' : 'Afternoon'}
        </Badge>
      </div>
    );
  };

  const renderStartTripView = () => (
    <div className="grid gap-6">
      <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              <CardTitle>Start New Trip</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {students.length} students
            </Badge>
          </div>
          <CardDescription>
            Complete safety checks and record starting odometer
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trip Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={tripType === 'morning' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTripType('morning')}
                >
                  <Sunrise className="h-4 w-4 mr-2" />
                  Morning
                </Button>
                <Button
                  variant={tripType === 'afternoon' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTripType('afternoon')}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Afternoon
                </Button>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label className="text-muted-foreground">Vehicle</Label>
              <p className="text-xl font-bold">{vehicle?.vehicleNumber}</p>
            </div>
          </div>

          {/* Route Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-lg font-bold">{students.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stops</p>
                <p className="text-lg font-bold">{studentsByStop.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Time</p>
                <p className="text-lg font-bold">45 min</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                Starting Odometer
              </Label>
              <Badge variant="secondary">Last: {vehicle?.currentOdometer} km</Badge>
            </div>
            <div className="relative">
              <Input
                type="number"
                className="text-4xl h-20 text-center font-mono tracking-tighter"
                placeholder="000000"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleGetLocation} className="text-muted-foreground">
                        <LocateFixed className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Get current location</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Camera className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Take photo of odometer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full h-16 text-xl font-bold gap-3 shadow-xl"
              onClick={handleStartRequest}
            >
              <Play className="h-6 w-6 fill-current" />
              START TRIP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="text-xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Stops</p>
            <p className="text-xl font-bold">{studentsByStop.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Est. Time</p>
            <p className="text-xl font-bold">45m</p>
          </CardContent>
        </Card>
      </div>

      {/* Route Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Route Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {studentsByStop.map((stop, index) => (
              <div key={stop.stopName} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stop.stopName}</p>
                  <p className="text-xs text-muted-foreground">
                    {stop.students[0]?.pickupTime} • {stop.totalCount} students
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveTripView = () => (
    <div className="space-y-6">
      {/* Active Trip Header */}
      <Card className="border-t-4 border-t-green-600 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center animate-pulse">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {getTripTypeIcon(activeTrip?.tripType ?? "morning")}
                  {activeTrip?.tripType === 'morning' ? 'Morning' : 'Afternoon'} Trip
                </h2>
                <p className="text-sm text-muted-foreground">
                  Started at {formatTime(activeTrip?.startTime)} • Odometer: {activeTrip?.startOdometer} km
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white animate-pulse">LIVE</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Boarding Progress
              </span>
              <span className="font-bold text-green-600">
                {boardedCount}/{students.length}
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-green-100" />
          </div>

          {nextStop && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700">Next Stop</p>
                  <p className="font-semibold">{nextStop.stopName}</p>
                  <p className="text-xs text-muted-foreground">
                    {nextStop.students[0]?.pickupTime} • {nextStop.totalCount} students
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const stop = nextStop.students[0];
                  if (stop) {
                    // Navigate to stop
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.stopName)}`;
                    window.open(url, '_blank');
                  }
                }}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Checklist by Stop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Student Boarding List
            </span>
            <Badge variant="outline">{boardedCount} boarded</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {studentsByStop.map((stop) => (
              <div key={stop.stopName} className="border-b last:border-0">
                <button
                  onClick={() => toggleStopExpand(stop.stopName)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {stop.students[0]?.stopOrder}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{stop.stopName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.boardedCount}/{stop.totalCount} boarded • {stop.students[0]?.pickupTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={stop.boardedCount === stop.totalCount ? "default" : "outline"}>
                      {stop.boardedCount === stop.totalCount ? 'Complete' : `${stop.boardedCount}/${stop.totalCount}`}
                    </Badge>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      expandedStops[stop.stopName] && "rotate-90"
                    )} />
                  </div>
                </button>

                {expandedStops[stop.stopName] && (
                  <div className="px-4 pb-4 space-y-2">
                    {stop.students.map((student) => {
                      const isBoarded = activeTrip?.boardedStudents?.includes(student._id);

                      return (
                        <div
                          key={student._id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg transition-colors",
                            isBoarded ? "bg-green-50 border border-green-200" : "bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn(
                                "text-white text-xs",
                                isBoarded ? "bg-green-600" : "bg-blue-600"
                              )}>
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Class {student.className}-{student.section}
                              </p>
                              {student.specialNeeds && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {student.specialNeeds}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleCallParent(student.parentPhone || '', student.name)}
                                  >
                                    <Phone className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Call parent</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleViewStudent(student)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-xs font-medium",
                                isBoarded
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              )}
                              onClick={() => handleMarkStudent(student._id, !!isBoarded)}
                            >
                              {isBoarded ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Boarded
                                </>
                              ) : (
                                'Board'
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* End Trip Controls */}
      <Card className="border-destructive/20 bg-destructive/[0.02]">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-bold text-destructive">
              <Gauge className="h-4 w-4" />
              Closing Odometer Reading
            </Label>
            <div className="relative">
              <Input
                type="number"
                className="text-2xl h-14 text-center font-mono border-destructive/30 focus-visible:ring-destructive"
                placeholder="Enter final reading"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleGetLocation}>
                        <LocateFixed className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add location</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Take photo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 h-16 text-lg font-bold shadow-lg"
              onClick={handleEndTrip}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Square className="h-5 w-5 mr-2 fill-current" />
              )}
              {endMutation.isPending ? "Ending..." : "END TRIP"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 px-4 text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={handleEmergency}
            >
              <AlertOctagon className="h-6 w-6" />
            </Button>
          </div>

          {boardedCount < students.length && (
            <div className="p-3 bg-amber-50 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                {students.length - boardedCount} student(s) not yet boarded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSafetyModal = () => (
    <Dialog open={showSafetyModal} onOpenChange={setShowSafetyModal}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pre-Trip Safety Check
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Verify these safety standards before beginning the route
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-3">
            {Object.entries(checklist).map(([key, value]) => (
              <div
                key={key}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                  value ? "bg-green-50 border-green-200" : "bg-muted/20 hover:bg-muted/50"
                )}
              >
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({ ...prev, [key]: !!checked }))
                  }
                />
                <Label
                  htmlFor={key}
                  className="flex-1 text-sm font-medium capitalize cursor-pointer"
                >
                  {key.replace(/([A-Z])/g, ' $1')}
                </Label>
                {value && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            ))}
          </div>

          {/* Vehicle Info Summary */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-medium mb-1">Vehicle Status</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-blue-600">Odometer:</span>
                <span className="ml-1 font-medium">{odometer} km</span>
              </div>
              <div>
                <span className="text-blue-600">Fuel Level:</span>
                <span className="ml-1 font-medium">{vehicle?.fuelLevel}%</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              By starting this trip, you confirm that the vehicle is in safe operating condition
              and you have verified the identity of all students.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSafetyModal(false)}>
            Cancel
          </Button>
          <Button onClick={confirmStart} disabled={startMutation.isPending}>
            {startMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {startMutation.isPending ? "Starting..." : "Confirm & Start Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEmergencyDialog = () => (
    <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertOctagon className="h-5 w-5" />
            Report Emergency
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately notify school administration and emergency services if configured.
            Please describe the situation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Describe the emergency..."
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            className="min-h-[100px]"
          />
          {currentLocation && (
            <p className="text-xs text-muted-foreground mt-2">
              📍 Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowEmergencyDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmEmergency}
            className="bg-red-600 hover:bg-red-700"
            disabled={emergencyMutation.isPending}
          >
            {emergencyMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertOctagon className="h-4 w-4 mr-2" />
            )}
            Report Emergency
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderStudentDialog = () => (
    <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
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
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Pickup Stop</p>
                <p className="font-medium">{selectedStudent.stopName}</p>
                <p className="text-xs text-blue-600">{selectedStudent.pickupTime}</p>
              </div>

              {selectedStudent.parentName && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                  <p className="font-medium">{selectedStudent.parentName}</p>
                  {selectedStudent.parentPhone && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCallParent(selectedStudent.parentPhone || '', selectedStudent.name)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedStudent.emergencyContact && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800">Emergency Contact</p>
                  <p className="font-medium text-amber-900">{selectedStudent.emergencyContact}</p>
                  {selectedStudent.emergencyPhone && (
                    <Button
                      size="sm"
                      variant="link"
                      className="h-auto p-0 mt-1 text-amber-700"
                      onClick={() => handleCallParent(selectedStudent.emergencyPhone || '', selectedStudent.name)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedStudent.emergencyPhone}
                    </Button>
                  )}
                </div>
              )}

              {selectedStudent.specialNeeds && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800">Special Needs</p>
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
          <Button variant="outline" onClick={() => setShowStudentDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 pb-24 max-w-4xl mx-auto animate-in fade-in duration-500">
      {renderHeader()}
      {renderActiveTripBadge()}

      {!activeTrip ? renderStartTripView() : renderActiveTripView()}

      {/* Dialogs */}
      {renderSafetyModal()}
      {renderEmergencyDialog()}
      {renderStudentDialog()}

      {/* SOS Floating Action Button (only during active trip) */}
      {activeTrip && (
        <div className="fixed bottom-6 right-6 animate-pulse">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl ring-4 ring-red-600/20"
                  onClick={handleEmergency}
                >
                  <AlertOctagon className="h-8 w-8" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>SOS Emergency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
