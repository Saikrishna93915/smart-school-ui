// src/pages/Transport.tsx - COMPLETE FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Bus,
  MapPin,
  Users,
  AlertTriangle,
  Plus,
  Download,
  Fuel,
  Wrench,
  Navigation,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Printer,
  FileText,
  Map,
  TrendingUp,
  TrendingDown,
  BarChart,
  FileSpreadsheet,
  Eye,
  Route,
  AlertCircle,
  Settings,
  User,
  Calendar,
  Bell,
  Loader2,
  Car,
  Shield,
  Battery,
  Thermometer,
  Gauge,
  ClipboardList,
  Filter,
  Search,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  Home,
  Truck,
  Zap,
  Database,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import {
  vehicleApi,
  driverApi,
  routeApi,
  maintenanceApi,
  fuelLogApi,
  dashboardApi,
  socketService
} from '@/Services/transportService';

// Types - UPDATED to match API responses
interface Vehicle {
  _id: string;
  vehicleNo: string;
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
  currentFuel: number;
  status: 'active' | 'maintenance' | 'inactive' | 'on-route';
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  currentDriver?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  currentRoute?: {
    _id: string;
    routeNo: string;
    name: string;
    zone: string;
  };
  lastService: string;
  nextService: string;
  createdAt: string;
}

interface Driver {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNo: string;
  status: 'active' | 'on-leave' | 'suspended' | 'inactive';
  assignedVehicle?: {
    _id: string;
    vehicleNo: string;
    model: string;
    capacity: number;
  };
  rating?: number;
  totalTrips?: number;
}

