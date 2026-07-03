import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, LogIn, LogOut, Coffee, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/timeclock")({
  head: () => ({ meta: [{ title: "Clock-in · skoolmate" }] }),
  component: TimeclockPage,
});

type State = "out" | "in" | "break";
interface Entry { id: string; type: "in" | "out" | "break-start" | "break-end"; time: string; note?: string }

const history = [
  { day: "Mon 22 Jun", in: "08:12", out: "16:38", breakMin: 45, hours: "7h 41m" },
  { day: "Tue 23 Jun", in: "08:05", out: "16:20", breakMin: 40, hours: "7h 35m" },
  { day: "Wed 24 Jun", in: "07:58", out: "16:45", breakMin: 50, hours: "7h 57m" },
  { day: "Thu 25 Jun", in: "08:20", out: "16:30", breakMin: 45, hours: "7h 25m" },
  { day: "Fri 26 Jun", in: "07:52", out: "15:10", breakMin: 30, hours: "6h 48m" },
];

function fmt(d: Date) { return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }); }

function TimeclockPage() {
  const [state, setState] = useState<State>("out");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  function log(type: Entry["type"], nextState: State, msg: string) {
    const t = fmt(new Date());
    setEntries((p) => [{ id: `e${Date.now()}`, type, time: t }, ...p]);
    setState(nextState);
    toast.success(msg);
  }

  const firstIn = entries.filter((e) => e.type === "in").at(-1);

  return (
    <AppShell>
      <PageHeader
        title="Time & Attendance"
        subtitle="Clock in for your teaching day. Timesheets sync to payroll weekly."
        actions={<Badge variant="outline"><MapPin className="h-3 w-3" /> On-site · Rosella Campus</Badge>}
      />
      <div className="px-4 py-6 md:px-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-8 text-center bg-gradient-to-br from-primary-soft/40 via-background to-background">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground border">
            <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="mt-6 text-6xl font-semibold tracking-tight tabular-nums">{fmt(now)}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {state === "out" && "You have not clocked in yet"}
            {state === "in" && firstIn && `Clocked in at ${firstIn.time} · currently working`}
            {state === "break" && "On break — clock back in when you return"}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {state === "out" && (
              <Button size="lg" className="rounded-full bg-primary px-8 hover:bg-primary/90" onClick={() => log("in", "in", "Clocked in. Have a great day!")}>
                <LogIn className="h-5 w-5" /> Clock in
              </Button>
            )}
            {state === "in" && (
              <>
                <Button size="lg" variant="outline" className="rounded-full px-6" onClick={() => log("break-start", "break", "Break started.")}>
                  <Coffee className="h-5 w-5" /> Start break
                </Button>
                <Button size="lg" className="rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90" onClick={() => log("out", "out", "Clocked out. See you tomorrow!")}>
                  <LogOut className="h-5 w-5" /> Clock out
                </Button>
              </>
            )}
            {state === "break" && (
              <Button size="lg" className="rounded-full bg-primary px-8 hover:bg-primary/90" onClick={() => log("break-end", "in", "Welcome back.")}>
                <LogIn className="h-5 w-5" /> End break
              </Button>
            )}
          </div>

          {entries.length > 0 && (
            <div className="mt-8 mx-auto max-w-md rounded-lg border bg-card/60 p-3 text-left">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Today's punches</div>
              <ul className="space-y-1 text-sm">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span className="capitalize">{e.type.replace("-", " ")}</span>
                    <span className="tabular-nums text-muted-foreground">{e.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">This week</h3>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-2">
            {history.map((h) => (
              <div key={h.day} className={cn("flex items-center justify-between rounded-md border px-3 py-2 text-xs")}>
                <div>
                  <div className="font-medium">{h.day}</div>
                  <div className="text-[11px] text-muted-foreground">{h.in} – {h.out} · {h.breakMin}m break</div>
                </div>
                <Badge variant="outline" className="tabular-nums">{h.hours}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-soft/50 px-3 py-2 text-sm">
            <span className="font-medium">Weekly total</span>
            <span className="tabular-nums font-semibold">37h 26m</span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
