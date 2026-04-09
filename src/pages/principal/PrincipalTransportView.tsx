import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import principalService from "@/Services/principalService";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Bus,
  MapPin,
  Navigation,
  Users,
  User,
  Phone,
  Mail,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Fuel,
  Wrench,
  Gauge,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Car,
  CarFront,
  CarTaxiFront,
  BusFront,
  BusIcon,
  Map,
  Route,
  MapPinHouse,
  Home,
  School,
  GraduationCap,
  Users2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundCog,
  UserRoundPlus,
  UserRoundMinus,
  PhoneCall,
  MailOpen,
  MessageSquare,
  Bell,
  BellRing,
  BellOff,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Sparkles,
  Rocket,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type Driver = {
  _id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: "LMV" | "HMV" | "LTV" | "HTV";
  experience: number; // years
  joiningDate: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  photo?: string;
  status: "active" | "on_leave" | "inactive" | "suspended";
  assignedVehicle?: string;
  assignedRoute?: string;
};

type Vehicle = {
  _id: string;
  vehicleNumber: string;
  registrationNumber: string;
  model: string;
  type: "bus" | "van" | "mini_bus" | "car";
  capacity: number;
  fuelType: "diesel" | "petrol" | "cng" | "electric";
  insuranceNumber: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  pollutionExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  odometer: number;
  driver: {
    _id: string;
    name: string;
    phone: string;
  };
  status: "active" | "maintenance" | "idle" | "out_of_service";
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
    lastUpdated: string;
  };
  fuelLevel?: number;
  currentTrip?: string;
};

type RoutePoint = {
  pointName: string;
  time: string;
  address: string;
  latitude?: number;
  longitude?: number;
  studentCount: number;
};

type Route = {
  _id: string;
  routeId: string;
  routeName: string;
  description?: string;
  morningTrip: {
    startTime: string;
    endTime: string;
    pickupPoints: RoutePoint[];
  };
  eveningTrip: {
    startTime: string;
    endTime: string;
    dropPoints: RoutePoint[];
  };
  distance: number; // km
  estimatedDuration: number; // minutes
  driver: {
    _id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    _id: string;
    vehicleNumber: string;
    capacity: number;
  };
  students: Array<{
    studentId: string;
    name: string;
    class: string;
    section: string;
    pickupPoint: string;
    dropPoint: string;
    parentPhone: string;
  }>;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
};

type Trip = {
  _id: string;
  tripId: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  tripType: "morning" | "evening";
  date: string;
  startTime?: string;
  endTime?: string;
  startOdometer?: number;
  endOdometer?: number;
  distance?: number;
  studentsPickedUp: number;
  totalStudents: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  incidents?: Array<{
    type: string;
    description: string;
    time: string;
  }>;
  notes?: string;
};

type TransportStats = {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  idleVehicles: number;
  outOfServiceVehicles: number;
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  suspendedRoutes: number;
  totalDrivers: number;
  activeDrivers: number;
  onLeaveDrivers: number;
  inactiveDrivers: number;
  suspendedDrivers: number;
  studentsUsingTransport: number;
  totalTripsToday: number;
  completedTripsToday: number;
  ongoingTripsToday: number;
  scheduledTripsToday: number;
  cancelledTripsToday: number;
  onTimePerformance: number; // percentage
  averageDistancePerTrip: number;
  fuelEfficiency?: number;
  expiringInsurance: number; // vehicles with insurance expiring in 30 days
  expiringFitness: number; // vehicles with fitness expiring in 30 days
  maintenanceDue: number; // vehicles due for maintenance in 7 days
};

type TransportOverviewData = {
  stats: TransportStats;
  vehicles: Vehicle[];
  routes: Route[];
  drivers: Driver[];
  todayTrips: Trip[];
  alerts: Array<{
    id: string;
    type: "warning" | "error" | "info";
    title: string;
    message: string;
    actionable: boolean;
  }>;
  lastUpdated: string;
};

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), "dd MMM yyyy");
};

