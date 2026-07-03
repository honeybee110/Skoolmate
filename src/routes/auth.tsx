import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Choose your portal · skoolmate" }] }),
  component: PortalChooser,
});

function PortalChooser() {
  const { ready, user, isAdminPortalUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) {
      navigate({ to: isAdminPortalUser ? "/admin" : "/dashboard" });
    }
  }, [ready, user, isAdminPortalUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft/30 via-background to-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 text-foreground">
          <BrandMark size="lg" />
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Choose your portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            skoolmate has separate experiences for classroom teachers and school leadership.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:border-primary/40 transition-colors">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">Teacher Portal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your classroom command centre: dashboard, timetable, lesson planner, IEPs,
              evidence, behaviour and reports.
            </p>
            <Button asChild className="mt-4 w-full gap-1.5">
              <Link to="/teacher/login">
                Sign in as Teacher <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>

          <Card className="p-6 hover:border-slate-400 transition-colors">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">Admin Portal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approvals, document management, whole-school timetable, analytics and user
              administration for leadership, allied health, wellbeing and IT.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full gap-1.5 border-slate-900 hover:bg-slate-900 hover:text-white">
              <Link to="/admin/login">
                Sign in as Admin <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to marketing site</Link>
        </p>
      </div>
    </div>
  );
}
