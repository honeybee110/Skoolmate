import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CalendarPlus, Archive, Copy, Rocket, GraduationCap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useDirectory, directoryActions } from "@/lib/directory-store";

export const Route = createFileRoute("/admin/year-setup")({
  head: () => ({ meta: [{ title: "Year Setup · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <YearSetup />
      </AppShell>
    </RoleGate>
  ),
});

function YearSetup() {
  const { years, activeYearId, classes, teachers } = useDirectory();
  const [step, setStep] = useState(1);
  const [newLabel, setNewLabel] = useState("");
  const [sourceYearId, setSourceYearId] = useState<string>(activeYearId);
  const [targetYearId, setTargetYearId] = useState<string>(years.find((y) => y.status === "planning")?.id ?? "");

  const planningYear = years.find((y) => y.id === targetYearId);
  const targetClasses = classes.filter((c) => c.yearId === targetYearId);

  return (
    <>
      <PageHeader
        title="Year Setup Wizard"
        subtitle="Prepare the next school year: create classes, assign teachers and ES, move students, then activate."
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-4 text-xs">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStep(n)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${step === n ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white" : "bg-muted"}`}>
                <span className="font-semibold">{n}</span>
                <span className="hidden sm:inline">{["Year", "Duplicate", "Assign staff", "Students", "Activate"][n - 1]}</span>
              </button>
            ))}
          </div>
        </Card>

        {step === 1 && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold">1 · Create a school year</h3>
              <p className="text-xs text-muted-foreground">Add the next academic year and set it to planning.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div><Label>Year label</Label><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="2028" className="w-32" /></div>
              <Button onClick={() => { if (!newLabel.trim()) return; directoryActions.createYear(newLabel.trim()); setNewLabel(""); toast.success("Year created"); }} className="gap-1.5"><CalendarPlus className="h-4 w-4" />Create</Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {years.map((y) => (
                <Card key={y.id} className={`p-3 ${y.status === "active" ? "border-[color:var(--primary)]" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{y.label}</div>
                    <Badge variant="outline" className="text-[10px] capitalize">{y.status}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{classes.filter((c) => c.yearId === y.id).length} classes</div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold">2 · Duplicate class structure</h3>
              <p className="text-xs text-muted-foreground">Clone all classes from the source year into the target year (staff and students are cleared).</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div><Label>Source year</Label>
                <Select value={sourceYearId} onValueChange={setSourceYearId}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
              <div><Label>Target year</Label>
                <Select value={targetYearId} onValueChange={setTargetYearId}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{years.filter((y) => y.id !== sourceYearId).map((y) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button disabled={!targetYearId} onClick={() => { directoryActions.duplicateClassesToYear(sourceYearId, targetYearId); toast.success("Classes duplicated"); }} className="gap-1.5"><Copy className="h-4 w-4" />Duplicate classes</Button>
            </div>
            <div className="text-xs text-muted-foreground">Source: {classes.filter((c) => c.yearId === sourceYearId).length} classes · Target: {targetClasses.length} classes</div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-5 space-y-3">
            <div>
              <h3 className="font-semibold">3 · Assign staff to next-year classes</h3>
              <p className="text-xs text-muted-foreground">Set the classroom teacher for each planned class. Multiple ES staff can be assigned from the class editor.</p>
            </div>
            <div className="space-y-2">
              {targetClasses.length === 0 && <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">No classes in {planningYear?.label ?? "target year"} yet — go back to step 2.</div>}
              {targetClasses.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-[color:var(--primary)]" /><span className="font-medium">{c.name}</span><span className="text-xs text-muted-foreground">· Room {c.room}</span></div>
                  <Select value={c.teacherId ?? "__none"} onValueChange={(v) => directoryActions.assignTeacher(c.id, v === "__none" ? undefined : v)}>
                    <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Unassigned</SelectItem>
                      {teachers.filter((t) => !t.archived && (t.role === "Teacher" || t.role === "Learning Specialist")).map((t) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-5 space-y-3">
            <div>
              <h3 className="font-semibold">4 · Move students between classes</h3>
              <p className="text-xs text-muted-foreground">Use the class editor's drag-and-drop pool for bulk moves.</p>
            </div>
            <div className="text-sm">Open the <a href="/admin/classes" className="text-[color:var(--primary)] underline">Class List</a> and drag students between classes. Changes propagate live to student and teacher directories.</div>
          </Card>
        )}

        {step === 5 && (
          <Card className="p-5 space-y-3">
            <div>
              <h3 className="font-semibold">5 · Archive and activate</h3>
              <p className="text-xs text-muted-foreground">Archive the current active year and activate the new one. This can be reversed by activating a different year later.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {years.map((y) => (
                <Card key={y.id} className={`p-3 ${y.id === activeYearId ? "border-[color:var(--primary)]" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{y.label}</div>
                      <div className="text-[11px] capitalize text-muted-foreground">{y.status}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {y.status !== "archived" && <Button size="sm" variant="outline" onClick={() => { directoryActions.archiveYear(y.id); toast.success("Archived"); }} className="gap-1.5"><Archive className="h-3.5 w-3.5" />Archive</Button>}
                      {y.id !== activeYearId && <Button size="sm" onClick={() => { directoryActions.activateYear(y.id); toast.success(`Activated ${y.label}`); }} className="gap-1.5 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white"><Rocket className="h-3.5 w-3.5" />Activate</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
