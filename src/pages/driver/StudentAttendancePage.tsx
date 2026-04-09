import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";

import driverService from "@/Services/driverService";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Icons
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserCheck,
  AlertCircle,
  Users,
  Bus,
  MapPin,
  Phone,
  PhoneCall,
  Mail,
  MessageSquare,
  Eye,
  RefreshCw,
  Loader2,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  AlertTriangle,
  Info,
  HelpCircle,
  User,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundMinus,
  UserRoundPlus,
  GraduationCap,
  School,
  Home,
  Map,
  Navigation,
  Locate,
  LocateFixed,
  LocateOff,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  BluetoothSearching,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

type BoardingStatus = "boarded" | "absent" | "late" | null;

interface Student {
  _id: string;
  personal: {
    firstName: string;
    lastName: string;
    photo?: string;
  };
  academic: {
    class: string;
    section: string;
    rollNumber?: string;
  };
  transport: {
    pickupStop: string;
    stopOrder: number;
    pickupTime: string;
    dropStop: string;
    dropTime: string;
    routeName: string;
    busNumber: string;
  };
  parentInfo: {
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  };
  attendance?: {
    status?: BoardingStatus;
    markedAt?: string;
    notes?: string;
  };
  specialNeeds?: string;
  notes?: string;
}

interface Trip {
  _id: string;
  tripType: 'morning' | 'afternoon' | 'evening';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  routeId: {
    _id: string;
    routeName: string;
    stops: Array<{
      stopName: string;
      stopOrder: number;
      arrivalTime: string;
      students: string[]; // studentIds
    }>;
  };
  boardedStudents: string[];
  absentStudents: string[];
  lateStudents: string[];
}

interface AttendanceStats {
  total: number;
  boarded: number;
  absent: number;
  late: number;
  pending: number;
  byStop: Record<string, {
    total: number;
    boarded: number;
    absent: number;
    late: number;
    pending: number;
  }>;
}

interface AttendanceFilter {
  search: string;
  status: 'all' | 'boarded' | 'absent' | 'late' | 'pending';
  stop: string;
  sortBy: 'name' | 'stop' | 'status';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
  page: number;
  limit: number;
}

// ==================== UTILITY FUNCTIONS ====================

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const getFullName = (student: Student): string => {
  return `${student.personal?.firstName || ''} ${student.personal?.lastName || ''}`.trim() || 'Unknown';
};

const formatTime = (timeString: string): string => {
  return timeString;
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(parseISO(dateString), 'hh:mm a');
};

const getStatusIcon = (status: BoardingStatus) => {
  switch (status) {
    case 'boarded':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'absent':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'late':
      return <Clock className="h-4 w-4 text-amber-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: BoardingStatus) => {
  switch (status) {
    case 'boarded':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Boarded</Badge>;
    case 'absent':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
    case 'late':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Late</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
  }
};

const getStatusButtonClass = (status: BoardingStatus, currentStatus: BoardingStatus) => {
  if (status === currentStatus) {
    switch (status) {
      case 'boarded':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'absent':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'late':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return '';
    }
  }
  return '';
};

// ==================== MOCK DATA ====================

const generateMockStudents = (count: number): Student[] => {
  const students: Student[] = [];
  const firstNames = [
    "Aarav", "Sneha", "Rohan", "Priya", "Rahul", "Ananya", "Vikram", "Divya", "Arjun", "Kavita",
    "Ravi", "Neha", "Amit", "Pooja", "Sanjay", "Meera", "Rajesh", "Sunita", "Deepak", "Anjali"
  ];
  const lastNames = ["Kumar", "Reddy", "Singh", "Sharma", "Verma", "Gupta", "Nair", "Patel"];
  const stops = [
    "Kukatpally Stop 1",
    "Kukatpally Stop 2",
    "Kukatpally Stop 3",
    "JNTU Stop",
    "KPHB Colony",
    "Miyapur X Road"
  ];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const stopIndex = Math.floor(Math.random() * stops.length);
    const stopName = stops[stopIndex];
    const status = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'boarded' : (Math.random() > 0.5 ? 'late' : 'absent')) : null;

    students.push({
      _id: `stu-${String(i).padStart(3, '0')}`,
      personal: {
        firstName,
        lastName,
      },
      academic: {
        class: `${Math.floor(Math.random() * 7) + 6}`,
        section: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        rollNumber: `${Math.floor(Math.random() * 40) + 1}`,
      },
      transport: {
        pickupStop: stopName,
        stopOrder: stopIndex + 1,
        pickupTime: `${7 + Math.floor(stopIndex / 2)}:${(stopIndex * 15) % 60}`.replace(/:/g, ':') + ' AM',
        dropStop: 'School Main Gate',
        dropTime: '03:30 PM',
        routeName: 'Kukatpally Route',
        busNumber: 'TS-07-AB-1234',
      },
      parentInfo: {
        fatherName: `Rajesh ${lastName}`,
        fatherPhone: `987654${String(i).padStart(4, '0')}`,
        motherName: `Sunita ${lastName}`,
        motherPhone: `987654${String(i + 1000).padStart(4, '0')}`,
        emergencyContact: `Emergency Contact ${i}`,
        emergencyPhone: `987654${String(i + 2000).padStart(4, '0')}`,
      },
      attendance: status ? {
        status: status as any,
        markedAt: new Date().toISOString(),
      } : undefined,
    });
  }

  return students;
};