const formatTime = (timeString?: string): string => {
  if (!timeString) return "-";
  return timeString;
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const getVehicleStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "maintenance":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Maintenance</Badge>;
    case "idle":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Idle</Badge>;
    case "out_of_service":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Out of Service</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getRouteStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "inactive":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    case "suspended":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getDriverStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "on_leave":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">On Leave</Badge>;
    case "inactive":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    case "suspended":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getTripStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>;
    case "ongoing":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Ongoing</Badge>;
    case "completed":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getVehicleIcon = (type: string) => {
  switch (type) {
    case "bus":
      return <BusFront className="h-4 w-4 text-blue-600" />;
    case "mini_bus":
      return <BusIcon className="h-4 w-4 text-green-600" />;
    case "van":
      return <CarFront className="h-4 w-4 text-orange-600" />;
    case "car":
      return <Car className="h-4 w-4 text-purple-600" />;
    default:
      return <Truck className="h-4 w-4 text-gray-600" />;
  }
};

const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  return differenceInDays(expiry, today);
};

const getExpiryBadge = (expiryDate: string) => {
  const days = getDaysUntilExpiry(expiryDate);
  
  if (days < 0) {
    return <Badge className="bg-red-600 text-white">Expired</Badge>;
  } else if (days <= 30) {
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{days} days left</Badge>;
  } else if (days <= 90) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} days left</Badge>;
  } else {
    return <Badge className="bg-green-100 text-green-800 border-green-200">{days} days left</Badge>;
  }
};

// ==================== MOCK DATA ====================

