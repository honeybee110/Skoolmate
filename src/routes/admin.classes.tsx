import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Plus, X, Users, DoorOpen, CalendarClock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDirectory, directoryActions, type ClassRoom, type ClassBand, type Teacher } from "@/lib/directory-store";
import { students as seedStudents } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({ meta: [{ title: "School-Wide Class List · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <ClassesPage />
      </AppShell>
    </RoleGate>
  ),
});

const BANDS: ClassBand[] = ["Prep", "Primary", "Secondary"];

function ClassesPage() {
  const { classes, teachers, activeYearId, years } = useDirectory();
  const [yearId, setYearId] = useState(activeYearId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const scoped = useMemo(() => classes.filter((c) => c.yearId === yearId), [classes, yearId]);
  const grouped = useMemo(() => ({
    Prep: scoped.filter((c) => c.band === "Prep"),
    Primary: scoped.filter((c) => c.band === "Primary"),
    Secondary: scoped.filter((c) => c.band === "Secondary"),
  }), [scoped]);

  const selected = classes.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="School-Wide Class List"
        subtitle="Every class across Prep, Primary and Secondary. Build the roster before the school year begins."
        actions={
          <div className="flex gap-2">
            <Select value={yearId} onValueChange={setYearId}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.label} · {y.status}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setAddOpen(true)} className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white shadow-md hover:opacity-95">
              <Plus className="h-4 w-4" />New class
            </Button>
          </div>
        }
      />
      <div className="px-4 py-6 md:px-8 space-y-6">
        {BANDS.map((band) => (
          <section key={band}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{band}</h2>
              <Badge variant="outline" className="text-[10px]">{grouped[band].length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grouped[band].map((c) => {
                const teacher = teachers.find((t) => t.id === c.teacherId);
                const esList = c.esStaffIds.map((id) => teachers.find((t) => t.id === id)).filter(Boolean) as Teacher[];
                return (
                  <Card key={c.id} className="group cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg" onClick={() => setSelectedId(c.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[color:var(--primary)]" />{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.yearLevel} · Room {c.room}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{c.studentIds.length} students</Badge>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[11px] text-muted-foreground">Classroom teacher</div>
                      <div className="text-sm font-medium">{teacher ? `${teacher.firstName} ${teacher.lastName}` : <span className="text-muted-foreground italic">Unassigned</span>}</div>
                      <div className="text-[11px] text-muted-foreground pt-1">ES staff</div>
                      <div className="flex flex-wrap gap-1">
                        {esList.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                        {esList.map((e) => <Badge key={e.id} variant="outline" className="text-[10px]">{e.firstName} {e.lastName[0]}.</Badge>)}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {grouped[band].length === 0 && <div className="col-span-full rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">No classes yet in {band}.</div>}
            </div>
          </section>
        ))}
      </div>

      <ClassEditor open={!!selected} onClose={() => setSelectedId(null)} classId={selected?.id ?? null} />
      <NewClassDialog open={addOpen} onOpenChange={setAddOpen} yearId={yearId} />
    </>
  );
}

function NewClassDialog({ open, onOpenChange, yearId }: { open: boolean; onOpenChange: (v: boolean) => void; yearId: string }) {
  const [form, setForm] = useState({ name: "", band: "Primary" as ClassBand, yearLevel: "", room: "" });
  const save = () => {
    if (!form.name || !form.room) { toast.error("Name and room required."); return; }
    directoryActions.createClass({ ...form, yearId });
    toast.success("Class created");
    onOpenChange(false);
    setForm({ name: "", band: "Primary", yearLevel: "", room: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New class</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary 16" /></div>
          <div><Label>Band</Label>
            <Select value={form.band} onValueChange={(v) => setForm({ ...form, band: v as ClassBand })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Year level</Label><Input value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} placeholder="e.g. Year 4" /></div>
          <div><Label>Room</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassEditor({ open, onClose, classId }: { open: boolean; onClose: () => void; classId: string | null }) {
  const { classes, teachers } = useDirectory();
  const cls = classes.find((c) => c.id === classId);
  const [dragOverZone, setDragOverZone] = useState<null | "teacher" | "es" | "students">(null);
  if (!cls) return null;

  const teacher = teachers.find((t) => t.id === cls.teacherId);
  const esList = cls.esStaffIds.map((id) => teachers.find((t) => t.id === id)).filter(Boolean) as Teacher[];
  const staffPool = teachers.filter((t) => !t.archived && t.id !== cls.teacherId && !cls.esStaffIds.includes(t.id));
  const studentPool = seedStudents.filter((s) => !cls.studentIds.includes(s.id));

  const onDropTeacher = (e: React.DragEvent) => {
    e.preventDefault();
    const [kind, id] = e.dataTransfer.getData("text/plain").split(":");
    if (kind === "teacher") { directoryActions.assignTeacher(cls.id, id); toast.success("Teacher assigned"); }
    setDragOverZone(null);
  };
  const onDropES = (e: React.DragEvent) => {
    e.preventDefault();
    const [kind, id] = e.dataTransfer.getData("text/plain").split(":");
    if (kind === "teacher") { directoryActions.addES(cls.id, id); toast.success("ES added"); }
    setDragOverZone(null);
  };
  const onDropStudent = (e: React.DragEvent) => {
    e.preventDefault();
    const [kind, id] = e.dataTransfer.getData("text/plain").split(":");
    if (kind === "student") { directoryActions.moveStudent(id, cls.id); toast.success("Student moved"); }
    setDragOverZone(null);
  };
  const allowDrop = (zone: typeof dragOverZone) => (e: React.DragEvent) => { e.preventDefault(); setDragOverZone(zone); };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[color:var(--primary)]" />{cls.name}</SheetTitle>
          <SheetDescription>{cls.yearLevel} · Room {cls.room} · {cls.band}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="roster" className="mt-4">
          <TabsList><TabsTrigger value="roster">Roster</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger></TabsList>

          <TabsContent value="roster" className="pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                <DropZone label="Classroom teacher" active={dragOverZone === "teacher"} onDragOver={allowDrop("teacher")} onDragLeave={() => setDragOverZone(null)} onDrop={onDropTeacher} hint="Drag a teacher here">
                  {teacher ? (
                    <div className="flex items-center justify-between rounded-md bg-[color:var(--primary)]/10 px-3 py-2">
                      <span className="text-sm font-medium">{teacher.firstName} {teacher.lastName}</span>
                      <button className="text-muted-foreground hover:text-foreground" onClick={() => directoryActions.assignTeacher(cls.id, undefined)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : null}
                </DropZone>

                <DropZone label={`Education support (${esList.length})`} active={dragOverZone === "es"} onDragOver={allowDrop("es")} onDragLeave={() => setDragOverZone(null)} onDrop={onDropES} hint="Drag ES staff here">
                  <div className="space-y-1">
                    {esList.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs">
                        <span>{e.firstName} {e.lastName} · {e.role}</span>
                        <button onClick={() => directoryActions.removeES(cls.id, e.id)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </DropZone>

                <DropZone label={`Students (${cls.studentIds.length})`} active={dragOverZone === "students"} onDragOver={allowDrop("students")} onDragLeave={() => setDragOverZone(null)} onDrop={onDropStudent} hint="Drag students here">
                  <div className="grid grid-cols-2 gap-1">
                    {cls.studentIds.map((sid) => {
                      const s = seedStudents.find((x) => x.id === sid);
                      if (!s) return null;
                      return <div key={sid} className="rounded bg-muted px-2 py-1 text-[11px]">{s.firstName} {s.lastName}</div>;
                    })}
                  </div>
                </DropZone>
              </div>

              <div className="space-y-3">
                <Card className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff pool</div>
                    <Badge variant="outline" className="text-[10px]">{staffPool.length}</Badge>
                  </div>
                  <div className="max-h-52 space-y-1 overflow-y-auto">
                    {staffPool.map((t) => (
                      <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", `teacher:${t.id}`)} className="cursor-grab rounded-md border bg-background px-2 py-1.5 text-xs hover:border-[color:var(--primary)]">
                        <div className="font-medium">{t.firstName} {t.lastName}</div>
                        <div className="text-[10px] text-muted-foreground">{t.role}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student pool</div>
                    <Badge variant="outline" className="text-[10px]">{studentPool.length}</Badge>
                  </div>
                  <div className="max-h-52 space-y-1 overflow-y-auto">
                    {studentPool.map((s) => (
                      <div key={s.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", `student:${s.id}`)} className="cursor-grab rounded-md border bg-background px-2 py-1.5 text-xs hover:border-[color:var(--primary)]">
                        {s.firstName} {s.lastName} · {s.yearLevel}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            <ClassDetailsEditor cls={cls} />
          </TabsContent>

          <TabsContent value="timetable" className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Manage sessions in the whole-school timetable.</p>
            <Button asChild variant="outline" className="gap-1.5"><Link to="/admin/timetable"><CalendarClock className="h-4 w-4" />Open timetable</Link></Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function DropZone({ label, hint, active, children, onDragOver, onDragLeave, onDrop }: { label: string; hint: string; active: boolean; children?: React.ReactNode; onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: (e: React.DragEvent) => void }) {
  return (
    <Card className={`p-3 transition-colors ${active ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5" : ""}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      {children}
      <div className="mt-2 text-[10px] italic text-muted-foreground">{hint}</div>
    </Card>
  );
}

function ClassDetailsEditor({ cls }: { cls: ClassRoom }) {
  const [form, setForm] = useState({ name: cls.name, yearLevel: cls.yearLevel, room: cls.room });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Year level</Label><Input value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} /></div>
      <div><Label>Room</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
      <div className="sm:col-span-2">
        <Button size="sm" onClick={() => { directoryActions.updateClass(cls.id, form); toast.success("Class updated"); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Save</Button>
      </div>
    </div>
  );
}

void DoorOpen;
