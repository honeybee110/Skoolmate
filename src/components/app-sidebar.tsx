import { Link, useRouterState } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  Camera,
  Activity,
  FileText,
  Library,
  Calendar,
  
  Settings,
  ShieldCheck,
  ClipboardCheck,
  Bell,
  BarChart3,
  HeartPulse,
  Stethoscope,
  UserCog,
  CalendarClock,
  Timer,
  LogOut,
  FolderKanban,
  Pin,
  UserCheck,
  Archive,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, roleLabel } from "@/lib/auth-context";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const teacherNav = {
  Teach: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "My Classes", url: "/classes", icon: GraduationCap },
    { title: "Students", url: "/students", icon: Users },
  ] as NavItem[],
  Plan: [
    { title: "Lesson Planner", url: "/lessons/planner", icon: BookOpen },
    { title: "Lesson Bank", url: "/lessons/bank", icon: Library },
    { title: "IEPs", url: "/ieps", icon: Target },
    { title: "Handover Documents", url: "/handover", icon: FolderKanban },
    { title: "Scope & Sequence", url: "/scope-sequence", icon: ClipboardCheck },
    { title: "Resource Bank", url: "/resources", icon: Library },
  ] as NavItem[],
  Track: [
    { title: "Daily Attendance", url: "/attendance", icon: UserCheck },
    { title: "Evidence Hub", url: "/evidence", icon: Camera },
    { title: "Behaviour", url: "/behaviour", icon: Activity },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Time & Attendance", url: "/timeclock", icon: Timer },
  ] as NavItem[],
};

const adminNav = {
  Overview: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "IEP Management", url: "/admin/ieps", icon: Target },
    { title: "Approval Centre", url: "/admin/approvals", icon: ClipboardCheck },
    { title: "Document Centre", url: "/admin/documents", icon: FolderKanban },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
  ] as NavItem[],
  School: [
    { title: "Teachers", url: "/admin/teachers", icon: UserCheck },
    { title: "My Classes", url: "/admin/classes", icon: GraduationCap },
    { title: "My Students", url: "/admin/students", icon: Users },
    { title: "Whole School Timetable", url: "/admin/timetable", icon: CalendarClock },
  ] as NavItem[],
  Curriculum: [
    { title: "Curriculum & Scope and Sequence", url: "/admin/curriculum", icon: BookOpen },
    { title: "Resource Bank Management", url: "/admin/resources", icon: Library },
    { title: "Leadership Templates", url: "/admin/templates", icon: Pin },
    { title: "Cross-Check Builder", url: "/admin/crosscheck-builder", icon: ClipboardCheck },
  ] as NavItem[],
  Insights: [
    { title: "Reports", url: "/admin/reports", icon: FileText },
    { title: "Evidence Hub", url: "/admin/evidence", icon: Camera },
    { title: "Behaviour Analytics", url: "/admin/behaviour", icon: BarChart3 },
  ] as NavItem[],
  Teams: [
    { title: "Wellbeing", url: "/admin/wellbeing", icon: HeartPulse },
    { title: "Allied Health", url: "/admin/allied-health", icon: Stethoscope },
  ] as NavItem[],
  Admin: [
    { title: "Time & Attendance", url: "/admin/timeclock", icon: Timer },
    { title: "User Management", url: "/admin/users", icon: UserCog },
    { title: "Override Audit", url: "/admin/audit", icon: Archive },
  ] as NavItem[],
};

export function AppSidebar({ variant = "teacher" }: { variant?: "teacher" | "admin" }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, profile, roles, signOut } = useAuth();
  const isActive = (url: string) =>
    url === "/admin" ? pathname === "/admin" : pathname === url || pathname.startsWith(url + "/");

  const isAdmin = variant === "admin";
  const nav = isAdmin ? adminNav : teacherNav;
  const homeUrl = isAdmin ? "/admin" : "/dashboard";
  const settingsUrl = isAdmin ? "/admin/settings" : "/settings";

  // Unified rich-navy sidebar for both teacher & admin portals
  const activeClasses =
    "data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:border-l-2 data-[active=true]:border-[color:var(--accent)] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] text-white/75 hover:bg-white/5 hover:text-white";


  const primaryRole = roles[0];
  const initials = (profile?.display_name || user?.email || "SM")
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel
        className={`text-[10px] uppercase tracking-[0.14em] font-semibold ${
          isAdmin ? "text-[color:var(--navy-light)]/80" : "text-muted-foreground/70"
        }`}
      >
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className={activeClasses}
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      collapsible="icon"
      className={
        isAdmin
          ? "[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-white [&_[data-sidebar=sidebar]]:via-[color:var(--navy-soft)]/40 [&_[data-sidebar=sidebar]]:to-white"
          : "[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-primary-soft/60 [&_[data-sidebar=sidebar]]:via-background [&_[data-sidebar=sidebar]]:to-background"
      }
    >
      <SidebarHeader
        className={
          isAdmin
            ? "border-b border-[color:var(--navy)]/15 bg-gradient-to-br from-[color:var(--navy)] to-[color:var(--navy-light)] text-white"
            : "border-b border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground"
        }
      >
        <Link to={homeUrl} className="flex items-center gap-2.5 px-2 py-2">
          <BrandMark size="sm" tagline={isAdmin ? "Admin Portal" : "Teacher Portal"} textClassName={isAdmin ? "text-white" : "text-primary-foreground"} />
        </Link>
        {isAdmin && (
          <div className="mx-2 mb-2 flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90">
            <ShieldCheck className="h-3 w-3" />
            Leadership access
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className={isAdmin ? "gap-0" : ""}>
        {Object.entries(nav).map(([label, items]) => renderGroup(label, items))}
      </SidebarContent>
      <SidebarFooter
        className={
          isAdmin
            ? "border-t border-[color:var(--navy)]/15 bg-[color:var(--navy-soft)]/40"
            : "border-t border-sidebar-border"
        }
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={settingsUrl} className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut()} className="flex items-center gap-3">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{
              backgroundColor: isAdmin
                ? "var(--navy)"
                : `hsl(${profile?.avatar_hue ?? 200} 60% 50%)`,
            }}
          >
            {initials || "SM"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium">
              {profile?.display_name ?? user?.email?.split("@")[0] ?? "Guest"}
            </span>
            <span
              className={`text-[10px] ${
                isAdmin ? "text-[color:var(--navy-light)] font-medium" : "text-muted-foreground"
              }`}
            >
              {primaryRole ? roleLabel(primaryRole) : "Not signed in"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
