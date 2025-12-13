import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Bus, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Plus, 
  Download, 
  Fuel, 
  Wrench,
  Navigation
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data for Charts
const routeOccupancy = [
  { route: 'R-01', capacity: 50, occupied: 45 },
  { route: 'R-02', capacity: 40, occupied: 38 },
  { route: 'R-03', capacity: 50, occupied: 42 },
  { route: 'R-04', capacity: 35, occupied: 20 },
  { route: 'R-05', capacity: 60, occupied: 55 },
  { route: 'R-06', capacity: 40, occupied: 35 },
];

// Mock Data for Fleet Table
const fleetData = [
  { id: 1, vehicleNo: 'KA-01-AB-1234', driver: 'Ramesh Singh', route: 'Route 1 (North)', capacity: 50, status: 'On Route', fuel: '75%' },
  { id: 2, vehicleNo: 'KA-01-AB-5678', driver: 'Suresh Kumar', route: 'Route 2 (East)', capacity: 40, status: 'On Route', fuel: '60%' },
  { id: 3, vehicleNo: 'KA-01-AB-9012', driver: 'Rajesh Yadav', route: 'Route 3 (West)', capacity: 50, status: 'Maintenance', fuel: '20%' },
  { id: 4, vehicleNo: 'KA-01-AB-3456', driver: 'Vikram Malhotra', route: 'Route 4 (South)', capacity: 35, status: 'On Route', fuel: '90%' },
  { id: 5, vehicleNo: 'KA-01-AB-7890', driver: 'Amit Patel', route: 'Route 5 (Central)', capacity: 60, status: 'Garage', fuel: '45%' },
];

const maintenanceAlerts = [
  { id: 1, vehicle: 'KA-01-AB-9012', issue: 'Engine Overheating', date: 'Due Today', priority: 'high' },
  { id: 2, vehicle: 'KA-01-AB-7890', issue: 'Oil Change', date: 'Due Tomorrow', priority: 'medium' },
  { id: 3, vehicle: 'KA-01-AB-1234', issue: 'Tyre Check', date: 'In 3 Days', priority: 'low' },
];

const statusStyles = {
  'On Route': 'bg-success/10 text-success border-success/20',
  'Maintenance': 'bg-destructive/10 text-destructive border-destructive/20',
  'Garage': 'bg-warning/10 text-warning border-warning/20',
};

export default function Transport() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Transport Management</h1>
            <p className="text-muted-foreground">Manage fleet, routes, and track vehicle status</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Schedule
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Vehicles"
            value="12"
            subtitle="Fleet size"
            icon={Bus}
            variant="primary"
          />
          <StatCard
            title="Active Routes"
            value="8"
            subtitle="Covering 4 zones"
            icon={MapPin}
            variant="success"
          />
          <StatCard
            title="Students"
            value="450"
            subtitle="Availing transport"
            icon={Users}
            trend={{ value: 5.4, isPositive: true }}
            variant="warning"
          />
          <StatCard
            title="Maintenance"
            value="2"
            subtitle="Vehicles in repair"
            icon={Wrench}
            variant="danger"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Occupancy Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Route Occupancy Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={routeOccupancy}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="route" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="capacity" name="Total Capacity" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="occupied" name="Occupied" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Alerts List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Maintenance Alerts
                </CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        alert.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                      }`}>
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{alert.vehicle}</p>
                        <p className="text-sm text-muted-foreground">{alert.issue}</p>
                      </div>
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'outline'}>
                      {alert.date}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Fuel Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleetData.map((bus) => (
                    <TableRow key={bus.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{bus.vehicleNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {bus.driver.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {bus.driver}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Navigation className="h-3 w-3" />
                          {bus.route}
                        </div>
                      </TableCell>
                      <TableCell>{bus.capacity} Seats</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-3 w-3 text-muted-foreground" />
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                parseInt(bus.fuel) < 30 ? 'bg-destructive' : 'bg-success'
                              }`} 
                              style={{ width: bus.fuel }}
                            />
                          </div>
                          <span className="text-xs">{bus.fuel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[bus.status as keyof typeof statusStyles]}>
                          {bus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Track</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}