import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["admin", "teacher", "parent", "student", "owner"] },
  { title: "Students", icon: Users, href: "/students", roles: ["admin", "teacher", "owner"] },
  { title: "Teachers & Staff", icon: GraduationCap, href: "/teachers", roles: ["admin", "owner"] },
  { title: "Attendance", icon: UserCheck, href: "/attendance", roles: ["admin", "teacher", "parent", "student", "owner"] },
  { title: "Exams & Results", icon: ClipboardList, href: "/exams", roles: ["admin", "teacher", "parent", "student", "owner"] },
  { title: "AI Insights", icon: Brain, href: "/ai-insights", roles: ["admin", "teacher", "owner"], badge: "AI" },
  { title: "Fees & Finance", icon: CreditCard, href: "/fees", roles: ["admin", "parent", "owner"] },
  { title: "Transport", icon: Bus, href: "/transport", roles: ["admin", "parent", "owner"] },
  { title: "Syllabus & Lessons", icon: BookOpen, href: "/syllabus", roles: ["admin", "teacher", "student"] },
  { title: "Communication", icon: MessageSquare, href: "/communication", roles: ["admin", "teacher", "parent", "owner"] },
  { title: "Certificates", icon: FileText, href: "/certificates", roles: ["admin", "student"] },
  { title: "Settings", icon: Settings, href: "/settings", roles: ["admin", "owner"] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  /**
   * ✅ FIX: Fetch name from AuthContext user object.
   * This ensures "Nagendra" or the Student's name appears instead of "Admin".
   */
  const displayName = user.name || "Nagendra Babu";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(c => c[0]?.toUpperCase())
    .join("");

  return (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col h-full border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* ===== HEADER ===== */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl gradient-secondary shadow-lg">
          <School className="h-5 w-5 text-white" />
        </div>

        {!isCollapsed && (
          <div className="ml-3 flex-1">
            <p className="text-sm font-black text-white tracking-tight">AI School ERP</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Smart Education</p>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-slate-400 hover:text-white hover:bg-white/10"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                  : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />

              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.badge && (
                    <Badge className="bg-amber-500 text-white border-none text-[10px] font-black px-1.5 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ===== USER FOOTER (DYNAMIC NAME FETCHING) ===== */}
      <div className="border-t border-sidebar-border p-4 bg-black/5">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-11 w-11 border-2 border-white/10 shadow-xl">
            <AvatarFallback className="bg-secondary text-white font-black text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="min-w-0">
              {/* ✅ FONT SIZE: 16px (text-base) for clarity */}
              <p className="text-base font-black text-white truncate leading-tight italic">
                {displayName}
              </p>
              {/* ✅ FONT SIZE: 14px (text-sm) for role */}
              <p className="text-sm font-bold text-slate-500 capitalize tracking-tighter">
                {user.role} Account
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={logout}
          variant="ghost"
          className={cn(
            "mt-6 w-full flex items-center gap-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold transition-colors",
            isCollapsed ? "justify-center" : "justify-start px-3"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}