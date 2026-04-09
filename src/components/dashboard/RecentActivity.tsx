import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'attendance' | 'fee' | 'exam' | 'notice' | 'admission' | 'teacher' | 'vehicle' | 'user';
  metadata?: any;
}

const typeBadges = {
  attendance: { variant: 'default' as const, label: 'Attendance', color: 'bg-green-500' },
  fee: { variant: 'default' as const, label: 'Fee', color: 'bg-yellow-500' },
  exam: { variant: 'default' as const, label: 'Exam', color: 'bg-blue-500' },
  notice: { variant: 'secondary' as const, label: 'Notice', color: 'bg-gray-500' },
  admission: { variant: 'default' as const, label: 'Admission', color: 'bg-purple-500' },
  teacher: { variant: 'default' as const, label: 'Teacher', color: 'bg-indigo-500' },
  vehicle: { variant: 'default' as const, label: 'Vehicle', color: 'bg-orange-500' },
  user: { variant: 'default' as const, label: 'User', color: 'bg-pink-500' },
};

interface RecentActivityProps {
  className?: string;
  activities?: Activity[];
  loading?: boolean;
  activityCount?: number;
  onActivityCountChange?: (count: number) => void;
  activityType?: string;
  onActivityTypeChange?: (type: string) => void;
  daysFilter?: number;
  onDaysFilterChange?: (days: number) => void;
  feeSort?: 'highest' | 'lowest';
  onFeeSortChange?: (sort: 'highest' | 'lowest') => void;
}

export function RecentActivity({ 
  className, 
  activities = [], 
  loading = false,
  activityCount = 20,
  onActivityCountChange,
  activityType = 'all',
  onActivityTypeChange,
  daysFilter = 7,
  onDaysFilterChange,
  feeSort = 'highest',
  onFeeSortChange
}: RecentActivityProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Activity Type Filter */}
            {onActivityTypeChange && (
              <Select
                value={activityType}
                onValueChange={onActivityTypeChange}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="fee">Fee Payment</SelectItem>
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Days Filter */}
            {onDaysFilterChange && (
              <Select
                value={daysFilter.toString()}
                onValueChange={(value) => onDaysFilterChange(parseInt(value))}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="3">Last 3 days</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Fee Sort Filter - Only show when Fee type selected */}
            {activityType === 'fee' && onFeeSortChange && (
              <Select
                value={feeSort}
                onValueChange={(value) => onFeeSortChange(value as 'highest' | 'lowest')}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Highest Fees</SelectItem>
                  <SelectItem value="lowest">Lowest Fees</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Count Filter */}
            {onActivityCountChange && (
              <Select
                value={activityCount.toString()}
                onValueChange={(value) => onActivityCountChange(parseInt(value))}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Show 10</SelectItem>
                  <SelectItem value="20">Show 20</SelectItem>
                  <SelectItem value="50">Show 50</SelectItem>
                  <SelectItem value="100">Show 100</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities found
          </div>
        ) : (
          activities.map((activity) => {
            const badge = typeBadges[activity.type] || typeBadges.notice;
            return (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback className={cn("text-xs font-semibold text-white", badge.color)}>
                    {activity.user.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-foreground">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    <span className="font-medium text-foreground">{activity.target}</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={badge.variant} 
                      className={cn("text-[10px] px-2 py-0.5 text-white", badge.color)}
                    >
                      {badge.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
