import { type ReactNode } from "react";
import { Bell, Sparkles, CalendarRange } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { useActiveSemester, semesterShortLabel, type SemesterScope } from "@/lib/semester-context";

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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-2">
              <SemesterChip />
              <Button
                size="sm"
                className="rounded-full bg-primary hover:bg-primary/90 shadow-sm gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                Ask AI
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
