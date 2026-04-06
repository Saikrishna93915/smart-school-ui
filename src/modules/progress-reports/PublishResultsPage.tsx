import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Eye,
  RotateCcw,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart,
  Info,
  Search,
  Lock,
  Unlock,
  Shield,
  Bell,
  X as XIcon,
} from 'lucide-react';

// ==================== TYPES ====================

type ResultCycle = {
  id: string;
  examName: string;
  examType: string;
  examCode: string;
  className: string;
  section: string;
  academicYear: string;
  totalStudents: number;
  marksEntryCompleted: number;
  verifiedCount: number;
  verifiedPercentage: number;
  status: 'draft' | 'ready' | 'published' | 'archived';
  lastUpdated: string;
  publishDate?: string;
  publishedBy?: string;
  publishedAt?: string;
  rollbackCount?: number;
  lastRollbackAt?: string;
  lastRollbackBy?: string;
  comments?: string;
  isLocked: boolean;
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notificationSent: boolean;
  notificationDate?: string;
  studentAccessCount?: number;
  parentAccessCount?: number;
};

type NotificationSettings = {
  notifyStudents: boolean;
  notifyParents: boolean;
  sendSMS: boolean;
  sendEmail: boolean;
  sendPush: boolean;
  notifyMessage: string;
};

type PublishStats = {
  totalCycles: number;
  published: number;
  ready: number;
  draft: number;
  archived: number;
  totalStudents: number;
  totalPublishedStudents: number;
  pendingApproval: number;
  lockedCycles: number;
  averageVerificationRate: number;
};

// ==================== STATIC DATA ====================

const academicYears = [
  { value: '2025-26', label: '2025-26', current: true },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
];

const examTypes = [
  { value: 'all', label: 'All Exam Types' },
  { value: 'unit-test-1', label: 'Unit Test 1' },
  { value: 'unit-test-2', label: 'Unit Test 2' },
  { value: 'quarterly', label: 'Quarterly Exam' },
  { value: 'unit-test-3', label: 'Unit Test 3' },
  { value: 'unit-test-4', label: 'Unit Test 4' },
  { value: 'half-yearly', label: 'Half Yearly Exam' },
  { value: 'unit-test-5', label: 'Unit Test 5' },
  { value: 'unit-test-6', label: 'Unit Test 6' },
  { value: 'annual', label: 'Annual Exam' },
];

