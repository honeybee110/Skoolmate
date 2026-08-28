import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PortalGuard } from "@/components/portal-guard";

// Layout route for /lessons/* — child routes render inside <Outlet />.
// The redirect to /lessons/bank now lives on the index leaf so it does
// not fire when the browser navigates to the child bank route
// (which would create an infinite redirect loop).
export const Route = createFileRoute("/lessons")({
  component: () => (
    <PortalGuard portal="teacher">
      <Outlet />
    </PortalGuard>
  ),
});
