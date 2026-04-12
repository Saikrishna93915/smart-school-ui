import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  CalendarDays,
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Search,
  FileText,
  Calendar,
  Award,
} from 'lucide-react';
import apiClient from '@/Services/apiClient';
import { GradeScaleService, type GradeScale, type GradeEntry } from '@/Services/gradeScale.service';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

/* ─── Types ─── */
interface ExamCycle {
  _id: string;
  academicYear: string;
  examName: string;
  examCode: string;
  examType: string;
  examSequence: number;
  startDate?: string;
  endDate?: string;
  resultDate?: string;
  isActive: boolean;
  isPublished: boolean;
  createdBy?: { name: string };
  publishedBy?: { name: string };
  createdAt: string;
}

interface SubjectDoc {
  _id: string;
  subjectName: string;
  subjectCode: string;
  className?: string;
  category?: string;
  totalMarks?: number;
  passingMarks?: number;
}

interface ClassDoc {
  _id: string;
  className: string;
  sections?: string[];
}

/* ─── Constants ─── */
const EXAM_TYPE_LABELS: Record<string, string> = {
  'Unit Test': 'Unit Test',
  Quarterly: 'Quarterly',
  'Half Yearly': 'Half Yearly',
  Annual: 'Annual',
};

/* ─── Component ─── */
export default function ExamSetupPage() {
  // Dynamic data
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [gradeScales, setGradeScales] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isGradeScaleOpen, setIsGradeScaleOpen] = useState(false);
  const [isGradeScaleFormOpen, setIsGradeScaleFormOpen] = useState(false);
  const [isDeleteGradeScaleDialogOpen, setIsDeleteGradeScaleDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ExamCycle | null>(null);
  const [editingGradeScale, setEditingGradeScale] = useState<GradeScale | null>(null);

  // Create form
  const [formData, setFormData] = useState({
    examName: '',
    examCode: '',
    examType: 'Unit Test',
    examSequence: 1,
    academicYear: '',
    startDate: '',
    endDate: '',
    resultDate: '',
    isActive: true,
  });

  // Grade scale form
  const [gradeScaleForm, setGradeScaleForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    grades: [
      { grade: 'A+', minPercentage: 91, maxPercentage: 100, gradePoint: 10, remark: 'Outstanding', color: '#22c55e' },
      { grade: 'A', minPercentage: 81, maxPercentage: 90, gradePoint: 9, remark: 'Excellent', color: '#3b82f6' },
      { grade: 'B+', minPercentage: 71, maxPercentage: 80, gradePoint: 8, remark: 'Very Good', color: '#0ea5e9' },
      { grade: 'B', minPercentage: 61, maxPercentage: 70, gradePoint: 7, remark: 'Good', color: '#6366f1' },
      { grade: 'C+', minPercentage: 51, maxPercentage: 60, gradePoint: 6, remark: 'Above Average', color: '#f59e0b' },
      { grade: 'C', minPercentage: 41, maxPercentage: 50, gradePoint: 5, remark: 'Average', color: '#f97316' },
      { grade: 'D', minPercentage: 35, maxPercentage: 40, gradePoint: 4, remark: 'Pass', color: '#ef4444' },
      { grade: 'F', minPercentage: 0, maxPercentage: 34, gradePoint: 0, remark: 'Fail', color: '#dc2626' },
    ] as GradeEntry[],
  });

  /* ─── Fetch data ─── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesRes, subjectsRes, classesRes, gradeScalesRes] = await Promise.all([
        apiClient.get('/progress-reports/exam-cycles'),
        apiClient.get('/subjects'),
        apiClient.get('/timetable/classes'),
        GradeScaleService.getAll(),
      ]);

      // Backend returns { success: true, data: [...] } — unwrap the array
      const cyclesArray = cyclesRes.data?.data || cyclesRes.data;
      setExamCycles(ensureArray<ExamCycle>(cyclesArray));
      setSubjects(ensureArray<SubjectDoc>(subjectsRes.data?.data || subjectsRes.data));
      setClasses(ensureArray<ClassDoc>(classesRes.data?.data || classesRes.data));
      setGradeScales(ensureArray<GradeScale>(gradeScalesRes));

      // Set default academic year from latest cycle
      if (cyclesArray.length > 0) {
        setSelectedYear(cyclesArray[0].academicYear);
        setFormData(prev => ({ ...prev, academicYear: cyclesArray[0].academicYear }));
      } else {
        setSelectedYear('2025-26');
        setFormData(prev => ({ ...prev, academicYear: '2025-26' }));
      }
    } catch (err: any) {
      console.error('Failed to fetch progress report data:', err);
      toast.error(err.response?.data?.message || 'Failed to load exam setup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Derived data ─── */
  const uniqueAcademicYears = [...new Set(examCycles.map(c => c.academicYear).filter(Boolean))].sort().reverse();
  const uniqueClasses = [...new Set(examCycles.map(c => c.examCode).map(code => {
    const match = code.match(/(\d+[A-Za-z]*)/);
    return match ? match[1] : null;
  }).filter(Boolean))].sort();

  const filteredCycles = useMemo(() => {
    let filtered = examCycles.filter(c => c.academicYear === selectedYear);
    if (!showInactive) filtered = filtered.filter(c => c.isActive);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.examName.toLowerCase().includes(term) ||
        c.examCode.toLowerCase().includes(term) ||
        c.examType.toLowerCase().includes(term)
      );
    }
    if (statusFilter === 'published') filtered = filtered.filter(c => c.isPublished);
    if (statusFilter === 'draft') filtered = filtered.filter(c => !c.isPublished);
    return filtered;
  }, [examCycles, selectedYear, searchTerm, statusFilter, showInactive]);

  const stats = useMemo(() => ({
    total: examCycles.length,
    active: examCycles.filter(c => c.isActive).length,
    published: examCycles.filter(c => c.isPublished).length,
    draft: examCycles.filter(c => !c.isPublished && c.isActive).length,
  }), [examCycles]);

  /* ─── Actions ─── */
  const handleCreateCycle = async () => {
    if (!formData.examName || !formData.examCode || !formData.examType || !formData.academicYear) {
      return toast.error('Please fill in all required fields (Exam Name, Code, Type, and Academic Year)');
    }
    if (!formData.examSequence || formData.examSequence < 1) {
      return toast.error('Exam sequence must be a positive number');
    }
    try {
      await apiClient.post('/progress-reports/exam-cycles', {
        ...formData,
        examSequence: Number(formData.examSequence),
      });
      toast.success('Exam cycle created successfully');
      setIsCreateDialogOpen(false);
      setFormData({ examName: '', examCode: '', examType: 'Unit Test', examSequence: 1, academicYear: selectedYear || '2025-26', startDate: '', endDate: '', resultDate: '', isActive: true });
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create exam cycle');
    }
  };

  const handleDeleteCycle = async () => {
    if (!selectedCycle) return;
    try {
      // Backend doesn't have a delete endpoint yet; mark inactive
      await apiClient.put(`/progress-reports/exam-cycles/${selectedCycle._id}`, { isActive: false });
      toast.success('Exam cycle deactivated');
      setIsDeleteDialogOpen(false);
      setSelectedCycle(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate cycle');
    }
  };

  const handlePublishCycle = async () => {
    if (!selectedCycle) return;
    try {
      await apiClient.post(`/progress-reports/exam-cycles/${selectedCycle._id}/publish`);
      toast.success('Exam results published successfully');
      setIsPublishDialogOpen(false);
      setSelectedCycle(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    }
  };

  const handleToggleActive = async (cycle: ExamCycle) => {
    try {
      await apiClient.put(`/progress-reports/exam-cycles/${cycle._id}`, { isActive: !cycle.isActive });
      toast.success(`Exam cycle ${cycle.isActive ? 'deactivated' : 'activated'}`);
      await fetchData();
    } catch (err: any) {
      toast.error('Failed to update cycle');
    }
  };

  /* ─── Grade Scale Management ─── */
  const openGradeScaleForm = (scale?: GradeScale) => {
    if (scale) {
      setEditingGradeScale(scale);
      setGradeScaleForm({
        name: scale.name,
        description: scale.description || '',
        isDefault: scale.isDefault || false,
        grades: scale.grades.map(g => ({
          grade: g.grade,
          minPercentage: g.minPercentage,
          maxPercentage: g.maxPercentage,
          gradePoint: g.gradePoint,
          remark: g.remark,
          color: g.color || '#6b7280',
        })),
      });
    } else {
      setEditingGradeScale(null);
      setGradeScaleForm({
        name: '',
        description: '',
        isDefault: false,
        grades: [
          { grade: 'A+', minPercentage: 91, maxPercentage: 100, gradePoint: 10, remark: 'Outstanding', color: '#22c55e' },
          { grade: 'A', minPercentage: 81, maxPercentage: 90, gradePoint: 9, remark: 'Excellent', color: '#3b82f6' },
          { grade: 'B+', minPercentage: 71, maxPercentage: 80, gradePoint: 8, remark: 'Very Good', color: '#0ea5e9' },
          { grade: 'B', minPercentage: 61, maxPercentage: 70, gradePoint: 7, remark: 'Good', color: '#6366f1' },
          { grade: 'C+', minPercentage: 51, maxPercentage: 60, gradePoint: 6, remark: 'Above Average', color: '#f59e0b' },
          { grade: 'C', minPercentage: 41, maxPercentage: 50, gradePoint: 5, remark: 'Average', color: '#f97316' },
          { grade: 'D', minPercentage: 35, maxPercentage: 40, gradePoint: 4, remark: 'Pass', color: '#ef4444' },
          { grade: 'F', minPercentage: 0, maxPercentage: 34, gradePoint: 0, remark: 'Fail', color: '#dc2626' },
        ],
      });
    }
    setIsGradeScaleFormOpen(true);
  };

  const handleSaveGradeScale = async () => {
    if (!gradeScaleForm.name || gradeScaleForm.grades.length === 0) {
      return toast.error('Name and at least one grade entry are required');
    }
    for (const g of gradeScaleForm.grades) {
      if (!g.grade || g.minPercentage === undefined || g.maxPercentage === undefined || g.gradePoint === undefined || !g.remark) {
        return toast.error('Each grade must have: grade, min/max %, grade point, and remark');
      }
      if (g.minPercentage > g.maxPercentage) {
        return toast.error(`Min % cannot be greater than Max % for grade "${g.grade}"`);
      }
    }
    try {
      const payload = {
        name: gradeScaleForm.name,
        description: gradeScaleForm.description,
        grades: gradeScaleForm.grades.map(g => ({
          grade: g.grade,
          minPercentage: g.minPercentage,
          maxPercentage: g.maxPercentage,
          gradePoint: g.gradePoint,
          remark: g.remark,
          color: g.color,
        })),
        isDefault: gradeScaleForm.isDefault,
      };
      if (editingGradeScale) {
        await GradeScaleService.update(editingGradeScale._id!, payload);
        toast.success('Grade scale updated successfully');
      } else {
        await GradeScaleService.create(payload);
        toast.success('Grade scale created successfully');
      }
      setIsGradeScaleFormOpen(false);
      setEditingGradeScale(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save grade scale');
    }
  };

  const handleDeleteGradeScale = async () => {
    if (!editingGradeScale) return;
    try {
      await GradeScaleService.remove(editingGradeScale._id!);
      toast.success('Grade scale deleted successfully');
      setIsDeleteGradeScaleDialogOpen(false);
      setEditingGradeScale(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete grade scale');
    }
  };

  const addGradeEntry = () => {
    setGradeScaleForm(prev => ({
      ...prev,
      grades: [...prev.grades, { grade: '', minPercentage: 0, maxPercentage: 100, gradePoint: 0, remark: '', color: '#6b7280' }],
    }));
  };

  const removeGradeEntry = (index: number) => {
    setGradeScaleForm(prev => ({
      ...prev,
      grades: prev.grades.filter((_, i) => i !== index),
    }));
  };

  const updateGradeEntry = (index: number, field: keyof GradeEntry, value: string | number) => {
    setGradeScaleForm(prev => ({
      ...prev,
      grades: prev.grades.map((g, i) => i === index ? { ...g, [field]: value } : g),
    }));
  };

  /* ─── Status badge ─── */
  const getStatusBadge = (cycle: ExamCycle) => {
    if (cycle.isPublished) {
      return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
    }
    if (!cycle.isActive) {
      return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Active</Badge>;
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
          <p className="text-muted-foreground mt-4">Loading exam setup...</p>
        </CardContent>
      </Card>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Exam Setup & Management</h1>
          <p className="text-muted-foreground mt-1">Configure exam cycles for progress reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="mt-1 bg-blue-50">
            <GraduationCap className="h-3 w-3 mr-1" />Progress Reports
          </Badge>
          <Button variant="outline" onClick={() => setIsGradeScaleOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />Manage Grade Scales
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Create Exam Cycle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.published}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-500">{stats.draft}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                {uniqueAcademicYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                {uniqueAcademicYears.length === 0 && <SelectItem value="2025-26">2025-26</SelectItem>}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} id="showInactive" />
              <Label htmlFor="showInactive" className="text-sm">Show Inactive</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Cycles</CardTitle>
          <CardDescription>{filteredCycles.length} exam cycle(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCycles.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Exam Cycles Found</h3>
              <p className="text-muted-foreground mb-4">Create your first exam cycle to get started.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Exam Cycle</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCycles.map(cycle => (
                  <TableRow key={cycle._id}>
                    <TableCell className="font-mono text-sm">{cycle.examCode}</TableCell>
                    <TableCell className="font-medium">{cycle.examName}</TableCell>
                    <TableCell>{EXAM_TYPE_LABELS[cycle.examType] || cycle.examType}</TableCell>
                    <TableCell>{cycle.academicYear}</TableCell>
                    <TableCell>{cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{getStatusBadge(cycle)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedCycle(cycle); setIsPublishDialogOpen(true); }} disabled={cycle.isPublished}>
                          <Award className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(cycle)}>
                          {cycle.isActive ? <X className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedCycle(cycle); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Dialog ─── */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Exam Cycle</DialogTitle>
            <DialogDescription>Set up a new exam cycle for progress reports.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Exam Name *</Label>
              <Input value={formData.examName} onChange={e => setFormData(p => ({ ...p, examName: e.target.value }))} placeholder="e.g., Unit Test 1" />
            </div>
            <div>
              <Label>Exam Code *</Label>
              <Input value={formData.examCode} onChange={e => setFormData(p => ({ ...p, examCode: e.target.value }))} placeholder="e.g., UT1-10A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Type *</Label>
                <Select value={formData.examType} onValueChange={v => setFormData(p => ({ ...p, examType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(EXAM_TYPE_LABELS).map(t => <SelectItem key={t} value={t}>{EXAM_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sequence *</Label>
                <Input type="number" value={formData.examSequence} onChange={e => setFormData(p => ({ ...p, examSequence: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
            </div>
            <div>
              <Label>Academic Year *</Label>
              <Select value={formData.academicYear} onValueChange={v => setFormData(p => ({ ...p, academicYear: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueAcademicYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  {uniqueAcademicYears.length === 0 && <SelectItem value="2025-26">2025-26</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Result Date</Label>
              <Input type="date" value={formData.resultDate} onChange={e => setFormData(p => ({ ...p, resultDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCycle}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Deactivate Exam Cycle</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to deactivate "{selectedCycle?.examName}"? This will hide it from active listings.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCycle} className="bg-destructive text-destructive-foreground">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Publish Confirmation ─── */}
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-green-600" />Publish Results</AlertDialogTitle>
            <AlertDialogDescription>
              Publish results for "{selectedCycle?.examName}"? This will make the results visible to students and parents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishCycle} className="bg-green-600">Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Grade Scale Management Dialog ─── */}
      <Dialog open={isGradeScaleOpen} onOpenChange={setIsGradeScaleOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Grade Scale Management</span>
              <Button size="sm" onClick={() => openGradeScaleForm()}>
                <Plus className="h-4 w-4 mr-1" />New Grade Scale
              </Button>
            </DialogTitle>
            <DialogDescription>Create and manage custom grading schemes for exam cycles.</DialogDescription>
          </DialogHeader>
          {gradeScales.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Grade Scales Defined</h3>
              <p className="text-muted-foreground mb-4">Create your first grade scale to get started.</p>
              <Button onClick={() => openGradeScaleForm()}><Plus className="h-4 w-4 mr-2" />Create Grade Scale</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grades</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeScales.map(scale => (
                  <TableRow key={scale._id}>
                    <TableCell className="font-medium">
                      {scale.name}
                      {scale.description && <p className="text-xs text-muted-foreground">{scale.description}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {scale.grades.slice(0, 5).map(g => (
                          <Badge key={g.grade} variant="outline" className="text-xs">{g.grade}</Badge>
                        ))}
                        {scale.grades.length > 5 && <Badge variant="outline" className="text-xs">+{scale.grades.length - 5}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {scale.isDefault ? <Badge className="bg-green-100 text-green-800">Default</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openGradeScaleForm(scale)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingGradeScale(scale); setIsDeleteGradeScaleDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Grade Scale Form Dialog ─── */}
      <Dialog open={isGradeScaleFormOpen} onOpenChange={(open) => { if (!open) { setIsGradeScaleFormOpen(false); setEditingGradeScale(null); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGradeScale ? 'Edit Grade Scale' : 'Create Grade Scale'}</DialogTitle>
            <DialogDescription>{editingGradeScale ? 'Update the grade scale configuration.' : 'Define a new grading scheme with custom boundaries and remarks.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={gradeScaleForm.name} onChange={e => setGradeScaleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Standard Grading" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={gradeScaleForm.description} onChange={e => setGradeScaleForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={gradeScaleForm.isDefault} onCheckedChange={v => setGradeScaleForm(p => ({ ...p, isDefault: v }))} id="gsDefault" />
              <Label htmlFor="gsDefault">Set as default grade scale</Label>
            </div>

            {/* Grade Entries */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Grade Entries</Label>
                <Button variant="outline" size="sm" onClick={addGradeEntry}><Plus className="h-3 w-3 mr-1" />Add Grade</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Grade</TableHead>
                    <TableHead>Min %</TableHead>
                    <TableHead>Max %</TableHead>
                    <TableHead>Grade Point</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="w-24">Color</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeScaleForm.grades.map((g, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input value={g.grade} onChange={e => updateGradeEntry(idx, 'grade', e.target.value)} placeholder="A+" className="w-16" /></TableCell>
                      <TableCell><Input type="number" min={0} max={100} value={g.minPercentage} onChange={e => updateGradeEntry(idx, 'minPercentage', parseInt(e.target.value) || 0)} className="w-16" /></TableCell>
                      <TableCell><Input type="number" min={0} max={100} value={g.maxPercentage} onChange={e => updateGradeEntry(idx, 'maxPercentage', parseInt(e.target.value) || 0)} className="w-16" /></TableCell>
                      <TableCell><Input type="number" min={0} max={10} step={0.5} value={g.gradePoint} onChange={e => updateGradeEntry(idx, 'gradePoint', parseFloat(e.target.value) || 0)} className="w-16" /></TableCell>
                      <TableCell><Input value={g.remark} onChange={e => updateGradeEntry(idx, 'remark', e.target.value)} placeholder="Excellent" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input type="color" value={g.color || '#6b7280'} onChange={e => updateGradeEntry(idx, 'color', e.target.value)} className="w-8 h-8 p-0 border-0 cursor-pointer" />
                          <span className="text-xs font-mono">{g.color}</span>
                        </div>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => removeGradeEntry(idx)}><X className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {gradeScaleForm.grades.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No grade entries added. Click "Add Grade" to start.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsGradeScaleFormOpen(false); setEditingGradeScale(null); }}>Cancel</Button>
            <Button onClick={handleSaveGradeScale}>{editingGradeScale ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Grade Scale Confirmation ─── */}
      <AlertDialog open={isDeleteGradeScaleDialogOpen} onOpenChange={setIsDeleteGradeScaleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Grade Scale</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{editingGradeScale?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGradeScale} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