const mockStudents = generateMockStudents(50);

const mockTrip: Trip = {
  _id: 'trip-001',
  tripType: 'morning',
  status: 'in_progress',
  startTime: new Date().toISOString(),
  routeId: {
    _id: 'route-001',
    routeName: 'Kukatpally Route',
    stops: [
      {
        stopName: 'Kukatpally Stop 1',
        stopOrder: 1,
        arrivalTime: '07:15 AM',
        students: mockStudents.filter(s => s.transport.pickupStop === 'Kukatpally Stop 1').map(s => s._id),
      },
      {
        stopName: 'Kukatpally Stop 2',
        stopOrder: 2,
        arrivalTime: '07:25 AM',
        students: mockStudents.filter(s => s.transport.pickupStop === 'Kukatpally Stop 2').map(s => s._id),
      },
      {
        stopName: 'Kukatpally Stop 3',
        stopOrder: 3,
        arrivalTime: '07:35 AM',
        students: mockStudents.filter(s => s.transport.pickupStop === 'Kukatpally Stop 3').map(s => s._id),
      },
      {
        stopName: 'JNTU Stop',
        stopOrder: 4,
        arrivalTime: '07:45 AM',
        students: mockStudents.filter(s => s.transport.pickupStop === 'JNTU Stop').map(s => s._id),
      },
      {
        stopName: 'KPHB Colony',
        stopOrder: 5,
        arrivalTime: '07:55 AM',
        students: mockStudents.filter(s => s.transport.pickupStop === 'KPHB Colony').map(s => s._id),
      },
    ],
  },
  boardedStudents: mockStudents.slice(0, 15).map(s => s._id),
  absentStudents: mockStudents.slice(15, 20).map(s => s._id),
  lateStudents: mockStudents.slice(20, 25).map(s => s._id),
};

// ==================== MAIN COMPONENT ====================

