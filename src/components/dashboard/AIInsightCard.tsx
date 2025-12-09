import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsight {
  id: string;
  type: 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  studentName?: string;
}

interface AIInsightCardProps {
  insights: AIInsight[];
  className?: string;
}

const typeIcons = {
  risk: AlertTriangle,
  trend: TrendingDown,
  recommendation: Lightbulb,
};

const severityStyles = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
};

const severityBadge = {
  high: 'destructive',
  medium: 'warning',
  low: 'success',
} as const;

export function AIInsightCard({ insights, className }: AIInsightCardProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = typeIcons[insight.type];
          return (
            <div
              key={insight.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                severityStyles[insight.severity]
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <Badge variant={severityBadge[insight.severity]} className="text-[10px] px-1.5">
                    {insight.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                {insight.studentName && (
                  <p className="text-xs font-medium mt-1">Student: {insight.studentName}</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
