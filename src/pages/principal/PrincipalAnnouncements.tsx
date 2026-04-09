import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import principalService from "@/Services/principalService";
import {
  Megaphone,
  Bell,
  BellRing,
  Calendar as CalendarIcon,
  Clock,
  Users,
  GraduationCap,
  Mail,
  Phone,
  Send,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pin,
  PinOff,
  Star,
  StarOff,
  ThumbsUp,
  ThumbsDown,
  FileText,
  BarChart3,
  Grid,
  Archive,
  Plus,
  Save,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type AnnouncementType = 
  | "general" 
  | "exam" 
  | "holiday" 
  | "event" 
  | "meeting" 
  | "emergency" 
  | "achievement" 
  | "reminder";

type AnnouncementPriority = "low" | "medium" | "high" | "urgent";

type AnnouncementStatus = "draft" | "scheduled" | "published" | "archived";

type AnnouncementAudience = {
  type: "all" | "students" | "parents" | "teachers" | "staff" | "custom";
  classes?: string[];
  sections?: string[];
  studentIds?: string[];
  parentIds?: string[];
  teacherIds?: string[];
  departmentIds?: string[];
};

type AnnouncementChannel = {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp?: boolean;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  audience: AnnouncementAudience;
  channels: AnnouncementChannel;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  publishedAt?: string;
  expiresAt?: string;
  pinned: boolean;
  featured: boolean;
  stats?: {
    views: number;
    reads: number;
    clicks: number;
    reactions: {
      likes: number;
      dislikes: number;
    };
    comments: number;
  };
  readBy?: Array<{
    userId: string;
    userName: string;
    userRole: string;
    readAt: string;
  }>;
};

type AnnouncementFilters = {
  search: string;
  type: string;
  priority: string;
  status: string;
  audience: string;
  fromDate: Date | null;
  toDate: Date | null;
  pinned: boolean;
  featured: boolean;
};

type AnnouncementStats = {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  archived: number;
  pinned: number;
  featured: number;
  totalViews: number;
  totalReads: number;
  totalReactions: number;
};

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy");
};

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

const getTypeIcon = (type: AnnouncementType) => {
  switch (type) {
    case "general":
      return <Megaphone className="h-4 w-4 text-blue-600" />;
    case "exam":
      return <GraduationCap className="h-4 w-4 text-red-600" />;
    case "holiday":
      return <Sun className="h-4 w-4 text-green-600" />;
    case "event":
      return <CalendarIcon className="h-4 w-4 text-purple-600" />;
    case "meeting":
      return <Users className="h-4 w-4 text-orange-600" />;
    case "emergency":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "achievement":
      return <Star className="h-4 w-4 text-yellow-600" />;
    case "reminder":
      return <Clock className="h-4 w-4 text-indigo-600" />;
    default:
      return <Megaphone className="h-4 w-4 text-gray-600" />;
  }
};