export default function StudentAttendancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const [attendance, setAttendance] = useState<Record<string, BoardingStatus>>({});
  const [filters, setFilters] = useState<AttendanceFilter>({
    search: '',
    status: 'all',
    stop: 'all',
    sortBy: 'stop',
    sortOrder: 'asc',
    viewMode: 'list',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<BoardingStatus>('boarded');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchDebounced = useDebounce(filters.search, 300);

  // ==================== REACT QUERY ====================

  const { 
    data: students, 
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<Student[]>({
    queryKey: ["driver-students"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getMyStudents();
      // return response.data?.data;

      await new Promise(resolve => setTimeout(resolve, 800));
      return mockStudents;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: trip } = useQuery<Trip | null>({
    queryKey: ["active-trip"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await driverService.getTodaySchedule();
      // const trips = response.data?.data?.trips || [];
      // return trips.find((t: Trip) => t.status === 'in_progress') || null;

      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTrip;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Initialize attendance from trip data
  useEffect(() => {
    if (students && trip) {
      const initialAttendance: Record<string, BoardingStatus> = {};
      students.forEach(student => {
        if (trip.boardedStudents.includes(student._id)) {
          initialAttendance[student._id] = 'boarded';
        } else if (trip.absentStudents.includes(student._id)) {
          initialAttendance[student._id] = 'absent';
        } else if (trip.lateStudents.includes(student._id)) {
          initialAttendance[student._id] = 'late';
        } else {
          initialAttendance[student._id] = null;
        }
      });
      setAttendance(initialAttendance);
    } else if (students) {
      const initialAttendance: Record<string, BoardingStatus> = {};
      students.forEach(student => {
        initialAttendance[student._id] = student.attendance?.status || null;
      });
      setAttendance(initialAttendance);
    }
  }, [students, trip]);

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo((): AttendanceStats => {
    const total = students?.length || 0;
    const boarded = Object.values(attendance).filter(s => s === 'boarded').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    const pending = total - (boarded + absent + late);

    // Calculate by stop
    const byStop: Record<string, any> = {};
    students?.forEach(student => {
      const stop = student.transport.pickupStop;
      if (!byStop[stop]) {
        byStop[stop] = {
          total: 0,
          boarded: 0,
          absent: 0,
          late: 0,
          pending: 0,
        };
      }
      byStop[stop].total++;
      const status = attendance[student._id];
      if (status === 'boarded') byStop[stop].boarded++;
      else if (status === 'absent') byStop[stop].absent++;
      else if (status === 'late') byStop[stop].late++;
      else byStop[stop].pending++;
    });

    return {
      total,
      boarded,
      absent,
      late,
      pending,
      byStop,
    };
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];

    let filtered = [...students];

    // Apply search
    if (searchDebounced) {
      const term = searchDebounced.toLowerCase();
      filtered = filtered.filter(s => 
        getFullName(s).toLowerCase().includes(term) ||
        s.academic.rollNumber?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(s => 
        (filters.status === 'pending' && attendance[s._id] === null) ||
        attendance[s._id] === filters.status
      );
    }

    // Apply stop filter
    if (filters.stop !== 'all') {
      filtered = filtered.filter(s => s.transport.pickupStop === filters.stop);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = getFullName(a).localeCompare(getFullName(b));
          break;
        case 'stop':
          comparison = (a.transport.stopOrder || 0) - (b.transport.stopOrder || 0);
          break;
        case 'status':
          const statusOrder = { boarded: 0, late: 1, absent: 2, null: 3 };
          comparison = (statusOrder[attendance[a._id] || 'null'] || 0) - 
                      (statusOrder[attendance[b._id] || 'null'] || 0);
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchDebounced, filters, attendance]);

  const paginatedStudents = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    return filteredStudents.slice(start, start + filters.limit);
  }, [filteredStudents, filters.page, filters.limit]);

  const totalPages = Math.ceil(filteredStudents.length / filters.limit);
  const uniqueStops = useMemo(() => {
    if (!students) return [];
    return [...new Set(students.map(s => s.transport.pickupStop))];
  }, [students]);

  const progress = stats.total > 0 ? ((stats.boarded + stats.late) / stats.total) * 100 : 0;

  // ==================== MUTATIONS ====================

  const saveMutation = useMutation({
    mutationFn: async () => {
      // await driverService.saveAttendance(attendance);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onMutate: () => {
      setSaving(true);
    },
    onSuccess: () => {
      toast.success("Attendance saved successfully", {
        description: `${stats.boarded} boarded, ${stats.late} late, ${stats.absent} absent`,
      });
      queryClient.invalidateQueries({ queryKey: ["active-trip"] });
    },
    onError: () => {
      toast.error("Failed to save attendance", {
        description: "Please try again",
      });
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const markStudentMutation = useMutation({
    mutationFn: async (_: { studentId: string; status: BoardingStatus }) => {
      // await driverService.markStudentBoarded(trip?._id, studentId, status);
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
    },
    onMutate: ({ studentId, status }) => {
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    },
    onError: (err, variables) => {
      toast.error(`Failed to mark student as ${variables.status}`);
      // Revert optimistic update
      setAttendance(prev => ({ ...prev, [variables.studentId]: null }));
    },
  });

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.info("Refreshing student list...");
  }, [refetch]);

  const handleMarkStudent = useCallback((studentId: string, status: BoardingStatus) => {
    if (!trip) {
      toast.warning("No active trip", {
        description: "Please start a trip first",
      });
      return;
    }
    markStudentMutation.mutate({ studentId, status });
  }, [trip, markStudentMutation]);

  const handleMarkBulk = useCallback(() => {
    if (!trip) {
      toast.warning("No active trip");
      return;
    }

    const newAttendance = { ...attendance };
    filteredStudents.forEach(student => {
      if (filters.status === 'all' || 
          (filters.status === 'pending' && attendance[student._id] === null)) {
        newAttendance[student._id] = bulkStatus;
      }
    });
    setAttendance(newAttendance);
    setShowBulkDialog(false);
    toast.success(`Marked ${filteredStudents.length} students as ${bulkStatus}`);
  }, [trip, filteredStudents, attendance, filters.status, bulkStatus]);

  const handleSave = useCallback(() => {
    if (!trip) {
      toast.warning("No active trip", {
        description: "Please start a trip first",
      });
      return;
    }
    setShowConfirmDialog(true);
  }, [trip]);

  const confirmSave = useCallback(() => {
    saveMutation.mutate();
    setShowConfirmDialog(false);
  }, [saveMutation]);

  const handleViewStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setShowStudentDialog(true);
  }, []);

  const handleCallParent = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const handleReset = useCallback(() => {
    if (students) {
      const initialAttendance: Record<string, BoardingStatus> = {};
      students.forEach(student => {
        initialAttendance[student._id] = null;
      });
      setAttendance(initialAttendance);
      toast.success("Attendance reset");
    }
  }, [students]);

  const handleFilterChange = useCallback((key: keyof AttendanceFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getSortIcon = useCallback((column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  }, [filters.sortBy, filters.sortOrder]);

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Student Attendance</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
          <UserCheck className="h-4 w-4" />
          Mark student boarding status for today's trip
          {trip && (
            <Badge className="bg-green-600 text-white animate-pulse">
              <Bus className="h-3 w-3 mr-1" />
              Active Trip
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
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
              <p>Refresh student list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {trip && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Boarded</p>
              <p className="text-2xl font-bold text-green-600">{stats.boarded}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
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
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgress = () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Attendance Progress</span>
            <span className="text-sm font-bold text-green-600">
              {stats.boarded + stats.late}/{stats.total} ({Math.round(progress)}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>✅ Boarded: {stats.boarded}</span>
            <span>⏰ Late: {stats.late}</span>
            <span>❌ Absent: {stats.absent}</span>
            <span>⏳ Pending: {stats.pending}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({stats.total})</SelectItem>
              <SelectItem value="boarded">Boarded ({stats.boarded})</SelectItem>
              <SelectItem value="late">Late ({stats.late})</SelectItem>
              <SelectItem value="absent">Absent ({stats.absent})</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.stop}
            onValueChange={(value) => handleFilterChange('stop', value)}
          >
            <SelectTrigger className="w-[160px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Stop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stops</SelectItem>
              {uniqueStops.map(stop => (
                <SelectItem key={stop} value={stop}>{stop}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Advanced
          </Button>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-[120px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stop">Stop Order</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>

          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('viewMode', 'list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('viewMode', 'grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={filters.limit.toString()}
            onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <Label className="text-xs">Stop</Label>
              <Select
                value={filters.stop}
                onValueChange={(value) => handleFilterChange('stop', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Stops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stops</SelectItem>
                  {uniqueStops.map(stop => (
                    <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S.No</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'name')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Student
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>Class</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'stop')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Pickup Stop
                    {getSortIcon('stop')}
                  </Button>
                </TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'status')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student, index) => {
                const status = attendance[student._id];
                const fullName = getFullName(student);

                return (
                  <TableRow key={student._id} className="hover:bg-muted/50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {getInitials(student.personal.firstName, student.personal.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            Roll: {student.academic.rollNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.academic.class}-{student.academic.section}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{student.transport.pickupStop}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.transport.pickupTime}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {student.parentInfo.fatherPhone && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleCallParent(student.parentInfo.fatherPhone!)}
                                >
                                  <Phone className="h-3 w-3 text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Call Father</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {student.parentInfo.motherPhone && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleCallParent(student.parentInfo.motherPhone!)}
                                >
                                  <Phone className="h-3 w-3 text-pink-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Call Mother</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                          variant="ghost"
                          className={cn("h-7 w-7 p-0", status === 'boarded' && "text-green-600")}
                          onClick={() => handleMarkStudent(student._id, 'boarded')}
                          disabled={!trip}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn("h-7 w-7 p-0", status === 'late' && "text-amber-600")}
                          onClick={() => handleMarkStudent(student._id, 'late')}
                          disabled={!trip}
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn("h-7 w-7 p-0", status === 'absent' && "text-red-600")}
                          onClick={() => handleMarkStudent(student._id, 'absent')}
                          disabled={!trip}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {paginatedStudents.map((student) => {
        const status = attendance[student._id];
        const fullName = getFullName(student);

        return (
          <Card key={student._id} className="group hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(student.personal.firstName, student.personal.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Class {student.academic.class}-{student.academic.section}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Stop {student.transport.stopOrder}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{student.transport.pickupStop}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{student.transport.pickupTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>{getStatusBadge(status)}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => handleViewStudent(student)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>

              {trip && (
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <Button
                    size="sm"
                    variant={status === 'boarded' ? 'default' : 'outline'}
                    className={cn(
                      "h-8 text-xs",
                      status === 'boarded' && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => handleMarkStudent(student._id, 'boarded')}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Board
                  </Button>
                  <Button
                    size="sm"
                    variant={status === 'late' ? 'default' : 'outline'}
                    className={cn(
                      "h-8 text-xs",
                      status === 'late' && "bg-amber-600 hover:bg-amber-700"
                    )}
                    onClick={() => handleMarkStudent(student._id, 'late')}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Late
                  </Button>
                  <Button
                    size="sm"
                    variant={status === 'absent' ? 'default' : 'outline'}
                    className={cn(
                      "h-8 text-xs",
                      status === 'absent' && "bg-red-600 hover:bg-red-700"
                    )}
                    onClick={() => handleMarkStudent(student._id, 'absent')}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Absent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, filters.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {(filters.page - 1) * filters.limit + 1} to{' '}
          {Math.min(filters.page * filters.limit, filteredStudents.length)} of{' '}
          {filteredStudents.length} students
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>
                1
              </Button>
              {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
            </>
          )}

          {pages.map(page => (
            <Button
              key={page}
              variant={page === filters.page ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderBulkDialog = () => (
    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Bulk Mark Students
          </DialogTitle>
          <DialogDescription>
            Mark {filteredStudents.length} displayed students as:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={bulkStatus === 'boarded' ? 'default' : 'outline'}
              className={bulkStatus === 'boarded' ? 'bg-green-600' : ''}
              onClick={() => setBulkStatus('boarded')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Boarded
            </Button>
            <Button
              variant={bulkStatus === 'late' ? 'default' : 'outline'}
              className={bulkStatus === 'late' ? 'bg-amber-600' : ''}
              onClick={() => setBulkStatus('late')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Late
            </Button>
            <Button
              variant={bulkStatus === 'absent' ? 'default' : 'outline'}
              className={bulkStatus === 'absent' ? 'bg-red-600' : ''}
              onClick={() => setBulkStatus('absent')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Absent
            </Button>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg">
            <p className="text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              This will affect {filteredStudents.length} students currently displayed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleMarkBulk} className="bg-blue-600 hover:bg-blue-700">
            Apply to {filteredStudents.length} Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                  {getInitials(selectedStudent.personal.firstName, selectedStudent.personal.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{getFullName(selectedStudent)}</h3>
                <p className="text-base text-muted-foreground">
                  Class {selectedStudent.academic.class}-{selectedStudent.academic.section}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Pickup Stop</p>
                <p className="font-medium">{selectedStudent.transport.pickupStop}</p>
                <p className="text-xs text-blue-600">{selectedStudent.transport.pickupTime}</p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Drop Stop</p>
                <p className="font-medium">{selectedStudent.transport.dropStop}</p>
                <p className="text-xs text-blue-600">{selectedStudent.transport.dropTime}</p>
              </div>

              {selectedStudent.parentInfo.fatherName && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{selectedStudent.parentInfo.fatherName}</p>
                  {selectedStudent.parentInfo.fatherPhone && (
                    <Button
                      size="sm"
                      variant="link"
                      className="h-auto p-0 mt-1"
                      onClick={() => handleCallParent(selectedStudent.parentInfo.fatherPhone!)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedStudent.parentInfo.fatherPhone}
                    </Button>
                  )}
                </div>
              )}

              {selectedStudent.parentInfo.motherName && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Mother's Name</p>
                  <p className="font-medium">{selectedStudent.parentInfo.motherName}</p>
                  {selectedStudent.parentInfo.motherPhone && (
                    <Button
                      size="sm"
                      variant="link"
                      className="h-auto p-0 mt-1"
                      onClick={() => handleCallParent(selectedStudent.parentInfo.motherPhone!)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedStudent.parentInfo.motherPhone}
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
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleCallParent(selectedStudent.parentInfo.fatherPhone || selectedStudent.parentInfo.motherPhone!)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Parent
              </Button>
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

  const renderConfirmDialog = () => (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Save Attendance
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save the attendance for {stats.total} students?
            {stats.pending > 0 && (
              <p className="text-amber-600 mt-2">
                ⚠️ {stats.pending} student(s) still pending. They will be marked as absent.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmSave} className="bg-green-600 hover:bg-green-700">
            Save Attendance
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
      {renderProgress()}
      {renderFilters()}

      {!trip && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">No Active Trip</p>
                <p className="text-sm text-amber-700">
                  Please start a trip from the "Start / End Trip" page before marking attendance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filters.viewMode === 'list' ? renderListView() : renderGridView()}
      {renderPagination()}

      {/* Dialogs */}
      {renderBulkDialog()}
      {renderStudentDialog()}
      {renderConfirmDialog()}
    </div>
  );
}