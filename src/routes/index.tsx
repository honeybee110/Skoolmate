import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import {
  Wand2,
  FileText,
  Layers,
  Activity,
  Users,
  ShieldCheck,
  ArrowRight,
  Check,
  MapPin,
  Star,
  FileCheck,
  Sparkles,
  GraduationCap,
  Building2,
  ClipboardList,
  BookOpen,
  LineChart,
  Settings2,
  BellRing,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "skoolmate — The smarter way to run Australian classrooms" },
      {
        name: "description",
        content:
          "skoolmate integrates lesson planning, IEP writing and cross-checking — aligned to the Victorian Curriculum 2.0. Plus a world-first behaviour analytics heatmap for neurodivergent learners.",
      },
      { property: "og:title", content: "skoolmate — Purpose-built for Australian schools" },
      {
        property: "og:description",
        content:
          "Lesson planning, IEP writing, curriculum cross-check and behaviour analytics — one platform for Australian classrooms.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const schools = [
  "Haileybury College",
  "Scotch College",
  "Mac.Robertson Girls'",
  "Nossal High School",
  "Strathcona Girls Grammar",
  "Camberwell Grammar",
];

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Lesson Planner",
    body: "Build rich, structured lesson plans in minutes — aligned to the Victorian Curriculum 2.0 out of the box.",
    chip: "Core",
    chipTone: "bg-primary-soft text-primary",
    iconTone: "bg-primary text-primary-foreground",
  },
  {
    icon: FileText,
    title: "IEP Writer & Tracker",
    body: "Generate compliant Individual Education Plans, set measurable goals and track progress through the year.",
    chip: "Inclusion",
    chipTone: "bg-accent-soft text-accent",
    iconTone: "bg-accent text-accent-foreground",
  },
  {
    icon: Layers,
    title: "Victorian Curriculum 2.0 Crosscheck",
    body: "Real-time alignment checking across all learning areas — see coverage gaps before an audit does.",
    chip: "VC 2.0",
    chipTone: "bg-primary-soft text-primary",
    iconTone: "bg-[color:var(--navy)] text-primary-foreground",
  },
  {
    icon: Activity,
    title: "Behaviour Analytics Heatmap",
    body: "A world-first tool that visualises behaviour patterns over time — helping identify triggers and tailor support.",
    chip: "Neurodivergent",
    chipTone: "bg-accent-soft text-accent",
    iconTone: "bg-accent text-accent-foreground",
  },
  {
    icon: Users,
    title: "Student Profiles & Cohort View",
    body: "Complete longitudinal records — IEPs, behaviour history, learning adjustments and parent contacts in one screen.",
    chip: "Students",
    chipTone: "bg-primary-soft text-primary",
    iconTone: "bg-primary text-primary-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & Compliance",
    body: "Built to Australian Privacy Act standards. AISV, CECV and DET compliant with role-based access to sensitive IEP data.",
    chip: "Security",
    chipTone: "bg-muted text-muted-foreground",
    iconTone: "bg-[color:var(--navy)] text-primary-foreground",
  },
];

const stats = [
  { icon: MapPin, value: "120+", label: "Victorian schools" },
  { icon: Users, value: "28K+", label: "Students supported" },
  { icon: FileCheck, value: "2,400+", label: "IEPs generated" },
  { icon: Star, value: "4.9★", label: "Teacher satisfaction" },
];

const testimonials = [
  {
    quote:
      "skoolmate has been a game-changer for our staff. The AI lesson planner has freed up countless hours, allowing our teachers to focus on high-impact instruction.",
    initials: "AN",
    name: "Amanda Nguyen",
    role: "Learning Support Coordinator, Haileybury",
    chip: "Inclusion",
    chipTone: "bg-accent-soft text-accent",
    avatarTone: "bg-primary text-primary-foreground",
  },
  {
    quote:
      "The ability to see real-time analytics across the whole school has revolutionised how we plan support interventions. We're more proactive than ever.",
    initials: "MP",
    name: "Michael Papadopoulos",
    role: "Assistant Principal, Nossal High School",
    chip: "Wellbeing",
    chipTone: "bg-primary-soft text-primary",
    avatarTone: "bg-accent text-accent-foreground",
  },
  {
    quote:
      "The Curriculum 2.0 crosscheck alone saved our team a term of manual mapping. It's now the first tab I open every morning.",
    initials: "RS",
    name: "Rachel Stafford",
    role: "Year 6 Teacher, Strathcona Girls",
    chip: "Teaching",
    chipTone: "bg-accent-soft text-accent",
    avatarTone: "bg-[color:var(--navy)] text-primary-foreground",
  },
];