const getTypeBadge = (type: AnnouncementType) => {
  switch (type) {
    case "general":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">General</Badge>;
    case "exam":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Exam</Badge>;
    case "holiday":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Holiday</Badge>;
    case "event":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Event</Badge>;
    case "meeting":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Meeting</Badge>;
    case "emergency":
      return <Badge className="bg-red-600 text-white">Emergency</Badge>;
    case "achievement":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Achievement</Badge>;
    case "reminder":
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Reminder</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const getPriorityBadge = (priority: AnnouncementPriority) => {
  switch (priority) {
    case "low":
      return <Badge variant="outline" className="text-gray-600">Low</Badge>;
    case "medium":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Medium</Badge>;
    case "high":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
    case "urgent":
      return <Badge className="bg-red-600 text-white">Urgent</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getStatusBadge = (status: AnnouncementStatus) => {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="text-gray-600">Draft</Badge>;
    case "scheduled":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Scheduled</Badge>;
    case "published":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
    case "archived":
      return <Badge variant="outline" className="text-gray-400">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAudienceLabel = (audience: AnnouncementAudience): string => {
  switch (audience.type) {
    case "all":
      return "Everyone";
    case "students":
      return "All Students";
    case "parents":
      return "All Parents";
    case "teachers":
      return "All Teachers";
    case "staff":
      return "All Staff";
    case "custom":
      return "Custom Selection";
    default:
      return "Unknown";
  }
};

// ==================== MOCK DATA ====================

const mockAnnouncements: Announcement[] = [
  {
    id: "ann-001",
    title: "Unit Test 3 Schedule",
    content: "Unit Test 3 for Classes 6-10 will be held from March 20 to March 25. Detailed schedule attached.",
    summary: "Exam schedule for UT3",
    type: "exam",
    priority: "high",
    status: "published",
    audience: { type: "students", classes: ["6", "7", "8", "9", "10"] },
    channels: { inApp: true, email: true, sms: false, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-10T09:30:00",
    updatedAt: "2026-03-10T09:30:00",
    publishedAt: "2026-03-10T09:35:00",
    pinned: true,
    featured: true,
    stats: { views: 245, reads: 189, clicks: 56, reactions: { likes: 34, dislikes: 2 }, comments: 8 },
  },
  {
    id: "ann-002",
    title: "Holiday Notice: Holi",
    content: "School will remain closed on March 25 for Holi. All staff and students are informed.",
    summary: "Holiday on March 25",
    type: "holiday",
    priority: "medium",
    status: "published",
    audience: { type: "all" },
    channels: { inApp: true, email: true, sms: true, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-12T11:15:00",
    updatedAt: "2026-03-12T11:15:00",
    publishedAt: "2026-03-12T11:20:00",
    pinned: false,
    featured: false,
    stats: { views: 512, reads: 478, clicks: 23, reactions: { likes: 67, dislikes: 0 }, comments: 12 },
  },
  {
    id: "ann-003",
    title: "Parent-Teacher Meeting",
    content: "PTM for Classes 10 and 12 will be held on March 22 from 9 AM to 2 PM. All parents are requested to attend.",
    summary: "PTM for Class 10 & 12",
    type: "meeting",
    priority: "high",
    status: "published",
    audience: { type: "parents", classes: ["10", "12"] },
    channels: { inApp: true, email: true, sms: true, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-13T14:30:00",
    updatedAt: "2026-03-13T14:30:00",
    publishedAt: "2026-03-13T14:35:00",
    pinned: true,
    featured: true,
    stats: { views: 387, reads: 312, clicks: 89, reactions: { likes: 45, dislikes: 3 }, comments: 15 },
  },
  {
    id: "ann-004",
    title: "Annual Sports Day",
    content: "Annual Sports Day will be held on March 28. Registration closes on March 20.",
    summary: "Sports Day registration open",
    type: "event",
    priority: "medium",
    status: "published",
    audience: { type: "students" },
    channels: { inApp: true, email: false, sms: false, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-14T10:45:00",
    updatedAt: "2026-03-14T10:45:00",
    publishedAt: "2026-03-14T10:50:00",
    pinned: false,
    featured: true,
    stats: { views: 178, reads: 145, clicks: 67, reactions: { likes: 23, dislikes: 1 }, comments: 5 },
  },
  {
    id: "ann-005",
    title: "Staff Meeting",
    content: "Monthly staff meeting on March 18 at 3 PM in the conference room. All staff must attend.",
    summary: "Staff meeting",
    type: "meeting",
    priority: "high",
    status: "scheduled",
    audience: { type: "staff" },
    channels: { inApp: true, email: true, sms: false, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-15T08:30:00",
    updatedAt: "2026-03-15T08:30:00",
    scheduledFor: "2026-03-18T08:00:00",
    pinned: false,
    featured: false,
  },
  {
    id: "ann-006",
    title: "Fee Payment Reminder",
    content: "Last date for fee payment without fine is March 20. Pay online to avoid queue.",
    summary: "Fee reminder",
    type: "reminder",
    priority: "medium",
    status: "published",
    audience: { type: "parents" },
    channels: { inApp: true, email: true, sms: true, push: true },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-15T12:15:00",
    updatedAt: "2026-03-15T12:15:00",
    publishedAt: "2026-03-15T12:20:00",
    pinned: false,
    featured: false,
    stats: { views: 234, reads: 198, clicks: 45, reactions: { likes: 12, dislikes: 0 }, comments: 3 },
  },
  {
    id: "ann-007",
    title: "Achievement: Science Olympiad",
    content: "Our students won 5 medals in the Regional Science Olympiad. Congratulations to all winners!",
    summary: "Science Olympiad winners",
    type: "achievement",
    priority: "low",
    status: "draft",
    audience: { type: "all" },
    channels: { inApp: true, email: false, sms: false, push: false },
    createdBy: { id: "user-001", name: "Principal Sharma", role: "principal" },
    createdAt: "2026-03-16T09:00:00",
    updatedAt: "2026-03-16T09:00:00",
    pinned: false,
    featured: false,
  },
];

// ==================== MAIN COMPONENT ====================

export default function PrincipalAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filters, setFilters] = useState<AnnouncementFilters>({
    search: "",
    type: "all",
    priority: "all",
    status: "all",
    audience: "all",
    fromDate: null,
    toDate: null,
    pinned: false,
    featured: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: "",
    content: "",
    summary: "",
    type: "general",
    priority: "medium",
    audience: { type: "all" },
    channels: { inApp: true, email: true, sms: false, push: true },
    scheduledFor: "",
    expiresAt: "",
    pinned: false,
    featured: false,
  });

  const loadAnnouncements = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Build query params
      const params: any = {};
      if (filters.type !== "all") params.type = filters.type;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.audience !== "all") params.audience = filters.audience;
      if (filters.pinned) params.pinned = true;
      if (filters.featured) params.featured = true;
      if (filters.search) params.search = filters.search;

      const response = await principalService.getAnnouncements(params);
      const apiData = response.data?.data || [];

      // Transform API data to match frontend format
      const transformed = apiData.map((a: any) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        summary: a.summary,
        type: a.type,
        priority: a.priority,
        status: a.status,
        audience: a.audience,
        channels: a.channels,
        createdBy: a.createdBy,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        scheduledFor: a.scheduledFor,
        expiresAt: a.expiresAt,
        pinned: a.pinned,
        featured: a.featured,
        stats: a.stats,
      }));

      setAnnouncements(transformed);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("Failed to load announcements");
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const stats = useMemo((): AnnouncementStats => {
    const total = announcements.length;
    const published = announcements.filter((a) => a.status === "published").length;
    const scheduled = announcements.filter((a) => a.status === "scheduled").length;
    const draft = announcements.filter((a) => a.status === "draft").length;
    const archived = announcements.filter((a) => a.status === "archived").length;
    const pinned = announcements.filter((a) => a.pinned).length;
    const featured = announcements.filter((a) => a.featured).length;
    const totalViews = announcements.reduce((sum, a) => sum + (a.stats?.views || 0), 0);
    const totalReads = announcements.reduce((sum, a) => sum + (a.stats?.reads || 0), 0);
    const totalReactions = announcements.reduce(
      (sum, a) => sum + (a.stats?.reactions?.likes || 0) + (a.stats?.reactions?.dislikes || 0),
      0
    );

    return { total, published, scheduled, draft, archived, pinned, featured, totalViews, totalReads, totalReactions };
  }, [announcements]);

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return announcements.slice(start, end);
  }, [announcements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(announcements.length / itemsPerPage);

  const handleRefresh = () => {
    loadAnnouncements(true);
    toast.success("Announcements refreshed");
  };

  const handleCreate = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      type: "general",
      priority: "medium",
      audience: { type: "all" },
      channels: { inApp: true, email: true, sms: false, push: true },
      scheduledFor: "",
      expiresAt: "",
      pinned: false,
      featured: false,
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData(announcement);
    setShowEditDialog(true);
  };

  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewDialog(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteDialog(true);
  };

  const handlePinToggle = async (announcement: Announcement) => {
    try {
      await principalService.pinAnnouncement(announcement.id, !announcement.pinned);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, pinned: !a.pinned } : a))
      );
      toast.success(announcement.pinned ? "Announcement unpinned" : "Announcement pinned");
    } catch (error) {
      toast.error("Failed to toggle pin");
    }
  };

  const handleFeaturedToggle = async (announcement: Announcement) => {
    try {
      await principalService.updateAnnouncement(announcement.id, { featured: !announcement.featured });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, featured: !a.featured } : a))
      );
      toast.success(announcement.featured ? "Removed from featured" : "Marked as featured");
    } catch (error) {
      toast.error("Failed to toggle featured");
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await principalService.updateAnnouncement(announcement.id, { status: "published" });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcement.id ? { ...a, status: "published", publishedAt: new Date().toISOString() } : a
        )
      );
      toast.success("Announcement published");
    } catch (error) {
      toast.error("Failed to publish");
    }
  };

  const handleArchive = async (announcement: Announcement) => {
    try {
      await principalService.archiveAnnouncement(announcement.id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, status: "archived" } : a))
      );
      toast.success("Announcement archived");
    } catch (error) {
      toast.error("Failed to archive");
    }
  };

  const handleStats = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowStatsDialog(true);
  };

  const handleDuplicate = async (announcement: Announcement) => {
    try {
      const newAnnouncement: Announcement = {
        ...announcement,
        id: `ann-${Date.now()}`,
        title: `${announcement.title} (Copy)`,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: undefined,
        stats: undefined,
        readBy: undefined,
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      toast.success("Announcement duplicated");
    } catch (error) {
      toast.error("Failed to duplicate");
    }
  };

  const handleSaveCreate = async () => {
    if (!formData.title?.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.content?.trim()) {
      toast.error("Please enter content");
      return;
    }

    try {
      const response = await principalService.createAnnouncement({
        title: formData.title!,
        content: formData.content!,
        audience: formData.audience!,
        pinned: formData.pinned || false,
        featured: formData.featured || false,
      });
      
      setAnnouncements((prev) => [response.data.data, ...prev]);
      setShowCreateDialog(false);
      toast.success("Announcement created successfully");
    } catch (error) {
      toast.error("Failed to create announcement");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAnnouncement) return;
    try {
      const response = await principalService.updateAnnouncement(selectedAnnouncement.id, {
        title: formData.title,
        content: formData.content,
        audience: formData.audience,
        expiresAt: formData.expiresAt,
        pinned: formData.pinned,
        featured: formData.featured,
      });
      
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === selectedAnnouncement.id ? { ...a, ...response.data.data, updatedAt: new Date().toISOString() } : a
        )
      );
      setShowEditDialog(false);
      toast.success("Announcement updated successfully");
    } catch (error) {
      toast.error("Failed to update announcement");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      await principalService.deleteAnnouncement(selectedAnnouncement.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedAnnouncement.id));
      setShowDeleteDialog(false);
      toast.success("Announcement deleted successfully");
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      type: "all",
      priority: "all",
      status: "all",
      audience: "all",
      fromDate: null,
      toDate: null,
      pinned: false,
      featured: false,
    });
    setCurrentPage(1);
    toast.success("Filters reset");
  };

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-1">Create and manage school-wide announcements</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Announcements</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-purple-600">{stats.scheduled}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search announcements..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && loadAnnouncements()}
              className="pl-10"
            />
          </div>
          <Button onClick={() => loadAnnouncements()} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filters.type !== "all" || filters.priority !== "all" || filters.status !== "all" ||
              filters.audience !== "all" || filters.pinned || filters.featured || filters.fromDate || filters.toDate) && (
              <Badge className="ml-2 bg-blue-600 text-white h-5 w-5 p-0 flex items-center justify-center">!</Badge>
            )}
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-none">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-none">
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => handleRefresh()} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger><SelectValue placeholder="All Priorities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={filters.audience} onValueChange={(value) => setFilters((prev) => ({ ...prev, audience: value }))}>
                <SelectTrigger><SelectValue placeholder="All Audiences" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.fromDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fromDate ? format(filters.fromDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filters.fromDate || undefined} onSelect={(date) => setFilters((prev) => ({ ...prev, fromDate: date ?? null }))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.toDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.toDate ? format(filters.toDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filters.toDate || undefined} onSelect={(date) => setFilters((prev) => ({ ...prev, toDate: date ?? null }))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="pinned" checked={filters.pinned} onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, pinned: checked === true }))} />
                <Label htmlFor="pinned">Pinned only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="featured" checked={filters.featured} onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, featured: checked === true }))} />
                <Label htmlFor="featured">Featured only</Label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderListView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Announcements
            <Badge variant="outline" className="ml-2">{announcements.length} total</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No announcements found</p>
            <p className="text-sm mt-2">Create your first announcement to get started</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {announcement.pinned && <Pin className="h-4 w-4 text-blue-600" />}
                          {announcement.featured && <Star className="h-4 w-4 text-yellow-600" />}
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {announcement.summary || announcement.content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(announcement.type)}
                          <span className="text-xs capitalize">{announcement.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getAudienceLabel(announcement.audience)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(announcement.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(announcement.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{announcement.stats?.views || 0} views</p>
                          <p className="text-xs text-muted-foreground">{announcement.stats?.reads || 0} reads</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleView(announcement)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(announcement)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handlePinToggle(announcement)} title={announcement.pinned ? "Unpin" : "Pin"}>
                            {announcement.pinned ? <PinOff className="h-4 w-4 text-blue-600" /> : <Pin className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleFeaturedToggle(announcement)} title={announcement.featured ? "Remove Featured" : "Mark Featured"}>
                            {announcement.featured ? <StarOff className="h-4 w-4 text-yellow-600" /> : <Star className="h-4 w-4" />}
                          </Button>
                          {announcement.status === "draft" && (
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handlePublish(announcement)} title="Publish">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {announcement.status === "published" && (
                            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-700" onClick={() => handleArchive(announcement)} title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDuplicate(announcement)} title="Duplicate">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(announcement)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, announcements.length)} of {announcements.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginatedAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(announcement.type)}
                <div>
                  <p className="font-medium">{announcement.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityBadge(announcement.priority)}
                    {getStatusBadge(announcement.status)}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {announcement.pinned && <Pin className="h-4 w-4 text-blue-600" />}
                {announcement.featured && <Star className="h-4 w-4 text-yellow-600" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {announcement.summary || announcement.content}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audience</span>
                <Badge variant="outline">{getAudienceLabel(announcement.audience)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(announcement.createdAt)}</span>
              </div>
              {announcement.stats && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement</span>
                  <span>{announcement.stats.views} views • {announcement.stats.reads} reads</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
              <Button size="sm" variant="ghost" onClick={() => handleView(announcement)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(announcement)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCreateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>Create an announcement for students, parents, teachers, or staff</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter announcement title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (Optional)</Label>
            <Input id="summary" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Brief summary for preview" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Enter announcement details..." className="min-h-[120px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type as string} onValueChange={(value) => setFormData({ ...formData, type: value as AnnouncementType })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority as string} onValueChange={(value) => setFormData({ ...formData, priority: value as AnnouncementPriority })}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={formData.audience?.type} onValueChange={(value) => setFormData({ ...formData, audience: { type: value as AnnouncementAudience["type"] } })}>
              <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="students">All Students</SelectItem>
                <SelectItem value="parents">All Parents</SelectItem>
                <SelectItem value="teachers">All Teachers</SelectItem>
                <SelectItem value="staff">All Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notification Channels</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="channel-inapp" checked={formData.channels?.inApp} onCheckedChange={(checked) => setFormData({ ...formData, channels: { ...formData.channels!, inApp: checked === true } })} />
                <Label htmlFor="channel-inapp">In-App</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="channel-email" checked={formData.channels?.email} onCheckedChange={(checked) => setFormData({ ...formData, channels: { ...formData.channels!, email: checked === true } })} />
                <Label htmlFor="channel-email">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="channel-sms" checked={formData.channels?.sms} onCheckedChange={(checked) => setFormData({ ...formData, channels: { ...formData.channels!, sms: checked === true } })} />
                <Label htmlFor="channel-sms">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="channel-push" checked={formData.channels?.push} onCheckedChange={(checked) => setFormData({ ...formData, channels: { ...formData.channels!, push: checked === true } })} />
                <Label htmlFor="channel-push">Push</Label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <Input type="datetime-local" value={formData.scheduledFor || ""} onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Expires (Optional)</Label>
              <Input type="datetime-local" value={formData.expiresAt || ""} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="pinned" checked={formData.pinned} onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked === true })} />
              <Label htmlFor="pinned">Pin to top</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="featured" checked={formData.featured} onCheckedChange={(checked) => setFormData({ ...formData, featured: checked === true })} />
              <Label htmlFor="featured">Mark as featured</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCreate}><Save className="h-4 w-4 mr-2" />Create Announcement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderViewDialog = () => (
    <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedAnnouncement && getTypeIcon(selectedAnnouncement.type)}
            Announcement Details
          </DialogTitle>
        </DialogHeader>
        {selectedAnnouncement && (
          <div className="space-y-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedAnnouncement.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeBadge(selectedAnnouncement.type)}
                  {getPriorityBadge(selectedAnnouncement.priority)}
                  {getStatusBadge(selectedAnnouncement.status)}
                  {selectedAnnouncement.pinned && (<Badge className="bg-blue-100 text-blue-800 border-blue-200"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>)}
                  {selectedAnnouncement.featured && (<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Star className="h-3 w-3 mr-1" />Featured</Badge>)}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleStats(selectedAnnouncement)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </Button>
            </div>
            {selectedAnnouncement.summary && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Summary</p>
                <p className="text-sm text-gray-600 mt-1">{selectedAnnouncement.summary}</p>
              </div>
            )}
            <div className="p-4 bg-white border rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Audience</p>
                <p className="font-medium">{getAudienceLabel(selectedAnnouncement.audience)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{selectedAnnouncement.createdBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDateTime(selectedAnnouncement.createdAt)}</p>
              </div>
              {selectedAnnouncement.publishedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Published At</p>
                  <p className="font-medium">{formatDateTime(selectedAnnouncement.publishedAt)}</p>
                </div>
              )}
              {selectedAnnouncement.scheduledFor && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled For</p>
                  <p className="font-medium">{formatDateTime(selectedAnnouncement.scheduledFor)}</p>
                </div>
              )}
              {selectedAnnouncement.expiresAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Expires At</p>
                  <p className="font-medium">{formatDateTime(selectedAnnouncement.expiresAt)}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notification Channels</p>
              <div className="flex gap-2">
                {selectedAnnouncement.channels.inApp && (<Badge variant="outline" className="bg-blue-50"><Bell className="h-3 w-3 mr-1" />In-App</Badge>)}
                {selectedAnnouncement.channels.email && (<Badge variant="outline" className="bg-green-50"><Mail className="h-3 w-3 mr-1" />Email</Badge>)}
                {selectedAnnouncement.channels.sms && (<Badge variant="outline" className="bg-yellow-50"><Phone className="h-3 w-3 mr-1" />SMS</Badge>)}
                {selectedAnnouncement.channels.push && (<Badge variant="outline" className="bg-purple-50"><BellRing className="h-3 w-3 mr-1" />Push</Badge>)}
              </div>
            </div>
            {selectedAnnouncement.stats && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Engagement</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedAnnouncement.stats.views}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedAnnouncement.stats.reads}</p>
                    <p className="text-xs text-muted-foreground">Reads</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedAnnouncement.stats.reactions.likes}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          {selectedAnnouncement && selectedAnnouncement.status === "draft" && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setShowViewDialog(false); handlePublish(selectedAnnouncement); }}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderStatsDialog = () => (
    <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Engagement Statistics</DialogTitle>
          <DialogDescription>{selectedAnnouncement?.title}</DialogDescription>
        </DialogHeader>
        {selectedAnnouncement && selectedAnnouncement.stats && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{selectedAnnouncement.stats.views}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{selectedAnnouncement.stats.reads}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Reads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{selectedAnnouncement.stats.clicks || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Clicks</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Reactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span>Likes</span>
                    </div>
                    <span className="font-bold">{selectedAnnouncement.stats.reactions.likes}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span>Dislikes</span>
                    </div>
                    <span className="font-bold">{selectedAnnouncement.stats.reactions.dislikes}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-center">{selectedAnnouncement.stats.comments || 0}</p>
                </CardContent>
              </Card>
            </div>
            {selectedAnnouncement.readBy && selectedAnnouncement.readBy.length > 0 && (
              <div>
                <p className="font-medium mb-2">Read By</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Read At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAnnouncement.readBy.slice(0, 5).map((reader) => (
                        <TableRow key={reader.userId}>
                          <TableCell>{reader.userName}</TableCell>
                          <TableCell>{reader.userRole}</TableCell>
                          <TableCell>{formatDateTime(reader.readAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStatsDialog(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}
      {viewMode === "list" ? renderListView() : renderGridView()}
      {renderCreateDialog()}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea id="edit-content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {renderViewDialog()}
      {renderDeleteDialog()}
      {renderStatsDialog()}
    </div>
  );
}
