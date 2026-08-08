import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, ShieldCheck, AlertTriangle, Eye } from "lucide-react";
import { enterGuestMode } from "@/lib/guest-mode";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Sign in · skoolmate" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const { user, ready, isAdminPortalUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongPortal, setWrongPortal] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (isAdminPortalUser) navigate({ to: "/admin" });
    else setWrongPortal(true);
  }, [ready, user, isAdminPortalUser, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Signed in");
    }

  };

  const google = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/admin/login",
    });
    if (res.error) {
      toast.error(res.error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <BrandMark size="lg" />
        </Link>
        <div className="space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Portal
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Oversight, approvals, and whole-school analytics.
          </h1>
          <p className="text-sm text-white/85">
            For leadership, allied health, wellbeing and IT staff. Review lesson plans and
            IEP goals, manage documents, and run the school.
          </p>
        </div>
        <p className="text-xs text-white/70">
          Classroom teacher?{" "}
          <Link to="/teacher/login" className="underline hover:text-white">
            Teacher Portal →
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3 w-3" /> Admin
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Sign in to Admin Portal
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Restricted to Leadership, Allied Health, Wellbeing and IT roles.
            </p>
          </div>

          {wrongPortal ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">This account can't access the Admin Portal.</p>
                  <p className="mt-1 text-xs text-amber-800/80">
                    Your account has teacher-only permissions. If you're the school
                    founder and no admin exists yet, claim founder access below.
                  </p>
                </div>
              </div>
              <Button
                className="w-full gap-1.5"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.rpc("claim_founder_admin");
                  setLoading(false);
                  if (error) {
                    toast.error(
                      error.message.includes("founder_already_claimed")
                        ? "Founder access has already been claimed. Ask your existing admin to grant you a role."
                        : error.message
                    );
                  } else {
                    toast.success("Founder access granted. Redirecting…");
                    setTimeout(() => window.location.assign("/admin"), 600);
                  }
                }}
              >
                <ShieldCheck className="h-4 w-4" /> Claim founder access
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/teacher/login">Go to Teacher Portal</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setWrongPortal(false);
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-2 gap-2"
                onClick={google}
                disabled={loading}
                data-guest-safe="true"
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full mb-4 gap-2 border border-dashed"
                data-guest-safe="true"
                onClick={() => { enterGuestMode("admin"); navigate({ to: "/admin" }); }}
              >
                <Eye className="h-4 w-4" />
                Continue as guest (view-only)
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or with email</span>
                </div>
              </div>

              <form onSubmit={signIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-email">Email</Label>
                  <Input
                    id="ai-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ai-pw">Password</Label>
                  <Input
                    id="ai-pw"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Admin accounts are provisioned by IT. Contact your school IT administrator
                for access.
              </p>
            </>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to marketing site</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
