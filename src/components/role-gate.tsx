import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type RoleGroup } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export function RoleGate({
  groups,
  children,
  redirectIfSignedOut = "/auth",
}: {
  groups: RoleGroup[];
  children: ReactNode;
  redirectIfSignedOut?: string;
}) {
  const { ready, user, inGroup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: redirectIfSignedOut });
  }, [ready, user, navigate, redirectIfSignedOut]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const allowed = groups.some((g) => inGroup(g));
  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive mb-3" />
          <h2 className="text-lg font-semibold">Access restricted</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You need a Leadership, Allied Health, Wellbeing, or IT role to enter the Admin
            Portal.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to Teacher Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
