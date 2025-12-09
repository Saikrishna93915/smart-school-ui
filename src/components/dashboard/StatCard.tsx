import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'border-l-primary',
    icon: 'bg-primary/10 text-primary',
    iconBorder: 'border-primary/20',
  },
  primary: {
    card: 'border-l-primary',
    icon: 'gradient-primary text-primary-foreground',
    iconBorder: 'border-primary/20',
  },
  success: {
    card: 'border-l-success',
    icon: 'gradient-success text-success-foreground',
    iconBorder: 'border-success/20',
  },
  warning: {
    card: 'border-l-warning',
    icon: 'gradient-warning text-warning-foreground',
    iconBorder: 'border-warning/20',
  },
  danger: {
    card: 'border-l-destructive',
    icon: 'bg-destructive/10 text-destructive',
    iconBorder: 'border-destructive/20',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card variant="stat" className={cn('animate-fade-in', styles.card, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span
                  className={cn(
                    'flex items-center text-xs font-semibold',
                    trend.isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm',
              styles.icon,
              styles.iconBorder
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
