import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";
import { AskChat } from "@/components/ask-mate/ask-chat";
import { getAskThread } from "@/lib/ask-threads.functions";

export const Route = createFileRoute("/ask/$threadId")({
  component: AskThreadPage,
});

function AskThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadThread = useServerFn(getAskThread);

  const thread = useQuery({
    queryKey: ["ask-thread", threadId],
    queryFn: () => loadThread({ data: { id: threadId } }),
  });

  if (thread.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  if (!thread.data?.thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <p>That conversation is not available.</p>
        <button className="text-primary underline" onClick={() => navigate({ to: "/ask" })}>
          Start a new one
        </button>
      </div>
    );
  }

  const initialMessages: UIMessage[] = thread.data.messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: (Array.isArray(m.parts) ? m.parts : []) as UIMessage["parts"],
  }));

  return (
    <AskChat
      key={threadId}
      threadId={threadId}
      initialMessages={initialMessages}
      onTitleChange={() => {
        void queryClient.invalidateQueries({ queryKey: ["ask-threads"] });
      }}
    />
  );
}
