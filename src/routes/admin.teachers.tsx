import { createFileRoute } from "@tanstack/react-router";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, Archive, ArchiveRestore, Mail, Phone, IdCard, Clock, Pencil, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { useDirectory, directoryActions, STAFF_ROLES, EMPLOYMENT_OPTIONS, type Teacher, type StaffRole, type EmploymentStatus } from "@/lib/directory-store";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({ meta: [{ title: "Teacher Directory · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <TeacherDirectory />
      </AppShell>
    </RoleGate>
  ),
});

function initials(t: Teacher) { return `${t.firstName[0] ?? ""}${t.lastName[0] ?? ""}`.toUpperCase(); }

function TeacherDirectory() {
  const { teachers, classes } = useDirectory();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<StaffRole | "All">("All");
  const [emp, setEmp] = useState<EmploymentStatus | "All">("All");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const filtered = useMemo(() => teachers.filter((t) => {
    if (!showArchived && t.archived) return false;
    if (showArchived && !t.archived) return false;
    if (role !== "All" && t.role !== role) return false;
    if (emp !== "All" && t.employment !== emp) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!`${t.firstName} ${t.lastName} ${t.email} ${t.employeeId} ${t.role}`.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [teachers, q, role, emp, showArchived]);

  const selected = teachers.find((t) => t.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Teacher Directory"
        subtitle="All staff. Search, filter, edit and assign to classes."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white shadow-md hover:opacity-95">
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        }
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, employee ID…" className="h-9 pl-8" />
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole | "All")}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All roles</SelectItem>
                {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={emp} onValueChange={(v) => setEmp(v as EmploymentStatus | "All")}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All employment</SelectItem>
                {EMPLOYMENT_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived((v) => !v)} className="gap-1.5">
              <Archive className="h-3.5 w-3.5" />{showArchived ? "Viewing archived" : "Active"}
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => {
            const teacherClasses = classes.filter((c) => c.teacherId === t.id || c.esStaffIds.includes(t.id));
            return (
              <Card key={t.id} className="group p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer" onClick={() => setSelectedId(t.id)}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md" style={{ backgroundImage: `linear-gradient(135deg, hsl(${t.avatarHue} 70% 55%), hsl(${t.avatarHue + 40} 75% 60%))` }}>
                    {initials(t)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{t.firstName} {t.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.role} · {t.employeeId}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{t.employment}</Badge>
                      {teacherClasses.slice(0, 2).map((c) => <Badge key={c.id} className="text-[10px] bg-[color:var(--primary)]/10 text-[color:var(--primary)] border border-[color:var(--primary)]/20">{c.name}</Badge>)}
                      {teacherClasses.length > 2 && <Badge variant="outline" className="text-[10px]">+{teacherClasses.length - 2}</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No teachers match those filters.</div>}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white" style={{ backgroundImage: `linear-gradient(135deg, hsl(${selected.avatarHue} 70% 55%), hsl(${selected.avatarHue + 40} 75% 60%))` }}>{initials(selected)}</div>
                  <div>
                    <SheetTitle>{selected.firstName} {selected.lastName}</SheetTitle>
                    <SheetDescription>{selected.role} · {selected.employeeId}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="classes">Classes</TabsTrigger><TabsTrigger value="clock">Clock</TabsTrigger></TabsList>
                <TabsContent value="profile" className="space-y-3 pt-3">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selected.email}</div>
                  {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selected.phone}</div>}
                  <div className="flex items-center gap-2 text-sm"><IdCard className="h-4 w-4 text-muted-foreground" />{selected.employment}</div>
                  <div className="flex gap-2 pt-3">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(selected); setDialogOpen(true); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                    {selected.archived ? (
                      <Button size="sm" variant="outline" onClick={() => { directoryActions.restoreTeacher(selected.id); toast.success("Restored"); }} className="gap-1.5"><ArchiveRestore className="h-3.5 w-3.5" />Restore</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { directoryActions.archiveTeacher(selected.id); toast.success("Archived"); setSelectedId(null); }} className="gap-1.5"><Archive className="h-3.5 w-3.5" />Archive</Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="classes" className="space-y-2 pt-3">
                  {classes.filter((c) => c.teacherId === selected.id || c.esStaffIds.includes(selected.id)).map((c) => (
                    <Card key={c.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[color:var(--primary)]" />{c.name}</div>
                          <div className="text-xs text-muted-foreground">Room {c.room} · {c.studentIds.length} students</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{c.teacherId === selected.id ? "Classroom teacher" : "ES"}</Badge>
                      </div>
                    </Card>
                  ))}
                  <AssignClassPicker teacherId={selected.id} />
                </TabsContent>
                <TabsContent value="clock" className="space-y-2 pt-3">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { directoryActions.clockIn(selected.id); toast.success("Clocked in"); }} className="gap-1.5"><Clock className="h-3.5 w-3.5" />Clock In</Button>
                    <Button size="sm" variant="outline" onClick={() => { directoryActions.clockOut(selected.id); toast.success("Clocked out"); }} className="gap-1.5"><Clock className="h-3.5 w-3.5" />Clock Out</Button>
                  </div>
                  <div className="space-y-1 pt-2">
                    {selected.clock.length === 0 && <div className="text-xs text-muted-foreground">No clock events yet.</div>}
                    {[...selected.clock].reverse().map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                        <span>{c.at}</span><Badge variant={c.type === "in" ? "default" : "outline"} className="text-[10px]">{c.type === "in" ? "IN" : "OUT"}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <TeacherEditDialog open={dialogOpen} onOpenChange={setDialogOpen} teacher={editing} />
    </>
  );
}

function AssignClassPicker({ teacherId }: { teacherId: string }) {
  const { classes } = useDirectory();
  const [classId, setClassId] = useState<string>("");
  return (
    <div className="flex gap-2 pt-2">
      <Select value={classId} onValueChange={setClassId}>
        <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Assign to class…" /></SelectTrigger>
        <SelectContent>
          {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — Room {c.room}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!classId} onClick={() => { directoryActions.addES(classId, teacherId); setClassId(""); toast.success("Assigned"); }}><Users className="h-3.5 w-3.5" />Assign</Button>
    </div>
  );
}

function TeacherEditDialog({ open, onOpenChange, teacher }: { open: boolean; onOpenChange: (v: boolean) => void; teacher: Teacher | null }) {
  const [form, setForm] = useState({
    firstName: teacher?.firstName ?? "",
    lastName: teacher?.lastName ?? "",
    employeeId: teacher?.employeeId ?? "",
    email: teacher?.email ?? "",
    phone: teacher?.phone ?? "",
    role: (teacher?.role ?? "Teacher") as StaffRole,
    employment: (teacher?.employment ?? "Full-time") as EmploymentStatus,
  });
  // reset on open
  useMemo(() => {
    setForm({
      firstName: teacher?.firstName ?? "",
      lastName: teacher?.lastName ?? "",
      employeeId: teacher?.employeeId ?? "",
      email: teacher?.email ?? "",
      phone: teacher?.phone ?? "",
      role: (teacher?.role ?? "Teacher") as StaffRole,
      employment: (teacher?.employment ?? "Full-time") as EmploymentStatus,
    });
  }, [teacher, open]);

  const save = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.employeeId) { toast.error("First name, last name, email and employee ID are required."); return; }
    if (teacher) { directoryActions.updateTeacher(teacher.id, form); toast.success("Teacher updated"); }
    else { directoryActions.addTeacher(form); toast.success("Teacher added"); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          <DialogDescription>Details are stored locally; not synced to the backend in this pass.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
          <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          <div><Label>Employee ID</Label><Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Employment</Label>
            <Select value={form.employment} onValueChange={(v) => setForm({ ...form, employment: v as EmploymentStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white">{teacher ? "Save changes" : "Add teacher"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// eslint import placeholder to avoid unused warning
void DialogTrigger;
