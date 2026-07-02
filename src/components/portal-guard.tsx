import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

/**
 * Enforces separation between Teacher and Admin portals.
 *
 * - `teacher`: unauthenticated → /teacher/login; admin-portal users → /admin.
 * - `admin`: unauthenticated → /admin/login; non-admin users → /dashboard.
 */
export function PortalGuard({
  portal,
  children,
}: {
  portal: "teacher" | "admin";
  children: ReactNode;
}) {
  const { ready, user, isAdminPortalUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: portal === "admin" ? "/admin/login" : "/teacher/login" });
      return;
    }
    if (portal === "admin" && !isAdminPortalUser) {
      navigate({ to: "/dashboard" });
    } else if (portal === "teacher" && isAdminPortalUser) {
      navigate({ to: "/admin" });
    }
  }, [ready, user, isAdminPortalUser, portal, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (portal === "admin" && !isAdminPortalUser) return null;
  if (portal === "teacher" && isAdminPortalUser) return null;
  return <>{children}</>;
}
