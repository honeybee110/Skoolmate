import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Lock,
  PencilLine,
} from "lucide-react";
import {
  ALL_CLASSES,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  SEMESTERS,
  MEETING_TYPES,
  ATTENDEE_ROLES,
  type SSGMinute,
  type Attendee,
  type ActionItem,
  type MinuteStatus,
} from "@/lib/ssg-minutes";
import { z } from "zod";
import { requiredText, shortText, longText, isoDate, safeValidate } from "@/lib/validation";
import { useFormDraft } from "@/lib/use-form-draft";

export const Route = createFileRoute("/teacher/ssg-minutes")({
  head: () => ({ meta: [{ title: "SSG Minutes · skoolmate" }] }),
  component: () => (
    <RequireAuth>
      <AppShell variant="teacher">
        <TeacherSSGMinutes />
      </AppShell>
    </RequireAuth>
  ),
});

type FormState = {
  id: string | null;
  student_name: string;
  class_level: string;
  semester: string;
  meeting_date: string;
  meeting_type: string;
  attendees: Attendee[];
  apologies: string;
  discussion_summary: string;
  action_items: ActionItem[];
  next_meeting_date: string;
  status: MinuteStatus;
};

const emptyForm = (): FormState => ({
  id: null,
  student_name: "",
  class_level: "",
  semester: "Semester 1",
  meeting_date: new Date().toISOString().slice(0, 10),
  meeting_type: "SSG",
  attendees: [{ name: "", role: "Parent / Carer" }],
  apologies: "",
  discussion_summary: "",
  action_items: [{ action: "", owner: "", due_date: "" }],
  next_meeting_date: "",
  status: "Draft",
});

const AttendeeSchema = z.object({
  name: shortText(120, "Attendee name"),
  role: shortText(60, "Attendee role"),
});

const ActionItemSchema = z.object({
  action: shortText(500, "Action"),
  owner: shortText(120, "Owner"),
  due_date: isoDate("Due date"),
});

const minutesSchema = (submitting: boolean) =>
  z.object({
    student_name: requiredText(120, "Student name"),
    class_level: requiredText(10, "Class level"),
    semester: requiredText(20, "Semester"),
    meeting_date: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : ""),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Meeting date is required." }),
    ),
    meeting_type: requiredText(40, "Meeting type"),
    attendees: z.array(AttendeeSchema).max(30, { message: "Too many attendees." }),
    apologies: longText(1000, "Apologies"),
    discussion_summary: submitting
      ? z.preprocess(
          (v) => (typeof v === "string" ? v : ""),
          longText(8000, "Discussion summary").pipe(
            z.string().min(1, { message: "Add a discussion summary before submitting." }),
          ),
        )
      : longText(8000, "Discussion summary"),
    action_items: z.array(ActionItemSchema).max(30, { message: "Too many action items." }),
    next_meeting_date: isoDate("Next meeting date"),
  });

