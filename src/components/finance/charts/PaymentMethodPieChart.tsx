import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote, Building, FileText, IndianRupee } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/finance/currencyFormatter';

interface PaymentMethodData {
  method: string;
  value: number;
  count: number;
  percentage: number;
}

interface PaymentMethodPieChartProps {
  data?: PaymentMethodData[];
  height?: number;
  title?: string;
  description?: string;
}

const getMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'upi':
      return <Smartphone className="h-4 w-4" />;
    case 'card':
      return <CreditCard className="h-4 w-4" />;
    case 'cash':
      return <IndianRupee className="h-4 w-4" />;
    case 'banktransfer':
    case 'netbanking':
      return <Building className="h-4 w-4" />;
    case 'cheque':
      return <FileText className="h-4 w-4" />;
    default:
      return <Banknote className="h-4 w-4" />;
  }
};

const getMethodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case 'upi': return '#8b5cf6';
    case 'card': return '#3b82f6';
    case 'cash': return '#f59e0b';
    case 'banktransfer': return '#10b981';
    case 'netbanking': return '#06b6d4';
    case 'cheque': return '#ef4444';
    default: return '#6b7280';
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {getMethodIcon(data.method)}
          <span className="font-semibold text-gray-900">{data.method}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(data.value)}
            </span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">Transactions</span>
            <span className="font-medium text-gray-900">{data.count}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">Share</span>
            <span className="font-medium text-gray-900">{formatPercentage(data.percentage)}</span>
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
    <div className="grid grid-cols-2 gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
          <div 
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {entry.value}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercentage((entry.payload as any).percentage)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const PaymentMethodPieChart: React.FC<PaymentMethodPieChartProps> = ({
  data: propData,
  height = 300,
  title = "Payment Methods",
  description = "Distribution by payment type"
}) => {
  // Default data if none provided
  const defaultData: PaymentMethodData[] = [
    { method: 'UPI', value: 4500000, count: 125, percentage: 45 },
    { method: 'Card', value: 2500000, count: 68, percentage: 25 },
    { method: 'Bank Transfer', value: 2000000, count: 42, percentage: 20 },
    { method: 'Cash', value: 1000000, count: 35, percentage: 10 }
  ];
  
  const data = propData || defaultData;
  const totalAmount = data.reduce((sum, item) => sum + item.value, 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-gray-600">
              {totalTransactions} transactions
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="method"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getMethodColor(entry.method)}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <Legend content={<CustomLegend />} />
            
            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: getMethodColor(item.method) }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {item.method}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.value)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.count} transactions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Most Popular</div>
              <div className="flex items-center gap-2">
                {getMethodIcon(data[0]?.method || 'UPI')}
                <span className="font-medium text-gray-900">
                  {data[0]?.method || 'UPI'}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-1">Average Transaction</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(totalAmount / totalTransactions)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};