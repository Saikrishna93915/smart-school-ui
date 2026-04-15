import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  RefreshCw,
  Download,
  FileText,
  MessageSquare,
  ChevronLeft,
  Calendar,
  Eye,
  Award,
  User,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

// ========================
// TYPES
// ========================
interface ReportData {
  reportId: string;
  examName: string;
  examType: string;
  generatedOn: string;
  format: string;
  hasTeacherRemark: boolean;
  teacherRemark: string | null;
  promotedToClass: string | null;
  rankInClass: number | null;
  attendance: { totalWorkingDays?: number; daysPresent?: number; attendancePercentage?: number } | null;
}

interface ChildInfo {
  name: string;
  className: string;
  section: string;
}

// ========================
// HELPERS
// ========================
const getExamTypeBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case 'unit test': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'mid term': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'term exam': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'final': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold">🥇 1st</Badge>;
  if (rank === 2) return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold">🥈 2nd</Badge>;
  if (rank === 3) return <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-bold">🥉 3rd</Badge>;
  if (rank <= 10) return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">#{rank}</Badge>;
  return <Badge variant="outline">#{rank}</Badge>;
};

const getTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ========================
// MAIN COMPONENT
// ========================
export default function DownloadReport() {
  const navigate = useNavigate();
  const { childId: paramChildId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve childId: use URL param, or fallback to first child from dashboard
  const resolveChildId = async (): Promise<string | null> => {
    if (paramChildId) return paramChildId;
    try {
      const res = await apiClient.get('/parent/dashboard');
      const children = res.data?.data?.children;
      if (children?.length > 0) return String(children[0].id);
    } catch (e) {
      console.error('Failed to resolve child ID from dashboard:', e);
    }
    return null;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resolvedChildId = await resolveChildId();
      if (!resolvedChildId) {
        toast.error('No children linked to your account');
        setLoading(false);
        return;
      }
      const res = await apiClient.get(`/parent/child/${resolvedChildId}/reports`);
      const data = res.data?.data;
      if (data) {
        setChild(data.child);
        setReports(data.reports || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [paramChildId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewReport = (report: ReportData) => {
    navigate(`/progress-reports/report-card?student=${childId}&exam=${report.reportId}`);
  };

  // ========================
  // LOADING STATE
  // ========================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-28 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="flex items-center justify-between"><div className="space-y-2"><div className="h-5 w-40 bg-muted rounded" /><div className="h-4 w-56 bg-muted rounded" /></div><div className="h-9 w-24 bg-muted rounded" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  // ========================
  // EMPTY STATE
  // ========================
  if (!child || reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground mb-6">Report cards will appear here once exams are published and results are finalized by the teachers.</p>
            <Button variant="outline" onClick={() => navigate('/parent/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ========================
          HEADER
      ======================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/parent/dashboard')} className="rounded-full">
            <ChevronLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{child.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                {child.name} • Class {child.className} — Section {child.section}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ========================
          REPORTS LIST
      ======================== */}
      <div className="space-y-3">
        {reports.map((report, idx) => (
          <Card
            key={report.reportId}
            className="border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/20"
            onClick={() => handleViewReport(report)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Left: Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg truncate">{report.examName}</h3>
                        <Badge variant="outline" className={`capitalize shrink-0 ${getExamTypeBadge(report.examType)}`}>
                          {report.examType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {getTimeAgo(report.generatedOn)}
                        </span>
                        {report.rankInClass && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" />
                            Rank: #{report.rankInClass}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta Info Row */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {report.hasTeacherRemark && (
                      <div className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200">
                        <MessageSquare className="h-3 w-3" />
                        <span>Teacher's remark: "{report.teacherRemark?.substring(0, 30)}{report.teacherRemark && report.teacherRemark.length > 30 ? '…' : ''}"</span>
                      </div>
                    )}
                    {report.promotedToClass && (
                      <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        <TrendingUp className="h-3 w-3" />
                        <span>Promoted to {report.promotedToClass}</span>
                      </div>
                    )}
                    {report.attendance?.attendancePercentage && (
                      <div className="flex items-center gap-1.5 text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200">
                        <Clock className="h-3 w-3" />
                        <span>Attendance: {report.attendance.attendancePercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {report.rankInClass && (
                    <div className="hidden sm:block">
                      {getRankBadge(report.rankInClass)}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReport(report);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================
          SUMMARY CARD
      ======================== */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base">Report Summary</CardTitle>
          <CardDescription>Overview of all available reports for {child.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-white/60 border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Reports</p>
                  <p className="text-xl font-bold">{reports.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/60 border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">With Remarks</p>
                  <p className="text-xl font-bold">{reports.filter(r => r.hasTeacherRemark).length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/60 border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best Rank</p>
                  <p className="text-xl font-bold">
                    {reports.filter(r => r.rankInClass).length > 0
                      ? `#${Math.min(...reports.filter(r => r.rankInClass).map(r => r.rankInClass!))}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
