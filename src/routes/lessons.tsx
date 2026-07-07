import { createFileRoute, redirect } from "@tanstack/react-router";

// The AI Lesson Planner has been retired. Lesson planning now lives entirely
// inside the Lesson Bank — teachers attach/upload MS Word plans into the
// Term & Week folders, and leadership reviews them there.
export const Route = createFileRoute("/lessons")({
  beforeLoad: () => {
    throw redirect({ to: "/lessons/bank" });
  },
});
