import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import TimetableGrid from '../components/timetable/TimetableGrid';
import TeacherTimetable from '../components/timetable/TeacherTimetable';
import StudentTimetable from '../components/timetable/StudentTimetable';
import ParentTimetable from './parent/ParentTimetable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  User,
  Download,
  Upload,
  Search,
  Target,
  BarChart,
  Users,
  Grid3x3,
  Eye,
  Bell,
  Settings,
  TrendingUp,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ClassDoc {
  _id: string;
  className: string;
  sections?: string[];
}

interface TimetableDoc {
  _id: string;
  classId?: string | { _id?: string; className?: string };
  sectionId?: string;
  academicYearId?: string;
  term?: string;
  isPublished?: boolean;
  status?: string;
  assignedPeriods?: number;
  totalPeriods?: number;
  hasConflicts?: boolean;
  conflictCount?: number;
}

interface ConflictDoc {
  _id: string;
  timetableId?: { classId?: { className?: string }; sectionId?: string };
  dayName?: string;
  subjectId?: { subjectName?: string };
  teacherId?: { name?: string };
  conflictType?: string;
  conflictDetails?: string;
  severity?: string;
}

/**
 * TimetableManagement Page - Fully Dynamic
 * Role-based timetable view:
 * - Admin/Owner: Manage all timetables
 * - Teacher: View own schedule
 * - Student: View class timetable
 */
