import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import { Sparkle } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { BrandMark } from "@/components/brand-mark";
import { OutputTools } from "@/components/ask-mate/output-tools";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TOOL_LABELS: Record<string, string> = {
  search_documents: "Searching documents",
  list_documents: "Reading the document library",
  lookup_student: "Opening the student profile",
  find_entry_skills: "Checking Entry Skills",
  list_lesson_plans: "Reading the Lesson Bank",
  list_ssg_minutes: "Reading SSG minutes",
  list_notifications: "Reading school notices",
};

const SUGGESTIONS = [
  "Create tomorrow's literacy planner for Level C",
  "Write an SSG summary for Mia Nguyen",
  "Find activities for counting to 10",
  "Find all documents mentioning sensory regulation",
  "Rewrite this report comment positively",
  "Compare Jack's progress with last semester",
];

export function AskChat({
  threadId,
  initialMessages,
  onTitleChange,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onTitleChange?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const firstSendRef = useRef(initialMessages.length > 0);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session?.access_token) {
            headers.set("Authorization", `Bearer ${data.session.access_token}`);
          }
          return fetch(input, { ...init, headers });
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Ask SkoolMate could not answer that."),
    onFinish: () => {
      if (!firstSendRef.current) {
        firstSendRef.current = true;
        onTitleChange?.();
      }
      textareaRef.current?.focus();
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
  };

  // A question typed on the dashboard is handed over here once the thread exists.
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current || initialMessages.length > 0) return;
    const pending = sessionStorage.getItem("ask-mate:pending");
    if (!pending) return;
    pendingRef.current = true;
    sessionStorage.removeItem("ask-mate:pending");
    void sendMessage({ text: pending });
  }, [initialMessages.length, sendMessage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 pb-8">
          {messages.length === 0 && (
            <div className="mt-6 rounded-2xl border bg-gradient-to-br from-[color:var(--primary)]/8 via-background to-[color:var(--accent)]/10 p-6">
              <BrandMark size="lg" showText={false} />
              <h2 className="mt-4 font-brand text-2xl font-bold tracking-tight">Ask SkoolMate</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Your workspace assistant. It reads your lesson planners, reports, Entry Skills,
                student profiles, uploaded documents, templates and school resources — and cites
                what it used.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/25 bg-background/70 text-xs hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => send(s)}
                  >
                    <Sparkle className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const plainText = message.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("\n")
              .trim();
            return (
            <Message from={message.role} key={message.id}>
              <MessageContent
                className={
                  message.role === "assistant"
                    ? "bg-transparent p-0 text-foreground"
                    : "bg-primary text-primary-foreground"
                }
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return message.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <span key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </span>
                    );
                  }
                  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                    const anyPart = part as unknown as {
                      type: string;
                      state: string;
                      input?: unknown;
                      output?: unknown;
                      errorText?: string;
                    };
                    const name = anyPart.type.replace("tool-", "");
                    return (
                      <Tool defaultOpen={false} key={i} className="bg-muted/30">
                        <ToolHeader
                          type={anyPart.type as never}
                          state={anyPart.state as never}
                          title={TOOL_LABELS[name] ?? name}
                        />

                        <ToolContent>
                          <ToolInput input={anyPart.input} />
                          <ToolOutput output={anyPart.output} errorText={anyPart.errorText} />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}

                {message.role === "assistant" && plainText.length > 0 && !busy && (
                  <OutputTools text={plainText} disabled={busy} onAction={(p) => send(p)} />
                )}
              </MessageContent>
            </Message>
            );
          })}


          {status === "submitted" && <Shimmer className="text-sm">Reading your workspace…</Shimmer>}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background/80 p-3 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            onSubmit={(message, event) => {
              event.preventDefault();
              send(message.text ?? "");
              (event.currentTarget as HTMLFormElement).reset();
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              autoFocus
              placeholder="Ask about a student, a document, a planner or a report…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={busy} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Ask SkoolMate only sees documents you are permitted to read. Always check generated
            content before it goes to families.
          </p>
        </div>
      </div>
    </div>
  );
}
