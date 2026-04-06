import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

// Icons
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  Mail,
  MailOpen,
  MapPin,
  Building2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Hospital,
  Car,
  Ambulance,
  Flame,
  HeartPulse,
  Search,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Users,
  Clock,
  Star,
  Copy,
  Eye,
} from "lucide-react";

// ==================== TYPES & INTERFACES ====================

type ContactCategory = "emergency" | "school" | "transport" | "medical" | "support" | "other";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  category: ContactCategory;
  icon: React.ElementType;
  available?: boolean;
  priority: number; // 1 = highest
  favorite?: boolean;
  notes?: string;
  workingHours?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  lastCalled?: string;
  callCount?: number;
}

interface ContactsResponse {
  success: boolean;
  data: Contact[];
  lastUpdated: string;
  version: number;
}

interface CallLog {
  contactId: string;
  contactName: string;
  phone: string;
  timestamp: string;
  duration?: number;
  status: 'success' | 'failed' | 'missed';
}

// ==================== UTILITY FUNCTIONS ====================

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `0${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

const getCategoryColor = (category: ContactCategory): { bg: string; border: string; text: string; icon: string } => {
  switch (category) {
    case "emergency":
      return { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", icon: "bg-red-600" };
    case "school":
      return { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700", icon: "bg-blue-600" };
    case "transport":
      return { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-700", icon: "bg-amber-600" };
    case "medical":
      return { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", icon: "bg-green-600" };
    case "support":
      return { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700", icon: "bg-purple-600" };
    default:
      return { bg: "bg-gray-50", border: "border-gray-500", text: "text-gray-700", icon: "bg-gray-600" };
  }
};

const getCategoryBadge = (category: ContactCategory) => {
  switch (category) {
    case "emergency":
      return <Badge className="bg-red-600 text-white border-red-700">Emergency</Badge>;
    case "school":
      return <Badge className="bg-blue-600 text-white border-blue-700">School</Badge>;
    case "transport":
      return <Badge className="bg-amber-600 text-white border-amber-700">Transport</Badge>;
    case "medical":
      return <Badge className="bg-green-600 text-white border-green-700">Medical</Badge>;
    case "support":
      return <Badge className="bg-purple-600 text-white border-purple-700">Support</Badge>;
    default:
      return <Badge variant="outline">Other</Badge>;
  }
};

// ==================== MOCK DATA ====================

const mockContacts: Contact[] = [
  // EMERGENCY SERVICES (Priority 1)
  {
    id: "1",
    name: "Emergency Services",
    role: "Police • Fire • Ambulance",
    phone: "112",
    category: "emergency",
    icon: AlertTriangle,
    available: true,
    priority: 1,
    favorite: true,
    notes: "National emergency number - works on all networks",
  },
  {
    id: "2",
    name: "Police Control Room",
    role: "Emergency",
    phone: "100",
    altPhone: "1090",
    category: "emergency",
    icon: Shield,
    available: true,
    priority: 1,
    favorite: true,
  },
  {
    id: "3",
    name: "Ambulance",
    role: "Medical Emergency",
    phone: "108",
    category: "medical",
    icon: Ambulance,
    available: true,
    priority: 1,
    favorite: true,
  },
  {
    id: "4",
    name: "Fire Service",
    role: "Fire Emergency",
    phone: "101",
    category: "emergency",
    icon: Flame,
    available: true,
    priority: 1,
  },

  // SCHOOL ADMINISTRATION (Priority 2)
  {
    id: "5",
    name: "School Office",
    role: "Main Office",
    phone: "+91 9876543210",
    altPhone: "+91 9876543211",
    email: "office@smartschool.edu",
    address: "Main Building, Room 101",
    category: "school",
    icon: Building2,
    available: true,
    priority: 2,
    workingHours: "8:00 AM - 5:00 PM",
  },
  {
    id: "6",
    name: "Principal",
    role: "Dr. Suresh Kumar",
    phone: "+91 9876543212",
    email: "principal@smartschool.edu",
    category: "school",
    icon: Building2,
    available: true,
    priority: 2,
    favorite: true,
  },
  {
    id: "7",
    name: "Vice Principal",
    role: "Mrs. Lakshmi Reddy",
    phone: "+91 9876543222",
    email: "vp@smartschool.edu",
    category: "school",
    icon: Building2,
    available: true,
    priority: 2,
  },

  // TRANSPORT DEPARTMENT (Priority 2)
  {
    id: "8",
    name: "Transport In-charge",
    role: "Mr. Rajesh Sharma",
    phone: "+91 9876543213",
    altPhone: "+91 9876543214",
    email: "transport@smartschool.edu",
    category: "transport",
    icon: Car,
    available: true,
    priority: 2,
    favorite: true,
  },
  {
    id: "9",
    name: "Transport Manager",
    role: "Fleet Operations",
    phone: "+91 9876543215",
    email: "fleet@smartschool.edu",
    category: "transport",
    icon: Car,
    available: true,
    priority: 2,
  },
  {
    id: "10",
    name: "Mechanic - Rajesh",
    role: "Vehicle Mechanic",
    phone: "+91 9876543219",
    category: "transport",
    icon: Car,
    available: true,
    priority: 2,
    workingHours: "24/7 Emergency",
  },
  {
    id: "11",
    name: "Petrol Pump - IOCL",
    role: "Fuel Station",
    phone: "+91 9876543220",
    address: "Kukatpally Main Road",
    category: "transport",
    icon: Car,
    available: true,
    priority: 2,
    location: {
      lat: 17.4948,
      lng: 78.4014,
      address: "IOCL Petrol Pump, Kukatpally",
    },
  },

  // MEDICAL (Priority 2)
  {
    id: "12",
    name: "School Nurse",
    role: "Ms. Priya Reddy",
    phone: "+91 9876543216",
    email: "nurse@smartschool.edu",
    category: "medical",
    icon: HeartPulse,
    available: true,
    priority: 2,
  },
  {
    id: "13",
    name: "City Hospital",
    role: "Nearest Hospital",
    phone: "+91 9876543217",
    altPhone: "+91 9876543218",
    email: "emergency@cityhospital.com",
    address: "NH-65, Kukatpally",
    category: "medical",
    icon: Hospital,
    available: true,
    priority: 2,
    location: {
      lat: 17.4952,
      lng: 78.4018,
      address: "City Hospital, Kukatpally",
    },
  },
  {
    id: "14",
    name: "Pharmacy - Apollo",
    role: "24/7 Pharmacy",
    phone: "+91 9876543223",
    category: "medical",
    icon: Hospital,
    available: true,
    priority: 2,
    workingHours: "24/7",
  },

  // SUPPORT SERVICES (Priority 3)
  {
    id: "15",
    name: "School Security",
    role: "Security Office",
    phone: "+91 9876543221",
    category: "support",
    icon: Shield,
    available: true,
    priority: 3,
  },
  {
    id: "16",
    name: "Towing Service",
    role: "Vehicle Breakdown",
    phone: "+91 9876543224",
    category: "support",
    icon: Car,
    available: true,
    priority: 3,
    workingHours: "24/7",
  },
  {
    id: "17",
    name: "Roadside Assistance",
    role: "24/7 Help",
    phone: "+91 9876543225",
    category: "support",
    icon: Car,
    available: true,
    priority: 3,
  },
  {
    id: "18",
    name: "Insurance Helpline",
    role: "Vehicle Insurance",
    phone: "+91 9876543226",
    category: "support",
    icon: ShieldCheck,
    available: true,
    priority: 3,
    workingHours: "9:00 AM - 6:00 PM",
  },
];

// ==================== MAIN COMPONENT ====================

export default function EmergencyContactsPage() {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactCategory | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callNumber, setCallNumber] = useState("");
  const [callName, setCallName] = useState("");
  const [callLogs, setCallLogs] = useLocalStorage<CallLog[]>("emergency-call-logs", []);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  // ==================== DATA FETCHING ====================

  const {
    data: contactsData,
    isLoading,
    refetch,
    isFetching
  } = useQuery<ContactsResponse>({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      // In production, replace with actual API call
      // const response = await emergencyService.getContacts();
      // return response.data;

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: mockContacts,
        lastUpdated: new Date().toISOString(),
        version: 1,
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
  });

  const contacts = contactsData?.data || [];

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo(() => {
    return {
      emergency: contacts.filter(c => c.category === "emergency").length,
      school: contacts.filter(c => c.category === "school").length,
      transport: contacts.filter(c => c.category === "transport").length,
      medical: contacts.filter(c => c.category === "medical").length,
      support: contacts.filter(c => c.category === "support").length,
      total: contacts.length,
      favorites: contacts.filter(c => c.favorite).length,
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Apply search
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.role.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filter !== "all") {
      filtered = filtered.filter(c => c.category === filter);
    }

    // Apply favorites filter
    if (favoritesOnly) {
      filtered = filtered.filter(c => c.favorite);
    }

    // Sort by priority (highest first) then by name
    return filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });
  }, [contacts, search, filter, favoritesOnly]);

  const emergencyContacts = useMemo(() => {
    return filteredContacts.filter(c => c.category === "emergency" && c.priority === 1);
  }, [filteredContacts]);

  const otherContacts = useMemo(() => {
    return filteredContacts.filter(c => !(c.category === "emergency" && c.priority === 1));
  }, [filteredContacts]);

  // Load recent calls
  useEffect(() => {
    const recent = [...callLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    setRecentCalls(recent);
  }, [callLogs]);

  // ==================== HANDLERS ====================

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Refreshing contacts...");
  }, [refetch]);

  const handleCall = useCallback((phone: string, name: string) => {
    setCallNumber(phone);
    setCallName(name);
    setShowCallDialog(true);
  }, []);

  const confirmCall = useCallback(() => {
    // Log the call
    const newLog: CallLog = {
      contactId: selectedContact?.id || 'unknown',
      contactName: callName,
      phone: callNumber,
      timestamp: new Date().toISOString(),
      status: 'success',
    };
    setCallLogs([newLog, ...callLogs.slice(0, 49)]);

    // Make the call
    window.location.href = `tel:${callNumber}`;
    setShowCallDialog(false);
    setSelectedContact(null);
  }, [callNumber, callName, selectedContact, callLogs, setCallLogs]);

  const handleSMS = useCallback((phone: string) => {
    window.location.href = `sms:${phone}`;
    toast.success("Opening SMS...");
  }, []);

  const handleEmail = useCallback((email: string) => {
    window.location.href = `mailto:${email}`;
    toast.success("Opening email...");
  }, []);

  const handleMap = useCallback((address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  }, []);

  const handleSOS = useCallback(() => {
    setShowSOSConfirm(true);
  }, []);

  const confirmSOS = useCallback(() => {
    // Call emergency number
    window.location.href = `tel:112`;
    
    // Log the SOS call
    const newLog: CallLog = {
      contactId: 'sos',
      contactName: 'EMERGENCY SOS',
      phone: '112',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
    setCallLogs([newLog, ...callLogs.slice(0, 49)]);

    toast.success("SOS Activated", {
      description: "Calling emergency services...",
      duration: 5000,
    });
    
    setShowSOSConfirm(false);
  }, [callLogs, setCallLogs]);

  const handleViewDetails = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailsDialog(true);
  }, []);

  const handleToggleFavorite = useCallback((contact: Contact) => {
    // In production, call API
    // await emergencyService.toggleFavorite(contact.id);
    
    toast.success(contact.favorite ? "Removed from favorites" : "Added to favorites");
    
    // Update local state (would be handled by React Query in production)
    queryClient.setQueryData(["emergency-contacts"], (old: any) => ({
      ...old,
      data: old.data.map((c: Contact) =>
        c.id === contact.id ? { ...c, favorite: !c.favorite } : c
      ),
    }));
  }, [queryClient]);

  const handleCopyPhone = useCallback((phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success("Phone number copied to clipboard");
  }, []);

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Emergency Contacts</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Quick access to important numbers
          {!isOnline && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );

  const renderSOSBanner = () => (
    <Card className="border-red-600 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <p className="font-bold text-2xl">EMERGENCY SOS</p>
              <p className="text-white/90">Call 112 for Police • Fire • Ambulance</p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-red-600 hover:bg-white/90 hover:text-red-700 text-lg px-8 h-14 font-bold animate-pulse shadow-xl"
            onClick={handleSOS}
          >
            <Phone className="h-6 w-6 mr-2" />
            CALL SOS NOW
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderNetworkStatus = () => (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">Connected - Emergency calls available</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-700">
                Offline - Using cached contacts. Emergency calls still work.
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStats = () => (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emergency</p>
              <p className="text-xl font-bold text-red-600">{stats.emergency}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">School</p>
              <p className="text-xl font-bold text-blue-600">{stats.school}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Car className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transport</p>
              <p className="text-xl font-bold text-amber-600">{stats.transport}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Hospital className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medical</p>
              <p className="text-xl font-bold text-green-600">{stats.medical}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Support</p>
              <p className="text-xl font-bold text-purple-600">{stats.support}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-9"
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === "emergency" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("emergency")}
              className="h-9 text-red-600 hover:text-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Emergency ({stats.emergency})
            </Button>
            <Button
              variant={filter === "school" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("school")}
              className="h-9 text-blue-600 hover:text-blue-700"
            >
              <Building2 className="h-4 w-4 mr-1" />
              School ({stats.school})
            </Button>
            <Button
              variant={filter === "transport" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("transport")}
              className="h-9 text-amber-600 hover:text-amber-700"
            >
              <Car className="h-4 w-4 mr-1" />
              Transport ({stats.transport})
            </Button>
            <Button
              variant={filter === "medical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("medical")}
              className="h-9 text-green-600 hover:text-green-700"
            >
              <Hospital className="h-4 w-4 mr-1" />
              Medical ({stats.medical})
            </Button>
            <Button
              variant={filter === "support" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("support")}
              className="h-9 text-purple-600 hover:text-purple-700"
            >
              <Users className="h-4 w-4 mr-1" />
              Support ({stats.support})
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant={favoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className="h-9"
            >
              <Star className={`h-4 w-4 mr-1 ${favoritesOnly ? 'fill-current' : ''}`} />
              Favorites ({stats.favorites})
            </Button>
          </div>

          {recentCalls.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Recent:</span>
              {recentCalls.map((call, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleCall(call.phone, call.contactName)}
                >
                  {call.contactName} • {formatPhoneNumber(call.phone)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderContactCard = (contact: Contact) => {
    const colors = getCategoryColor(contact.category);
    const Icon = contact.icon;

    return (
      <Card
        key={contact.id}
        className={cn(
          "hover:shadow-lg transition-all duration-300 group",
          contact.priority === 1 && "border-2 border-red-200"
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-xl", colors.bg)}>
                <Icon className={cn("h-6 w-6", colors.text)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-base">{contact.name}</p>
                  {contact.favorite && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  {contact.priority === 1 && (
                    <Badge className="bg-red-600 text-white border-red-700 text-[10px] px-1 h-4">
                      SOS
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{contact.role}</p>
              </div>
            </div>
            {contact.available && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <div className="h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Available now</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="space-y-3">
            {/* Primary Phone */}
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg group-hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{formatPhoneNumber(contact.phone)}</span>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCall(contact.phone, contact.name)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSMS(contact.phone)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send SMS</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPhone(contact.phone)}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy number</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Alternate Phone */}
            {contact.altPhone && (
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{formatPhoneNumber(contact.altPhone)}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCall(contact.altPhone!, contact.name)}
                  className="h-7 w-7 p-0"
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Email */}
            {contact.email && (
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {contact.email}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEmail(contact.email!)}
                  className="h-7 w-7 p-0"
                >
                  <MailOpen className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Address */}
            {contact.address && (
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {contact.address}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMap(contact.address!)}
                  className="h-7 w-7 p-0"
                >
                  <MapPin className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Working Hours */}
            {contact.workingHours && (
              <div className="flex items-center gap-2 pl-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{contact.workingHours}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-1 mt-3 pt-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewDetails(contact)}
              className="h-8 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleToggleFavorite(contact)}
              className="h-8 text-xs"
            >
              <Star className={`h-3 w-3 mr-1 ${contact.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {contact.favorite ? 'Favorited' : 'Favorite'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContactDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Contact Details
          </DialogTitle>
        </DialogHeader>
        {selectedContact && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
              <div className={cn("p-4 rounded-xl", getCategoryColor(selectedContact.category).bg)}>
                <selectedContact.icon className={cn("h-8 w-8", getCategoryColor(selectedContact.category).text)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                <p className="text-muted-foreground">{selectedContact.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getCategoryBadge(selectedContact.category)}
                  {selectedContact.favorite && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                      Favorite
                    </Badge>
                  )}
                  {selectedContact.priority === 1 && (
                    <Badge className="bg-red-600 text-white border-red-700">Emergency</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Primary Phone</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-lg">{formatPhoneNumber(selectedContact.phone)}</p>
                    <Button size="sm" onClick={() => handleCall(selectedContact.phone, selectedContact.name)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>

                {selectedContact.altPhone && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Alternate Phone</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{formatPhoneNumber(selectedContact.altPhone)}</p>
                      <Button size="sm" variant="outline" onClick={() => handleCall(selectedContact.altPhone!, selectedContact.name)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                )}

                {selectedContact.email && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{selectedContact.email}</p>
                      <Button size="sm" variant="outline" onClick={() => handleEmail(selectedContact.email!)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Additional Information</h3>

                {selectedContact.address && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-medium">{selectedContact.address}</p>
                    <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => handleMap(selectedContact.address!)}>
                      <MapPin className="h-3 w-3 mr-1" />
                      Open in Maps
                    </Button>
                  </div>
                )}

                {selectedContact.workingHours && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Working Hours</p>
                    <p className="font-medium">{selectedContact.workingHours}</p>
                  </div>
                )}

                {selectedContact.notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="font-medium">{selectedContact.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedContact.location && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Map view would appear here</p>
                  </div>
                  <p className="text-sm mt-2">{selectedContact.location.address}</p>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {selectedContact && (
            <Button onClick={() => handleCall(selectedContact.phone, selectedContact.name)}>
              <Phone className="h-4 w-4 mr-2" />
              Call Now
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
            <Phone className="h-5 w-5 text-green-600" />
            Call {callName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to call {formatPhoneNumber(callNumber)}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowCallDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmCall} className="bg-green-600 hover:bg-green-700">
            <PhoneCall className="h-4 w-4 mr-2" />
            Call Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderSOSDialog = () => (
    <AlertDialog open={showSOSConfirm} onOpenChange={setShowSOSConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Activate SOS Emergency?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will call emergency services (112). Only use in genuine emergencies.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowSOSConfirm(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmSOS} className="bg-red-600 hover:bg-red-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Activate SOS
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {renderHeader()}
      {renderSOSBanner()}
      {renderNetworkStatus()}
      {renderStats()}
      {renderFilters()}

      {/* Emergency Priority Section */}
      {emergencyContacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Emergency Priority
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {emergencyContacts.map(renderContactCard)}
          </div>
        </div>
      )}

      {/* Other Contacts */}
      {otherContacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            All Contacts
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherContacts.map(renderContactCard)}
          </div>
        </div>
      )}

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-muted-foreground">
              {search ? `No results for "${search}"` : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {renderContactDetailsDialog()}
      {renderCallDialog()}
      {renderSOSDialog()}
    </div>
  );
}