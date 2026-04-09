import { useState, useMemo, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Icons
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Bus,
  GraduationCap,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Grid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Printer,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

interface StudentPersonal {
  firstName: string;
  lastName: string;
  photo?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}

interface StudentAcademic {
  class: string;
  section: string;
  rollNumber?: string;
  admissionNumber?: string;
}

interface StudentTransport {
  pickupStop: string;
  stopOrder?: number;
  pickupTime?: string;
  dropStop?: string;
  dropTime?: string;
  routeName?: string;
  busNumber?: string;
}

interface StudentParent {
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  address?: string;
}

interface StudentAttendance {
  percentage: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lastAttended?: string;
}

interface Student {
  _id: string;
  personal?: StudentPersonal;
  academic?: StudentAcademic;
  transport?: StudentTransport;
  parentInfo?: StudentParent;
  attendance?: StudentAttendance;
  status: 'active' | 'inactive' | 'alumni' | 'transferred';
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface FilterOptions {
  classes: string[];
  sections: string[];
  pickupStops: string[];
  statuses: string[];
}

interface FilterState {
  search: string;
  class: string;
  section: string;
  pickupStop: string;
  status: string;
  sortBy: 'name' | 'class' | 'pickupStop' | 'status' | 'attendance';
  sortOrder: 'asc' | 'desc';
  viewMode: 'table' | 'grid';
  page: number;
  limit: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface StudentsResponse {
  success: boolean;
  students: Student[];
  filters: FilterOptions;
  pagination: PaginationState;
  message?: string;
}

// ==================== UTILITY FUNCTIONS ====================

const getInitials = (firstName: string = '', lastName: string = ''): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const getFullName = (student: Student): string => {
  return `${student.personal?.firstName || ''} ${student.personal?.lastName || ''}`.trim() || 'Unknown';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case 'inactive':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    case 'alumni':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Alumni</Badge>;
    case 'transferred':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Transferred</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getAttendanceColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 75) return 'text-blue-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Format: 98765 43210
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

const getStudentAge = (dob?: string): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// ==================== MOCK DATA (Replace with actual API) ====================

const generateMockStudents = (count: number): Student[] => {
  const students: Student[] = [];
  const firstNames = [
    "Aarav", "Sneha", "Rohan", "Priya", "Rahul", "Ananya", "Vikram", "Divya", "Arjun", "Kavita",
    "Ravi", "Neha", "Amit", "Pooja", "Sanjay", "Meera", "Rajesh", "Sunita", "Deepak", "Anjali",
    "Suresh", "Lata", "Mohan", "Geeta", "Krishna", "Radha", "Gopal", "Sita", "Ram", "Lakshmi"
  ];
  
  const lastNames = [
    "Kumar", "Reddy", "Singh", "Sharma", "Verma", "Gupta", "Nair", "Patel", "Rao", "Joshi"
  ];
  
  const classes = ["6", "7", "8", "9", "10", "11", "12"];
  const sections = ["A", "B", "C", "D"];
  const pickupStops = [
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
    const className = classes[Math.floor(Math.random() * classes.length)];
    const section = sections[Math.floor(Math.random() * sections.length)];
    const pickupStop = pickupStops[Math.floor(Math.random() * pickupStops.length)];
    const status = Math.random() > 0.1 ? 'active' : 'inactive';
    
    const totalDays = 120;
    const presentDays = Math.floor(Math.random() * 40) + 80;
    const attendancePercentage = (presentDays / totalDays) * 100;

    students.push({
      _id: `STU${String(i).padStart(4, "0")}`,
      personal: {
        firstName,
        lastName,
        bloodGroup: ["A+", "B+", "O+", "AB+"][Math.floor(Math.random() * 4)],
        dateOfBirth: `2010-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        gender: i % 2 === 0 ? 'male' : 'female',
      },
      academic: {
        class: className,
        section,
        rollNumber: `${className}${section}-${String(i).padStart(2, "0")}`,
        admissionNumber: `ADM${2024000 + i}`,
      },
      transport: {
        pickupStop,
        stopOrder: Math.floor(Math.random() * 5) + 1,
        pickupTime: `${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
        dropStop: "School Main Gate",
        dropTime: "03:30 PM",
        routeName: "Kukatpally Route",
        busNumber: "TS-07-1234",
      },
      parentInfo: {
        fatherName: `Rajesh ${lastName}`,
        fatherPhone: `987654${String(i).padStart(4, "0")}`,
        motherName: `Sunita ${lastName}`,
        motherPhone: `987654${String(i + 1000).padStart(4, "0")}`,
        emergencyContact: `Grandparent ${lastName}`,
        emergencyPhone: `987654${String(i + 2000).padStart(4, "0")}`,
        emergencyRelation: "Grandparent",
        address: `H.No: ${i}-123, Main Road, Hyderabad`,
      },
      attendance: {
        percentage: attendancePercentage,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        lastAttended: new Date().toISOString(),
      },
      status: status as any,
    });
  }
  
  return students;
};

const mockStudents = generateMockStudents(150);

const mockFilterOptions: FilterOptions = {
  classes: ["6", "7", "8", "9", "10", "11", "12"],
  sections: ["A", "B", "C", "D"],
  pickupStops: [
    "Kukatpally Stop 1",
    "Kukatpally Stop 2",
    "Kukatpally Stop 3",
    "JNTU Stop",
    "KPHB Colony",
    "Miyapur X Road"
  ],
  statuses: ["active", "inactive", "alumni", "transferred"],
};

// ==================== MAIN COMPONENT ====================

export default function DriverStudentList() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    class: "",
    section: "",
    pickupStop: "",
    status: "",
    sortBy: "name",
    sortOrder: "asc",
    viewMode: "table",
    page: 1,
    limit: 20,
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callNumber, setCallNumber] = useState("");
  const [callName, setCallName] = useState("");

  const searchDebounced = useDebounce(filters.search, 300);

  // ==================== REACT QUERY ====================

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<StudentsResponse>({
    queryKey: ["driver-students", filters],
    queryFn: async () => {
      // In production, replace with actual API call with filters
      // const response = await driverService.getMyStudents({
      //   search: searchDebounced,
      //   class: filters.class,
      //   section: filters.section,
      //   pickupStop: filters.pickupStop,
      //   status: filters.status,
      //   sortBy: filters.sortBy,
      //   sortOrder: filters.sortOrder,
      //   page: filters.page,
      //   limit: filters.limit,
      // });
      // return response.data;

      // Mock filtering
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockStudents];

      if (searchDebounced) {
        const term = searchDebounced.toLowerCase();
        filtered = filtered.filter(s =>
          getFullName(s).toLowerCase().includes(term) ||
          s.academic?.admissionNumber?.toLowerCase().includes(term) ||
          s.academic?.rollNumber?.toLowerCase().includes(term)
        );
      }

      if (filters.class) {
        filtered = filtered.filter(s => s.academic?.class === filters.class);
      }

      if (filters.section) {
        filtered = filtered.filter(s => s.academic?.section === filters.section);
      }

      if (filters.pickupStop) {
        filtered = filtered.filter(s => s.transport?.pickupStop === filters.pickupStop);
      }

      if (filters.status) {
        filtered = filtered.filter(s => s.status === filters.status);
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = getFullName(a).localeCompare(getFullName(b));
            break;
          case 'class':
            comparison = `${a.academic?.class || ''}${a.academic?.section || ''}`.localeCompare(
              `${b.academic?.class || ''}${b.academic?.section || ''}`
            );
            break;
          case 'pickupStop':
            comparison = (a.transport?.pickupStop || '').localeCompare(b.transport?.pickupStop || '');
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
          case 'attendance':
            comparison = (a.attendance?.percentage || 0) - (b.attendance?.percentage || 0);
            break;
        }
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / filters.limit);
      const start = (filters.page - 1) * filters.limit;
      const paginatedStudents = filtered.slice(start, start + filters.limit);

      return {
        students: paginatedStudents,
        filters: mockFilterOptions,
        pagination: {
          currentPage: filters.page,
          totalPages,
          totalItems,
          itemsPerPage: filters.limit,
          hasNextPage: filters.page < totalPages,
          hasPrevPage: filters.page > 1,
        },
      } as StudentsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    retry: 2,
  });

  // ==================== COMPUTED VALUES ====================

  const students = data?.students || [];
  const filterOptions = data?.filters || mockFilterOptions;
  const pagination = data?.pagination;

  const sortedStudents = useMemo(() => {
    return [...students];
  }, [students]);

  const paginatedStudents = useMemo(() => {
    return sortedStudents;
  }, [sortedStudents]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.class) count++;
    if (filters.section) count++;
    if (filters.pickupStop) count++;
    if (filters.status) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Refreshing student list...");
  }, [refetch]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      class: "",
      section: "",
      pickupStop: "",
      status: "",
      sortBy: "name",
      sortOrder: "asc",
      viewMode: filters.viewMode,
      page: 1,
      limit: 20,
    });
    toast.success("Filters cleared");
  }, [filters.viewMode]);

  const handleSort = useCallback((column: FilterState['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handleViewDetails = useCallback((student: Student) => {
    setSelectedStudent(student);
    setShowDetailsDialog(true);
  }, []);

  const handleCall = useCallback((phone: string, name: string) => {
    setCallNumber(phone);
    setCallName(name);
    setShowCallDialog(true);
  }, []);

  const confirmCall = useCallback(() => {
    window.location.href = `tel:${callNumber}`;
    setShowCallDialog(false);
  }, [callNumber]);

  const handleExport = useCallback(() => {
    toast.success("Export started", {
      description: "Student list will be downloaded as CSV",
    });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getSortIcon = useCallback((column: FilterState['sortBy']) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  }, [filters.sortBy, filters.sortOrder]);

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
          <Users className="h-4 w-4" />
          Students assigned to your route
          {pagination && (
            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
              {pagination.totalItems} total
            </span>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll no, admission no..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9 pr-9"
                />
                {filters.search && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => handleFilterChange('search', '')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Select
              value={filters.class}
              onValueChange={(value) => handleFilterChange('class', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map((cls: string) => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.section}
              onValueChange={(value) => handleFilterChange('section', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {filterOptions.sections.map((section: string) => (
                  <SelectItem key={section} value={section}>Section {section}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.pickupStop}
              onValueChange={(value) => handleFilterChange('pickupStop', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Stops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stops</SelectItem>
                {filterOptions.pickupStops.map((stop: string) => (
                  <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange('viewMode', 'grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={filters.viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange('viewMode', 'table')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {filterOptions.statuses.map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {paginatedStudents.length} of {pagination?.totalItems || 0} students
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Student
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('class')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Class/Section
                    {getSortIcon('class')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('pickupStop')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Pickup Stop
                    {getSortIcon('pickupStop')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('attendance')}
                    className="h-8 px-2 hover:bg-transparent font-semibold"
                  >
                    Attendance
                    {getSortIcon('attendance')}
                  </Button>
                </TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
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
              {paginatedStudents.map((student) => (
                <TableRow key={student._id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-primary/10">
                        <AvatarImage src={student.personal?.photo} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(student.personal?.firstName, student.personal?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getFullName(student)}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.academic?.rollNumber || student.academic?.admissionNumber}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>Class {student.academic?.class || '-'} {student.academic?.section || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p>{student.transport?.pickupStop || '-'}</p>
                        {student.transport?.pickupTime && (
                          <p className="text-xs text-muted-foreground">{student.transport.pickupTime}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.attendance && (
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={student.attendance.percentage} className="h-2" />
                        </div>
                        <span className={cn("text-sm font-medium", getAttendanceColor(student.attendance.percentage))}>
                          {student.attendance.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {student.parentInfo?.fatherPhone && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleCall(student.parentInfo?.fatherPhone!, student.personal?.firstName || 'Student')}
                              >
                                <Phone className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Call Father</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {student.parentInfo?.motherPhone && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleCall(student.parentInfo?.motherPhone!, student.personal?.firstName || 'Student')}
                              >
                                <Phone className="h-4 w-4 text-pink-600" />
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
                    {getStatusBadge(student.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {student.parentInfo?.fatherPhone && (
                          <DropdownMenuItem onClick={() => handleCall(student.parentInfo?.fatherPhone!, student.personal?.firstName || 'Student')}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Father
                          </DropdownMenuItem>
                        )}
                        {student.parentInfo?.motherPhone && (
                          <DropdownMenuItem onClick={() => handleCall(student.parentInfo?.motherPhone!, student.personal?.firstName || 'Student')}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Mother
                          </DropdownMenuItem>
                        )}
                        {student.transport?.pickupStop && (
                          <DropdownMenuItem>
                            <MapPin className="h-4 w-4 mr-2" />
                            Directions
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {paginatedStudents.map((student) => (
        <Card key={student._id} className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-20 w-20 border-4 border-primary/10 group-hover:border-primary/30 transition-all">
                  <AvatarImage src={student.personal?.photo} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(student.personal?.firstName, student.personal?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  {student.status === 'active' ? (
                    <div className="h-5 w-5 rounded-full bg-green-500 border-2 border-white" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-yellow-500 border-2 border-white" />
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-lg">{getFullName(student)}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Class {student.academic?.class}-{student.academic?.section}
              </p>

              <div className="w-full mt-3 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm bg-muted/30 py-2 px-3 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{student.transport?.pickupStop || 'No stop assigned'}</span>
                </div>

                {student.attendance && (
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className={cn("font-medium", getAttendanceColor(student.attendance.percentage))}>
                      {student.attendance.percentage.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="flex justify-center gap-1">
                  {getStatusBadge(student.status)}
                </div>
              </div>

              <div className="flex gap-2 mt-4 w-full">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleViewDetails(student)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Details
                </Button>
                {student.parentInfo?.fatherPhone && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleCall(student.parentInfo?.fatherPhone!, student.personal?.firstName || 'Student')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
          {pagination.totalItems} students
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
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
              variant={page === pagination.currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
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
                onClick={() => handlePageChange(pagination.totalPages)}
              >
                {pagination.totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStudentDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-blue-600" />
            Student Details
          </DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <div className="space-y-6 py-4">
            {/* Header with Avatar */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/10">
                <AvatarImage src={selectedStudent.personal?.photo} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(selectedStudent.personal?.firstName, selectedStudent.personal?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{getFullName(selectedStudent)}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedStudent.academic?.admissionNumber || 'No ID'}
                  </Badge>
                  {getStatusBadge(selectedStudent.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {selectedStudent.personal?.bloodGroup && (
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Group</p>
                      <p className="font-medium">{selectedStudent.personal.bloodGroup}</p>
                    </div>
                  )}
                  {selectedStudent.personal?.dateOfBirth && (
                    <div>
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-medium">{getStudentAge(selectedStudent.personal.dateOfBirth)} years</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Academic Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="text-lg font-medium">{selectedStudent.academic?.class || '-'}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Section</p>
                  <p className="text-lg font-medium">{selectedStudent.academic?.section || '-'}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="text-lg font-medium">{selectedStudent.academic?.rollNumber || '-'}</p>
                </div>
              </div>
            </div>

            {/* Transport Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bus className="h-4 w-4 text-green-600" />
                Transport Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pickup Stop</p>
                  <p className="font-medium">{selectedStudent.transport?.pickupStop || '-'}</p>
                  {selectedStudent.transport?.pickupTime && (
                    <p className="text-xs text-blue-600 mt-1">{selectedStudent.transport.pickupTime}</p>
                  )}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Drop Stop</p>
                  <p className="font-medium">{selectedStudent.transport?.dropStop || '-'}</p>
                  {selectedStudent.transport?.dropTime && (
                    <p className="text-xs text-blue-600 mt-1">{selectedStudent.transport.dropTime}</p>
                  )}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Route</p>
                  <p className="font-medium">{selectedStudent.transport?.routeName || '-'}</p>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Parent / Guardian Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedStudent.parentInfo?.fatherName && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Father's Name</p>
                    <p className="font-medium">{selectedStudent.parentInfo.fatherName}</p>
                    {selectedStudent.parentInfo.fatherPhone && (
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 mt-1 text-xs"
                        onClick={() => handleCall(selectedStudent.parentInfo!.fatherPhone!, selectedStudent.personal?.firstName || 'Student')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {formatPhoneNumber(selectedStudent.parentInfo.fatherPhone)}
                      </Button>
                    )}
                  </div>
                )}
                
                {selectedStudent.parentInfo?.motherName && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Mother's Name</p>
                    <p className="font-medium">{selectedStudent.parentInfo.motherName}</p>
                    {selectedStudent.parentInfo.motherPhone && (
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 mt-1 text-xs"
                        onClick={() => handleCall(selectedStudent.parentInfo!.motherPhone!, selectedStudent.personal?.firstName || 'Student')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {formatPhoneNumber(selectedStudent.parentInfo.motherPhone)}
                      </Button>
                    )}
                  </div>
                )}

                {selectedStudent.parentInfo?.emergencyContact && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 col-span-2">
                    <p className="text-xs text-amber-800">Emergency Contact</p>
                    <p className="font-medium text-amber-900">{selectedStudent.parentInfo.emergencyContact}</p>
                    {selectedStudent.parentInfo.emergencyPhone && (
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 mt-1 text-xs text-amber-700"
                        onClick={() => handleCall(selectedStudent.parentInfo!.emergencyPhone!, selectedStudent.personal?.firstName || 'Student')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {formatPhoneNumber(selectedStudent.parentInfo.emergencyPhone)} ({selectedStudent.parentInfo.emergencyRelation || 'Emergency'})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            {selectedStudent.attendance && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Attendance Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Percentage</p>
                      <p className={cn("text-xl font-bold", getAttendanceColor(selectedStudent.attendance.percentage))}>
                        {selectedStudent.attendance.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">Present</p>
                      <p className="text-xl font-bold text-green-700">{selectedStudent.attendance.presentDays}</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">Absent</p>
                      <p className="text-xl font-bold text-red-700">{selectedStudent.attendance.absentDays}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">Total Days</p>
                      <p className="text-xl font-bold text-blue-700">{selectedStudent.attendance.totalDays}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {selectedStudent?.parentInfo?.fatherPhone && (
            <Button onClick={() => handleCall(selectedStudent.parentInfo?.fatherPhone!, selectedStudent.personal?.firstName || 'Student')}>
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
            Are you sure you want to call {callName}'s parent at {formatPhoneNumber(callNumber)}?
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

  // ==================== LOADING STATE ====================

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
            <h2 className="text-xl font-bold mb-2">Failed to Load Students</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An error occurred while loading the student list."}
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

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {renderHeader()}
      {renderFilters()}

      {paginatedStudents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold text-lg">No students found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilterCount > 0 
                  ? "Try adjusting your filters to see more results" 
                  : "No students are assigned to your route yet"}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="link" onClick={handleResetFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {filters.viewMode === 'table' ? renderTableView() : renderGridView()}
          {renderPagination()}
        </>
      )}

      {/* Dialogs */}
      {renderStudentDetailsDialog()}
      {renderCallDialog()}
    </div>
  );
}