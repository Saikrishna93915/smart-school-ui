import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatLakhs, formatPercentage } from '@/lib/utils/finance/currencyFormatter';

interface MonthlyCollectionData {
  month: string;
  collected: number; // in lakhs
  pending: number; // in lakhs
  target: number; // in lakhs
}

interface CollectionBarChartProps {
  data: MonthlyCollectionData[];
  height?: number;
  showTarget?: boolean;
  title?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const collected = payload.find((p: any) => p.dataKey === 'collected')?.value || 0;
    const pending = payload.find((p: any) => p.dataKey === 'pending')?.value || 0;
    const target = payload.find((p: any) => p.dataKey === 'target')?.value || 0;
    const collectionRate = target > 0 ? (collected / target) * 100 : 0;

    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-3 border-b pb-2">{label} 2024</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-sm text-gray-600">Collected</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatLakhs(collected * 100000)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatLakhs(pending * 100000)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border-2 border-blue-500 border-dashed" />
              <span className="text-sm text-gray-600">Target</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatLakhs(target * 100000)}
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Collection Rate</span>
            <span className={`text-sm font-semibold ${
              collectionRate >= 90 ? 'text-green-700' :
              collectionRate >= 75 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {formatPercentage(collectionRate)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  
  return (
    <div className="flex items-center justify-center gap-6 mt-2 mb-4">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const CollectionBarChart: React.FC<CollectionBarChartProps> = ({ 
  data,
  height = 350,
  showTarget = true,
  title = "Collection Performance",
  description = "Monthly trend (Amounts in lakhs)"
}) => {
  // Calculate summary metrics
  const currentMonth = data[data.length - 1];
  const totalCollected = data.reduce((sum, item) => sum + item.collected, 0);
  const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
  const totalTarget = data.reduce((sum, item) => sum + item.target, 0);
  const overallCollectionRate = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;
  
  // Calculate month-over-month growth
  const momGrowth = data.length > 1 
    ? ((currentMonth.collected - data[data.length - 2].collected) / data[data.length - 2].collected) * 100
    : 0;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {title}
              <Info className="h-4 w-4 text-gray-400" />
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-gray-900">
              {formatLakhs(currentMonth.collected * 100000)}
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 mt-1 ${
              momGrowth >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {momGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatPercentage(Math.abs(momGrowth))} vs last month
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#e5e7eb"
              />
              
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}L`}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
              />
              
              <Legend content={<CustomLegend />} />
              
              <Bar 
                name="Collected"
                dataKey="collected"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              
              <Bar 
                name="Pending"
                dataKey="pending"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              
              {showTarget && (
                <ReferenceLine 
                  y={currentMonth.target}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Target: ₹${currentMonth.target}L`,
                    position: 'right',
                    fill: '#3b82f6',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatLakhs(totalCollected * 100000)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Collected</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {formatPercentage(overallCollectionRate)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Collection Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700">
              {formatLakhs(totalPending * 100000)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Pending</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatLakhs(totalTarget * 100000)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Target</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};