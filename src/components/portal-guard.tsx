import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useIsGuest, guestPortal } from "@/lib/guest-mode";
import { Loader2 } from "lucide-react";

/**
 * Enforces separation between Teacher and Admin portals.
 * Guest mode: anyone with the URL may enter in view-only mode.
 */
export function PortalGuard({
  portal,
  children,
}: {
  portal: "teacher" | "admin";
  children: ReactNode;
}) {
  const { ready, user, isAdminPortalUser } = useAuth();
  const guest = useIsGuest();
  const navigate = useNavigate();

  useEffect(() => {
    if (guest) return; // guest can enter either portal
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
  }, [ready, user, isAdminPortalUser, portal, navigate, guest]);

  if (guest) {
    // Only enforce cross-portal isolation loosely for guests.
    const gp = guestPortal();
    if (gp && gp !== portal) {
      // allow, but no redirect — guests can move between portals via URL
    }
    return <>{children}</>;
  }

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

