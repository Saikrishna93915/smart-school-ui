import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertTriangle,
  DollarSign,
  Percent,
  Users
} from 'lucide-react';
import { formatCompactCurrency, formatPercentage } from '@/lib/utils/finance/currencyFormatter';

interface FinanceMetricsProps {
  totalCollected: number;
  currentMonth: number;
  outstandingBalance: number;
  collectionRate: number;
  pendingAccounts: number;
  className?: string;
}

export const FinanceMetrics: React.FC<FinanceMetricsProps> = ({
  totalCollected,
  currentMonth,
  outstandingBalance,
  collectionRate,
  pendingAccounts,
  className = ''
}) => {
  const metrics = [
    {
      title: 'Total Collected',
      value: formatCompactCurrency(totalCollected),
      description: 'Overall collection',
      icon: DollarSign,
      trend: '+12.4%',
      trendUp: true,
      color: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      title: 'This Month',
      value: formatCompactCurrency(currentMonth),
      description: 'Current month collection',
      icon: CreditCard,
      trend: '+8.2%',
      trendUp: true,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Outstanding',
      value: formatCompactCurrency(outstandingBalance),
      description: 'Pending payments',
      icon: AlertTriangle,
      trend: '-3.1%',
      trendUp: false,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Collection Rate',
      value: formatPercentage(collectionRate),
      description: 'Efficiency rate',
      icon: Percent,
      trend: '+2.4%',
      trendUp: true,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Accounts',
      value: pendingAccounts.toString(),
      description: 'Fee defaulters',
      icon: Users,
      trend: '-5',
      trendUp: false,
      color: 'text-red-700',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={index} className="border border-gray-200 hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">{metric.description}</div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trendUp ? 'text-green-700' : 'text-red-700'
                }`}>
                  {metric.trendUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {metric.trend}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};