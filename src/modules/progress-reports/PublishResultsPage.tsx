import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Award,
  Archive,
  Search,
  Clock,
  Users,
} from 'lucide-react';
import apiClient from '@/Services/apiClient';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ExamCycle {
  _id: string;
  examName: string;
  examCode: string;
  examType: string;
  academicYear: string;
  isPublished: boolean;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  resultDate?: string;
  createdAt: string;
}

export default function PublishResultsPage() {
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ExamCycle | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/progress-reports/exam-cycles');
      setExamCycles(ensureArray<ExamCycle>(res.data?.data || res.data));
    } catch (err) {
      console.error('Failed to fetch cycles:', err);
      toast.error('Failed to load exam cycles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredCycles = useMemo(() => {
    let filtered = examCycles;
    if (yearFilter !== 'all') filtered = filtered.filter(c => c.academicYear === yearFilter);
    if (statusFilter === 'published') filtered = filtered.filter(c => c.isPublished);
    if (statusFilter === 'unpublished') filtered = filtered.filter(c => !c.isPublished && c.isActive);
    if (statusFilter === 'inactive') filtered = filtered.filter(c => !c.isActive);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.examName.toLowerCase().includes(term) ||
        c.examCode.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [examCycles, yearFilter, statusFilter, searchTerm]);

  const uniqueYears = useMemo(() =>
    [...new Set(examCycles.map(c => c.academicYear).filter(Boolean))].sort().reverse(),
    [examCycles]
  );

  const handlePublish = async () => {
    if (!selectedCycle) return;
    try {
      setPublishing(selectedCycle._id);
      await apiClient.post(`/progress-reports/exam-cycles/${selectedCycle._id}/publish`);
      toast.success(`Results published for "${selectedCycle.examName}"`);
      setIsPublishDialogOpen(false);
      setSelectedCycle(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    } finally {
      setPublishing(null);
    }
  };

  const handleToggleActive = async (cycle: ExamCycle) => {
    try {
      await apiClient.put(`/progress-reports/exam-cycles/${cycle._id}`, { isActive: !cycle.isActive });
      toast.success(`Cycle ${cycle.isActive ? 'deactivated' : 'activated'}`);
      await fetchData();
    } catch {
      toast.error('Failed to update cycle');
    }
  };

  const getStatusBadge = (cycle: ExamCycle) => {
    if (cycle.isPublished) return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
    if (!cycle.isActive) return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
    return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Ready</Badge>;
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading publish queue...</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Publish Results</h1>
          <p className="text-muted-foreground mt-1">Review and publish exam results for students.</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Cycles</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{examCycles.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Published</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{examCycles.filter(c => c.isPublished).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Publication</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{examCycles.filter(c => !c.isPublished && c.isActive).length}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search cycles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cycles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Cycles</CardTitle>
          <CardDescription>{filteredCycles.length} cycle(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCycles.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Exam Cycles Found</h3>
              <p className="text-muted-foreground">Create exam cycles in Exam Setup first.</p>
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
                  <TableHead>Result Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCycles.map(cycle => (
                  <TableRow key={cycle._id}>
                    <TableCell className="font-mono text-sm">{cycle.examCode}</TableCell>
                    <TableCell className="font-medium">{cycle.examName}</TableCell>
                    <TableCell>{cycle.examType}</TableCell>
                    <TableCell>{cycle.academicYear}</TableCell>
                    <TableCell>{cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{cycle.resultDate ? new Date(cycle.resultDate).toLocaleDateString() : cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{getStatusBadge(cycle)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!cycle.isPublished && cycle.isActive && (
                          <Button variant="default" size="sm" onClick={() => { setSelectedCycle(cycle); setIsPublishDialogOpen(true); }}
                            disabled={publishing === cycle._id}>
                            <Award className="h-3 w-3 mr-1" />
                            {publishing === cycle._id ? 'Publishing...' : 'Publish'}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(cycle)}>
                          {cycle.isActive ? <Archive className="h-4 w-4 text-gray-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
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

      {/* Publish Confirmation */}
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-green-600" />Publish Results</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish results for <strong>{selectedCycle?.examName}</strong>?
              This will make the results visible to students and parents. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} className="bg-green-600">
              {publishing ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
