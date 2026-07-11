import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — skoolmate" },
      {
        name: "description",
        content:
          "One price, everything included. Transparent skoolmate pricing for teachers, schools and districts across Victoria.",
      },
      { property: "og:title", content: "Pricing — skoolmate" },
      {
        property: "og:description",
        content:
          "No paid add-on modules, no surprise fees at renewal. Priced for special education, supported-inclusive, and mainstream schools.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  step: string;
  name: string;
  sub: string;
  priceLabel: string;
  monthly?: number;
  annual?: number;
  perLabel?: string;
  billedAnnualLabel?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
  solidCta?: boolean;
};

const tiers: Tier[] = [
  {
    step: "①",
    name: "Starter",
    sub: "A single teacher or case manager, getting started.",
    priceLabel: "Free",
    features: [
      "Behaviour logging",
      "Basic caseload heatmap",
      "5 AI lesson plans / month",
      "Teacher edit before use",
    ],
    cta: "Start free",
    ctaHref: "/teacher/login",
  },
  {
    step: "②",
    name: "Educator Pro",
    sub: "For one teacher or case manager who wants no limits.",
    priceLabel: "$29",
    monthly: 29,
    annual: 24,
    perLabel: "/teacher/mo",
    billedAnnualLabel: "Billed annually at $290/yr",
    features: [
      "Unlimited AI lesson generation",
      "IEP + VIC Curriculum 2.0 aligned",
      "Full behaviour analytics",
      "Edit and comment workflow",
    ],
    cta: "Choose Educator Pro",
    ctaHref: "/#demo",
    featured: true,
    solidCta: true,
  },
  {
    step: "③",
    name: "School — small",
    sub: "Up to 100 students on an active plan.",
    priceLabel: "$549",
    monthly: 549,
    annual: 458,
    perLabel: "/mo",
    billedAnnualLabel: "Billed annually at $5,490/yr",
    features: [
      "All staff included",
      "Admin approval queue",
      "Full audit trail",
      "Cross-class analytics",
    ],
    cta: "Book a demo",
    ctaHref: "/#demo",
  },
  {
    step: "④",
    name: "School — established",
    sub: "101–300 students on an active plan.",
    priceLabel: "$1,199",
    monthly: 1199,
    annual: 999,
    perLabel: "/mo",
    billedAnnualLabel: "Billed annually at $11,990/yr",
    features: [
      "Everything in Small",
      "Priority support",
      "Shared lesson libraries",
      "Custom reporting",
    ],
    cta: "Book a demo",
    ctaHref: "/#demo",
  },
  {
    step: "⑤",
    name: "District",
    sub: "Multi-school, 300+ students on active plans.",
    priceLabel: "Custom",
    features: [
      "SSO + SIS integration",
      "Custom curriculum mapping",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    ctaHref: "/#demo",
  },
];

function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" hash="features" className="transition hover:text-foreground">Features</Link>
            <Link to="/pricing" className="text-foreground">Pricing</Link>
            <Link to="/teacher/login" className="transition hover:text-foreground">Teacher Login</Link>
            <Link to="/admin/login" className="transition hover:text-foreground">Admin Login</Link>
          </nav>
          <Button asChild className="rounded-full bg-primary px-5 hover:bg-primary/90">
            <Link to="/" hash="demo">Book a Demo</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-primary/25 bg-primary-soft px-3.5 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Pricing
          </span>
          <h1 className="mt-5 font-brand text-4xl font-medium tracking-tight md:text-5xl">
            One price. Everything included.
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            No paid add-on modules, no surprise fees at renewal. Priced for special
            education, supported-inclusive, and mainstream schools across Victoria.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
            </button>
          </div>
          <span className="ml-3 text-sm font-semibold text-accent">Save ~17% billed annually</span>
        </div>

        {/* Growth rail */}
        <div className="relative mx-auto mt-16 h-0.5 max-w-5xl bg-border">
          <div
            aria-hidden
            className="absolute -top-px left-0 h-[3px] w-full bg-gradient-to-r from-primary-soft to-primary"
            style={{
              clipPath:
                "polygon(0 100%, 0 40%, 20% 55%, 40% 30%, 60% 45%, 80% 15%, 100% 0%, 100% 100%)",
            }}
          />
        </div>
        <p className="mt-4 mb-10 text-center text-xs uppercase tracking-wider text-muted-foreground">
          Starts with one teacher. Grows with the school.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {tiers.map((t) => {
            const amount =
              billing === "monthly" ? t.monthly : t.annual;
            const priceText =
              amount != null ? `$${amount.toLocaleString()}` : t.priceLabel;
            return (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                  t.featured ? "border-2 border-primary shadow-md" : "border-border"
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-sm text-primary">
                  {t.step}
                </div>
                <h3 className="mt-4 font-brand text-lg font-medium">{t.name}</h3>
                <p className="mt-1 min-h-9 text-sm text-muted-foreground">{t.sub}</p>
                <div className="mt-3 font-brand text-3xl font-medium">
                  {priceText}
                  {t.perLabel && amount != null && (
                    <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                      {t.perLabel}
                    </span>
                  )}
                </div>
                <div className="mt-1 min-h-4 text-xs text-muted-foreground">
                  {billing === "annual" && t.billedAnnualLabel ? t.billedAnnualLabel : "\u00A0"}
                </div>
                <ul className="mt-4 mb-5 flex-1 space-y-0">
                  {t.features.map((f, i) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 py-2 text-sm text-muted-foreground ${
                        i === 0 ? "" : "border-t border-border"
                      }`}
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={t.solidCta ? "default" : "outline"}
                  className={
                    t.solidCta
                      ? "rounded-lg bg-primary hover:bg-primary/90"
                      : "rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }
                >
                  {t.ctaHref.startsWith("/#") ? (
                    <Link to="/" hash={t.ctaHref.slice(2)}>{t.cta}</Link>
                  ) : (
                    <Link to={t.ctaHref}>{t.cta}</Link>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-14 max-w-3xl border-t border-border pt-8 text-center text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Founding-school offer:</strong> the
          first 20 schools to sign on lock in current pricing for 3 years, even as
          list price rises later. All tiers include full AI-generated lesson
          planning with mandatory teacher review and admin sign-off before
          anything reaches a student.
        </div>

        <div className="mt-14 text-center">
          <Button asChild size="lg" className="rounded-full bg-primary px-6 hover:bg-primary/90">
            <Link to="/" hash="demo">
              Book a demo <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