const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
type BehaviourState = "Calm" | "Moderate" | "Elevated" | "Distressed";
const heatmapWeeks: { week: string; cells: BehaviourState[] }[] = [
  { week: "Wk 1", cells: ["Calm", "Moderate", "Calm", "Elevated", "Moderate"] },
  { week: "Wk 2", cells: ["Moderate", "Calm", "Elevated", "Distressed", "Moderate"] },
  { week: "Wk 3", cells: ["Calm", "Calm", "Moderate", "Moderate", "Calm"] },
  { week: "Wk 4", cells: ["Moderate", "Elevated", "Calm", "Calm", "Moderate"] },
];
const cellTone: Record<BehaviourState, string> = {
  Calm: "bg-[color:oklch(0.9_0.06_155)] text-[color:oklch(0.35_0.09_155)]",
  Moderate: "bg-[color:oklch(0.93_0.06_85)] text-[color:oklch(0.38_0.09_75)]",
  Elevated: "bg-[color:oklch(0.9_0.07_45)] text-[color:oklch(0.4_0.11_40)]",
  Distressed: "bg-[color:oklch(0.86_0.09_25)] text-[color:oklch(0.4_0.14_25)]",
};

const resources = [
  { label: "Disability Standards for Education 2005", href: "https://www.education.gov.au/disability-standards-education-2005" },
  { label: "NCCD Portal", href: "https://www.nccd.edu.au/" },
  { label: "The NDIS in Schools", href: "https://www.ndis.gov.au/understanding/families-and-carers/children-and-education" },
  { label: "Australian Curriculum – Student Diversity", href: "https://www.australiancurriculum.edu.au/resources/student-diversity/" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ───────────────────────── Nav ───────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#curriculum" className="transition hover:text-foreground">Curriculum</a>
            <a href="#behaviour" className="transition hover:text-foreground">Behaviour Analytics</a>
            <a href="#schools" className="transition hover:text-foreground">Schools</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden text-sm font-medium text-primary hover:text-primary/80 sm:inline-flex"
            >
              Sign in
            </Link>
            <Button asChild className="rounded-full bg-primary px-5 hover:bg-primary/90">
              <Link to="/teacher/login">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-soft/40 via-background to-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="drift-a absolute -left-24 top-16 h-72 w-72 rounded-[42%_58%_63%_37%/45%_46%_54%_55%] bg-primary/20 blur-2xl" />
          <div className="drift-b absolute right-10 top-40 h-40 w-40 rounded-full bg-accent/25 blur-xl" />
          <div className="drift-c absolute bottom-16 left-1/3 h-24 w-24 rounded-full border-[6px] border-primary/25" />
          <div className="drift-d absolute -bottom-8 right-24 h-56 w-56 rounded-[58%_42%_38%_62%/52%_40%_60%_48%] bg-gradient-to-br from-primary/15 to-accent/25 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Purpose-built for Australian schools · Victorian Curriculum 2.0
          </span>
          <h1 className="mt-6 text-balance font-brand text-5xl font-medium tracking-tight md:text-6xl lg:text-[4.25rem]">
            The smarter way to run
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Australian classrooms.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            skoolmate integrates lesson planning, IEP writing and cross-checking — all
            aligned to the Victorian Curriculum 2.0. Plus a world-first behaviour analytics
            heatmap designed for neurodivergent learners.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">
              <Link to="/teacher/login">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary/40 bg-background px-6 text-foreground hover:bg-primary-soft"
            >
              <a href="#demo">Watch Demo</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            {[
              "No credit card required",
              "Free 30-day trial",
              "Victorian Curriculum 2.0 ready",
            ].map((c) => (
              <li key={c} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {c}
              </li>
            ))}
          </ul>
        </div>

        {/* For Teachers / For Admins */}
        <div id="demo" className="relative mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            <AudienceCard
              badge="For Teachers"
              icon={GraduationCap}
              title="Spend less time on paperwork, more time teaching."
              body="AI-drafted lesson plans, IEPs and progress notes — all aligned to the Victorian Curriculum 2.0."
              items={[
                { icon: BookOpen, label: "AI Lesson Planner" },
                { icon: ClipboardList, label: "IEP Writer & Tracker" },
                { icon: Activity, label: "Behaviour Heatmap" },
                { icon: Users, label: "Student Profiles" },
              ]}
              cta={{ label: "Start Free Trial", to: "/teacher/login" }}
              tone="primary"
            />
            <AudienceCard
              badge="For Admins"
              icon={Building2}
              title="Whole-school visibility, compliance and reporting."
              body="Real-time dashboards across cohorts, curriculum coverage, IEP compliance and staff workload."
              items={[
                { icon: LineChart, label: "Analytics & Reports" },
                { icon: ShieldAlert, label: "Compliance & Audit" },
                { icon: Settings2, label: "Roles & Permissions" },
                { icon: BellRing, label: "Reminders & Approvals" },
              ]}
              cta={{ label: "Explore Admin Console", to: "/admin" }}
              tone="accent"
            />
          </div>
        </div>
      </section>


      {/* ───────────────────────── Schools trust strip ───────────────────────── */}
      <section id="schools" className="border-y border-border/60 bg-primary-soft/40">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Trusted by leading Victorian schools
          </p>
          <div className="mt-4 grid grid-cols-2 items-center gap-y-3 text-sm text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
            {schools.map((s) => (
              <span key={s} className="font-brand text-base tracking-tight text-foreground/70">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Features grid ───────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex text-[11px] font-semibold uppercase tracking-widest text-primary">
            Everything you need
          </span>
          <h2 className="mt-3 text-balance font-brand text-4xl font-medium tracking-tight md:text-5xl">
            One platform. Every classroom need.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop switching between Word docs, spreadsheets and disconnected portals. skoolmate
            replaces all of them with tools built for Australian teachers.
          </p>
        </div>

        <div id="curriculum" className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group relative rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.chipTone}`}
              >
                {f.chip}
              </span>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.iconTone}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-brand text-xl font-medium tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────────────── Behaviour heatmap spotlight ───────────────────────── */}
      <section
        id="behaviour"
        className="relative overflow-hidden bg-[color:var(--navy)] text-primary-foreground"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-accent/15"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2">
          <div>
            <span className="inline-flex text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">
              World-first feature
            </span>
            <h2 className="mt-3 text-balance font-brand text-4xl font-medium tracking-tight md:text-[2.75rem]">
              A behaviour analytics heatmap for every learner.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Designed specifically for neurodivergent learners — including those with ASD,
              ADHD and anxiety — skoolmate's behaviour heatmap turns daily observations
              into visual patterns that drive smarter support decisions.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-primary-foreground/85">
              {[
                "Spot recurring triggers by day and time of week",
                "Track IEP behaviour goals against real outcomes",
                "Generate evidence-based reports for OT and psychologists",
                "Share anonymised trends with parents in the portal",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-full bg-primary px-6 hover:bg-primary/90"
            >
              <Link to="/dashboard">
                See it in action <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Heatmap card */}
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur">
            <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] items-center gap-2 text-xs">
              <span />
              {heatmapDays.map((d) => (
                <span
                  key={d}
                  className="text-center font-semibold uppercase tracking-widest text-primary-foreground/70"
                >
                  {d}
                </span>
              ))}
              {heatmapWeeks.map((row) => (
                <Fragment key={row.week}>
                  <span className="pr-2 text-right font-semibold text-primary-foreground/70">
                    {row.week}
                  </span>
                  {row.cells.map((state, i) => (
                    <span
                      key={`${row.week}-${i}`}
                      className={`rounded-md py-2 text-center text-[11px] font-semibold ${cellTone[state]}`}
                    >
                      {state}
                    </span>
                  ))}
                </Fragment>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-primary/40 bg-primary/15 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-primary-foreground">
                <Sparkles className="h-4 w-4" /> AI Pattern Insight
              </p>
              <p className="mt-2 text-primary-foreground/85">
                Elevated behaviour consistently appears on{" "}
                <strong>Tuesday &amp; Thursday afternoons</strong>. Consider reviewing
                post-lunch transitions and the sensory environment for those sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats band ───────────────────────── */}
      <section className="bg-gradient-to-r from-primary to-[color:var(--navy)] text-primary-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-brand text-4xl font-medium md:text-5xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-primary-foreground/80">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── Testimonials ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </span>
          <h2 className="mt-3 font-brand text-4xl font-medium tracking-tight md:text-5xl">
            Victorian teachers love skoolmate
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
            >
              <span
                className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.chipTone}`}
              >
                {t.chip}
              </span>
              <blockquote className="text-sm leading-relaxed text-foreground/85">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${t.avatarTone}`}
                >
                  {t.initials}
                </span>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ───────────────────────── Inclusive commitment / resources ───────────────────────── */}
      <section className="border-y border-border/60 bg-primary-soft/30">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-brand text-3xl font-medium tracking-tight md:text-4xl">
            Committed to inclusive and supportive education
          </h2>
          <p className="mt-4 text-muted-foreground">
            skoolmate is built with the flexibility to support the diverse needs of every
            student — helping schools meet obligations under the Disability Discrimination
            Act 1992 and the Disability Standards for Education 2005.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {resources.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {r.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Final CTA ───────────────────────── */}
      <section
        id="book-demo"
        className="relative overflow-hidden bg-[color:var(--navy)] text-primary-foreground"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/20"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <BrandMark size="sm" showText={false} />
          </div>
          <h2 className="mt-6 text-balance font-brand text-4xl font-medium tracking-tight md:text-5xl">
            Ready to give every student
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              the support they deserve?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-primary-foreground/80">
            Join 120+ Victorian schools already using skoolmate to streamline lesson
            planning, IEP writing and neurodivergent learner support.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">
              <Link to="/auth">
                Book a Demo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/dashboard">See the product</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-1">
              <BrandMark size="md" />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Purpose-built for Australian schools. Aligned to the Victorian Curriculum
                2.0. Supporting neurodivergent learners since 2026.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> All systems operational
              </p>
            </div>

            <FooterCol
              heading="Product"
              items={[
                { label: "Lesson Planner", href: "/lessons" },
                { label: "IEP Writer", href: "/ieps" },
                { label: "Behaviour Heatmap", href: "/behaviour" },
                { label: "VC 2.0 Crosscheck", href: "/scope-sequence" },
              ]}
            />
            <FooterCol
              heading="Schools"
              items={[
                { label: "Primary Schools", href: "#schools" },
                { label: "Secondary Schools", href: "#schools" },
                { label: "Special Schools", href: "#schools" },
                { label: "Catholic Schools", href: "#schools" },
                { label: "Independent Schools", href: "#schools" },
              ]}
            />
            <FooterCol
              heading="Resources"
              items={resources.map((r) => ({ label: r.label, href: r.href, external: true }))}
            />
            <FooterCol
              heading="Company"
              items={[
                { label: "Book a demo", href: "/auth" },
                { label: "Sign in", href: "/auth" },
                { label: "Contact", href: "mailto:hello@skoolmate.com.au", external: true },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
            <div>
              © {new Date().getFullYear()} skoolmate Pty Ltd. Made in Melbourne, Australia.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-foreground">
        {heading}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            {i.external || i.href.startsWith("http") ? (
              <a
                href={i.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                {i.label}
              </a>
            ) : i.href.startsWith("#") ? (
              <a href={i.href} className="hover:text-foreground">
                {i.label}
              </a>
            ) : (
              <Link to={i.href} className="hover:text-foreground">
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AudienceCard({
  badge,
  icon: Icon,
  title,
  body,
  items,
  cta,
  tone,
}: {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  items: { icon: React.ComponentType<{ className?: string }>; label: string }[];
  cta: { label: string; to: string };
  tone: "primary" | "accent";
}) {
  const tint =
    tone === "primary"
      ? {
          chip: "bg-primary-soft text-primary",
          iconBg: "bg-primary text-primary-foreground",
          ring: "border-primary/20",
          glow: "from-primary/15 to-accent/10",
        }
      : {
          chip: "bg-accent-soft text-accent",
          iconBg: "bg-accent text-accent-foreground",
          ring: "border-accent/25",
          glow: "from-accent/15 to-primary/10",
        };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${tint.ring} bg-card p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${tint.glow} blur-2xl`}
      />
      <div className="relative flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tint.chip}`}>
          {badge}
        </span>
      </div>
      <h3 className="relative mt-5 font-brand text-2xl font-medium tracking-tight md:text-[1.6rem]">
        {title}
      </h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <ul className="relative mt-6 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <li
            key={it.label}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
          >
            <it.icon className="h-4 w-4 text-primary" />
            {it.label}
          </li>
        ))}
      </ul>
      <div className="relative mt-7">
        <Button asChild className="rounded-full bg-primary px-5 hover:bg-primary/90">
          <Link to={cta.to}>
            {cta.label} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
