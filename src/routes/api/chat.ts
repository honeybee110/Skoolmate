// Ask SkoolMate — streaming chat endpoint with workspace tools + thread persistence.
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { ASK_SYSTEM_PROMPT, createUserSupabase, createWorkspaceTools, getUserId } from "@/lib/ask-mate.server";

type Body = { messages?: unknown; threadId?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured for this workspace.", { status: 500 });

        const body = (await request.json()) as Body;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Messages and threadId are required", { status: 400 });
        }

        const supabase = createUserSupabase(token);
        const userId = await getUserId(supabase, token);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { data: thread } = await supabase
          .from("ask_threads")
          .select("id, user_id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread || (thread as any).user_id !== userId) {
          return new Response("Conversation not found", { status: 404 });
        }

        const uiMessages = messages as UIMessage[];
        const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");

        if (lastUser) {
          const { error: insErr } = await (supabase as any).from("ask_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts ?? [],
            client_message_id: lastUser.id ?? null,
          });
          if (insErr) console.error("[ask] failed to save user message", insErr.message);

          const firstText = (lastUser.parts ?? [])
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          if (firstText && (thread as any).title === "New conversation") {
            await supabase
              .from("ask_threads")
              .update({ title: firstText.slice(0, 70) })
              .eq("id", threadId);
          } else {
            await supabase.from("ask_threads").update({ title: (thread as any).title }).eq("id", threadId);
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const today = new Date().toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const result = streamText({
          model: gateway("openai/gpt-5.6-sol"),
          system: `${ASK_SYSTEM_PROMPT}\n\nToday is ${today}.`,
          messages: await convertToModelMessages(uiMessages),
          tools: createWorkspaceTools(supabase, apiKey),
          stopWhen: stepCountIs(50),
          providerOptions: { lovable: { reasoningEffort: "none" } },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage) return;
            const { error } = await (supabase as any).from("ask_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "assistant",
              parts: responseMessage.parts ?? [],
              client_message_id: responseMessage.id ?? null,
            });
            if (error) console.error("[ask] failed to save assistant message", error.message);
          },
        });
      },
    },
  },
});
