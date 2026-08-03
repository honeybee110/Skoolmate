import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { enterGuestMode } from "@/lib/guest-mode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2, GraduationCap, Eye } from "lucide-react";

export const Route = createFileRoute("/teacher/login")({
  head: () => ({ meta: [{ title: "Teacher Sign in · skoolmate" }] }),
  component: TeacherLogin,
});

function TeacherLogin() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      resetIepCells();
      toast.success("Signed in");
    }

  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/teacher/login",
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — signing you in.");
  };

  const google = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/teacher/login",
    });
    if (res.error) {
      toast.error(res.error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2.5 text-primary-foreground">
          <BrandMark size="lg" className="text-primary-foreground" />
        </Link>
        <div className="space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <GraduationCap className="h-3.5 w-3.5" /> Teacher Portal
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Plan your day, track IEPs, capture evidence.
          </h1>
          <p className="text-sm text-primary-foreground/85">
            Your teaching day starts here — lesson plans, class list, IEP goals and
            evidence, all in one place.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          Are you leadership, allied health or IT?{" "}
          <Link to="/admin/login" className="underline hover:text-white">
            Admin Portal →
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <GraduationCap className="h-3 w-3" /> Teacher
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your school email or Google.
            </p>
          </div>

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
            onClick={() => { enterGuestMode("teacher"); navigate({ to: "/dashboard" }); }}
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

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ti-email">Email</Label>
                  <Input
                    id="ti-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ti-pw">Password</Label>
                  <Input
                    id="ti-pw"
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
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tu-name">Display name</Label>
                  <Input
                    id="tu-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Honey Anderson"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tu-email">School email</Label>
                  <Input
                    id="tu-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tu-pw">Password</Label>
                  <Input
                    id="tu-pw"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create teacher account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
