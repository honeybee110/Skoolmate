import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
} from "lucide-react";
import {
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  SEMESTERS,
  type SSGMinute,
} from "@/lib/ssg-minutes";

export const Route = createFileRoute("/admin/ssg-minutes")({
  head: () => ({ meta: [{ title: "SSG Minutes · Admin · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <AdminSSGMinutes />
      </AppShell>
    </RoleGate>
  ),
});

type SubmitterProfile = { id: string; display_name: string | null };

function AdminSSGMinutes() {
  const [minutes, setMinutes] = useState<SSGMinute[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [selected, setSelected] = useState<SSGMinute | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await (supabase as unknown as { from: (t: string) => any })
      .from("ssg_minutes")
      .select("*")
      .eq("status", "Submitted")
      .order("meeting_date", { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as SSGMinute[];
    setMinutes(list);
    const ids = Array.from(new Set(list.map((m) => m.submitted_by)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: SubmitterProfile) => {
        map[p.id] = p.display_name ?? p.id.slice(0, 8);
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const semesterMinutes = useMemo(
    () => minutes.filter((m) => m.semester === semester),
    [minutes, semester],
  );

  const byClass = useMemo(() => {
    const map = new Map<string, SSGMinute[]>();
    for (const m of semesterMinutes) {
      const arr = map.get(m.class_level) ?? [];
      arr.push(m);
      map.set(m.class_level, arr);
    }
    return map;
  }, [semesterMinutes]);

  return (
    <div>
      <PageHeader
        title="SSG Minutes"
        subtitle="Read-only view of every submitted Student Support Group meeting across the school."
        actions={
          <div className="flex items-center gap-2">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading minutes…
          </div>
        ) : error ? (
          <Card className="border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" /> Could not load minutes
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => void load()}>
              Retry
            </Button>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={["primary", "secondary"]} className="space-y-3">
            <LevelGroup
              id="primary"
              title="Primary (P1–P15)"
              classes={PRIMARY_CLASSES}
              byClass={byClass}
              profiles={profiles}
              onOpen={setSelected}
            />
            <LevelGroup
              id="secondary"
              title="Secondary (S1–S10)"
              classes={SECONDARY_CLASSES}
              byClass={byClass}
              profiles={profiles}
              onOpen={setSelected}
            />
          </Accordion>
        )}
      </div>

      <MinuteDetailDialog
        minute={selected}
        submitter={selected ? profiles[selected.submitted_by] : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function LevelGroup({
  id,
  title,
  classes,
  byClass,
  profiles,
  onOpen,
}: {
  id: string;
  title: string;
  classes: string[];
  byClass: Map<string, SSGMinute[]>;
  profiles: Record<string, string>;
  onOpen: (m: SSGMinute) => void;
}) {
  const totalMinutes = classes.reduce((n, c) => n + (byClass.get(c)?.length ?? 0), 0);
  const missing = classes.filter((c) => !byClass.get(c)?.length).length;

  return (
    <AccordionItem value={id} className="rounded-2xl border bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex flex-1 items-center justify-between pr-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalMinutes} submitted</Badge>
            {missing > 0 ? (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                <CircleAlert className="mr-1 h-3 w-3" />
                {missing} class{missing === 1 ? "" : "es"} pending
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="mr-1 h-3 w-3" /> All classes submitted
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const rows = byClass.get(c) ?? [];
            const empty = rows.length === 0;
            return (
              <Card
                key={c}
                className={`p-3 ${empty ? "border-amber-200 bg-amber-50/40" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">{c}</div>
                  {empty ? (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-100 text-amber-900"
                    >
                      <CircleAlert className="mr-1 h-3 w-3" /> 0 submitted
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{rows.length} submitted</Badge>
                  )}
                </div>
                {empty ? (
                  <p className="text-xs text-muted-foreground">
                    No minutes submitted for this class this semester.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {rows.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(m)}
                          className="flex w-full items-center justify-between gap-2 py-2 text-left transition hover:bg-accent/40"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {m.student_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(m.meeting_date).toLocaleDateString()} · {m.meeting_type} ·{" "}
                              {profiles[m.submitted_by] ?? "Teacher"}
                            </div>
                          </div>
                          <Badge variant="default" className="shrink-0">Submitted</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function MinuteDetailDialog({
  minute,
  submitter,
  onClose,
}: {
  minute: SSGMinute | null;
  submitter?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!minute} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {minute && (
          <>
            <DialogHeader>
              <DialogTitle>{minute.student_name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {minute.class_level} · {minute.semester} · {minute.meeting_type} ·{" "}
                {new Date(minute.meeting_date).toLocaleDateString()}
              </p>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <Section label="Submitted by">
                {submitter ?? "Teacher"}
                {minute.submitted_at &&
                  ` · ${new Date(minute.submitted_at).toLocaleString()}`}
              </Section>

              <Section label="Attendees">
                {minute.attendees?.length ? (
                  <ul className="space-y-1">
                    {minute.attendees.map((a, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{a.name || <em className="text-muted-foreground">Unnamed</em>}</span>
                        <span className="text-xs text-muted-foreground">{a.role}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <em className="text-muted-foreground">No attendees recorded.</em>
                )}
              </Section>

              {minute.apologies && (
                <Section label="Apologies">
                  <p className="whitespace-pre-wrap">{minute.apologies}</p>
                </Section>
              )}

              <Section label="Discussion summary">
                <p className="whitespace-pre-wrap">
                  {minute.discussion_summary || (
                    <em className="text-muted-foreground">No summary recorded.</em>
                  )}
                </p>
              </Section>

              <Section label="Action items">
                {minute.action_items?.length ? (
                  <ul className="space-y-1">
                    {minute.action_items.map((a, i) => (
                      <li key={i} className="rounded-md border p-2">
                        <div className="text-sm">{a.action}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Owner: {a.owner || "—"}
                          {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString()}`}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <em className="text-muted-foreground">No action items.</em>
                )}
              </Section>

              {minute.next_meeting_date && (
                <Section label="Next meeting">
                  {new Date(minute.next_meeting_date).toLocaleDateString()}
                </Section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
