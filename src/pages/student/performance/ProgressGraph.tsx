import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import apiClient from '@/Services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ExamCycle {
  _id: string;
  examName: string;
  examType: string;
  examSequence: number;
}

interface TrendPoint {
  exam: string;
  sequence: number;
  percentage: number;
  grade: string;
}

const ProgressGraph: React.FC = () => {
  const { user } = useAuth();
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [examCycles, setExamCycles] = useState<ExamCycle[]>([]);

  const fetchTrendData = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);

      // Fetch available exam cycles
      const cyclesRes = await apiClient.get('/progress-reports/exam-cycles', { params: { isPublished: true } });
      const cycles = ensureArray<ExamCycle>(cyclesRes.data);
      setExamCycles(cycles);

      // Fetch student's progress report
      const reportRes = await apiClient.get(`/progress-reports/students/${user._id}/report`);
      const reportData = reportRes.data?.data || reportRes.data;

      if (reportData?.reports) {
        const trendData: TrendPoint[] = reportData.reports.map((r: any) => ({
          exam: r.examCycleName || r.examType || 'Unknown',
          sequence: 0,
          percentage: r.percentage || 0,
          grade: r.grade || 'N/A',
        }));
        setTrend(trendData);
      } else {
        setTrend([]);
      }
    } catch (err) {
      console.error('Failed to fetch trend data:', err);
      setTrend([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => { fetchTrendData(); }, [fetchTrendData]);

  const filteredTrend = selectedCycle === 'all'
    ? trend
    : trend.filter(t => t.exam.toLowerCase().includes(selectedCycle.toLowerCase()));

  const avgPercentage = filteredTrend.length > 0
    ? filteredTrend.reduce((sum, t) => sum + t.percentage, 0) / filteredTrend.length
    : 0;

  const latestTrend = filteredTrend[filteredTrend.length - 1];
  const previousTrend = filteredTrend[filteredTrend.length - 2];
  const isImproving = latestTrend && previousTrend && latestTrend.percentage > previousTrend.percentage;

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="animate-spin inline-block"><RefreshCw className="h-6 w-6 text-muted-foreground" /></div>
        <p className="text-muted-foreground mt-2 text-sm">Loading progress data...</p>
      </CardContent></Card>
    );
  }

  if (trend.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center">
        <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground text-sm">No progress data available yet.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress Graph</CardTitle>
            <CardDescription>Your academic performance across exam cycles</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All cycles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                {examCycles.map(c => <SelectItem key={c._id} value={c.examName}>{c.examName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTrendData}><RefreshCw className="h-3 w-3" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-2xl font-bold">{avgPercentage.toFixed(1)}%</p>
          </div>
          {latestTrend && (
            <div>
              <p className="text-sm text-muted-foreground">Latest</p>
              <p className="text-2xl font-bold">{latestTrend.percentage.toFixed(1)}%</p>
            </div>
          )}
          {isImproving !== undefined && (
            <Badge className={isImproving ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isImproving ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isImproving ? 'Improving' : 'Declining'}
            </Badge>
          )}
        </div>

        {/* Bar Chart */}
        <div className="h-64 flex items-end gap-3">
          {filteredTrend.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <p className="text-xs font-bold">{item.percentage.toFixed(0)}%</p>
              <div
                className={`w-full rounded-t transition-all ${
                  item.percentage >= 90 ? 'bg-green-500' :
                  item.percentage >= 70 ? 'bg-blue-500' :
                  item.percentage >= 50 ? 'bg-yellow-500' :
                  item.percentage >= 35 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.max(item.percentage * 2, 8)}px` }}
              />
              <p className="text-[11px] text-muted-foreground text-center leading-tight">{item.exam}</p>
              <Badge variant="outline" className="text-xs">{item.grade}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressGraph;
