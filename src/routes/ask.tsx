import { useCallback, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquarePlus, Trash2, MessagesSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createAskThread, deleteAskThread, listAskThreads } from "@/lib/ask-threads.functions";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask SkoolMate — AI workspace assistant" },
      {
        name: "description",
        content:
          "Ask SkoolMate answers from your planners, reports, Entry Skills, student profiles and uploaded documents.",
      },
      { property: "og:title", content: "Ask SkoolMate — AI workspace assistant" },
      {
        property: "og:description",
        content:
          "Ask SkoolMate answers from your planners, reports, Entry Skills, student profiles and uploaded documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskLayout,
});

function AskLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pending, setPending] = useState(false);

  const listThreads = useServerFn(listAskThreads);
  const createThread = useServerFn(createAskThread);
  const removeThread = useServerFn(deleteAskThread);

  const threads = useQuery({
    queryKey: ["ask-threads"],
    queryFn: () => listThreads(),
  });

  const onNew = useCallback(async () => {
    setPending(true);
    try {
      const thread = await createThread();
      await queryClient.invalidateQueries({ queryKey: ["ask-threads"] });
      navigate({ to: "/ask/$threadId", params: { threadId: thread.id } });
    } finally {
      setPending(false);
    }
  }, [createThread, navigate, queryClient]);

  const del = useMutation({
    mutationFn: (id: string) => removeThread({ data: { id } }),
    onSuccess: async (_r, id) => {
      await queryClient.invalidateQueries({ queryKey: ["ask-threads"] });
      if (pathname.includes(id)) navigate({ to: "/ask" });
    },
  });

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-gradient-to-b from-[color:var(--primary)]/6 to-background md:flex">
          <div className="flex items-center gap-2 border-b px-3 py-3">
            <BrandMark size="sm" showText={false} />
            <span className="font-brand text-sm font-bold">Ask SkoolMate</span>
          </div>
          <div className="p-3">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white shadow-sm hover:opacity-95"
              onClick={onNew}
              disabled={pending}
            >
              <MessageSquarePlus className="h-4 w-4" />
              New conversation
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
            <ul className="space-y-1">
              {(threads.data ?? []).map((t) => {
                const active = pathname === `/ask/${t.id}`;
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg px-1 transition",
                      active ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <Link
                      to="/ask/$threadId"
                      params={{ threadId: t.id }}
                      className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-2 text-left text-xs"
                    >
                      <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{t.title}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${t.title}`}
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => del.mutate(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </li>
                );
              })}
              {threads.data?.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No conversations yet.
                </li>
              )}
            </ul>
          </ScrollArea>
        </aside>
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
