import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ClassAttendance {
  className: string;
  section: string;
  attendancePercentage: number;
  presentSessions: number;
  totalSessions: number;
  totalEnrolled: number;
}

interface SummaryData {
  totalClasses: number;
  overallAttendancePercentage: number;
  startDate: string;
  endDate: string;
}

export default function ClassWiseAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState<ClassAttendance[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'percentage' | 'name'>('percentage');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/attendance/class-wise', {
        params: { startDate, endDate }
      });
      const result = res.data;
      setData(ensureArray<ClassAttendance>(result.data || []));
      setSummary(result.summary || null);
    } catch (err: any) {
      console.error('Failed to fetch class-wise attendance:', err);
      toast.error(err.response?.data?.message || 'Failed to load attendance data');
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueClasses = useMemo(() =>
    [...new Set(data.map(d => d.className))].sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    let filtered = classFilter === 'all' ? data : data.filter(d => d.className === classFilter);
    if (sortBy === 'percentage') {
      filtered = [...filtered].sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    } else {
      filtered = [...filtered].sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));
    }
    return filtered;
  }, [data, classFilter, sortBy]);

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-yellow-600';
    if (pct >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 60) return 'bg-yellow-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBadge = (pct: number) => {
    if (pct >= 90) return { text: 'Excellent', className: 'bg-green-100 text-green-800' };
    if (pct >= 75) return { text: 'Good', className: 'bg-blue-100 text-blue-800' };
    if (pct >= 60) return { text: 'Average', className: 'bg-yellow-100 text-yellow-800' };
    if (pct >= 40) return { text: 'Below Average', className: 'bg-orange-100 text-orange-800' };
    return { text: 'Critical', className: 'bg-red-100 text-red-800' };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return toast.error('No data to export');
    const headers = ['Class', 'Section', 'Attendance %', 'Present Sessions', 'Total Sessions', 'Enrolled Students'];
    const rows = filteredData.map(d => [
      d.className, d.section, `${d.attendancePercentage}%`,
      d.presentSessions, d.totalSessions, d.totalEnrolled
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-wise-attendance-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const lowAttendanceClasses = data.filter(d => d.attendancePercentage < 60);
  const excellentClasses = data.filter(d => d.attendancePercentage >= 90);

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-8 w-8 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-4">Loading attendance data...</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class-Wise Attendance</h1>
          <p className="text-muted-foreground mt-1">View attendance percentages across all classes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredData.length === 0}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label>Filter by Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={v => setSortBy(v as 'percentage' | 'name')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Attendance % (High → Low)</SelectItem>
                  <SelectItem value="name">Class Name (A → Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className="w-full text-center py-2">
                {summary ? `${summary.totalClasses} classes · ${summary.startDate} to ${summary.endDate}` : 'No data'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPercentageColor(summary.overallAttendancePercentage)}`}>
                {summary.overallAttendancePercentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary.totalClasses}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent (≥90%)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{excellentClasses.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Attention (&lt;60%)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{lowAttendanceClasses.length}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Low Attendance Alert */}
      {lowAttendanceClasses.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />Low Attendance Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowAttendanceClasses.map(c => (
                <Badge key={`${c.className}-${c.section}`} variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  {c.className}-{c.section}: {c.attendancePercentage}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {data.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Attendance Data</h3>
          <p className="text-muted-foreground">No attendance records found for the selected date range.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Class</CardTitle>
            <CardDescription>{filteredData.length} class section(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => {
                  const badge = getBadge(item.attendancePercentage);
                  return (
                    <TableRow key={`${item.className}-${item.section}`}>
                      <TableCell className="font-semibold">{item.className}</TableCell>
                      <TableCell>{item.section}</TableCell>
                      <TableCell className={`text-center font-bold text-lg ${getPercentageColor(item.attendancePercentage)}`}>
                        {item.attendancePercentage}%
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={item.attendancePercentage} className={`w-24 h-3 ${getProgressBarColor(item.attendancePercentage)}`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{item.presentSessions}/{item.totalSessions}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />{item.totalEnrolled}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={badge.className}>{badge.text}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
