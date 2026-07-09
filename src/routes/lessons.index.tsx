import { createFileRoute, redirect } from "@tanstack/react-router";

// The dedicated Lesson Planner surface is being rebuilt; until then the
// bare /lessons URL forwards teachers into the Lesson Bank library.
export const Route = createFileRoute("/lessons/")({
  beforeLoad: () => {
    throw redirect({ to: "/lessons/bank" });
  },
});
