import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Search, Star, Upload, Sparkles, ExternalLink, FileText, Video, Image as ImgIcon, Music2, BookOpen, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Resource Bank · SchoolMate AU" }] }),
  component: ResourceBank,
});

type Kind = "worksheet" | "video" | "visual" | "song" | "lesson" | "aac";
interface Resource {
  id: string;
  title: string;
  source: string;
  kind: Kind;
  subject: string;
  levels: string[];
  tags: string[];
  starred?: boolean;
}

const seed: Resource[] = [
  { id: "r1", title: "Numbers 0–20 tracing pack", source: "Twinkl", kind: "worksheet", subject: "Maths", levels: ["A", "F"], tags: ["numeracy", "fine-motor"], starred: true },
  { id: "r2", title: "CVC Word Sort — animals", source: "Starfall", kind: "worksheet", subject: "English", levels: ["F", "1"], tags: ["phonics", "reading"] },
  { id: "r3", title: "Colourful Semantics visuals", source: "Boardmaker", kind: "visual", subject: "English", levels: ["C", "D"], tags: ["AAC", "semantics"], starred: true },
  { id: "r4", title: "Living / Non-living sort", source: "Topmarks", kind: "lesson", subject: "Science", levels: ["B", "F"], tags: ["biology", "sorting"] },
  { id: "r5", title: "Steady beat body percussion", source: "YouTube · MusicKids", kind: "video", subject: "Music", levels: ["A", "B"], tags: ["music", "regulation"] },
  { id: "r6", title: "Feelings check-in board", source: "Canva · School template", kind: "visual", subject: "Personal & Social", levels: ["C"], tags: ["SEL", "check-in"] },
  { id: "r7", title: "PE circuit cards", source: "In-house", kind: "worksheet", subject: "PE", levels: ["A", "B"], tags: ["gross-motor"] },
  { id: "r8", title: "Turn-taking social story", source: "In-house", kind: "lesson", subject: "Learn to Play", levels: ["A"], tags: ["social", "story"] },
  { id: "r9", title: "AAC — snack requesting board", source: "PODD", kind: "aac", subject: "English", levels: ["C", "D"], tags: ["AAC", "communication"], starred: true },
  { id: "r10", title: "Now / Then / Later timeline", source: "In-house", kind: "visual", subject: "History", levels: ["F"], tags: ["sequencing"] },
  { id: "r11", title: "Measurement — long/short cards", source: "Twinkl", kind: "worksheet", subject: "Maths", levels: ["A"], tags: ["measurement"] },
  { id: "r12", title: "Assembly / SWPBS song", source: "YouTube · SWPBS", kind: "song", subject: "Personal & Social", levels: ["A", "B", "C"], tags: ["SWPBS", "routines"] },
];

const kindMeta: Record<Kind, { label: string; icon: typeof FileText; tone: string }> = {
  worksheet: { label: "Worksheet", icon: FileText, tone: "bg-blue-100 text-blue-700" },
  video: { label: "Video", icon: Video, tone: "bg-rose-100 text-rose-700" },
  visual: { label: "Visual", icon: ImgIcon, tone: "bg-violet-100 text-violet-700" },
  song: { label: "Song", icon: Music2, tone: "bg-amber-100 text-amber-700" },
  lesson: { label: "Lesson", icon: BookOpen, tone: "bg-emerald-100 text-emerald-700" },
  aac: { label: "AAC", icon: Sparkles, tone: "bg-teal-100 text-teal-700" },
};

const SUBJECTS = ["All", "English", "Maths", "Science", "History", "Personal & Social", "PE", "Music", "Learn to Play"];

function ResourceBank() {
  const [items, setItems] = useState<Resource[]>(seed);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("All");
  const [starOnly, setStarOnly] = useState(false);

  const filtered = useMemo(() => items.filter((r) => {
    if (subject !== "All" && r.subject !== subject) return false;
    if (starOnly && !r.starred) return false;
    if (q && !`${r.title} ${r.source} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, subject, starOnly, q]);

  const toggleStar = (id: string) => setItems((p) => p.map((r) => r.id === id ? { ...r, starred: !r.starred } : r));

  return (
    <AppShell>
      <PageHeader
        title="Resource Bank"
        subtitle="Your school's shared library — Twinkl, Topmarks, Starfall, Boardmaker, Canva, plus in-house files."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => toast.info("Upload flow — coming soon")}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link to="/lessons"><Sparkles className="h-4 w-4" /> Open in Lesson Planner</Link>
            </Button>
          </>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-4">
        {/* AI recommendation strip */}
        <Card className="flex flex-wrap items-start gap-4 border-primary/25 bg-gradient-to-br from-primary-soft/40 via-background to-background p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-primary">AI recommendation</div>
            <p className="text-sm mt-0.5">
              Based on tomorrow's <b>Maths — Numbers</b> lesson and Mia's IEP goal, try
              <b> "Numbers 0–20 tracing pack"</b> and the <b>Colourful Semantics visuals</b> for Zara's language prompts.
            </p>
          </div>
          <Button size="sm" variant="outline">Add to lesson</Button>
        </Card>

        <Card className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag, source…" className="pl-8 h-9" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
            <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            {SUBJECTS.map((s) => (
              <button key={s} onClick={() => setSubject(s)} className={cn("rounded-md px-2 py-1 transition whitespace-nowrap", subject === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{s}</button>
            ))}
          </div>
          <Button size="sm" variant={starOnly ? "default" : "outline"} onClick={() => setStarOnly((v) => !v)}>
            <Star className={cn("h-4 w-4", starOnly && "fill-current")} /> Starred
          </Button>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
              No resources match your filters.
            </Card>
          )}
          {filtered.map((r) => {
            const meta = kindMeta[r.kind];
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="group p-4 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug">{r.title}</h4>
                      <button onClick={() => toggleStar(r.id)} aria-label="Star">
                        <Star className={cn("h-4 w-4 text-muted-foreground transition hover:text-amber-500", r.starred && "fill-amber-400 text-amber-500")} />
                      </button>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{r.source}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{r.subject}</Badge>
                      <Badge variant="outline" className="text-[10px]">Level {r.levels.join(", ")}</Badge>
                      {r.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge className={cn("text-[10px] font-normal", meta.tone)}>{meta.label}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Open <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
