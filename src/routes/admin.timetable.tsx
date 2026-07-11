import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Send, RotateCcw, CheckCircle2, Rocket, MessageSquare, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useDirectory, directoryActions, statusTone, statusLabel, type ClassBand, type Timetable } from "@/lib/directory-store";
import { sessionTimes, type WeekDay } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/timetable")({
  head: () => ({ meta: [{ title: "Whole-School Timetable · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <WholeSchoolTimetable />
      </AppShell>
    </RoleGate>
  ),
});

const days: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const BANDS: ClassBand[] = ["Prep", "Primary", "Secondary"];

function WholeSchoolTimetable() {
  const { classes, teachers, timetables, activeYearId, years } = useDirectory();
  const activeYear = years.find((y) => y.id === activeYearId);
  const scoped = classes.filter((c) => c.yearId === activeYearId);
  const queue = timetables.filter((t) => t.status === "submitted" || t.status === "in_review" || t.status === "returned");

  return (
    <>
      <PageHeader
        title="Whole-School Timetable"
        subtitle="Master timetable for all classes. Review submissions and publish approved versions."
        actions={<Badge variant="outline" className="gap-1.5">{activeYear?.label ?? "—"} · {activeYear?.status}</Badge>}
      />
      <div className="px-4 py-6 md:px-8">
        <Tabs defaultValue="master">
          <TabsList>
            <TabsTrigger value="master">Master timetable</TabsTrigger>
            <TabsTrigger value="review">Review queue <Badge variant="secondary" className="ml-2 text-[10px]">{queue.length}</Badge></TabsTrigger>
          </TabsList>

          <TabsContent value="master" className="mt-4 space-y-6">
            {BANDS.map((band) => {
              const list = scoped.filter((c) => c.band === band);
              return (
                <section key={band}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{band}</h2>
                    <Badge variant="outline" className="text-[10px]">{list.length}</Badge>
                  </div>
                  <div className="space-y-4">
                    {list.map((c) => {
                      const tt = timetables.find((t) => t.classId === c.id);
                      const teacher = teachers.find((x) => x.id === c.teacherId);
                      const esList = c.esStaffIds.map((id) => teachers.find((x) => x.id === id)).filter(Boolean);
                      return (
                        <Card key={c.id} className="overflow-hidden">
                          <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3">
                            <div>
                              <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[color:var(--primary)]" />{c.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned"}
                                {esList.length > 0 && <> · ES: {esList.map((e) => e?.firstName).join(", ")}</>}
                                · Room {c.room} · {c.studentIds.length} students
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {tt && <Badge className={statusTone(tt.status)}>{statusLabel(tt.status)} · v{tt.version}</Badge>}
                              {tt?.status === "published" && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                          </div>
                          {tt ? <TimetableGrid tt={tt} /> : <div className="p-6 text-center text-xs text-muted-foreground">No timetable submitted yet.</div>}
                        </Card>
                      );
                    })}
                    {list.length === 0 && <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">No classes in {band}.</div>}
                  </div>
                </section>
              );
            })}
          </TabsContent>

          <TabsContent value="review" className="mt-4 space-y-3">
            {queue.length === 0 && <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">Nothing awaiting review.</div>}
            {queue.map((tt) => {
              const c = classes.find((x) => x.id === tt.classId);
              const teacher = teachers.find((x) => x.id === c?.teacherId);
              return (
                <ReviewCard key={tt.id} tt={tt} title={c?.name ?? tt.classId} subtitle={`Submitted by ${teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"}`} />
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function TimetableGrid({ tt }: { tt: Timetable }) {
  const locked = tt.status === "published" || tt.status === "approved";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 text-left">Session</th>
            {days.map((d) => <th key={d} className="px-3 py-2 text-left">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {sessionTimes.map((s) => (
            <tr key={s.session} className="border-b last:border-0">
              <td className="px-3 py-2 align-top">
                <div className="text-xs font-semibold">S{s.session}</div>
                <div className="text-[10px] text-muted-foreground">{s.start}–{s.end}</div>
              </td>
              {days.map((d) => {
                const cell = tt.grid[d]?.[s.session];
                return (
                  <td key={d} className="px-3 py-2 align-top">
                    {locked ? (
                      <div className="rounded-md border bg-[color:var(--primary)]/5 px-2 py-1.5 text-xs font-medium">{cell?.subject || "—"}</div>
                    ) : (
                      <input
                        defaultValue={cell?.subject ?? ""}
                        placeholder="—"
                        onBlur={(e) => directoryActions.setCell(tt.classId, d, s.session, { subject: e.target.value, room: cell?.room ?? "" })}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewCard({ tt, title, subtitle }: { tt: Timetable; title: string; subtitle: string }) {
  const [returnOpen, setReturnOpen] = useState(false);
  const [comment, setComment] = useState("");
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle} · Updated {tt.updatedAt}</div>
        </div>
        <Badge className={statusTone(tt.status)}>{statusLabel(tt.status)}</Badge>
      </div>
      <TimetableGrid tt={tt} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => { directoryActions.reviewTimetable(tt.classId); toast.success("Marked in review"); }} className="gap-1.5"><Send className="h-3.5 w-3.5" />In review</Button>
        <Button size="sm" variant="outline" onClick={() => setReturnOpen(true)} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Return with comment</Button>
        <Button size="sm" variant="outline" onClick={() => { directoryActions.approveTimetable(tt.classId); toast.success("Approved"); }} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>
        <Button size="sm" onClick={() => { directoryActions.publishTimetable(tt.classId); toast.success("Published"); }} className="gap-1.5 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white"><Rocket className="h-3.5 w-3.5" />Publish</Button>
        {tt.comments.length > 0 && <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" />{tt.comments.length} comment{tt.comments.length !== 1 && "s"}</span>}
      </div>
      {tt.comments.length > 0 && (
        <div className="mt-3 space-y-1">
          {tt.comments.map((c) => (
            <div key={c.id} className="rounded-md bg-muted px-3 py-2 text-xs"><span className="font-semibold">{c.author}</span> · {c.at}<div className="pt-1 text-foreground">{c.body}</div></div>
          ))}
        </div>
      )}

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return timetable with comment</DialogTitle></DialogHeader>
          <Textarea placeholder="What revisions are needed?" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!comment.trim()) return; directoryActions.returnTimetable(tt.classId, comment.trim()); setReturnOpen(false); setComment(""); toast.success("Returned to teacher"); }} className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white">Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
