import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'attendance' | 'fee' | 'exam' | 'notice' | 'admission';
}

const activityData: Activity[] = [
  { id: '1', user: 'Priya Sharma', action: 'marked attendance for', target: 'Class 10-A', time: '2 min ago', type: 'attendance' },
  { id: '2', user: 'Anil Verma', action: 'paid fee for', target: 'Arjun Verma', time: '15 min ago', type: 'fee' },
  { id: '3', user: 'Admin', action: 'added exam schedule for', target: 'Mid-term Exams', time: '1 hour ago', type: 'exam' },
  { id: '4', user: 'System', action: 'sent reminder to', target: '45 parents', time: '2 hours ago', type: 'notice' },
  { id: '5', user: 'Rajesh Kumar', action: 'admitted new student', target: 'Kavya Singh', time: '3 hours ago', type: 'admission' },
];

const typeBadges = {
  attendance: { variant: 'success' as const, label: 'Attendance' },
  fee: { variant: 'warning' as const, label: 'Fee' },
  exam: { variant: 'accent' as const, label: 'Exam' },
  notice: { variant: 'secondary' as const, label: 'Notice' },
  admission: { variant: 'default' as const, label: 'Admission' },
};

interface RecentActivityProps {
  className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activityData.map((activity) => {
          const badge = typeBadges[activity.type];
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="text-xs bg-muted">
                  {activity.user.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant} className="text-[10px]">
                    {badge.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
