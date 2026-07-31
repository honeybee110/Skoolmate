import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { students, todayTimetable } from "@/lib/mock-data";
import { useCuration } from "@/lib/curation-store";
import { listDocuments } from "@/lib/doc-search.functions";
import { createAskThread } from "@/lib/ask-threads.functions";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { subjectFromTitle } from "@/lib/subject-colors";
import {
  ArrowUp,
  BookOpen,
  ChevronRight,
  FileText,
  Search,
  Sparkles,
  Star,
  Clock,
} from "lucide-react";
import { PortalGuard } from "@/components/portal-guard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace · skoolmate" },
      {
        name: "description",
        content:
          "Your AI workspace: ask SkoolMate anything, create lesson plans, write reports, and pick up today's schedule, documents and students.",
      },
      { property: "og:title", content: "Workspace · skoolmate" },
      {
        property: "og:description",
        content: "A clean AI workspace for teachers — ask, plan, write and find in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PortalGuard portal="teacher">
      <Dashboard />
    </PortalGuard>
  ),
});

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  {
    label: "Create Lesson Plan",
    hint: "AI planner",
    to: "/lessons/planner",
    icon: BookOpen,
    tone: "from-[color:var(--primary)] to-indigo-500",
  },
  {
    label: "Write Student Report",
    hint: "Reports",
    to: "/reports",
    icon: FileText,
    tone: "from-amber-400 to-orange-500",
  },
  {
    label: "Search Documents",
    hint: "Semantic search",
    to: "/search",
    icon: Search,
    tone: "from-emerald-400 to-teal-500",
  },
  {
    label: "Ask SkoolMate",
    hint: "Workspace AI",
    to: "/ask",
    icon: Sparkles,
    tone: "from-[color:var(--accent)] to-cyan-500",
  },
] as const;

function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createThread = useServerFn(createAskThread);
  const loadDocuments = useServerFn(listDocuments);
  const { resources } = useCuration();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0];

  const documents = useQuery({
    queryKey: ["dashboard-documents"],
    queryFn: () => loadDocuments(),
    retry: false,
  });

  const recentDocs = (documents.data ?? []).slice(0, 5);
  const favourites = resources.filter((r) => r.featured).slice(0, 5);
  const schedule = todayTimetable.filter((b) => b.type !== "break").slice(0, 5);
  const recentStudents = students.slice(0, 6);

  const ask = async () => {
    const value = question.trim();
    if (!value || asking) return;
    setAsking(true);
    try {
      sessionStorage.setItem("ask-mate:pending", value);
      const thread = await createThread();
      await queryClient.invalidateQueries({ queryKey: ["ask-threads"] });
      navigate({ to: "/ask/$threadId", params: { threadId: thread.id } });
    } catch {
      sessionStorage.removeItem("ask-mate:pending");
      navigate({ to: "/ask" });
    } finally {
      setAsking(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
        {/* Greeting + ask bar */}
        <header className="text-center">
          <h1 className="font-brand text-3xl font-bold tracking-tight md:text-4xl">
            {greetingFor(new Date())}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            What would you like to get done today?
          </p>
        </header>

        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-[0_18px_50px_-30px_rgba(14,42,77,0.55)] focus-within:border-primary/50">
            <Sparkles className="h-4 w-4 shrink-0 text-[color:var(--accent)]" />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void ask();
              }}
              placeholder="Ask SkoolMate anything..."
              aria-label="Ask SkoolMate anything"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => void ask()}
              disabled={!question.trim() || asking}
              aria-label="Send to Ask SkoolMate"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(14,42,77,0.5)]"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                  a.tone,
                )}
              >
                <a.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-sm font-medium leading-snug">{a.label}</div>
              <div className="text-[11px] text-muted-foreground">{a.hint}</div>
            </Link>
          ))}
        </div>

        {/* Content grid */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <SectionHeader title="Today's Schedule" to="/calendar" label="Calendar" />
            <ul className="mt-3 space-y-1.5">
              {schedule.map((b, i) => {
                const tone = subjectFromTitle(b.title, b.type);
                return (
                  <li
                    key={i}
                    className={cn("flex items-center gap-3 rounded-lg border-l-4 px-3 py-2", tone.cell)}
                  >
                    <span className="w-14 shrink-0 text-[11px] font-medium text-muted-foreground">
                      {b.start}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{b.title}</span>
                    <span className="text-[11px] text-muted-foreground">{b.room}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Recent Documents" to="/search" label="All documents" />
            <ul className="mt-3 space-y-1">
              {documents.isLoading && (
                <li className="py-6 text-center text-xs text-muted-foreground">Loading…</li>
              )}
              {!documents.isLoading && recentDocs.length === 0 && (
                <li className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                  No documents yet — upload one from Search.
                </li>
              )}
              {recentDocs.map((d) => (
                <li key={d.id}>
                  <Link
                    to="/search"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{d.title}</span>
                    <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Favourite Resources" to="/resources" label="Resource bank" />
            <ul className="mt-3 space-y-1">
              {favourites.length === 0 && (
                <li className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Star a resource to pin it here.
                </li>
              )}
              {favourites.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/resources"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary"
                  >
                    <Star className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                    <span className="text-[11px] text-muted-foreground">{r.subject}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Recent Students" to="/students" label="All students" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {recentStudents.map((s) => (
                <Link
                  key={s.id}
                  to="/students/$studentId"
                  params={{ studentId: s.id }}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-secondary"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: s.avatarColor }}
                  >
                    {s.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm leading-tight">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{s.className}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, to, label }: { title: string; to: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold">{title}</h2>
      <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
        <Link to={to}>
          {label} <ChevronRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
