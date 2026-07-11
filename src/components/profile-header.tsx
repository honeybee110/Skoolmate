import { type ReactNode } from "react";
import { useAuth, roleLabel } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function ProfileHeader({
  eyebrow,
  greeting,
  subtitle,
  actions,
  className,
  variant = "teacher",
}: {
  eyebrow?: string;
  greeting?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: "teacher" | "admin";
}) {
  const { user, profile, roles } = useAuth();
  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "there";
  const firstName = greeting ?? displayName.split(" ")[0];
  const initials = displayName
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "SM";
  const primaryRole = roles[0];
  const hue = profile?.avatar_hue ?? (variant === "admin" ? 258 : 275);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[color:var(--navy)] via-[color:var(--navy-light)] to-[color:var(--navy)] px-6 py-6 text-white shadow-[0_20px_60px_-30px_rgba(11,26,47,0.6)] md:px-8",
        className,
      )}
    >
      {/* decorative blur */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-[-40%] h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg ring-2 ring-white/20"
            style={{
              backgroundImage: `linear-gradient(135deg, hsl(${hue} 75% 58%), hsl(${hue + 40} 80% 62%))`,
            }}
          >
            {initials}
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[color:var(--accent)] ring-2 ring-[color:var(--navy)]" />
          </div>
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight md:text-3xl">
              Good morning, {firstName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
              {primaryRole && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white/85 ring-1 ring-white/10">
                  {roleLabel(primaryRole)}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
