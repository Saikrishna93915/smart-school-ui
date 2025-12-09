import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  ClipboardList,
  Brain,
  CreditCard,
  Bus,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'teacher', 'parent', 'student', 'owner'] },
  { title: 'Students', icon: Users, href: '/students', roles: ['admin', 'teacher', 'owner'] },
  { title: 'Teachers & Staff', icon: GraduationCap, href: '/teachers', roles: ['admin', 'owner'] },
  { title: 'Attendance', icon: UserCheck, href: '/attendance', roles: ['admin', 'teacher', 'parent', 'student', 'owner'] },
  { title: 'Exams & Results', icon: ClipboardList, href: '/exams', roles: ['admin', 'teacher', 'parent', 'student', 'owner'] },
  { title: 'AI Insights', icon: Brain, href: '/ai-insights', roles: ['admin', 'teacher', 'owner'], badge: 'AI' },
  { title: 'Fees & Finance', icon: CreditCard, href: '/fees', roles: ['admin', 'parent', 'owner'] },
  { title: 'Transport', icon: Bus, href: '/transport', roles: ['admin', 'parent', 'owner'] },
  { title: 'Syllabus & Lessons', icon: BookOpen, href: '/syllabus', roles: ['admin', 'teacher', 'student'] },
  { title: 'Communication', icon: MessageSquare, href: '/communication', roles: ['admin', 'teacher', 'parent', 'owner'] },
  { title: 'Certificates', icon: FileText, href: '/certificates', roles: ['admin', 'student'] },
  { title: 'Settings', icon: Settings, href: '/settings', roles: ['admin', 'owner'] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-secondary shadow-glow">
          <School className="h-5 w-5 text-secondary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">AI School ERP</h1>
            <p className="text-xs text-sidebar-muted truncate">Smart Education</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-secondary text-sidebar-primary-foreground shadow-glow'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-secondary">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm font-semibold">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-muted capitalize">{user.role}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          onClick={logout}
          className={cn(
            'mt-2 text-sidebar-muted hover:text-destructive hover:bg-destructive/10',
            isCollapsed ? 'w-full' : 'w-full justify-start'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
