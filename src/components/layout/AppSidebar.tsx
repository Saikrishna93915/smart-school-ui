// src/components/layout/AppSidebar.tsx
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
  Bus,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
  Wallet,
  BarChart3,
  Banknote,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  badge?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    href: "/dashboard", 
    roles: ["admin", "teacher", "parent", "student", "owner", "accountant"] 
  },
  { 
    title: "Students", 
    icon: Users, 
    href: "/students", 
    roles: ["admin", "teacher", "owner"] 
  },
  { 
    title: "Teachers & Staff", 
    icon: GraduationCap, 
    href: "/teachers", 
    roles: ["admin", "owner"] 
  },
  { 
    title: "Attendance", 
    icon: UserCheck, 
    href: "/attendance", 
    roles: ["admin", "teacher", "parent", "student", "owner"] 
  },
  { 
    title: "Exams & Results", 
    icon: ClipboardList, 
    href: "/exams", 
    roles: ["admin", "teacher", "parent", "student", "owner"] 
  },
  { 
    title: "AI Insights", 
    icon: Brain, 
    href: "/ai-insights", 
    roles: ["admin", "teacher", "owner"], 
    badge: "AI" 
  },
  
  // ===== FINANCE SECTION (For Admin/Accountant) =====
  { 
    title: "Finance", 
    icon: BarChart3, 
    href: "/finance", 
    roles: ["admin", "accountant", "owner"],
    children: [
      { 
        title: "Collections", 
        icon: Banknote, 
        href: "/finance/collections", 
        roles: ["admin", "accountant", "owner"] 
      },
      { 
        title: "Payment History", 
        icon: Receipt, 
        href: "/finance/payment-history", 
        roles: ["admin", "accountant", "owner"] 
      },
      { 
        title: "Record Payment", 
        icon: CreditCard, 
        href: "/finance/record-payment", 
        roles: ["admin", "accountant", "owner"] 
      },
      { 
        title: "Financial Reports", 
        icon: FileSpreadsheet, 
        href: "/finance/reports", 
        roles: ["admin", "accountant", "owner"] 
      },
      { 
        title: "Fee Defaulters", 
        icon: AlertCircle, 
        href: "/finance/defaulters", 
        roles: ["admin", "accountant", "owner"] 
      },
    ]
  },
  
  // ===== FEES SECTION (For Parents/Students) =====
  { 
    title: "My Fees", 
    icon: Wallet, 
    href: "/fees", 
    roles: ["parent", "student"],
    children: [
      { 
        title: "Fee Structure", 
        icon: FileText, 
        href: "/fees/structure", 
        roles: ["parent", "student"] 
      },
      { 
        title: "Current Dues", 
        icon: AlertCircle, 
        href: "/fees/dues", 
        roles: ["parent", "student"] 
      },
      { 
        title: "Payment History", 
        icon: Receipt, 
        href: "/fees/history", 
        roles: ["parent", "student"] 
      },
      { 
        title: "Pay Online", 
        icon: CreditCard, 
        href: "/fees/pay", 
        roles: ["parent", "student"] 
      },
      { 
        title: "Receipts", 
        icon: Download, 
        href: "/fees/receipts", 
        roles: ["parent", "student"] 
      },
    ]
  },
  
  { 
    title: "Transport", 
    icon: Bus, 
    href: "/transport", 
    roles: ["admin", "parent", "owner"] 
  },
  { 
    title: "Syllabus & Lessons", 
    icon: BookOpen, 
    href: "/syllabus", 
    roles: ["admin", "teacher", "student"] 
  },
  { 
    title: "Communication", 
    icon: MessageSquare, 
    href: "/communication", 
    roles: ["admin", "teacher", "parent", "owner"] 
  },
  { 
    title: "Certificates", 
    icon: FileText, 
    href: "/certificates", 
    roles: ["admin", "student"] 
  },
  { 
    title: "Settings", 
    icon: Settings, 
    href: "/settings", 
    roles: ["admin", "owner"] 
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Auto-open menu if current path is within it
  const isMenuActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(child => 
        location.pathname === child.href || 
        location.pathname.startsWith(child.href + '/')
      );
    }
    return location.pathname === item.href || 
           location.pathname.startsWith(item.href + '/');
  };

  // Initialize open menus based on current location
  useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {};
    
    navItems.forEach(item => {
      if (item.children && item.roles.includes(user.role)) {
        // Open menu if current path is within it or if it's a frequently used section
        if (isMenuActive(item) || item.title === "My Fees" || item.title === "Finance") {
          newOpenMenus[item.title] = true;
        }
      }
    });
    
    setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname, user?.role]);

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  const displayName = user.name || "Nagendra Babu";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(c => c[0]?.toUpperCase() || "")
    .join("");

  const renderNavItem = (item: NavItem, isChild: boolean = false) => {
    const Icon = item.icon;
    const isActive = isMenuActive(item);
    
    // For collapsed sidebar, only show parent items
    if (isCollapsed && (item.children || isChild)) {
      if (isChild) return null;
      
      return (
        <NavLink
          key={item.href}
          to={item.href}
          className={cn(
            "flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 mb-1",
            isActive
              ? "bg-secondary text-white shadow-lg shadow-secondary/20"
              : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
          )}
          title={item.title}
        >
          <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
        </NavLink>
      );
    }

    // Render parent item with children
    if (item.children && !isCollapsed) {
      const isOpen = openMenus[item.title] || false;
      
      return (
        <Collapsible
          key={item.title}
          open={isOpen}
          onOpenChange={() => toggleMenu(item.title)}
          className="mb-1"
        >
          <CollapsibleTrigger asChild>
            <div className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
            )}>
              <div className="flex items-center gap-3 flex-1">
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span className="flex-1 truncate text-left">{item.title}</span>
                {item.badge && (
                  <Badge className="bg-amber-500 text-white border-none text-[10px] font-black px-1.5 h-4">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90"
              )} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-1 ml-4 space-y-1">
            {item.children
              .filter(child => child.roles.includes(user.role))
              .map(child => {
                const childIsActive = location.pathname === child.href || 
                                     location.pathname.startsWith(child.href + '/');
                return (
                  <NavLink
                    key={child.href}
                    to={child.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      childIsActive
                        ? "bg-secondary/20 text-white"
                        : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <child.icon className={cn("h-4 w-4 shrink-0", childIsActive ? "text-white" : "text-slate-400")} />
                    <span className="flex-1 truncate">{child.title}</span>
                  </NavLink>
                );
              })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    // Render regular nav item
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
  };

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
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map(item => renderNavItem(item))}
      </nav>

      {/* ===== USER FOOTER ===== */}
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
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-white truncate leading-tight italic">
                {displayName}
              </p>
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