interface Route {
  _id: string;
  routeNo: string;
  name: string;
  zone: 'north' | 'south' | 'east' | 'west' | 'central';
  startPoint: string;
  endPoint: string;
  totalDistance: number;
  estimatedTime: number;
  status: 'active' | 'inactive' | 'temporary-closed';
  monthlyStudents: number;
  monthlyEfficiency: number;
  assignedVehicle?: {
    _id: string;
    vehicleNo: string;
  };
  assignedDriver?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Maintenance {
  _id: string;
  maintenanceId: string;
  vehicle: {
    _id: string;
    vehicleNo: string;
    make: string;
    model: string;
  };
  issueDescription: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  estimatedCost: number;
  actualCost?: number;
  scheduledDate: string;
  completionDate?: string;
  reportedBy?: string;
}

interface StatData {
  title: string;
  value: string | number;
  change: number;
  isPositive: boolean;
  icon: any;
  description: string;
}

const Transport = () => {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState({
    vehicles: false,
    drivers: false,
    routes: false,
    maintenance: false,
    dashboard: false
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  
  // New vehicle form state
  type NewVehicleForm = {
    vehicleNo: string;
    registrationNo: string;
    make: string;
    model: string;
    year: number;
    color: string;
    capacity: number;
    fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
    currentFuel: number;
    status: 'active' | 'maintenance' | 'inactive' | 'on-route';
    lastService: string;
    nextService: string;
  };
  
  const [newVehicle, setNewVehicle] = useState<NewVehicleForm>({
    vehicleNo: '',
    registrationNo: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    capacity: 50,
    fuelType: 'diesel',
    currentFuel: 100,
    status: 'active',
    lastService: new Date().toISOString().split('T')[0],
    nextService: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  // Dashboard data
  const [vehicleStats, setVehicleStats] = useState<any>(null);
  const [routeEfficiencyData, setRouteEfficiencyData] = useState<any[]>([]);
  const [fuelConsumptionData, setFuelConsumptionData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);

  // Stats for dashboard
  const [stats, setStats] = useState<StatData[]>([
    { title: 'Total Fleet', value: '0', change: 0, isPositive: true, icon: Bus, description: 'Active vehicles' },
    { title: 'Active Routes', value: '0', change: 0, isPositive: true, icon: MapPin, description: 'Covering all zones' },
    { title: 'Students Transported', value: '0', change: 0, isPositive: true, icon: Users, description: 'Daily average' },
    { title: 'Fuel Efficiency', value: '0%', change: 0, isPositive: true, icon: Fuel, description: 'Monthly average' },
    { title: 'On-time Performance', value: '0%', change: 0, isPositive: true, icon: Clock, description: 'This month' },
    { title: 'Maintenance Cost', value: '₹0', change: 0, isPositive: true, icon: Wrench, description: 'Monthly spend' },
  ]);

  // =================== API CALLS - FIXED ===================

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, vehicles: true }));
      const response = await vehicleApi.getAllVehicles();
      
      console.log('Vehicles API Response:', response); // Debug
      
      // FIX: Handle both response structures
      if (response.success) {
        // Check if data is nested (pagination) or direct array
        const vehiclesData = response.data?.data || response.data || [];
        setVehicles(vehiclesData);
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch vehicles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, vehicles: false }));
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, drivers: true }));
      const response = await driverApi.getAllDrivers();
      
      console.log('Drivers API Response:', response); // Debug
      
      if (response.success) {
        const driversData = response.data?.data || response.data || [];
        setDrivers(driversData);
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, drivers: false }));
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, routes: true }));
      const response = await routeApi.getAllRoutes();
      
      console.log('Routes API Response:', response); // Debug
      
      if (response.success) {
        const routesData = response.data?.data || response.data || [];
        setRoutes(routesData);
        
        // Prepare route efficiency data for chart
        const efficiencyData = routesData.map((route: Route) => ({
          route: route.routeNo,
          capacity: route.monthlyEfficiency * 2,
          occupied: route.monthlyStudents,
          efficiency: route.monthlyEfficiency
        }));
        setRouteEfficiencyData(efficiencyData);
      }
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch routes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, routes: false }));
    }
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, maintenance: true }));
      const response = await maintenanceApi.getAllMaintenance();
      
      console.log('Maintenance API Response:', response); // Debug
      
      if (response.success) {
        const maintenanceData = response.data?.data || response.data || [];
        setMaintenanceAlerts(maintenanceData);
      }
    } catch (error: any) {
      console.error('Error fetching maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, maintenance: false }));
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, dashboard: true }));
      
      // Fetch all stats in parallel
      const [vehicleStatsRes, driverStatsRes, routeStatsRes, maintenanceStatsRes, fuelStatsRes] = await Promise.all([
        vehicleApi.getVehicleStats(),
        driverApi.getDriverStats(),
        routeApi.getRouteStats(),
        maintenanceApi.getMaintenanceStats(),
        fuelLogApi.getFuelStats({ period: 'monthly' })
      ]);

      console.log('All stats responses:', {
        vehicleStatsRes,
        driverStatsRes,
        routeStatsRes,
        maintenanceStatsRes,
        fuelStatsRes
      });

      // Update vehicle stats
      if (vehicleStatsRes.success) {
        setVehicleStats(vehicleStatsRes.data);
        
        // Create status distribution for pie chart
        const distribution = [
          { name: 'Active', value: vehicleStatsRes.data.activeVehicles || 0, color: '#10b981' },
          { name: 'Maintenance', value: vehicleStatsRes.data.maintenanceVehicles || 0, color: '#f59e0b' },
          { name: 'On Route', value: vehicleStatsRes.data.onRouteVehicles || 0, color: '#3b82f6' },
          { name: 'Inactive', value: vehicleStatsRes.data.inactiveVehicles || 0, color: '#ef4444' }
        ];
        setStatusDistribution(distribution);
        
        // Update stats cards
        setStats(prev => prev.map(stat => {
          if (stat.title === 'Total Fleet') {
            return { ...stat, value: vehicleStatsRes.data.totalVehicles || 0 };
          }
          return stat;
        }));
      }

      // Update route stats
      if (routeStatsRes.success) {
        setStats(prev => prev.map(stat => {
          if (stat.title === 'Active Routes') {
            return { ...stat, value: routeStatsRes.data.activeRoutes || 0 };
          }
          if (stat.title === 'Students Transported') {
            return { ...stat, value: routeStatsRes.data.totalOccupied || 0 };
          }
          return stat;
        }));
      }

      // Update fuel stats
      if (fuelStatsRes.success) {
        // Mock fuel consumption data (your API might not have this yet)
        const fuelData = [
          { month: 'Jan', consumption: 450, cost: 35000 },
          { month: 'Feb', consumption: 420, cost: 32000 },
          { month: 'Mar', consumption: 480, cost: 37000 },
          { month: 'Apr', consumption: 410, cost: 31500 },
          { month: 'May', consumption: 460, cost: 35500 },
          { month: 'Jun', consumption: 430, cost: 33000 },
        ];
        setFuelConsumptionData(fuelData);
        
        setStats(prev => prev.map(stat => {
          if (stat.title === 'Fuel Efficiency') {
            return { 
              ...stat, 
              value: `${fuelStatsRes.data.avgEfficiency || 0}%`,
              change: 1.2
            };
          }
          if (stat.title === 'Maintenance Cost') {
            return { 
              ...stat, 
              value: `₹${(maintenanceStatsRes.success && maintenanceStatsRes.data.monthlyCost) || 0}`,
              change: -3.4
            };
          }
          return stat;
        }));
      }

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    // Comment out socket for now until backend setup
    // socketService.connect();
    
    // Listen for real-time updates
    // socketService.on('vehicle-added', (data: Vehicle) => {
    //   setVehicles(prev => [...prev, data]);
    //   toast({
    //     title: "New Vehicle Added",
    //     description: `${data.vehicleNo} has been added to the fleet`,
    //   });
    // });

    return () => {
      // socketService.disconnect();
    };
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchRoutes();
    fetchMaintenance();
    fetchDashboardStats();
  }, [fetchVehicles, fetchDrivers, fetchRoutes, fetchMaintenance, fetchDashboardStats]);

  // =================== API HANDLERS - FIXED ===================

  const handleAddVehicle = async () => {
    try {
      if (!newVehicle.vehicleNo || !newVehicle.registrationNo || !newVehicle.make || !newVehicle.model) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const response = await vehicleApi.createVehicle(newVehicle);
      console.log('Create vehicle response:', response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Vehicle added successfully",
        });
        setIsAddVehicleOpen(false);
        setNewVehicle({
          vehicleNo: '',
          registrationNo: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          capacity: 50,
          fuelType: 'diesel',
          currentFuel: 100,
          status: 'active',
          lastService: new Date().toISOString().split('T')[0],
          nextService: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        });
        fetchVehicles();
        fetchDashboardStats(); // Refresh stats
      }
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add vehicle",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVehicleLocation = async (vehicleId: string, locationData: any) => {
    try {
      const response = await vehicleApi.updateVehicleLocation(vehicleId, locationData);
      if (response.success) {
        toast({
          title: "Location Updated",
          description: "Vehicle location updated successfully",
        });
        fetchVehicles();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFuelLevel = async (vehicleId: string, fuelLevel: number) => {
    try {
      const response = await vehicleApi.updateFuelLevel(vehicleId, { fuelLevel });
      if (response.success) {
        toast({
          title: "Fuel Updated",
          description: "Fuel level updated successfully",
        });
        fetchVehicles();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update fuel level",
        variant: "destructive",
      });
    }
  };

  const handleAssignDriver = async (vehicleId: string, driverId: string) => {
    try {
      const response = await vehicleApi.assignDriver(vehicleId, { driverId });
      if (response.success) {
        toast({
          title: "Driver Assigned",
          description: "Driver assigned to vehicle successfully",
        });
        fetchVehicles();
        fetchDrivers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    try {
      const response = await vehicleApi.deleteVehicle(vehicleToDelete);
      if (response.success) {
        setIsDeleteDialogOpen(false);
        setVehicleToDelete(null);
        toast({
          title: "Success",
          description: "Vehicle deleted successfully",
        });
        fetchVehicles();
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setIsLoading({
      vehicles: true,
      drivers: true,
      routes: true,
      maintenance: true,
      dashboard: true
    });

    Promise.all([
      fetchVehicles(),
      fetchDrivers(),
      fetchRoutes(),
      fetchMaintenance(),
      fetchDashboardStats()
    ]).finally(() => {
      setIsLoading({
        vehicles: false,
        drivers: false,
        routes: false,
        maintenance: false,
        dashboard: false
      });
      toast({
        title: "Refreshed",
        description: "Data refreshed successfully",
      });
    });
  };

  // =================== HELPER FUNCTIONS ===================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-amber-100 text-amber-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on-route': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'on-route': return <Navigation className="h-4 w-4" />;
      default: return <Bus className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getDriverInitials = (driver: { firstName: string; lastName: string }) => {
    return `${driver.firstName.charAt(0)}${driver.lastName.charAt(0)}`.toUpperCase();
  };

  // =================== RENDER ===================

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bus className="h-8 w-8 text-blue-600" />
            Transport Management
          </h1>
          <p className="text-muted-foreground mt-1">Monitor fleet, manage routes, and track vehicle performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading.dashboard}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading.dashboard ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>
                  Add a new vehicle to your transport fleet
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNo">Vehicle No.*</Label>
                  <Input
                    id="vehicleNo"
                    value={newVehicle.vehicleNo}
                    onChange={(e) => setNewVehicle({...newVehicle, vehicleNo: e.target.value})}
                    placeholder="BUS-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNo">Registration No.*</Label>
                  <Input
                    id="registrationNo"
                    value={newVehicle.registrationNo}
                    onChange={(e) => setNewVehicle({...newVehicle, registrationNo: e.target.value})}
                    placeholder="KA01AB1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make*</Label>
                  <Input
                    id="make"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                    placeholder="Tata"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model*</Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    placeholder="Starbus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                    min="2000"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                    placeholder="White"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({...newVehicle, capacity: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={newVehicle.fuelType}
                    onValueChange={(value: 'petrol' | 'diesel' | 'cng' | 'electric') => 
                      setNewVehicle({...newVehicle, fuelType: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentFuel">Current Fuel Level (%)</Label>
                  <Input
                    id="currentFuel"
                    type="number"
                    value={newVehicle.currentFuel}
                    onChange={(e) => setNewVehicle({...newVehicle, currentFuel: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newVehicle.status}
                    onValueChange={(value: 'active' | 'maintenance' | 'inactive' | 'on-route') => 
                      setNewVehicle({...newVehicle, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-route">On Route</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastService">Last Service Date</Label>
                  <Input
                    id="lastService"
                    type="date"
                    value={newVehicle.lastService}
                    onChange={(e) => setNewVehicle({...newVehicle, lastService: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextService">Next Service Date</Label>
                  <Input
                    id="nextService"
                    type="date"
                    value={newVehicle.nextService}
                    onChange={(e) => setNewVehicle({...newVehicle, nextService: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVehicle} disabled={isLoading.vehicles}>
                  {isLoading.vehicles ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Add Vehicle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">{stat.title}</p>
                  <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.isPositive ? '+' : ''}{stat.change}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Fleet Status Distribution
                </CardTitle>
                <CardDescription>Current status of all vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Route Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Route Efficiency
                </CardTitle>
                <CardDescription>Utilization across all routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={routeEfficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="occupied" name="Occupied Seats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" name="Total Capacity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fuel Consumption Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Fuel Consumption Trend
              </CardTitle>
              <CardDescription>Monthly fuel usage and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelConsumptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="consumption" name="Consumption (L)" stroke="#3b82f6" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost (₹)" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Vehicle Fleet
              </CardTitle>
              <CardDescription>Manage and monitor all vehicles in the fleet</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.vehicles ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading vehicles...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle No.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fuel</TableHead>
                        <TableHead>Last Service</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No vehicles found. Add a new vehicle to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map((vehicle) => (
                          <TableRow key={vehicle._id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-blue-600" />
                                {vehicle.vehicleNo}
                              </div>
                              <div className="text-xs text-gray-500">{vehicle.registrationNo}</div>
                            </TableCell>
                            <TableCell>
                              {vehicle.currentDriver ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {getDriverInitials(vehicle.currentDriver)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{`${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}`}</div>
                                    <div className="text-xs text-gray-500">{vehicle.currentDriver.phone}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {vehicle.currentRoute ? (
                                <div>
                                  <div className="font-medium">{vehicle.currentRoute.routeNo}</div>
                                  <div className="text-xs text-gray-500">{vehicle.currentRoute.name}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No route</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{vehicle.capacity} seats</div>
                              <div className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</div>
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                                {getStatusIcon(vehicle.status)}
                                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                              </div>
                              {vehicle.currentLocation?.address && (
                                <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {vehicle.currentLocation.address}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${vehicle.currentFuel > 70 ? 'bg-green-500' : vehicle.currentFuel > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${vehicle.currentFuel}%` }}
                                  />
                                </div>
                                <span className="text-sm">{vehicle.currentFuel}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(vehicle.lastService)}</div>
                              <div className="text-xs text-gray-500">Next: {formatDate(vehicle.nextService)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    toast({
                                      title: "Vehicle Details",
                                      description: `Viewing details for ${vehicle.vehicleNo}`,
                                    });
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    if (drivers.length > 0) {
                                      const driverId = prompt(
                                        `Assign driver to ${vehicle.vehicleNo}\nAvailable drivers:\n${drivers.map(d => `${d.employeeId}: ${d.firstName} ${d.lastName}`).join('\n')}\n\nEnter driver ID:`
                                      );
                                      if (driverId) {
                                        handleAssignDriver(vehicle._id, driverId);
                                      }
                                    } else {
                                      toast({
                                        title: "No Drivers",
                                        description: "Please add drivers first",
                                        variant: "destructive",
                                      });
                                    }
                                  }}>
                                    <User className="h-4 w-4 mr-2" />
                                    Assign Driver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const newFuel = prompt(`Enter new fuel level for ${vehicle.vehicleNo} (0-100):`, vehicle.currentFuel.toString());
                                    if (newFuel && !isNaN(parseInt(newFuel)) && parseInt(newFuel) >= 0 && parseInt(newFuel) <= 100) {
                                      handleUpdateFuelLevel(vehicle._id, parseInt(newFuel));
                                    }
                                  }}>
                                    <Fuel className="h-4 w-4 mr-2" />
                                    Update Fuel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setVehicleToDelete(vehicle._id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Vehicle
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Drivers
              </CardTitle>
              <CardDescription>Manage drivers and their assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.drivers ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading drivers...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Vehicle</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No drivers found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        drivers.map((driver) => (
                          <TableRow key={driver._id}>
                            <TableCell className="font-medium">
                              {driver.employeeId}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{driver.firstName} {driver.lastName}</div>
                              <div className="text-xs text-gray-500">{driver.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{driver.phone}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{driver.licenseNo}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                driver.status === 'active' ? 'default' :
                                driver.status === 'on-leave' ? 'secondary' :
                                driver.status === 'suspended' ? 'destructive' : 'outline'
                              }>
                                {driver.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {driver.assignedVehicle ? (
                                <div>
                                  <div className="font-medium">{driver.assignedVehicle.vehicleNo}</div>
                                  <div className="text-xs text-gray-500">{driver.assignedVehicle.model}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Route Management
              </CardTitle>
              <CardDescription>Manage transport routes and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.routes ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading routes...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {routes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No routes found. Add routes to get started.
                    </div>
                  ) : (
                    routes.map((route) => (
                      <Card key={route._id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{route.routeNo} - {route.name}</h3>
                              <p className="text-sm text-gray-600">
                                {route.startPoint} → {route.endPoint}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{route.zone.toUpperCase()} ZONE</Badge>
                                <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                                  {route.status.toUpperCase().replace('-', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {route.monthlyStudents}/{route.monthlyEfficiency * 2 || 50}
                              </div>
                              <p className="text-sm text-gray-600">students / capacity</p>
                              <p className="text-sm text-gray-600">Efficiency: {route.monthlyEfficiency || 0}%</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Capacity Utilization</span>
                              <span>{Math.round((route.monthlyStudents / (route.monthlyEfficiency * 2 || 50)) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${(route.monthlyEfficiency || 0) > 90 ? 'bg-green-500' : (route.monthlyEfficiency || 0) > 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                style={{ width: `${route.monthlyEfficiency || 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-600">Distance: </span>
                              <span className="font-medium">{route.totalDistance} km</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Time: </span>
                              <span className="font-medium">{route.estimatedTime} mins</span>
                            </div>
                            <div>
                              {route.assignedVehicle ? (
                                <span className="text-green-600">Vehicle Assigned</span>
                              ) : (
                                <span className="text-red-600">No Vehicle</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Records
              </CardTitle>
              <CardDescription>View and manage vehicle maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.maintenance ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading maintenance records...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No maintenance records found.
                    </div>
                  ) : (
                    maintenanceAlerts.map((alert) => (
                      <div key={alert._id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{alert.vehicle.vehicleNo}</div>
                          <p className="text-sm text-gray-600">{alert.issueDescription}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDate(alert.scheduledDate)}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              alert.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {alert.priority.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              alert.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                              alert.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              alert.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {alert.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{alert.estimatedCost?.toLocaleString() || 'TBD'}</div>
                          <Button size="sm" variant="outline" className="mt-2">
                            Update Status
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVehicleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transport;