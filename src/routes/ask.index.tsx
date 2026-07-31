import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrandMark } from "@/components/brand-mark";
import { createAskThread } from "@/lib/ask-threads.functions";

export const Route = createFileRoute("/ask/")({
  component: AskIndex,
});

function AskIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createThread = useServerFn(createAskThread);
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const thread = await createThread();
        await queryClient.invalidateQueries({ queryKey: ["ask-threads"] });
        navigate({ to: "/ask/$threadId", params: { threadId: thread.id }, replace: true });
      } catch {
        started.current = false;
        setFailed(true);
      }
    })();
  }, [createThread, navigate, queryClient]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <BrandMark size="xl" showText={false} />
      {failed ? (
        <p className="max-w-sm text-center text-sm">
          Sign in with your school account to start a conversation with Ask SkoolMate.
        </p>
      ) : (
        <p className="text-sm">Opening Ask SkoolMate…</p>
      )}
    </div>
  );
}
