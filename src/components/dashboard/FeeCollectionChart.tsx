import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const feeData = [
  { name: 'Collected', value: 85, color: 'hsl(var(--success))' },
  { name: 'Pending', value: 12, color: 'hsl(var(--warning))' },
  { name: 'Overdue', value: 3, color: 'hsl(var(--destructive))' },
];

interface FeeCollectionChartProps {
  className?: string;
}

export function FeeCollectionChart({ className }: FeeCollectionChartProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Fee Collection Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={feeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {feeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {feeData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name} ({item.value}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
