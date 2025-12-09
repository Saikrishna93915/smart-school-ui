import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, CreditCard, MessageSquare, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface QuickAction {
  title: string;
  icon: React.ElementType;
  href: string;
  variant: 'default' | 'secondary' | 'success' | 'warning';
  roles: UserRole[];
}

const quickActions: QuickAction[] = [
  { title: 'Add Student', icon: UserPlus, href: '/students/add', variant: 'default', roles: ['admin'] },
  { title: 'Mark Attendance', icon: UserCheck, href: '/attendance', variant: 'success', roles: ['admin', 'teacher'] },
  { title: 'Collect Fee', icon: CreditCard, href: '/fees', variant: 'warning', roles: ['admin'] },
  { title: 'Send Notice', icon: MessageSquare, href: '/communication', variant: 'secondary', roles: ['admin', 'teacher'] },
  { title: 'View Reports', icon: FileText, href: '/reports', variant: 'default', roles: ['admin', 'owner'] },
  { title: 'Schedule Event', icon: Calendar, href: '/calendar', variant: 'secondary', roles: ['admin'] },
];

interface QuickActionsProps {
  role: UserRole;
  className?: string;
}

export function QuickActions({ role, className }: QuickActionsProps) {
  const filteredActions = quickActions.filter((action) => action.roles.includes(role));

  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto flex-col gap-2 py-4"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
