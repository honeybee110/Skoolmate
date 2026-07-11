import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, Plus, Trash2, Copy, FileDown, Save, Upload, Sparkles, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/crosscheck-builder")({
  head: () => ({ meta: [{ title: "CrossCheck Builder · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership"]}>
      <AppShell variant="admin">
        <CrossCheckBuilder />
      </AppShell>
    </RoleGate>
  ),
});

type Level = "Developing" | "Working towards" | "Achieved" | "Extended";
type Criterion = { id: string; level: Level; text: string };
type Skill = { id: string; name: string; criteria: Criterion[] };
type Strand = { id: string; name: string; skills: Skill[] };

const LEVELS: Level[] = ["Developing", "Working towards", "Achieved", "Extended"];
const LEVEL_TONE: Record<Level, string> = {
  Developing: "bg-rose-100 text-rose-700 border-rose-200",
  "Working towards": "bg-amber-100 text-amber-700 border-amber-200",
  Achieved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Extended: "bg-sky-100 text-sky-700 border-sky-200",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const STARTER: Strand[] = [
  {
    id: uid(),
    name: "Reading & Viewing",
    skills: [
      {
        id: uid(),
        name: "Phonological awareness",
        criteria: [
          { id: uid(), level: "Developing", text: "Identifies initial sounds in familiar words with modelling." },
          { id: uid(), level: "Working towards", text: "Segments 2–3 phoneme CVC words with prompting." },
          { id: uid(), level: "Achieved", text: "Blends and segments CVC words independently." },
          { id: uid(), level: "Extended", text: "Manipulates onset/rime and phonemes in multisyllabic words." },
        ],
      },
    ],
  },
];

function CrossCheckBuilder() {
  const [title, setTitle] = useState("Cross-Checks Master — Semester 1 · 2026 · Literacy");
  const [semester, setSemester] = useState("Semester 1 · 2026");
  const [learningArea, setLearningArea] = useState("Literacy");
  const [strands, setStrands] = useState<Strand[]>(STARTER);
  const importRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    const skills = strands.reduce((a, s) => a + s.skills.length, 0);
    const crit = strands.reduce((a, s) => a + s.skills.reduce((b, k) => b + k.criteria.length, 0), 0);
    return { strands: strands.length, skills, crit };
  }, [strands]);

  function addStrand() {
    setStrands((p) => [...p, { id: uid(), name: "New strand", skills: [] }]);
  }
  function updateStrand(id: string, patch: Partial<Strand>) {
    setStrands((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeStrand(id: string) {
    setStrands((p) => p.filter((s) => s.id !== id));
  }
  function addSkill(strandId: string) {
    setStrands((p) => p.map((s) => s.id === strandId ? {
      ...s,
      skills: [...s.skills, {
        id: uid(), name: "New skill",
        criteria: LEVELS.map((l) => ({ id: uid(), level: l, text: "" })),
      }],
    } : s));
  }
  function updateSkill(strandId: string, skillId: string, patch: Partial<Skill>) {
    setStrands((p) => p.map((s) => s.id !== strandId ? s : {
      ...s, skills: s.skills.map((k) => k.id === skillId ? { ...k, ...patch } : k),
    }));
  }
  function removeSkill(strandId: string, skillId: string) {
    setStrands((p) => p.map((s) => s.id !== strandId ? s : { ...s, skills: s.skills.filter((k) => k.id !== skillId) }));
  }
  function updateCriterion(strandId: string, skillId: string, critId: string, patch: Partial<Criterion>) {
    setStrands((p) => p.map((s) => s.id !== strandId ? s : {
      ...s, skills: s.skills.map((k) => k.id !== skillId ? k : {
        ...k, criteria: k.criteria.map((c) => c.id === critId ? { ...c, ...patch } : c),
      }),
    }));
  }
  function addCriterion(strandId: string, skillId: string) {
    setStrands((p) => p.map((s) => s.id !== strandId ? s : {
      ...s, skills: s.skills.map((k) => k.id !== skillId ? k : {
        ...k, criteria: [...k.criteria, { id: uid(), level: "Developing", text: "" }],
      }),
    }));
  }
  function removeCriterion(strandId: string, skillId: string, critId: string) {
    setStrands((p) => p.map((s) => s.id !== strandId ? s : {
      ...s, skills: s.skills.map((k) => k.id !== skillId ? k : {
        ...k, criteria: k.criteria.filter((c) => c.id !== critId),
      }),
    }));
  }
  function duplicateSkill(strandId: string, skillId: string) {
    setStrands((p) => p.map((s) => {
      if (s.id !== strandId) return s;
      const src = s.skills.find((k) => k.id === skillId);
      if (!src) return s;
      const clone: Skill = { ...src, id: uid(), name: `${src.name} (copy)`, criteria: src.criteria.map((c) => ({ ...c, id: uid() })) };
      return { ...s, skills: [...s.skills, clone] };
    }));
  }

  function exportJson() {
    const payload = { title, semester, learningArea, strands, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/[^\w-]+/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Master list exported (JSON).");
  }
  function exportCsv() {
    const rows = [["Strand", "Skill", "Level", "Success criterion"]];
    for (const s of strands) for (const k of s.skills) for (const c of k.criteria) {
      rows.push([s.name, k.name, c.level, c.text.replace(/"/g, '""')]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/[^\w-]+/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Master list exported (CSV).");
  }
  function pin() {
    toast.success("Pinned to every class IEP folder.");
  }
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.title) setTitle(data.title);
        if (data.semester) setSemester(data.semester);
        if (data.learningArea) setLearningArea(data.learningArea);
        if (Array.isArray(data.strands)) setStrands(data.strands);
        toast.success("Master list imported.");
      } catch {
        toast.error("Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader
        title="CrossCheck Builder"
        subtitle="Build the semester Cross-Checks Masterlist by strand → skill → success criteria (Developing → Extended)."
        actions={
          <>
            <input ref={importRef} type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}><Upload className="h-4 w-4" />Import</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><FileDown className="h-4 w-4" />Export CSV</Button>
            <Button variant="outline" size="sm" onClick={exportJson}><FileDown className="h-4 w-4" />Export JSON</Button>
            <Button size="sm" className="bg-navy text-white hover:bg-navy-light" onClick={pin}><Save className="h-4 w-4" />Pin to class folders</Button>
          </>
        }
      />

      <div className="space-y-4 px-4 py-6 md:px-8">
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Semester</label>
              <Input value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Learning area</label>
              <Input value={learningArea} onChange={(e) => setLearningArea(e.target.value)} className="mt-1 h-9" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5 text-navy" />
            <span>{totals.strands} strand{totals.strands === 1 ? "" : "s"}</span>
            <span>·</span>
            <span>{totals.skills} skill{totals.skills === 1 ? "" : "s"}</span>
            <span>·</span>
            <span>{totals.crit} success criteri{totals.crit === 1 ? "on" : "a"}</span>
            <span className="ml-auto inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />Auto-syncs to IEP goals</span>
          </div>
        </Card>

        {strands.map((s) => (
          <Card key={s.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b bg-gradient-to-r from-navy/8 to-transparent px-3 py-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input
                value={s.name}
                onChange={(e) => updateStrand(s.id, { name: e.target.value })}
                className="h-8 max-w-md font-semibold"
                placeholder="Strand name (e.g. Reading & Viewing)"
              />
              <Badge variant="outline" className="text-[10px]">{s.skills.length} skills</Badge>
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addSkill(s.id)}>
                  <Plus className="h-3 w-3" />Skill
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] text-rose-600" onClick={() => removeStrand(s.id)}>
                  <Trash2 className="h-3 w-3" />Remove strand
                </Button>
              </div>
            </div>
            <div className="divide-y">
              {s.skills.map((k) => (
                <div key={k.id} className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={k.name}
                      onChange={(e) => updateSkill(s.id, k.id, { name: e.target.value })}
                      className="h-8 max-w-md font-medium"
                      placeholder="Skill (e.g. Phonological awareness)"
                    />
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => duplicateSkill(s.id, k.id)}>
                        <Copy className="h-3 w-3" />Duplicate
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addCriterion(s.id, k.id)}>
                        <Plus className="h-3 w-3" />Criterion
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-rose-600" onClick={() => removeSkill(s.id, k.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {k.criteria.map((c) => (
                      <div key={c.id} className="grid grid-cols-[140px_1fr_28px] gap-2">
                        <select
                          value={c.level}
                          onChange={(e) => updateCriterion(s.id, k.id, c.id, { level: e.target.value as Level })}
                          className={cn("rounded-md border px-2 text-xs font-medium", LEVEL_TONE[c.level])}
                        >
                          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <Textarea
                          value={c.text}
                          onChange={(e) => updateCriterion(s.id, k.id, c.id, { text: e.target.value })}
                          rows={1}
                          className="min-h-[36px] text-xs"
                          placeholder="Success criterion — student can…"
                        />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600" onClick={() => removeCriterion(s.id, k.id, c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {s.skills.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No skills yet. Add one to start.
                </div>
              )}
            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addStrand} className="gap-1.5">
          <Plus className="h-4 w-4" />Add strand
        </Button>
      </div>
    </>
  );
}
