import { Link, useRouterState } from "@tanstack/react-router";
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

const teach = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Classes", url: "/classes", icon: GraduationCap },
  { title: "Students", url: "/students", icon: Users },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

const plan = [
  { title: "Lesson Planner", url: "/lessons", icon: BookOpen },
  { title: "IEPs", url: "/ieps", icon: Target },
  { title: "Resource Bank", url: "/resources", icon: Library },
];

const track = [
  { title: "Evidence Hub", url: "/evidence", icon: Camera },
  { title: "Behaviour", url: "/behaviour", icon: Activity },
  { title: "Reports", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderGroup = (label: string, items: typeof teach) => (
    <SidebarGroup>
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
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">SchoolMate</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">AU</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Teach", teach)}
        {renderGroup("Plan", plan)}
        {renderGroup("Track", track)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-foreground text-xs font-semibold">
            SK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium">Sarah Kim</span>
            <span className="text-[10px] text-muted-foreground">Teacher · Rosella</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
