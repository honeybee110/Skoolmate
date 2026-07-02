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
  Sparkles,
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
    { title: "Lesson Planner", url: "/lessons", icon: BookOpen },
    { title: "IEPs", url: "/ieps", icon: Target },
    { title: "Handover Documents", url: "/handover", icon: FolderKanban },
    { title: "Scope & Sequence", url: "/scope-sequence", icon: ClipboardCheck },
    { title: "Resource Bank", url: "/resources", icon: Library },
  ] as NavItem[],
  Track: [
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

  const nav = variant === "admin" ? adminNav : teacherNav;
  const homeUrl = variant === "admin" ? "/admin" : "/dashboard";
  const settingsUrl = variant === "admin" ? "/admin/settings" : "/settings";

  const primaryRole = roles[0];
  const initials = (profile?.display_name || user?.email || "SM")
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className="data-[active=true]:bg-primary-soft data-[active=true]:text-primary data-[active=true]:font-medium"
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to={homeUrl} className="flex items-center gap-2.5 px-2 py-2">
          <BrandMark
            size="sm"
            tagline={variant === "admin" ? "Admin Portal" : "Teacher Portal"}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(nav).map(([label, items]) => renderGroup(label, items))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
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
            style={{ backgroundColor: `hsl(${profile?.avatar_hue ?? 200} 60% 50%)` }}
          >
            {initials || "SM"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium">
              {profile?.display_name ?? user?.email?.split("@")[0] ?? "Guest"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {primaryRole ? roleLabel(primaryRole) : "Not signed in"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
