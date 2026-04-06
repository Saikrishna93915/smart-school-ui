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
  gradient?: string;
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    border: 'border-l-primary',
    icon: 'bg-primary/10 text-primary',
  },
  primary: {
    border: 'border-l-primary',
    icon: 'bg-primary/10 text-primary',
  },
  success: {
    border: 'border-l-success',
    icon: 'bg-success/10 text-success',
  },
  warning: {
    border: 'border-l-warning',
    icon: 'bg-warning/10 text-warning',
  },
  danger: {
    border: 'border-l-destructive',
    icon: 'bg-destructive/10 text-destructive',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  gradient,
  loading = false,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  // Get gradient styles
  const gradientClasses = gradient ? `bg-gradient-to-br ${gradient}` : '';
  const iconGradient = gradient ? 'text-white' : styles.icon;

  return (
    <Card className={cn('border-l-4', !gradient && styles.border, 'overflow-hidden', className)}>
      {gradient && <div className={cn(gradientClasses, 'h-1 w-full')} />}
      <CardContent className={cn('p-5', gradient && 'bg-card')}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className={cn('text-sm font-medium', gradient ? 'text-muted-foreground' : 'text-muted-foreground')}>{title}</p>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              ) : (
                <>
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
                </>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ml-4',
              gradient ? `bg-gradient-to-br ${gradient}` : iconGradient
            )}
          >
            <Icon className={cn('h-6 w-6', gradient && 'text-white')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
