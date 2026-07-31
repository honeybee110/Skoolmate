import { type ReactNode } from "react";
import { Bell, Sparkles, CalendarRange, Eye, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { useActiveSemester, semesterShortLabel, type SemesterScope } from "@/lib/semester-context";
import { useIsGuest, useGuestReadOnlyGuard, exitGuestMode } from "@/lib/guest-mode";

function SemesterChip() {
  const { activeSemester, setActiveSemester, options } = useActiveSemester();
  return (
    <div className="hidden items-center gap-1 rounded-full border bg-secondary/60 px-1 py-1 lg:flex">
      <CalendarRange className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {options.map((opt: SemesterScope) => {
        const active = opt === activeSemester;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setActiveSemester(opt)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {semesterShortLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

export function AppShell({
  children,
  variant = "teacher",
}: {
  children: ReactNode;
  variant?: "teacher" | "admin";
}) {
  const guest = useIsGuest();
  useGuestReadOnlyGuard();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar variant={variant} />
        <div className="flex flex-1 flex-col">
          {guest && (
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-100 px-3 py-2 text-amber-900 md:px-6"
              data-guest-safe="true"
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                <Eye className="h-3.5 w-3.5" />
                Guest view-only mode — you're exploring skoolmate. Changes won't be saved.
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 border-amber-400 bg-white text-amber-900 hover:bg-amber-50"
                data-guest-safe="true"
              >
                <Link
                  to={variant === "admin" ? "/admin/login" : "/teacher/login"}
                  onClick={() => exitGuestMode()}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </Button>
            </div>
          )}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-2">
              <SemesterChip />
              <Button
                asChild
                size="sm"
                aria-label="Ask SkoolMate"
                title="Ask SkoolMate"
                className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-4 text-white shadow-md hover:opacity-95 gap-1.5"
              >
                <Link to="/ask">
                  <Sparkles className="h-4 w-4" />
                  Ask SkoolMate
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
              </Button>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