const classOptions = [
  { value: 'all', label: 'All Classes' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
];

const sectionOptions = ['A', 'B', 'C', 'D'];

const initialResultCycles: ResultCycle[] = [
  {
    id: 'RC-1001',
    examName: 'Unit Test 2 - Class 10A',
    examType: 'unit-test-2',
    examCode: 'UT2-10A-2025',
    className: '10',
    section: 'A',
    academicYear: '2025-26',
    totalStudents: 48,
    marksEntryCompleted: 100,
    verifiedCount: 48,
    verifiedPercentage: 100,
    status: 'ready',
    lastUpdated: '2026-03-05T10:30:00Z',
    isLocked: false,
    requiresApproval: false,
    notificationSent: false,
  },
  {
    id: 'RC-1002',
    examName: 'Unit Test 2 - Class 9B',
    examType: 'unit-test-2',
    examCode: 'UT2-9B-2025',
    className: '9',
    section: 'B',
    academicYear: '2025-26',
    totalStudents: 42,
    marksEntryCompleted: 92,
    verifiedCount: 35,
    verifiedPercentage: 83,
    status: 'draft',
    lastUpdated: '2026-03-06T14:20:00Z',
    isLocked: false,
    requiresApproval: false,
    notificationSent: false,
  },
  {
    id: 'RC-1003',
    examName: 'Quarterly - Class 8A',
    examType: 'quarterly',
    examCode: 'QTR-8A-2025',
    className: '8',
    section: 'A',
    academicYear: '2025-26',
    totalStudents: 45,
    marksEntryCompleted: 100,
    verifiedCount: 45,
    verifiedPercentage: 100,
    status: 'published',
    lastUpdated: '2026-02-20T09:15:00Z',
    publishDate: '2026-02-21T11:00:00Z',
    publishedBy: 'Admin',
    publishedAt: '2026-02-21T11:00:00Z',
    isLocked: true,
    requiresApproval: false,
    notificationSent: true,
    notificationDate: '2026-02-21T11:05:00Z',
    studentAccessCount: 42,
    parentAccessCount: 38,
  },
  {
    id: 'RC-1004',
    examName: 'Unit Test 1 - Class 7C',
    examType: 'unit-test-1',
    examCode: 'UT1-7C-2025',
    className: '7',
    section: 'C',
    academicYear: '2025-26',
    totalStudents: 39,
    marksEntryCompleted: 100,
    verifiedCount: 38,
    verifiedPercentage: 97,
    status: 'ready',
    lastUpdated: '2026-03-04T16:45:00Z',
    isLocked: false,
    requiresApproval: true,
    approvalStatus: 'pending',
    notificationSent: false,
  },
  {
    id: 'RC-1005',
    examName: 'Half Yearly - Class 10B',
    examType: 'half-yearly',
    examCode: 'HY-10B-2025',
    className: '10',
    section: 'B',
    academicYear: '2025-26',
    totalStudents: 46,
    marksEntryCompleted: 100,
    verifiedCount: 46,
    verifiedPercentage: 100,
    status: 'published',
    lastUpdated: '2026-01-15T13:20:00Z',
    publishDate: '2026-01-18T10:30:00Z',
    publishedBy: 'Principal',
    publishedAt: '2026-01-18T10:30:00Z',
    rollbackCount: 1,
    lastRollbackAt: '2026-01-20T09:00:00Z',
    lastRollbackBy: 'Admin',
    comments: 'Corrected grade calculation error',
    isLocked: true,
    requiresApproval: false,
    notificationSent: true,
    notificationDate: '2026-01-18T10:35:00Z',
    studentAccessCount: 44,
    parentAccessCount: 41,
  },
  {
    id: 'RC-1006',
    examName: 'Annual Exam - Class 12A',
    examType: 'annual',
    examCode: 'ANN-12A-2025',
    className: '12',
    section: 'A',
    academicYear: '2025-26',
    totalStudents: 52,
    marksEntryCompleted: 100,
    verifiedCount: 52,
    verifiedPercentage: 100,
    status: 'published',
    lastUpdated: '2026-03-01T12:00:00Z',
    publishDate: '2026-03-02T09:00:00Z',
    publishedBy: 'Exam Controller',
    publishedAt: '2026-03-02T09:00:00Z',
    isLocked: true,
    requiresApproval: false,
    notificationSent: true,
    notificationDate: '2026-03-02T09:05:00Z',
    studentAccessCount: 50,
    parentAccessCount: 48,
  },
  {
    id: 'RC-1007',
    examName: 'Unit Test 3 - Class 8B',
    examType: 'unit-test-3',
    examCode: 'UT3-8B-2025',
    className: '8',
    section: 'B',
    academicYear: '2025-26',
    totalStudents: 43,
    marksEntryCompleted: 85,
    verifiedCount: 30,
    verifiedPercentage: 70,
    status: 'draft',
    lastUpdated: '2026-03-07T08:15:00Z',
    isLocked: false,
    requiresApproval: false,
    notificationSent: false,
  },
  {
    id: 'RC-1008',
    examName: 'Unit Test 4 - Class 9A',
    examType: 'unit-test-4',
    examCode: 'UT4-9A-2025',
    className: '9',
    section: 'A',
    academicYear: '2025-26',
    totalStudents: 44,
    marksEntryCompleted: 100,
    verifiedCount: 42,
    verifiedPercentage: 95,
    status: 'ready',
    lastUpdated: '2026-03-03T11:30:00Z',
    isLocked: false,
    requiresApproval: true,
    approvalStatus: 'approved',
    approvedBy: 'Principal',
    approvedAt: '2026-03-04T10:00:00Z',
    notificationSent: false,
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getStatusBadge = (status: ResultCycle['status'], requiresApproval?: boolean, approvalStatus?: string) => {
  if (status === 'published') {
    return (
      <Badge className="bg-green-600 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Published
      </Badge>
    );
  }
  if (status === 'ready') {
    if (requiresApproval) {
      if (approvalStatus === 'pending') {
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      }
      if (approvalStatus === 'approved') {
        return (
          <Badge className="bg-blue-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      }
      if (approvalStatus === 'rejected') {
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XIcon className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      }
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        Ready to Publish
      </Badge>
    );
  }
  if (status === 'archived') {
    return (
      <Badge variant="outline" className="text-gray-600">
        <Lock className="h-3 w-3 mr-1" />
        Archived
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Draft
    </Badge>
  );
};

const calculateStats = (cycles: ResultCycle[]): PublishStats => {
  const totalCycles = cycles.length;
  const published = cycles.filter(c => c.status === 'published').length;
  const ready = cycles.filter(c => c.status === 'ready' && (!c.requiresApproval || c.approvalStatus === 'approved')).length;
  const draft = cycles.filter(c => c.status === 'draft').length;
  const archived = cycles.filter(c => c.status === 'archived').length;
  const totalStudents = cycles.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalPublishedStudents = cycles
    .filter(c => c.status === 'published')
    .reduce((sum, c) => sum + c.totalStudents, 0);
  const pendingApproval = cycles.filter(c => c.requiresApproval && c.approvalStatus === 'pending').length;
  const lockedCycles = cycles.filter(c => c.isLocked).length;
  const averageVerificationRate = cycles.reduce((sum, c) => sum + c.verifiedPercentage, 0) / cycles.length;

  return {
    totalCycles,
    published,
    ready,
    draft,
    archived,
    totalStudents,
    totalPublishedStudents,
    pendingApproval,
    lockedCycles,
    averageVerificationRate,
  };
};

// ==================== MAIN COMPONENT ====================

export default function PublishResultsPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // Data states
  const [resultCycles, setResultCycles] = useState<ResultCycle[]>(initialResultCycles);
  const [filteredCycles, setFilteredCycles] = useState<ResultCycle[]>(initialResultCycles);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOnlyLocked, setShowOnlyLocked] = useState(false);
  const [showOnlyPendingApproval, setShowOnlyPendingApproval] = useState(false);
  
  // Dialog states
  const [selectedCycle, setSelectedCycle] = useState<ResultCycle | null>(null);
  const [dialogMode, setDialogMode] = useState<'publish' | 'rollback' | 'archive' | 'approve' | 'reject' | 'lock' | 'unlock' | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isBulkPublishDialogOpen, setIsBulkPublishDialogOpen] = useState(false);
  
  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState('');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    notifyStudents: true,
    notifyParents: true,
    sendSMS: true,
    sendEmail: true,
    sendPush: false,
    notifyMessage: 'Your exam results have been published. Please check the parent portal.',
  });
  
  // Preview state
  const [previewMode, setPreviewMode] = useState<'student' | 'parent'>('student');
  
  // Current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo(() => calculateStats(resultCycles), [resultCycles]);

  // Apply filters
  useEffect(() => {
    let filtered = resultCycles.filter(cycle => cycle.academicYear === selectedYear);
    
    if (selectedExamType !== 'all') {
      filtered = filtered.filter(cycle => cycle.examType === selectedExamType);
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(cycle => cycle.className === selectedClass);
    }
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter(cycle => cycle.section === selectedSection);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(cycle => 
        cycle.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.examCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cycle => cycle.status === statusFilter);
    }
    
    if (showOnlyLocked) {
      filtered = filtered.filter(cycle => cycle.isLocked);
    }
    
    if (showOnlyPendingApproval) {
      filtered = filtered.filter(cycle => cycle.requiresApproval && cycle.approvalStatus === 'pending');
    }
    
    setFilteredCycles(filtered);
    setCurrentPage(1);
  }, [resultCycles, selectedYear, selectedExamType, selectedClass, selectedSection, searchTerm, statusFilter, showOnlyLocked, showOnlyPendingApproval]);

  // Pagination
  const totalPages = Math.ceil(filteredCycles.length / itemsPerPage);
  const paginatedCycles = filteredCycles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ==================== HANDLER FUNCTIONS ====================

  const handlePublishAll = () => {
    const readyCycles = resultCycles.filter(c => 
      c.status === 'ready' && (!c.requiresApproval || c.approvalStatus === 'approved')
    );
    
    if (readyCycles.length === 0) {
      toast.error('No cycles ready for publication');
      return;
    }
    
    setIsBulkPublishDialogOpen(true);
  };

  const handleConfirmBulkPublish = () => {
    const now = new Date().toISOString();
    
    const updatedCycles = resultCycles.map(cycle => {
      if (cycle.status === 'ready' && (!cycle.requiresApproval || cycle.approvalStatus === 'approved')) {
        return {
          ...cycle,
          status: 'published' as const,
          publishDate: now,
          publishedBy: 'Admin',
          publishedAt: now,
          isLocked: true,
          notificationSent: notificationSettings.notifyStudents || notificationSettings.notifyParents,
          notificationDate: notificationSettings.notifyStudents || notificationSettings.notifyParents ? now : undefined,
        };
      }
      return cycle;
    });
    
    setResultCycles(updatedCycles);
    setIsBulkPublishDialogOpen(false);
    toast.success(`Published ${resultCycles.filter(c => c.status === 'ready').length} result cycles`);
  };

  const handlePublish = () => {
    if (!selectedCycle) return;
    
    const now = new Date().toISOString();
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            status: 'published' as const,
            publishDate: now,
            publishedBy: 'Admin',
            publishedAt: now,
            isLocked: true,
            notificationSent: notificationSettings.notifyStudents || notificationSettings.notifyParents,
            notificationDate: notificationSettings.notifyStudents || notificationSettings.notifyParents ? now : undefined,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Results published for ${selectedCycle.examName}`);
  };

  const handleRollback = () => {
    if (!selectedCycle) return;
    
    const now = new Date().toISOString();
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            status: 'ready' as const,
            publishDate: undefined,
            publishedBy: undefined,
            publishedAt: undefined,
            isLocked: false,
            notificationSent: false,
            notificationDate: undefined,
            rollbackCount: (cycle.rollbackCount || 0) + 1,
            lastRollbackAt: now,
            lastRollbackBy: 'Admin',
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Results rolled back for ${selectedCycle.examName}`);
  };

  const handleArchive = () => {
    if (!selectedCycle) return;
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            status: 'archived' as const,
            isLocked: true,
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Cycle archived for ${selectedCycle.examName}`);
  };

  const handleApprove = () => {
    if (!selectedCycle) return;
    
    const now = new Date().toISOString();
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            approvalStatus: 'approved' as const,
            approvedBy: 'Principal',
            approvedAt: now,
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Cycle approved for ${selectedCycle.examName}`);
  };

  const handleReject = () => {
    if (!selectedCycle) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            approvalStatus: 'rejected' as const,
            rejectionReason: rejectionReason,
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    setRejectionReason('');
    closeDialog();
    toast.error(`Cycle rejected for ${selectedCycle.examName}`);
  };

  const handleLock = () => {
    if (!selectedCycle) return;
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            isLocked: true,
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Cycle locked for ${selectedCycle.examName}`);
  };

  const handleUnlock = () => {
    if (!selectedCycle) return;
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            isLocked: false,
            comments: comments || cycle.comments,
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    closeDialog();
    toast.success(`Cycle unlocked for ${selectedCycle.examName}`);
  };

  const handleSendNotifications = () => {
    if (!selectedCycle) return;
    
    const updatedCycles = resultCycles.map(cycle => 
      cycle.id === selectedCycle.id 
        ? {
            ...cycle,
            notificationSent: true,
            notificationDate: new Date().toISOString(),
          }
        : cycle
    );
    
    setResultCycles(updatedCycles);
    setIsNotificationDialogOpen(false);
    setSelectedCycle(null);
    toast.success(`Notifications sent for ${selectedCycle.examName}`);
  };

  const handleRefresh = () => {
    setResultCycles([...initialResultCycles]);
    toast.success('Data refreshed');
  };

  const resetFilters = () => {
    setSelectedYear('2025-26');
    setSelectedExamType('all');
    setSelectedClass('all');
    setSelectedSection('all');
    setSearchTerm('');
    setStatusFilter('all');
    setShowOnlyLocked(false);
    setShowOnlyPendingApproval(false);
    toast.success('Filters reset');
  };

  const closeDialog = () => {
    setSelectedCycle(null);
    setDialogMode(null);
    setRejectionReason('');
    setComments('');
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Publish Results</h1>
        <p className="text-muted-foreground mt-1">
          Publish verified exam results for report-card visibility to parents and students.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" onClick={() => setIsStatsDialogOpen(true)}>
          <BarChart className="h-4 w-4 mr-2" />
          Statistics
        </Button>
        <Button onClick={handlePublishAll} className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4 mr-2" />
          Publish All Ready
        </Button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cycles</p>
              <p className="text-2xl font-bold">{stats.totalCycles}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
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
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ready to Publish</p>
              <p className="text-2xl font-bold text-blue-600">{stats.ready}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pendingApproval}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Students Impacted</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label} {year.current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedExamType} onValueChange={setSelectedExamType}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map((exam) => (
                <SelectItem key={exam.value} value={exam.value}>
                  {exam.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger>
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sectionOptions.map((sec) => (
                <SelectItem key={sec} value={sec}>
                  Section {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by exam name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="locked"
                checked={showOnlyLocked}
                onCheckedChange={setShowOnlyLocked}
              />
              <Label htmlFor="locked" className="text-sm cursor-pointer">
                Locked only
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="pending"
                checked={showOnlyPendingApproval}
                onCheckedChange={setShowOnlyPendingApproval}
              />
              <Label htmlFor="pending" className="text-sm cursor-pointer">
                Pending approval
              </Label>
            </div>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <Badge variant="outline" className="px-3 py-1">
            {filteredCycles.length} of {resultCycles.length} cycles
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Result Publication Queue
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Cycle</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Marks Entry</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lock</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No result cycles found for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCycles.map((cycle) => {
                    const verificationPercent = cycle.verifiedPercentage;
                    return (
                      <TableRow key={cycle.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{cycle.examName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{cycle.examCode}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{examTypes.find(e => e.value === cycle.examType)?.label}</p>
                          </div>
                        </TableCell>
                        <TableCell>{cycle.className} - {cycle.section}</TableCell>
                        <TableCell>{cycle.totalStudents}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={cycle.marksEntryCompleted} className="w-16 h-2" />
                            <span className="text-sm font-medium">{cycle.marksEntryCompleted}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress value={verificationPercent} className="w-16 h-2" />
                              <span className="text-sm font-medium">{verificationPercent}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {cycle.verifiedCount}/{cycle.totalStudents}
                            </p>
                            {verificationPercent === 100 ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(cycle.status, cycle.requiresApproval, cycle.approvalStatus)}
                            {cycle.requiresApproval && cycle.approvalStatus === 'pending' && (
                              <p className="text-xs text-purple-600 mt-1">Awaiting approval</p>
                            )}
                            {cycle.requiresApproval && cycle.approvalStatus === 'rejected' && (
                              <p className="text-xs text-red-600 mt-1">Rejected</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cycle.isLocked ? (
                            <Lock className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Unlock className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(cycle.lastUpdated).toLocaleDateString()}</p>
                            {cycle.publishDate ? (
                              <p className="text-xs text-muted-foreground">
                                Published: {new Date(cycle.publishDate).toLocaleDateString()}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCycle(cycle);
                                setIsPreviewDialogOpen(true);
                              }}
                              title="Preview Result Sheet"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {!cycle.notificationSent && cycle.status === 'published' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setSelectedCycle(cycle);
                                  setIsNotificationDialogOpen(true);
                                }}
                                title="Send Notifications"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            )}

                            {cycle.requiresApproval && cycle.approvalStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => {
                                    setSelectedCycle(cycle);
                                    setDialogMode('approve');
                                  }}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedCycle(cycle);
                                    setDialogMode('reject');
                                  }}
                                  title="Reject"
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {cycle.isLocked ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:text-amber-700"
                                onClick={() => {
                                  setSelectedCycle(cycle);
                                  setDialogMode('unlock');
                                }}
                                title="Unlock"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:text-amber-700"
                                onClick={() => {
                                  setSelectedCycle(cycle);
                                  setDialogMode('lock');
                                }}
                                title="Lock"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}

                            {cycle.status === 'published' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedCycle(cycle);
                                  setDialogMode('rollback');
                                }}
                                title="Rollback"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={cycle.status !== 'ready' || (cycle.requiresApproval && cycle.approvalStatus !== 'approved')}
                                className={cycle.status === 'ready' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                onClick={() => {
                                  setSelectedCycle(cycle);
                                  setDialogMode('publish');
                                }}
                                title={cycle.status === 'ready' ? 'Publish' : 'Not ready'}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-600 hover:text-gray-700"
                              onClick={() => {
                                setSelectedCycle(cycle);
                                setDialogMode('archive');
                              }}
                              title="Archive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {filteredCycles.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCycles.length)} of {filteredCycles.length} cycles
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? 'bg-blue-600' : ''}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGuidelines = () => (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Publication Rules</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Only cycles with full marks entry (100%) and verification can be published</li>
              <li>Published results become visible to students and parents immediately</li>
              <li>Some cycles may require approval from Principal before publishing</li>
              <li>Locked cycles cannot be modified until unlocked by admin</li>
              <li>Rollback should be used only for correction scenarios after admin approval</li>
              <li>Archived cycles are hidden from main view but preserved for audit</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ==================== DIALOG RENDER FUNCTIONS ====================

  const renderPreviewDialog = () => (
    <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview Result Sheet</DialogTitle>
          <DialogDescription>
            View how results will appear to students and parents
          </DialogDescription>
        </DialogHeader>
        {selectedCycle && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exam</p>
                <p className="font-medium">{selectedCycle.examName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={previewMode === 'student' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setPreviewMode('student')}
                >
                  Student View
                </Badge>
                <Badge
                  variant={previewMode === 'parent' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setPreviewMode('parent')}
                >
                  Parent View
                </Badge>
              </div>
            </div>

            <Card className="border-2">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg">Result Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-medium">Sample Student</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Roll Number</p>
                      <p className="font-medium">{selectedCycle.className}{selectedCycle.section}-01</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="font-medium">{selectedCycle.className} - {selectedCycle.section}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Exam</p>
                      <p className="font-medium">{examTypes.find(e => e.value === selectedCycle.examType)?.label}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="font-semibold mb-2">Subject-wise Marks</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Mathematics</span>
                        <span className="font-bold text-green-600">85%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Science</span>
                        <span className="font-bold text-green-600">78%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>English</span>
                        <span className="font-bold text-green-600">82%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Social Studies</span>
                        <span className="font-bold text-green-600">71%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Hindi</span>
                        <span className="font-bold text-green-600">79%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Marks</p>
                        <p className="text-2xl font-bold">395/500</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <p className="text-2xl font-bold text-green-600">79%</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <Badge className="bg-green-600 text-white text-lg px-4 py-1">B+</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rank</p>
                        <p className="text-xl font-bold">8/48</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {previewMode === 'parent' && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-3 text-sm text-purple-700">
                  <Info className="h-4 w-4 inline mr-2" />
                  Parents see the same result summary with additional options to download and print.
                </CardContent>
              </Card>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsPreviewDialogOpen(false);
            setSelectedCycle(null);
          }}>
            Close
          </Button>
          <Button onClick={() => {
            toast.info('Download functionality coming soon');
          }}>
            <Download className="h-4 w-4 mr-2" />
            Download Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderActionDialog = () => (
    <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === 'publish' && 'Confirm Publish'}
            {dialogMode === 'rollback' && 'Confirm Rollback'}
            {dialogMode === 'archive' && 'Confirm Archive'}
            {dialogMode === 'approve' && 'Approve Cycle'}
            {dialogMode === 'reject' && 'Reject Cycle'}
            {dialogMode === 'lock' && 'Lock Cycle'}
            {dialogMode === 'unlock' && 'Unlock Cycle'}
          </DialogTitle>
          <DialogDescription>
            {selectedCycle && (
              <>
                {dialogMode === 'publish' && `You are about to publish ${selectedCycle.examName}. This will make results visible to students and parents.`}
                {dialogMode === 'rollback' && `You are about to rollback published results for ${selectedCycle.examName}. This will hide results from view.`}
                {dialogMode === 'archive' && `You are about to archive ${selectedCycle.examName}. Archived cycles can be restored later.`}
                {dialogMode === 'approve' && `Approve ${selectedCycle.examName} for publication.`}
                {dialogMode === 'reject' && `Reject ${selectedCycle.examName}. Please provide a reason.`}
                {dialogMode === 'lock' && `Lock ${selectedCycle.examName} to prevent modifications.`}
                {dialogMode === 'unlock' && `Unlock ${selectedCycle.examName} to allow modifications.`}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {dialogMode === 'reject' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this cycle is being rejected..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}

        {(dialogMode === 'rollback' || dialogMode === 'archive' || dialogMode === 'lock' || dialogMode === 'unlock') && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comments (Optional)</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about this action..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant={
              dialogMode === 'publish' ? 'default' :
              dialogMode === 'rollback' ? 'destructive' :
              dialogMode === 'reject' ? 'destructive' :
              'default'
            }
            className={
              dialogMode === 'approve' ? 'bg-green-600 hover:bg-green-700' :
              dialogMode === 'reject' ? 'bg-red-600 hover:bg-red-700' :
              dialogMode === 'publish' ? 'bg-blue-600 hover:bg-blue-700' :
              ''
            }
            onClick={() => {
              if (dialogMode === 'publish') handlePublish();
              if (dialogMode === 'rollback') handleRollback();
              if (dialogMode === 'archive') handleArchive();
              if (dialogMode === 'approve') handleApprove();
              if (dialogMode === 'reject') handleReject();
              if (dialogMode === 'lock') handleLock();
              if (dialogMode === 'unlock') handleUnlock();
            }}
          >
            {dialogMode === 'publish' && 'Publish Now'}
            {dialogMode === 'rollback' && 'Rollback Now'}
            {dialogMode === 'archive' && 'Archive Now'}
            {dialogMode === 'approve' && 'Approve Cycle'}
            {dialogMode === 'reject' && 'Reject Cycle'}
            {dialogMode === 'lock' && 'Lock Cycle'}
            {dialogMode === 'unlock' && 'Unlock Cycle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderNotificationDialog = () => (
    <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Send Notifications
          </DialogTitle>
          <DialogDescription>
            Notify students and parents about published results
          </DialogDescription>
        </DialogHeader>
        {selectedCycle && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-students">Notify Students</Label>
                <Switch
                  id="notify-students"
                  checked={notificationSettings.notifyStudents}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, notifyStudents: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-parents">Notify Parents</Label>
                <Switch
                  id="notify-parents"
                  checked={notificationSettings.notifyParents}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, notifyParents: checked})}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Notification Channels</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-sms">SMS</Label>
                <Switch
                  id="send-sms"
                  checked={notificationSettings.sendSMS}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sendSMS: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-email">Email</Label>
                <Switch
                  id="send-email"
                  checked={notificationSettings.sendEmail}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sendEmail: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-push">Push Notification</Label>
                <Switch
                  id="send-push"
                  checked={notificationSettings.sendPush}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sendPush: checked})}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="message">Notification Message</Label>
              <Textarea
                id="message"
                value={notificationSettings.notifyMessage}
                onChange={(e) => setNotificationSettings({...notificationSettings, notifyMessage: e.target.value})}
                placeholder="Enter notification message..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This will be sent to {selectedCycle.totalStudents} students and {selectedCycle.totalStudents} parents
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsNotificationDialogOpen(false);
            setSelectedCycle(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSendNotifications}>
            <Bell className="h-4 w-4 mr-2" />
            Send Notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderStatsDialog = () => (
    <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b bg-white">
          <DialogTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-600" />
            Publication Statistics
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Cycles</p>
                <p className="text-3xl font-bold">{stats.totalCycles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ready to Publish</p>
                <p className="text-2xl font-bold text-blue-600">{stats.ready}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingApproval}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Locked Cycles</p>
                <p className="text-2xl font-bold text-amber-600">{stats.lockedCycles}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Published Students</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPublishedStudents}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg Verification</p>
                <p className="text-2xl font-bold">{stats.averageVerificationRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Publication Timeline</h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {resultCycles
                .filter(c => c.status === 'published')
                .slice(0, 5)
                .map(cycle => (
                  <div key={cycle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{cycle.examName}</p>
                      <p className="text-xs text-muted-foreground">
                        Published on {new Date(cycle.publishDate || '').toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {cycle.totalStudents} students
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={() => setIsStatsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderBulkPublishDialog = () => (
    <AlertDialog open={isBulkPublishDialogOpen} onOpenChange={setIsBulkPublishDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish All Ready Cycles</AlertDialogTitle>
          <AlertDialogDescription>
            This will publish {resultCycles.filter(c => c.status === 'ready' && (!c.requiresApproval || c.approvalStatus === 'approved')).length} result cycles.
            Notifications will be sent according to your settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This action cannot be undone. Published results will be immediately visible.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Send Notifications</Label>
              <Switch
                checked={notificationSettings.notifyStudents || notificationSettings.notifyParents}
                onCheckedChange={(checked) => setNotificationSettings({
                  ...notificationSettings,
                  notifyStudents: checked,
                  notifyParents: checked,
                })}
              />
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsBulkPublishDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmBulkPublish} className="bg-blue-600 hover:bg-blue-700">
            Publish All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderStats()}
      {renderFilters()}
      {renderTable()}
      {renderGuidelines()}

      {/* Dialogs */}
      {renderPreviewDialog()}
      {renderActionDialog()}
      {renderNotificationDialog()}
      {renderStatsDialog()}
      {renderBulkPublishDialog()}
    </div>
  );
}