const generateMockDrivers = (count: number): Driver[] => {
  const drivers: Driver[] = [];
  const firstNames = [
    "Rajesh", "Sunita", "Mohan", "Geeta", "Suresh", "Kavita", "Ramesh", "Anita",
    "Dinesh", "Lakshmi", "Mahesh", "Shanti", "Prakash", "Usha", "Gopal", "Radha"
  ];
  const lastNames = [
    "Sharma", "Verma", "Singh", "Reddy", "Patel", "Kumar", "Joshi", "Nair"
  ];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const status = i % 5 === 0 ? "on_leave" : (i % 8 === 0 ? "inactive" : "active");

    drivers.push({
      _id: `DRV${String(i).padStart(3, "0")}`,
      driverId: `DRI${String(i).padStart(3, "0")}`,
      firstName,
      lastName,
      phone: `987654${String(i).padStart(4, "0")}`,
      alternatePhone: `987654${String(i + 100).padStart(4, "0")}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      address: `${i} Driver Colony, Hyderabad`,
      licenseNumber: `AP-${String(i).padStart(6, "0")}`,
      licenseExpiry: new Date(2026, 11, 31).toISOString(),
      licenseType: i % 3 === 0 ? "HMV" : "LMV",
      experience: 5 + (i % 15),
      joiningDate: new Date(2020, i % 12, 1).toISOString(),
      emergencyContact: `987654${String(i + 200).padStart(4, "0")}`,
      emergencyPhone: `987654${String(i + 300).padStart(4, "0")}`,
      bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
      status: status as any,
      assignedVehicle: i <= 10 ? `VH${String(i).padStart(3, "0")}` : undefined,
      assignedRoute: i <= 10 ? `RT${String(i).padStart(3, "0")}` : undefined,
    });
  }
  
  return drivers;
};

const generateMockVehicles = (count: number, drivers: Driver[]): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  const types = ["bus", "bus", "bus", "mini_bus", "mini_bus", "van", "van", "car"] as const;

  for (let i = 1; i <= count; i++) {
    const type = types[(i - 1) % types.length];
    const capacity = type === "bus" ? 50 : (type === "mini_bus" ? 30 : (type === "van" ? 15 : 5));
    const driverIndex = (i - 1) % drivers.length;
    const status = i % 6 === 0 ? "maintenance" : (i % 10 === 0 ? "idle" : "active");
    const insuranceExpiry = new Date();
    insuranceExpiry.setMonth(insuranceExpiry.getMonth() + (i % 12 === 0 ? -1 : (i % 6 + 6)));

    vehicles.push({
      _id: `VH${String(i).padStart(3, "0")}`,
      vehicleNumber: `TS-07-${String(i).padStart(4, "0")}`,
      registrationNumber: `TS-07-${String(i).padStart(4, "0")}`,
      model: ["Tata Starbus", "Ashok Leyland", "Eicher", "Mahindra", "Force"][i % 5],
      type: type,
      capacity,
      fuelType: i % 4 === 0 ? "cng" : "diesel",
      insuranceNumber: `INS/${String(i).padStart(6, "0")}`,
      insuranceExpiry: insuranceExpiry.toISOString(),
      fitnessExpiry: new Date(2026, 11, 31).toISOString(),
      pollutionExpiry: new Date(2026, 11, 31).toISOString(),
      lastMaintenance: new Date(2026, 1, 15).toISOString(),
      nextMaintenance: new Date(2026, 4, 15).toISOString(),
      odometer: 50000 + (i * 1000),
      driver: {
        _id: drivers[driverIndex]._id,
        name: `${drivers[driverIndex].firstName} ${drivers[driverIndex].lastName}`,
        phone: drivers[driverIndex].phone,
      },
      status: status as any,
      fuelLevel: 60 + (i % 30),
    });
  }
  
  return vehicles;
};

const generateMockRoutes = (count: number, vehicles: Vehicle[], drivers: Driver[]): Route[] => {
  const routes: Route[] = [];
  const areas = [
    "Kukatpally", "Madhapur", "Gachibowli", "Hitech City", "Jubilee Hills",
    "Banjara Hills", "Begumpet", "Secunderabad", "Ameerpet", "Punjagutta"
  ];

  for (let i = 1; i <= count; i++) {
    const area = areas[(i - 1) % areas.length];
    const vehicle = vehicles[(i - 1) % vehicles.length];
    const driver = drivers[(i - 1) % drivers.length];
    const status = i % 4 === 0 ? "inactive" : (i % 7 === 0 ? "suspended" : "active");

    const pickupPoints: RoutePoint[] = [];
    const dropPoints: RoutePoint[] = [];
    
    // Generate pickup points
    for (let j = 1; j <= 4; j++) {
      pickupPoints.push({
        pointName: `${area} Stop ${j}`,
        time: `${6 + (j-1) * 0.25}:${(j * 15) % 60}`.replace(/\./g, ':'),
        address: `${j} Main Road, ${area}`,
        studentCount: 5 + (j * 2),
      });
    }
    
    // Generate drop points (reverse order)
    for (let j = 1; j <= 4; j++) {
      dropPoints.push({
        pointName: `${area} Stop ${5 - j}`,
        time: `${14 + (j-1) * 0.25}:${(j * 15) % 60}`.replace(/\./g, ':'),
        address: `${5 - j} Main Road, ${area}`,
        studentCount: 5 + ((5 - j) * 2),
      });
    }

    const totalStudents = pickupPoints.reduce((sum, p) => sum + p.studentCount, 0);

    routes.push({
      _id: `RT${String(i).padStart(3, "0")}`,
      routeId: `RTE${String(i).padStart(3, "0")}`,
      routeName: `${area} Route`,
      description: `Route covering ${area} area`,
      morningTrip: {
        startTime: "06:30 AM",
        endTime: "07:45 AM",
        pickupPoints,
      },
      eveningTrip: {
        startTime: "02:30 PM",
        endTime: "03:45 PM",
        dropPoints,
      },
      distance: 15 + (i * 2),
      estimatedDuration: 45 + (i * 5),
      driver: {
        _id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phone,
      },
      vehicle: {
        _id: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        capacity: vehicle.capacity,
      },
      students: Array.from({ length: totalStudents }, (_, idx) => ({
        studentId: `STU${String(idx + 1).padStart(3, "0")}`,
        name: `Student ${idx + 1}`,
        class: `${Math.floor(Math.random() * 7) + 6}`,
        section: String.fromCharCode(65 + (idx % 4)),
        pickupPoint: pickupPoints[Math.floor(idx / 10) % pickupPoints.length].pointName,
        dropPoint: dropPoints[Math.floor(idx / 10) % dropPoints.length].pointName,
        parentPhone: `987654${String(idx + 1000).padStart(4, "0")}`,
      })),
      status: status as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return routes;
};

const generateMockTrips = (routes: Route[], date: string): Trip[] => {
  const trips: Trip[] = [];
  
  routes.forEach((route, index) => {
    // Morning trip
    const morningStatus = index % 5 === 0 ? "cancelled" : (index % 3 === 0 ? "ongoing" : "completed");
    trips.push({
      _id: `TRP${String(index + 1).padStart(3, "0")}M`,
      tripId: `TRP${String(index + 1).padStart(3, "0")}M`,
      routeId: route._id,
      routeName: route.routeName,
      driverId: route.driver._id,
      driverName: route.driver.name,
      vehicleId: route.vehicle._id,
      vehicleNumber: route.vehicle.vehicleNumber,
      tripType: "morning",
      date,
      startTime: morningStatus !== "cancelled" ? "06:30 AM" : undefined,
      endTime: morningStatus === "completed" ? "07:45 AM" : undefined,
      startOdometer: morningStatus !== "cancelled" ? 50000 + (index * 10) : undefined,
      endOdometer: morningStatus === "completed" ? 50015 + (index * 10) : undefined,
      distance: morningStatus === "completed" ? 15 : undefined,
      studentsPickedUp: morningStatus === "completed" ? Math.floor(route.students.length * 0.95) : 0,
      totalStudents: route.students.length,
      status: morningStatus as any,
    });

    // Evening trip
    const eveningStatus = index % 5 === 0 ? "cancelled" : (index % 4 === 0 ? "scheduled" : "ongoing");
    trips.push({
      _id: `TRP${String(index + 1).padStart(3, "0")}E`,
      tripId: `TRP${String(index + 1).padStart(3, "0")}E`,
      routeId: route._id,
      routeName: route.routeName,
      driverId: route.driver._id,
      driverName: route.driver.name,
      vehicleId: route.vehicle._id,
      vehicleNumber: route.vehicle.vehicleNumber,
      tripType: "evening",
      date,
      startTime: eveningStatus === "ongoing" ? "02:30 PM" : undefined,
      endTime: eveningStatus === "ongoing" ? "03:45 PM" : undefined,
      status: eveningStatus,
      studentsPickedUp: eveningStatus === "ongoing" ? Math.floor(route.students.length * 0.9) : 0,
      totalStudents: route.students.length,
    });
  });
  
  return trips;
};

// Generate mock data
const mockDrivers = generateMockDrivers(15);
const mockVehicles = generateMockVehicles(12, mockDrivers);
const mockRoutes = generateMockRoutes(10, mockVehicles, mockDrivers);
const mockTrips = generateMockTrips(mockRoutes, new Date().toISOString().split('T')[0]);

const calculateTransportStats = (
  vehicles: Vehicle[],
  routes: Route[],
  drivers: Driver[],
  trips: Trip[]
): TransportStats => {
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === "active").length;
  const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length;
  const idleVehicles = vehicles.filter(v => v.status === "idle").length;
  const outOfServiceVehicles = vehicles.filter(v => v.status === "out_of_service").length;

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status === "active").length;
  const inactiveRoutes = routes.filter(r => r.status === "inactive").length;
  const suspendedRoutes = routes.filter(r => r.status === "suspended").length;

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === "active").length;
  const onLeaveDrivers = drivers.filter(d => d.status === "on_leave").length;
  const inactiveDrivers = drivers.filter(d => d.status === "inactive").length;
  const suspendedDrivers = drivers.filter(d => d.status === "suspended").length;

  const studentsUsingTransport = routes.reduce((sum, r) => sum + r.students.length, 0);

  const todayTrips = trips;
  const totalTripsToday = todayTrips.length;
  const completedTripsToday = todayTrips.filter(t => t.status === "completed").length;
  const ongoingTripsToday = todayTrips.filter(t => t.status === "ongoing").length;
  const scheduledTripsToday = todayTrips.filter(t => t.status === "scheduled").length;
  const cancelledTripsToday = todayTrips.filter(t => t.status === "cancelled").length;

  const onTimePerformance = completedTripsToday > 0 ? 92 : 100; // mock

  const averageDistancePerTrip = completedTripsToday > 0
    ? trips.filter(t => t.distance).reduce((sum, t) => sum + (t.distance || 0), 0) / completedTripsToday
    : 0;

  const expiringInsurance = vehicles.filter(v => {
    const days = getDaysUntilExpiry(v.insuranceExpiry);
    return days >= 0 && days <= 30;
  }).length;

  const expiringFitness = vehicles.filter(v => {
    const days = getDaysUntilExpiry(v.fitnessExpiry);
    return days >= 0 && days <= 30;
  }).length;

  const maintenanceDue = vehicles.filter(v => {
    const days = getDaysUntilExpiry(v.nextMaintenance);
    return days >= 0 && days <= 7;
  }).length;

  return {
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    idleVehicles,
    outOfServiceVehicles,
    totalRoutes,
    activeRoutes,
    inactiveRoutes,
    suspendedRoutes,
    totalDrivers,
    activeDrivers,
    onLeaveDrivers,
    inactiveDrivers,
    suspendedDrivers,
    studentsUsingTransport,
    totalTripsToday,
    completedTripsToday,
    ongoingTripsToday,
    scheduledTripsToday,
    cancelledTripsToday,
    onTimePerformance,
    averageDistancePerTrip,
    expiringInsurance,
    expiringFitness,
    maintenanceDue,
  };
};

const mockStats = calculateTransportStats(mockVehicles, mockRoutes, mockDrivers, mockTrips);

const mockAlerts = [
  {
    id: "ALT001",
    type: "warning" as const,
    title: "Insurance Expiring Soon",
    message: `${mockStats.expiringInsurance} vehicles have insurance expiring in the next 30 days`,
    actionable: true,
  },
  {
    id: "ALT002",
    type: "warning" as const,
    title: "Fitness Certificate Expiring",
    message: `${mockStats.expiringFitness} vehicles need fitness certificate renewal`,
    actionable: true,
  },
  {
    id: "ALT003",
    type: "info" as const,
    title: "Maintenance Due",
    message: `${mockStats.maintenanceDue} vehicles are due for maintenance this week`,
    actionable: true,
  },
  {
    id: "ALT004",
    type: "info" as const,
    title: "On-Time Performance",
    message: `Today's on-time performance is ${mockStats.onTimePerformance}%`,
    actionable: false,
  },
];

const mockTransportData: TransportOverviewData = {
  stats: mockStats,
  vehicles: mockVehicles,
  routes: mockRoutes,
  drivers: mockDrivers,
  todayTrips: mockTrips,
  alerts: mockAlerts,
  lastUpdated: new Date().toISOString(),
};

// ==================== MAIN COMPONENT ====================

export default function PrincipalTransportView() {
  const navigate = useNavigate();
  const [data, setData] = useState<TransportOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [showTripDialog, setShowTripDialog] = useState(false);
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");

  // ==================== DATA LOADING ====================

  const loadTransportData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Call actual API
      const response = await principalService.getTransportOverview();
      const apiData = response.data?.data;

      if (apiData) {
        // Ensure all required arrays are present
        const sanitizedData: TransportOverviewData = {
          ...apiData,
          vehicles: apiData.vehicles || [],
          routes: apiData.routes || [],
          drivers: apiData.drivers || [],
          todayTrips: apiData.todayTrips || [],
          alerts: apiData.alerts || [],
          stats: apiData.stats || mockStats,
          lastUpdated: apiData.lastUpdated || new Date().toISOString()
        };
        setData(sanitizedData);
      } else {
        setData(mockTransportData);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading transport data:", error);
      toast.error("Failed to load transport data");
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTransportData();
  }, [loadTransportData]);

  // ==================== COMPUTED VALUES ====================

  const filteredVehicles = useMemo(() => {
    if (!data || !Array.isArray(data.vehicles)) return [];
    let filtered = [...data.vehicles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.vehicleNumber.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term) ||
        v.driver.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const filteredRoutes = useMemo(() => {
    if (!data || !Array.isArray(data.routes)) return [];
    let filtered = [...data.routes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.routeName.toLowerCase().includes(term) ||
        r.driver.name.toLowerCase().includes(term) ||
        r.vehicle.vehicleNumber.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const filteredDrivers = useMemo(() => {
    if (!data || !Array.isArray(data.drivers)) return [];
    let filtered = [...data.drivers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(term) ||
        d.phone.includes(term) ||
        d.licenseNumber.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const filteredTrips = useMemo(() => {
    if (!data || !Array.isArray(data.todayTrips)) return [];
    let filtered = [...data.todayTrips];

    if (routeFilter !== "all") {
      filtered = filtered.filter(t => t.routeId === routeFilter);
    }

    if (driverFilter !== "all") {
      filtered = filtered.filter(t => t.driverId === driverFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    return filtered;
  }, [data, routeFilter, driverFilter, statusFilter]);

  const routeOptions = useMemo(() => {
    if (!data || !Array.isArray(data.routes)) return [];
    return data.routes.map(r => ({ id: r._id, name: r.routeName }));
  }, [data]);

  const driverOptions = useMemo(() => {
    if (!data || !Array.isArray(data.drivers)) return [];
    return data.drivers.map(d => ({
      id: d._id,
      name: `${d.firstName} ${d.lastName}`,
    }));
  }, [data]);

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadTransportData(true);
    toast.success("Transport data refreshed");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRouteFilter("all");
    setDriverFilter("all");
    toast.success("Filters reset");
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDialog(true);
  };

  const handleViewRoute = (route: Route) => {
    setSelectedRoute(route);
    setShowRouteDialog(true);
  };

  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDriverDialog(true);
  };

  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowTripDialog(true);
  };

  const handleAlertAction = (alert: any) => {
    if (alert.title.includes("Insurance")) {
      setActiveTab("vehicles");
    } else if (alert.title.includes("Fitness")) {
      setActiveTab("vehicles");
    } else if (alert.title.includes("Maintenance")) {
      setActiveTab("vehicles");
    }
    setShowAlertsDialog(false);
  };

  // ==================== LOADING STATE ====================

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transport data...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Transport Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor vehicles, routes, drivers, and trips
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAlertsDialog(true)}>
          <Bell className="h-4 w-4 mr-2" />
          Alerts
          {data?.alerts && data.alerts.length > 0 && (
            <Badge className="ml-2 bg-red-600 text-white h-5 w-5 p-0 flex items-center justify-center">
              {data.alerts.length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );

  const renderAlerts = () => {
    if (!data?.alerts || data.alerts.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`border-l-4 ${
              alert.type === "error"
                ? "border-l-red-500"
                : alert.type === "warning"
                ? "border-l-yellow-500"
                : alert.type === "info"
                ? "border-l-blue-500"
                : "border-l-blue-500"
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {alert.type === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {alert.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                  <p className="text-sm font-medium">{alert.title}</p>
                </div>
                {alert.actionable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleAlertAction(alert)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!data) return null;
    const s = data.stats;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vehicles</p>
                <p className="text-2xl font-bold">{s.totalVehicles}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {s.activeVehicles} Active
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    <Wrench className="h-3 w-3 mr-1 text-yellow-600" />
                    {s.maintenanceVehicles} Maintenance
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Bus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routes</p>
                <p className="text-2xl font-bold">{s.totalRoutes}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {s.activeRoutes} Active
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    <XCircle className="h-3 w-3 mr-1 text-yellow-600" />
                    {s.inactiveRoutes} Inactive
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Route className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-bold">{s.totalDrivers}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {s.activeDrivers} Active
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    <UserRoundX className="h-3 w-3 mr-1 text-blue-600" />
                    {s.onLeaveDrivers} On Leave
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{s.studentsUsingTransport}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Using {s.totalRoutes} routes
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTodayTrips = () => {
    if (!data) return null;
    const s = data.stats;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Today's Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">Total</p>
              <p className="text-xl font-bold">{s.totalTripsToday}</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-xs text-green-600">Completed</p>
              <p className="text-xl font-bold">{s.completedTripsToday}</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <p className="text-xs text-yellow-600">Ongoing</p>
              <p className="text-xl font-bold">{s.ongoingTripsToday}</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <p className="text-xs text-purple-600">Scheduled</p>
              <p className="text-xl font-bold">{s.scheduledTripsToday}</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <p className="text-xs text-red-600">Cancelled</p>
              <p className="text-xl font-bold">{s.cancelledTripsToday}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>On-Time Performance</span>
                <span className="font-bold text-green-600">{s.onTimePerformance}%</span>
              </div>
              <Progress value={s.onTimePerformance} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Avg Distance: {s.averageDistancePerTrip.toFixed(1)} km
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles, routes, drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "trips" && (
            <>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-[180px]">
                  <Route className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routeOptions.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger className="w-[180px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {driverOptions.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderVehiclesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-blue-600" />
          Vehicle Fleet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No vehicles found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle._id} className="hover:bg-gray-50">
                    <TableCell className="font-mono font-medium">
                      {vehicle.vehicleNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getVehicleIcon(vehicle.type)}
                        <span className="capitalize">{vehicle.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.capacity} seats</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{vehicle.driver.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getVehicleStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>
                      {getExpiryBadge(vehicle.insuranceExpiry)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewVehicle(vehicle)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderRoutesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-green-600" />
          Bus Routes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No routes found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Morning Trip</TableHead>
                  <TableHead>Evening Trip</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => (
                  <TableRow key={route._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{route.routeName}</TableCell>
                    <TableCell>{route.driver.name}</TableCell>
                    <TableCell>{route.vehicle.vehicleNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{route.morningTrip.startTime} - {route.morningTrip.endTime}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.morningTrip.pickupPoints.length} stops
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{route.eveningTrip.startTime} - {route.eveningTrip.endTime}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.eveningTrip.dropPoints.length} stops
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{route.students.length} students</Badge>
                    </TableCell>
                    <TableCell>{getRouteStatusBadge(route.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewRoute(route)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDriversTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Drivers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No drivers found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>License No</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(driver.firstName, driver.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                          <p className="text-xs text-muted-foreground">{driver.driverId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{driver.licenseNumber}</TableCell>
                    <TableCell>
                      {getExpiryBadge(driver.licenseExpiry)}
                    </TableCell>
                    <TableCell>{driver.experience} years</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm">{driver.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.assignedVehicle ? (
                        <Badge variant="outline">{driver.assignedVehicle}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getDriverStatusBadge(driver.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDriver(driver)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTripsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Today's Trips
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredTrips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No trips found for today</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip._id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs font-medium">
                      {trip.tripId}
                    </TableCell>
                    <TableCell>{trip.routeName}</TableCell>
                    <TableCell>{trip.driverName}</TableCell>
                    <TableCell>{trip.vehicleNumber}</TableCell>
                    <TableCell className="capitalize">{trip.tripType}</TableCell>
                    <TableCell>
                      {trip.startTime || '-'} - {trip.endTime || '-'}
                    </TableCell>
                    <TableCell>
                      {trip.studentsPickedUp > 0 ? (
                        <Badge variant="outline" className="bg-green-50">
                          {trip.studentsPickedUp}/{trip.totalStudents}
                        </Badge>
                      ) : (
                        <span className="text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getTripStatusBadge(trip.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewTrip(trip)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderVehicleDialog = () => (
    <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            Vehicle Details
          </DialogTitle>
        </DialogHeader>
        {selectedVehicle && (
          <div className="space-y-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedVehicle.vehicleNumber}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.model}</p>
              </div>
              {getVehicleStatusBadge(selectedVehicle.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{selectedVehicle.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="font-medium">{selectedVehicle.capacity} seats</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fuel Type</p>
                <p className="font-medium capitalize">{selectedVehicle.fuelType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Odometer</p>
                <p className="font-medium">{selectedVehicle.odometer.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fuel Level</p>
                <p className="font-medium">{selectedVehicle.fuelLevel}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="font-medium">{selectedVehicle.driver.name}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Insurance & Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Insurance No</p>
                  <p className="font-mono text-sm">{selectedVehicle.insuranceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Insurance Expiry</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{formatDate(selectedVehicle.insuranceExpiry)}</p>
                    {getExpiryBadge(selectedVehicle.insuranceExpiry)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fitness Expiry</p>
                  <p className="text-sm">{formatDate(selectedVehicle.fitnessExpiry)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pollution Expiry</p>
                  <p className="text-sm">{formatDate(selectedVehicle.pollutionExpiry)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Maintenance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last Maintenance</p>
                  <p className="text-sm">{formatDate(selectedVehicle.lastMaintenance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Maintenance</p>
                  <p className="text-sm">{formatDate(selectedVehicle.nextMaintenance)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowVehicleDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderRouteDialog = () => (
    <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-green-600" />
            Route Details
          </DialogTitle>
        </DialogHeader>
        {selectedRoute && (
          <div className="space-y-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedRoute.routeName}</h3>
                <p className="text-sm text-muted-foreground">{selectedRoute.description}</p>
              </div>
              {getRouteStatusBadge(selectedRoute.status)}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-xl font-bold">{selectedRoute.distance} km</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{selectedRoute.estimatedDuration} min</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-xl font-bold">{selectedRoute.students.length}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Driver & Vehicle</h4>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="font-medium">{selectedRoute.driver.name}</p>
                  <p className="text-sm flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {selectedRoute.driver.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedRoute.vehicle.vehicleNumber}</p>
                  <p className="text-sm">Capacity: {selectedRoute.vehicle.capacity}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="morning" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="morning">Morning Trip</TabsTrigger>
                <TabsTrigger value="evening">Evening Trip</TabsTrigger>
              </TabsList>
              <TabsContent value="morning">
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span>Start: {selectedRoute.morningTrip.startTime}</span>
                    <span>End: {selectedRoute.morningTrip.endTime}</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pickup Point</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoute.morningTrip.pickupPoints.map((point, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{point.pointName}</TableCell>
                            <TableCell>{point.time}</TableCell>
                            <TableCell>{point.studentCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="evening">
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span>Start: {selectedRoute.eveningTrip.startTime}</span>
                    <span>End: {selectedRoute.eveningTrip.endTime}</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drop Point</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoute.eveningTrip.dropPoints.map((point, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{point.pointName}</TableCell>
                            <TableCell>{point.time}</TableCell>
                            <TableCell>{point.studentCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRouteDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDriverDialog = () => (
    <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Driver Details
          </DialogTitle>
        </DialogHeader>
        {selectedDriver && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(selectedDriver.firstName, selectedDriver.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{selectedDriver.driverId}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getDriverStatusBadge(selectedDriver.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedDriver.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alternate Phone</p>
                <p className="font-medium">{selectedDriver.alternatePhone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{selectedDriver.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blood Group</p>
                <p className="font-medium">{selectedDriver.bloodGroup || '-'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">License Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">License Number</p>
                  <p className="font-mono text-sm">{selectedDriver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">License Type</p>
                  <p className="text-sm">{selectedDriver.licenseType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{formatDate(selectedDriver.licenseExpiry)}</p>
                    {getExpiryBadge(selectedDriver.licenseExpiry)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm">{selectedDriver.experience} years</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Vehicle</p>
                  <p className="font-medium">{selectedDriver.assignedVehicle || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Route</p>
                  <p className="font-medium">{selectedDriver.assignedRoute || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDriverDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderTripDialog = () => (
    <Dialog open={showTripDialog} onOpenChange={setShowTripDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Trip Details
          </DialogTitle>
        </DialogHeader>
        {selectedTrip && (
          <div className="space-y-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedTrip.tripId}</h3>
                <p className="text-sm text-muted-foreground">{selectedTrip.routeName}</p>
              </div>
              {getTripStatusBadge(selectedTrip.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Trip Type</p>
                <p className="font-medium capitalize">{selectedTrip.tripType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(selectedTrip.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Time</p>
                <p className="font-medium">{selectedTrip.startTime || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Time</p>
                <p className="font-medium">{selectedTrip.endTime || '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Driver & Vehicle</h4>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="font-medium">{selectedTrip.driverName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedTrip.vehicleNumber}</p>
                </div>
              </div>
            </div>

            {selectedTrip.status === "completed" && (
              <>
                <div>
                  <h4 className="font-medium mb-2">Trip Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-xl font-bold">{selectedTrip.distance} km</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="text-xl font-bold">
                        {selectedTrip.studentsPickedUp}/{selectedTrip.totalStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Odometer</p>
                      <p className="text-xl font-bold">
                        {selectedTrip.endOdometer ? (selectedTrip.endOdometer - (selectedTrip.startOdometer || 0)) : 0} km
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTripDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderAlertsDialog = () => (
    <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-orange-600" />
            Transport Alerts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {data?.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${
                alert.type === "error"
                  ? "bg-red-50 border-red-200"
                  : alert.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {alert.type === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {alert.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                  <p className="font-medium">{alert.title}</p>
                </div>
                {alert.actionable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleAlertAction(alert)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAlertsDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderAlerts()}
      {renderStats()}
      {renderTodayTrips()}
      {renderFilters()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active</span>
                    <span className="font-bold text-green-600">{data?.stats.activeVehicles}</span>
                  </div>
                  <Progress value={(data?.stats.activeVehicles || 0) / (data?.stats.totalVehicles || 1) * 100} className="h-2" />
                  <div className="flex justify-between text-sm mt-2">
                    <span>Maintenance</span>
                    <span className="font-bold text-yellow-600">{data?.stats.maintenanceVehicles}</span>
                  </div>
                  <Progress value={(data?.stats.maintenanceVehicles || 0) / (data?.stats.totalVehicles || 1) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Driver Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active</span>
                    <span className="font-bold text-green-600">{data?.stats.activeDrivers}</span>
                  </div>
                  <Progress value={(data?.stats.activeDrivers || 0) / (data?.stats.totalDrivers || 1) * 100} className="h-2" />
                  <div className="flex justify-between text-sm mt-2">
                    <span>On Leave</span>
                    <span className="font-bold text-blue-600">{data?.stats.onLeaveDrivers}</span>
                  </div>
                  <Progress value={(data?.stats.onLeaveDrivers || 0) / (data?.stats.totalDrivers || 1) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles">{renderVehiclesTab()}</TabsContent>
        <TabsContent value="routes">{renderRoutesTab()}</TabsContent>
        <TabsContent value="drivers">{renderDriversTab()}</TabsContent>
        <TabsContent value="trips">{renderTripsTab()}</TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderVehicleDialog()}
      {renderRouteDialog()}
      {renderDriverDialog()}
      {renderTripDialog()}
      {renderAlertsDialog()}
    </div>
  );
}