const TimetableManagement = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('annual');
  const [activeTab, setActiveTab] = useState('timetable');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic data from API
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [timetables, setTimetables] = useState<TimetableDoc[]>([]);
  const [conflicts, setConflicts] = useState<ConflictDoc[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedTimetables: 0,
    conflictingSlots: 0,
    totalSlots: 0,
    filledSlots: 0,
    publishedTimetables: 0,
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setApiError(null);
      setLoadingClasses(true);

      const [classesResponse, timetablesResponse] = await Promise.all([
        apiClient.get('/timetable/classes'),
        apiClient.get('/timetable', {
          params: { page: 1, limit: 100 }
        })
      ]);

      const classesData = classesResponse.data?.data || classesResponse.data;
      const safeClasses = ensureArray<ClassDoc>(classesData);
      setClasses(safeClasses);

      const timetablesData = timetablesResponse.data?.data;
      const safeTimetables = ensureArray<TimetableDoc>(timetablesData);
      setTimetables(safeTimetables);

      // Compute stats dynamically
      const publishedCount = safeTimetables.filter(t => t.isPublished).length;
      const completedCount = safeTimetables.filter(t => t.status === 'published' || t.isPublished).length;
      const totalSlots = safeTimetables.reduce((sum, t) => sum + (t.totalPeriods || 0), 0);
      const filledSlots = safeTimetables.reduce((sum, t) => sum + (t.assignedPeriods || 0), 0);
      const conflictCount = safeTimetables.filter(t => t.hasConflicts).length;

      setStats({
        totalClasses: safeClasses.length,
        completedTimetables: completedCount,
        conflictingSlots: conflictCount,
        totalSlots,
        filledSlots,
        publishedTimetables: publishedCount,
      });

      // Auto-select latest timetable context
      if (safeTimetables.length > 0) {
        const latest = safeTimetables[0];
        const resolvedClassId =
          typeof latest.classId === 'string'
            ? latest.classId
            : latest.classId?._id || '';

        if (resolvedClassId) setSelectedClass(resolvedClassId);
        if (latest.sectionId) setSelectedSection(latest.sectionId);
        if (latest.academicYearId) setAcademicYear(latest.academicYearId);
        if (latest.term) setTerm(latest.term);
      } else if (safeClasses.length > 0) {
        // Fallback to first class
        setSelectedClass(safeClasses[0]._id);
        if (safeClasses[0].sections?.[0]) {
          setSelectedSection(safeClasses[0].sections[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching timetable setup data:', error);
      if (error.response?.status === 401) return;
      setApiError(error.response?.data?.message || error.message || 'Failed to load timetable data. Please check your connection.');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // Fetch conflicts for the Conflicts tab
  const fetchConflicts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (academicYear) params.academicYearId = academicYear;

      const res = await apiClient.get('/timetable/conflicts', { params });
      const conflictsData = res.data?.data || res.data;
      setConflicts(ensureArray<ConflictDoc>(conflictsData));

      setStats(prev => ({
        ...prev,
        conflictingSlots: ensureArray<ConflictDoc>(conflictsData).length
      }));
    } catch (err) {
      console.error('Error fetching conflicts:', err);
      setConflicts([]);
    }
  }, [academicYear]);

  // Extract unique academic years from timetables
  const academicYears = [...new Set(
    timetables
      .map(t => t.academicYearId)
      .filter(Boolean) as string[]
  )].sort().reverse();

  // Extract available terms
  const termsMap: Record<string, string> = { annual: 'Annual', term1: 'Term 1', term2: 'Term 2' };
  const availableTerms = [...new Set(
    timetables
      .map(t => t.term)
      .filter(Boolean) as string[]
  )];
  const terms = availableTerms.length > 0
    ? availableTerms.map(t => ({ value: t, label: termsMap[t] || t }))
    : Object.entries(termsMap).map(([value, label]) => ({ value, label }));

  // Get sections for the selected class
  const selectedClassDoc = classes.find(c => c._id === selectedClass);
  const sections = selectedClassDoc?.sections || ['A', 'B', 'C', 'D'];

  // Recompute stats when timetables change
  const timetableCompletionPercentage = stats.totalSlots > 0
    ? Math.round((stats.filledSlots / stats.totalSlots) * 100)
    : 0;

  // Permission checks
  const canPublish = ['admin', 'owner'].includes(user?.role || '');
  const canViewAnalytics = ['admin', 'owner', 'principal'].includes(user?.role || '');

  const handleRefresh = async () => {
    await fetchInitialData();
    toast.success('Timetable data refreshed');
  };

  // Render Admin/Owner View
  const renderAdminView = () => (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Grid3x3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
              <p className="text-muted-foreground">
                Create, manage, and publish class schedules for all classes
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingClasses}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingClasses ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          {canPublish && (
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Publish All
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {apiError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Failed to Load Data</p>
                <p className="text-sm text-muted-foreground mt-1">{apiError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters Panel */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Academic Year */}
            <div className="lg:col-span-2 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Academic Year
              </Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.length > 0 ? (
                    academicYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="lg:col-span-3 space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={selectedClass} onValueChange={(val) => {
                setSelectedClass(val);
                const cls = classes.find(c => c._id === val);
                if (cls?.sections?.[0]) setSelectedSection(cls.sections[0]);
              }} disabled={loadingClasses}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls._id} value={cls._id}>{cls.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="lg:col-span-2 space-y-2">
              <Label className="text-sm font-medium">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(sec => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term */}
            <div className="lg:col-span-2 space-y-2">
              <Label className="text-sm font-medium">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="lg:col-span-3 space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          subtitle="Across all standards"
          icon={Users}
          variant="primary"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Timetables"
          value={`${stats.completedTimetables}/${stats.totalClasses}`}
          subtitle={stats.totalClasses > 0 ? `${Math.round((stats.completedTimetables/stats.totalClasses)*100)}% completed` : 'No timetables yet'}
          icon={Target}
          variant="success"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Slot Coverage"
          value={`${timetableCompletionPercentage}%`}
          subtitle={`${stats.filledSlots}/${stats.totalSlots} slots filled`}
          icon={BarChart}
          variant="warning"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Published"
          value={stats.publishedTimetables}
          subtitle="Ready for students"
          icon={CheckCircle}
          variant="default"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="timetable" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Timetable
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Conflicts
            {stats.conflictingSlots > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs">
                {stats.conflictingSlots}
              </Badge>
            )}
          </TabsTrigger>
          {canViewAnalytics && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Timetable Tab */}
        <TabsContent value="timetable" className="space-y-6">
          <div>
            {selectedClass && selectedSection ? (
              <TimetableGrid
                key={`${selectedClass}-${selectedSection}-${academicYear}-${term}`}
                classId={selectedClass}
                sectionId={selectedSection}
                academicYearId={academicYear}
                term={term}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Grid3x3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a class and section to view and manage its timetable
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Conflicts Tab - Dynamic */}
        <TabsContent value="conflicts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Schedule Conflicts
              </CardTitle>
              <CardDescription>Review and resolve scheduling conflicts</CardDescription>
              <Button variant="outline" size="sm" onClick={fetchConflicts} className="w-fit mt-2">
                <RefreshCw className="h-3 w-3 mr-2" />
                Refresh Conflicts
              </Button>
            </CardHeader>
            <CardContent>
              {conflicts.length > 0 ? (
                <div className="space-y-4">
                  {conflicts.map((conflict) => {
                    const className = conflict.timetableId?.classId?.className || 'Unknown Class';
                    const section = conflict.timetableId?.sectionId || '';
                    const subject = conflict.subjectId?.subjectName || 'Unknown Subject';
                    const teacher = conflict.teacherId?.name || 'Unknown Teacher';
                    const details = conflict.conflictDetails || conflict.conflictType || 'No details';

                    return (
                      <div key={conflict._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30">
                        <div>
                          <p className="font-medium">{className}{section ? ` - ${section}` : ''} — {subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {conflict.dayName && `${conflict.dayName} · `}{teacher} — {details}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={conflict.conflictType === 'teacher_clash' ? 'destructive' : 'warning'}>
                            {(conflict.conflictType || 'conflict').replace(/_/g, ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">Resolve</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">No scheduling conflicts detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - Dynamic */}
        {canViewAnalytics && (
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Completion Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Completion</span>
                      <span className="font-bold">{timetableCompletionPercentage}%</span>
                    </div>
                    <Progress value={timetableCompletionPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Classes Completed</p>
                      <p className="text-2xl font-bold">{stats.completedTimetables}/{stats.totalClasses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-2xl font-bold">{stats.publishedTimetables}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Conflicts</p>
                      <p className="text-2xl font-bold text-{stats.conflictingSlots > 0 ? 'destructive' : 'green-600'}">
                        {stats.conflictingSlots}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Timetables</p>
                      <p className="text-2xl font-bold">{timetables.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Resource Utilization
                  </CardTitle>
                  <CardDescription>Based on current timetable assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Slot Fill Rate</span>
                      <span className="font-bold">{timetableCompletionPercentage}%</span>
                    </div>
                    <Progress value={timetableCompletionPercentage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Classes with Timetables</span>
                      <span className="font-bold">
                        {stats.totalClasses > 0 ? Math.round((stats.completedTimetables / stats.totalClasses) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats.totalClasses > 0 ? (stats.completedTimetables / stats.totalClasses) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Published Rate</span>
                      <span className="font-bold">
                        {timetables.length > 0 ? Math.round((stats.publishedTimetables / timetables.length) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={timetables.length > 0 ? (stats.publishedTimetables / timetables.length) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Resources & Templates
              </CardTitle>
              <CardDescription>Download tools and templates for timetable management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Download className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Excel Template</h4>
                  <p className="text-sm text-muted-foreground mt-1">Bulk import timetables</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Grid3x3 className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Sample Timetable</h4>
                  <p className="text-sm text-muted-foreground mt-1">Reference format</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Guidelines</h4>
                  <p className="text-sm text-muted-foreground mt-1">Best practices</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Bell className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Help & Support</h4>
                  <p className="text-sm text-muted-foreground mt-1">FAQs and tutorials</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guidelines Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Scheduling Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Best Practices
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Allocate continuous slots for labs</li>
                <li>• Avoid single class periods spread across days</li>
                <li>• Balance practical and theory sessions</li>
                <li>• Include break timings appropriately</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Common Issues
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Teacher assigned to multiple classes</li>
                <li>• Room double-booked for same time</li>
                <li>• Insufficient break time allocated</li>
                <li>• Unbalanced subject distribution</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Before Publishing
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Verify all slots are filled</li>
                <li>• Check for scheduling conflicts</li>
                <li>• Confirm with all staff involved</li>
                <li>• Send notifications to stakeholders</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const userRole = user?.role;

  return (
    <div className="space-y-6">
      {userRole === 'admin' || userRole === 'owner' ? (
        renderAdminView()
      ) : userRole === 'teacher' ? (
        <TeacherTimetable />
      ) : userRole === 'student' ? (
        <StudentTimetable />
      ) : userRole === 'parent' ? (
        <ParentTimetable />
      ) : (
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Your role does not have access to timetable management.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimetableManagement;
