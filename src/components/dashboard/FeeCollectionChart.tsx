import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface FeeCollectionData {
  _id: string;
  className: string;
  totalFee: number;
  paid: number;
  unpaid: number;
  studentCount: number;
  totalAmount: number;
}

interface FeeCollectionChartProps {
  data?: FeeCollectionData[];
  loading?: boolean;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

export function FeeCollectionChart({ data = [], loading = false, className }: FeeCollectionChartProps) {
  // Format data for stacked bar chart
  const chartData = data.length > 0
    ? data.map(item => ({
        name: item.className || item._id || 'Class',
        paid: item.paid || 0,
        unpaid: item.unpaid || 0,
        total: (item.paid || 0) + (item.unpaid || 0),
        students: item.studentCount || 0,
      }))
    : [
        { name: '10th A', paid: 125000, unpaid: 45000, total: 170000, students: 45 },
        { name: '10th B', paid: 118000, unpaid: 52000, total: 170000, students: 42 },
        { name: '9th A', paid: 95000, unpaid: 75000, total: 170000, students: 38 },
        { name: '9th B', paid: 102000, unpaid: 68000, total: 170000, students: 40 },
        { name: '8th A', paid: 89000, unpaid: 81000, total: 170000, students: 35 },
      ];

  if (loading) {
    return (
      <Card className={cn('animate-fade-in', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fee Collection by Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Fee Collection by Class</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Paid (Green) vs Unpaid (Orange) Amount</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number, name: string) => {
                  if (name === 'paid') {
                    return [formatCurrency(value), 'Paid Fees'];
                  } else if (name === 'unpaid') {
                    return [formatCurrency(value), 'Unpaid Fees'];
                  }
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => value === 'paid' ? 'Paid Fees' : value === 'unpaid' ? 'Unpaid Fees' : value}
              />
              <Bar dataKey="paid" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unpaid" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground">Total Classes</p>
            <p className="text-lg font-semibold">{chartData.length}</p>
          </div>
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-lg font-semibold">{chartData.reduce((sum, d) => sum + d.students, 0)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
            <p className="text-xs text-green-600 dark:text-green-400">Total Paid</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">{formatCurrency(chartData.reduce((sum, d) => sum + d.paid, 0))}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
            <p className="text-xs text-orange-600 dark:text-orange-400">Total Unpaid</p>
            <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">{formatCurrency(chartData.reduce((sum, d) => sum + d.unpaid, 0))}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
