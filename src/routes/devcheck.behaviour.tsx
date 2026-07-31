import { createFileRoute } from "@tanstack/react-router";
import { BehaviourLeadership } from "@/components/behaviour/behaviour-leadership";
export const Route = createFileRoute("/devcheck/behaviour")({
  component: () => <div className="p-6"><BehaviourLeadership /></div>,
});
