import { type ReactNode } from "react";
import { Search, Bell, Sparkles } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="relative ml-2 hidden flex-1 max-w-xl md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students, lessons, evidence, IEP goals…"
                className="w-full rounded-full border bg-secondary/60 py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
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
