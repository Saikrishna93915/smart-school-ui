import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const defaultAttendanceData = [
  { name: 'Mon', present: 456, absent: 12 },
  { name: 'Tue', present: 462, absent: 6 },
  { name: 'Wed', present: 448, absent: 20 },
  { name: 'Thu', present: 459, absent: 9 },
  { name: 'Fri', present: 451, absent: 17 },
];

interface AttendanceData {
  _id: string;
  total: number;
  present: number;
  absent: number;
  percentage?: number;
}

interface AttendanceChartProps {
  data?: AttendanceData[];
  loading?: boolean;
  className?: string;
}

export function AttendanceChart({ data = [], loading = false, className }: AttendanceChartProps) {
  // Format data for chart - use date as name if available
  const chartData = data.length > 0
    ? data.slice(-7).map(item => ({
        name: item._id || 'N/A',
        present: item.present || 0,
        absent: item.absent || 0,
      }))
    : defaultAttendanceData;

  // If no data at all, don't render the chart to avoid whitespace
  if (!loading && data.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className={cn('animate-fade-in', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
