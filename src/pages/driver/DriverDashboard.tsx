import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  MapPin,
  History,
  Truck,
  Fuel,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Phone,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";
import driverService from "@/Services/driverService";

interface QuickAction {
  title: string;
  icon: React.ElementType;
  href: string;
  color: string;
  description: string;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await driverService.getDashboard();
      setData(res.data?.data || null);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    void load();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: "Start / End Trip",
      icon: MapPin,
      href: "/driver/start-trip",
      color: "bg-green-600 hover:bg-green-700",
      description: "Begin or end your daily trip",
    },
    {
      title: "Student Attendance",
      icon: Users,
      href: "/driver/student-attendance",
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Mark student boarding status",
    },
    {
      title: "Vehicle Checklist",
      icon: ClipboardCheck,
      href: "/driver/vehicle-checklist",
      color: "bg-amber-600 hover:bg-amber-700",
      description: "Pre-trip vehicle inspection",
    },
    {
      title: "Today's Schedule",
      icon: Clock,
      href: "/driver/my-schedule",
      color: "bg-purple-600 hover:bg-purple-700",
      description: "View today's trips",
    },
    {
      title: "Route Map",
      icon: Navigation,
      href: "/driver/route-map",
      color: "bg-indigo-600 hover:bg-indigo-700",
      description: "View routes & navigation",
    },
    {
      title: "My Students",
      icon: Users,
      href: "/driver/my-students",
      color: "bg-pink-600 hover:bg-pink-700",
      description: "Student list & contacts",
    },
    {
      title: "Incident Report",
      icon: AlertTriangle,
      href: "/driver/incident-report",
      color: "bg-red-600 hover:bg-red-700",
      description: "Report accidents/issues",
    },
    {
      title: "Maintenance",
      icon: Wrench,
      href: "/driver/maintenance",
      color: "bg-cyan-600 hover:bg-cyan-700",
      description: "Request vehicle repairs",
    },
    {
      title: "Trip History",
      icon: History,
      href: "/driver/trip-history",
      color: "bg-gray-600 hover:bg-gray-700",
      description: "View past trips",
    },
    {
      title: "My Vehicle",
      icon: Truck,
      href: "/driver/my-vehicle",
      color: "bg-orange-600 hover:bg-orange-700",
      description: "Vehicle details & info",
    },
    {
      title: "Fuel Log",
      icon: Fuel,
      href: "/driver/fuel-log",
      color: "bg-emerald-600 hover:bg-emerald-700",
      description: "Track fuel expenses",
    },
    {
      title: "Emergency Contacts",
      icon: Phone,
      href: "/driver/emergency-contacts",
      color: "bg-rose-600 hover:bg-rose-700",
      description: "Important phone numbers",
    },
  ];

  const stats = [
    {
      title: "Today's Trips",
      value: data?.todayTrips?.length || 0,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Students on Route",
      value: data?.studentCount || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Trips (Month)",
      value: data?.monthlyStats?.totalTrips || 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Distance (Month)",
      value: `${data?.monthlyStats?.totalDistance || 0} km`,
      icon: MapPin,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Fuel Efficiency",
      value: data?.monthlyStats?.fuelEfficiency ? `${data.monthlyStats.fuelEfficiency} km/L` : "-",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "On-Time %",
      value: data?.monthlyStats?.onTimePercentage ? `${data.monthlyStats.onTimePercentage}%` : "-",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your daily routes and vehicle</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => navigate(action.href)}
                className={`${action.color} text-white rounded-xl p-4 text-left transition-all hover:shadow-lg hover:scale-105 active:scale-95`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-white/80">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Trips */}
      {data?.todayTrips && data.todayTrips.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Trips</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/driver/my-schedule")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.todayTrips.map((trip: any, index: number) => (
                <div
                  key={trip._id || index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{trip.routeId?.routeName || trip.tripType || "Unknown Route"}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {trip.status || "Scheduled"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {trip.status === "active" || trip.status === "in-progress" ? (
                      <Button size="sm" onClick={() => navigate("/driver/student-attendance")}>
                        Mark Attendance
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => navigate("/driver/start-trip")}>
                        Start Trip
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Important Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <ClipboardCheck className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Complete Vehicle Checklist</p>
                <p className="text-xs text-amber-700">Perform pre-trip inspection before starting your journey</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 text-sm">Mark Student Attendance</p>
                <p className="text-xs text-blue-700">Ensure all students are marked as boarded/absent for each trip</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <Fuel className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Log Fuel Expenses</p>
                <p className="text-xs text-green-700">Record all fuel purchases with odometer readings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