function TeacherSSGMinutes() {
  const { user } = useAuth();
  const [minutes, setMinutes] = useState<SSGMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const { restoredDraft, draftSavedAt, clearDraft, discardDraft } = useFormDraft<FormState>(
    "ssg-minutes",
    form,
    {
      scope: user?.id,
      isEmpty: (f) =>
        !f.student_name.trim() && !f.discussion_summary.trim() && !f.apologies.trim() && f.id === null,
    },
  );
  const [filterSem, setFilterSem] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const { data, error } = await (supabase as unknown as { from: (t: string) => any })
      .from("ssg_minutes")
      .select("*")
      .eq("submitted_by", user.id)
      .order("meeting_date", { ascending: false });
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    setMinutes((data ?? []) as unknown as SSGMinute[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(
    () =>
      minutes.filter(
        (m) =>
          (filterSem === "All" || m.semester === filterSem) &&
          (filterType === "All" || m.meeting_type === filterType),
      ),
    [minutes, filterSem, filterType],
  );

  const editing = form.id != null;
  const locked = editing && form.status === "Submitted";

  const startNew = () => setForm(emptyForm());
  const startEdit = (m: SSGMinute) => {
    setForm({
      id: m.id,
      student_name: m.student_name,
      class_level: m.class_level,
      semester: m.semester,
      meeting_date: m.meeting_date,
      meeting_type: m.meeting_type,
      attendees: m.attendees?.length ? m.attendees : [{ name: "", role: "Parent / Carer" }],
      apologies: m.apologies ?? "",
      discussion_summary: m.discussion_summary ?? "",
      action_items: m.action_items?.length ? m.action_items : [{ action: "", owner: "", due_date: "" }],
      next_meeting_date: m.next_meeting_date ?? "",
      status: m.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persist = async (nextStatus: MinuteStatus) => {
    if (!user) return;
    const parsed = safeValidate(minutesSchema(nextStatus === "Submitted"), {
      student_name: form.student_name,
      class_level: form.class_level,
      semester: form.semester,
      meeting_date: form.meeting_date,
      meeting_type: form.meeting_type,
      attendees: form.attendees,
      apologies: form.apologies,
      discussion_summary: form.discussion_summary,
      action_items: form.action_items,
      next_meeting_date: form.next_meeting_date,
    });
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    const clean = parsed.data;
    setSaving(true);
    const payload: Record<string, unknown> = {
      student_name: clean.student_name,
      class_level: clean.class_level,
      semester: clean.semester,
      meeting_date: clean.meeting_date,
      meeting_type: clean.meeting_type,
      attendees: clean.attendees.filter((a) => a.name || a.role),
      apologies: clean.apologies || null,
      discussion_summary: clean.discussion_summary || null,
      action_items: clean.action_items.filter((a) => a.action),
      next_meeting_date: clean.next_meeting_date || null,
      status: nextStatus,
      submitted_by: user.id,
      submitted_at: nextStatus === "Submitted" ? new Date().toISOString() : null,
    };

    // Cast the client to any to bypass generated types until they regenerate.
    const table = (supabase as unknown as { from: (t: string) => any }).from("ssg_minutes");
    const res = form.id
      ? await table.update(payload).eq("id", form.id).select().single()
      : await table.insert(payload).select().single();

    setSaving(false);
    if (res.error) {
      toast.error(res.error.message, {
        action: { label: "Retry", onClick: () => void persist(nextStatus) },
      });
      return;
    }
    toast.success(nextStatus === "Submitted" ? "Minutes submitted" : "Draft saved");
    clearDraft();
    setForm(emptyForm());
    await load();
  };

  return (
    <div>
      <PageHeader
        title="SSG Minutes"
        subtitle="Record Student Support Group meetings and submit them for the leadership record."
        actions={
          <Button onClick={startNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> New minutes
          </Button>
        }
      />

      {restoredDraft && restoredDraft.id === null && form.id === null && (
        <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm md:mx-8">
          <span className="flex items-center gap-2 text-foreground">
            <PencilLine className="h-4 w-4 text-primary" />
            Unsaved minutes from{" "}
            {draftSavedAt ? new Date(draftSavedAt).toLocaleString() : "an earlier session"} were kept on this device.
          </span>
          <span className="flex gap-2">
            <Button size="sm" onClick={() => { setForm(restoredDraft); discardDraft(); }}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={discardDraft}>Discard</Button>
          </span>
        </div>
      )}

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* ─── List ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" />
                My submitted minutes
              </div>
              <Button size="icon" variant="ghost" onClick={() => void load()} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Select value={filterSem} onValueChange={setFilterSem}>
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All semesters</SelectItem>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All types</SelectItem>
                  {MEETING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading minutes…
              </div>
            ) : loadError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Could not load minutes
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => void load()}>
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-medium">
                  No SSG minutes submitted yet for this semester
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fill out the form on the right to add your first one.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{m.student_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.class_level} · {m.meeting_type} ·{" "}
                          {new Date(m.meeting_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={m.status === "Submitted" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {m.status === "Submitted" ? (
                          <><Lock className="mr-1 h-3 w-3" />Submitted</>
                        ) : (
                          <><PencilLine className="mr-1 h-3 w-3" />Draft</>
                        )}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ─── Form ───────────────────────────────────────────── */}
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {editing ? (locked ? "View minutes" : "Edit draft") : "New SSG minutes"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locked
                  ? "This record has been submitted and is read-only."
                  : "Save as draft to keep editing, or submit to lock the record."}
              </p>
            </div>
            {editing && (
              <Button size="sm" variant="ghost" onClick={startNew}>
                Cancel
              </Button>
            )}
          </div>

          <fieldset disabled={locked || saving} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Student name">
                <Input
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  placeholder="e.g. Jamie Nguyen"
                />
              </Field>
              <Field label="Class level">
                <Select
                  value={form.class_level}
                  onValueChange={(v) => setForm({ ...form, class_level: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__primary" disabled>— Primary —</SelectItem>
                    {PRIMARY_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__secondary" disabled>— Secondary —</SelectItem>
                    {SECONDARY_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Semester">
                <Select
                  value={form.semester}
                  onValueChange={(v) => setForm({ ...form, semester: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Meeting type">
                <Select
                  value={form.meeting_type}
                  onValueChange={(v) => setForm({ ...form, meeting_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Meeting date">
                <Input
                  type="date"
                  value={form.meeting_date}
                  onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                />
              </Field>
              <Field label="Next meeting date (optional)">
                <Input
                  type="date"
                  value={form.next_meeting_date}
                  onChange={(e) => setForm({ ...form, next_meeting_date: e.target.value })}
                />
              </Field>
            </div>

            {/* Attendees */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Attendees</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      ...form,
                      attendees: [...form.attendees, { name: "", role: "Parent / Carer" }],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add attendee
                </Button>
              </div>
              <div className="space-y-2">
                {form.attendees.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      placeholder="Name"
                      value={a.name}
                      onChange={(e) => {
                        const next = [...form.attendees];
                        next[i] = { ...next[i], name: e.target.value };
                        setForm({ ...form, attendees: next });
                      }}
                    />
                    <Select
                      value={a.role || undefined}
                      onValueChange={(v) => {
                        const next = [...form.attendees];
                        next[i] = { ...next[i], role: v as Attendee["role"] };
                        setForm({ ...form, attendees: next });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        {ATTENDEE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          ...form,
                          attendees: form.attendees.filter((_, j) => j !== i),
                        })
                      }
                      title="Remove attendee"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Apologies (optional)">
              <Textarea
                rows={2}
                value={form.apologies}
                onChange={(e) => setForm({ ...form, apologies: e.target.value })}
                placeholder="Who couldn't attend?"
              />
            </Field>

            <Field label="Discussion summary">
              <Textarea
                rows={6}
                value={form.discussion_summary}
                onChange={(e) => setForm({ ...form, discussion_summary: e.target.value })}
                placeholder="Key points, updates from allied health, family concerns…"
              />
            </Field>

            {/* Action items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Action items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      ...form,
                      action_items: [
                        ...form.action_items,
                        { action: "", owner: "", due_date: "" },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add action
                </Button>
              </div>
              <div className="space-y-2">
                {form.action_items.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1.6fr_1fr_140px_auto] gap-2">
                    <Input
                      placeholder="Action"
                      value={a.action}
                      onChange={(e) => {
                        const next = [...form.action_items];
                        next[i] = { ...next[i], action: e.target.value };
                        setForm({ ...form, action_items: next });
                      }}
                    />
                    <Input
                      placeholder="Owner"
                      value={a.owner}
                      onChange={(e) => {
                        const next = [...form.action_items];
                        next[i] = { ...next[i], owner: e.target.value };
                        setForm({ ...form, action_items: next });
                      }}
                    />
                    <Input
                      type="date"
                      value={a.due_date}
                      onChange={(e) => {
                        const next = [...form.action_items];
                        next[i] = { ...next[i], due_date: e.target.value };
                        setForm({ ...form, action_items: next });
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          ...form,
                          action_items: form.action_items.filter((_, j) => j !== i),
                        })
                      }
                      title="Remove action"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          {!locked && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => void persist("Draft")}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as draft"}
              </Button>
              <Button onClick={() => void persist("Submitted")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit minutes"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
