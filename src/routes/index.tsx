import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import {
  Sparkles,
  Wand2,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Lightbulb,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import teacherShot from "@/assets/landing-teacher.jpg";
import adminShot from "@/assets/landing-admin.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "skoolmate — The AI Copilot for Your Entire School" },
      {
        name: "description",
        content:
          "skoolmate integrates AI-powered lesson planning, IEP tracking, real-time analytics and streamlined admin for Australian Special Developmental Schools.",
      },
      { property: "og:title", content: "skoolmate — The AI Copilot for Your Entire School" },
      {
        property: "og:description",
        content:
          "AI lesson planning, IEPs, behaviour analytics and compliance — purpose-built for Australian Special Developmental Schools.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const schools = [
  "Maple Creek Primary",
  "Ironbark Secondary",
  "Wattle Grove Grammar",
  "Coastal Plains College",
  "Sunrise District School",
  "Ridgeview Academy",
];

const features = [
  {
    icon: Wand2,
    title: "AI Lesson Planner",
    body: "Generate Victorian Curriculum 2.0 aligned lesson plans, resources and assessments in minutes.",
    tone: "bg-[oklch(0.95_0.04_25)] text-[oklch(0.55_0.18_25)]",
  },
  {
    icon: LineChart,
    title: "Real-time Analytics",
    body: "Track student and cohort progress across semesters with intuitive dashboards and predictive insight.",
    tone: "bg-[oklch(0.95_0.05_155)] text-[oklch(0.45_0.13_155)]",
  },
  {
    icon: MessageSquare,
    title: "Seamless Communication",
    body: "A stronger school community with parent messaging, news feeds and IEP portal built in.",
    tone: "bg-[oklch(0.96_0.06_95)] text-[oklch(0.5_0.14_75)]",
  },
  {
    icon: ShieldCheck,
    title: "Simplified Compliance",
    body: "Automate attendance, curriculum reporting and NCCD evidence — always audit-ready.",
    tone: "bg-[oklch(0.94_0.05_295)] text-[oklch(0.5_0.18_295)]",
  },
];

const testimonials = [
  {
    quote:
      "skoolmate has been a game-changer for our staff. The AI lesson planner has freed up countless hours, allowing our teachers to focus on high-impact instruction.",
    name: "Sarah Jenkins",
    role: "Principal, Maple Creek Primary",
  },
  {
    quote:
      "The ability to see real-time analytics across the entire school has revolutionised our strategic planning and support interventions. We're more proactive than ever.",
    name: "David Chen",
    role: "Head of School, Ironbark Secondary College",
  },
];

const resources = [
  { label: "Disability Standards for Education 2005", href: "https://www.education.gov.au/disability-standards-education-2005" },
  { label: "NCCD Portal", href: "https://www.nccd.edu.au/" },
  { label: "The NDIS in Schools", href: "https://www.ndis.gov.au/understanding/families-and-carers/children-and-education" },
  { label: "Australian Curriculum – Student Diversity", href: "https://www.australiancurriculum.edu.au/resources/student-diversity/" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#teachers" className="transition hover:text-foreground">For Teachers</a>
            <a href="#admins" className="transition hover:text-foreground">For Admins</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
            <Link to="/teacher/login" className="transition hover:text-foreground">Teacher Login</Link>
            <Link to="/admin/login" className="transition hover:text-foreground">Admin Login</Link>
          </nav>
          <Button asChild className="rounded-full bg-primary px-5 hover:bg-primary/90">
            <a href="#demo">Book a Demo</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-soft/30 via-background to-background">
        {/* Floating brand shapes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="drift-a absolute -left-20 top-20 h-72 w-72 rounded-[42%_58%_63%_37%/45%_46%_54%_55%] bg-primary/25 blur-2xl" />
          <div className="drift-b absolute right-10 top-32 h-40 w-40 rounded-full bg-accent/40 blur-xl" />
          <div className="drift-c absolute bottom-10 left-1/3 h-24 w-24 rounded-full border-[6px] border-primary/30" />
          <div className="drift-d absolute -bottom-4 right-24 h-56 w-56 rounded-[58%_42%_38%_62%/52%_40%_60%_48%] bg-gradient-to-br from-primary/20 to-accent/30 blur-2xl" />
          <div className="drift-a absolute top-1/2 left-16 h-3 w-3 rotate-45 bg-primary/60" />
          <div className="drift-c absolute top-24 right-1/3 h-4 w-4 rotate-45 bg-accent/70" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Built for Australian Special Developmental Schools
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            The AI Copilot for <span className="text-primary">Your Entire School</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            skoolmate integrates AI-powered lesson planning, student analytics and streamlined administration to
            empower your teachers and leaders.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">
              <a href="#demo">Book a Demo <ArrowRight className="ml-1 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/dashboard">See the product</Link>
            </Button>
          </div>
        </div>

        {/* Split feature cards echoing the mock */}
        <div className="relative mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-2">
          <FeatureIntro
            icon={Lightbulb}
            iconTone="bg-primary-soft text-primary"
            title="For Teachers"
            body="Reduce your planning workload and gain deeper insights into student progress. Discover tools built for you."
            href="#teachers"
          />
          <FeatureIntro
            icon={Shield}
            iconTone="bg-accent-soft text-accent-foreground"
            title="For Admins"
            body="Get a whole-school view of performance, manage compliance, and streamline day-to-day operations."
            href="#admins"
          />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">Trusted by leading schools across Australia</p>
          <div className="mt-4 grid grid-cols-2 items-center gap-4 text-sm text-muted-foreground/80 sm:grid-cols-3 md:grid-cols-6">
            {schools.map((s) => (
              <span key={s} className="tracking-tight">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            An All-in-One Platform Designed for Australian Education
          </h2>
          <p className="mt-4 text-muted-foreground">Everything you need to run your school efficiently and effectively.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Teachers */}
      <section id="teachers" className="bg-secondary/30">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">For Teachers</span>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight">
              Reclaim Your Time, Amplify Your Impact
            </h2>
            <p className="mt-4 text-muted-foreground">
              Say goodbye to late-night lesson planning. Our AI assistant helps you create engaging,
              curriculum-aligned content in a fraction of the time. Track individual student progress with
              powerful visualisation tools and automate repetitive tasks, so you can focus on what you do best:
              teaching.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "AI Lesson Planner aligned to Victorian Curriculum 2.0",
                "Live IEP goal tracking with Cross-Check to Evidence Hub",
                "Class dashboard with medical alerts and today's schedule",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {l}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 rounded-full bg-primary px-6 hover:bg-primary/90">
              <Link to="/lessons">Explore Teacher Tools <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <ProductShot src={teacherShot} alt="Teacher dashboard preview" />
        </div>
      </section>

      {/* For Admins */}
      <section id="admins">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <ProductShot src={adminShot} alt="Admin analytics preview" className="md:order-1" />
          <div className="md:order-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-foreground">For Admins</span>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight">
              Lead with Clarity and Confidence
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get a bird's-eye view of your entire school. From real-time analytics to simplified financial and
              enrolment management, skoolmate provides the tools you need to make informed decisions.
            </p>
            <dl className="mt-6 space-y-2 text-sm">
              <Row label="Principal & Leadership" value="Strategic oversight and data-driven insights." />
              <Row label="Assistant Principals" value="Manage daily organisation and track training needs." />
              <Row label="Leading Teachers" value="Facilitate collaborative planning and training sessions." />
              <Row label="Learning Specialists" value="Review and approve weekly lesson plans." />
              <Row label="Allied Health & Behaviourists" value="Access student data to inform support strategies." />
              <Row label="Maintenance" value="Manage and track facilities tickets efficiently." />
            </dl>
            <Button asChild className="mt-8 rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90">
              <Link to="/reports">Discover Admin Features <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Inclusive commitment */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight">
            Committed to Inclusive and Supportive Education
          </h2>
          <p className="mt-4 text-muted-foreground">
            skoolmate is built with the flexibility to support the diverse needs of every student. Our platform
            helps teachers differentiate learning and assists schools in meeting their obligations under the
            Disability Discrimination Act 1992 and the Disability Standards for Education 2005.
          </p>
          <div className="mt-10">
            <p className="text-sm font-semibold">Further Reading &amp; Official Resources</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
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
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          What school leaders are saying
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border bg-card p-8 shadow-sm">
              <blockquote className="text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-6">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-primary">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="bg-[oklch(0.18_0.03_240)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to see how skoolmate can transform your school?
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">Book a Demo</Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
              <a href="#pricing">Explore Pricing</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} skoolmate. Made for Australian schools.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureIntro({
  icon: Icon,
  iconTone,
  title,
  body,
  href,
}: {
  icon: typeof Lightbulb;
  iconTone: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border bg-card/80 p-7 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
        Learn more <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

function ProductShot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/20 to-transparent blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <img src={src} alt={alt} width={1280} height={896} loading="lazy" className="h-auto w-full" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="text-sm text-muted-foreground">{value}</dd>
    </div>
  );
}
