// Ask SkoolMate — thread + message persistence (typed RPC for the UI).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AskThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AskStoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[];
  created_at: string;
}

export const listAskThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AskThread[]> => {
    const { data, error } = await context.supabase
      .from("ask_threads")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AskThread[];
  });

export const createAskThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AskThread> => {
    const { data, error } = await (context.supabase as any)
      .from("ask_threads")
      .insert({ user_id: context.userId, title: "New conversation" })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return data as AskThread;
  });

export const renameAskThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ask_threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAskThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ask_threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAskThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ thread: AskThread | null; messages: AskStoredMessage[] }> => {
    const { data: thread } = await context.supabase
      .from("ask_threads")
      .select("id, title, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!thread) return { thread: null, messages: [] };

    const { data: rows, error } = await context.supabase
      .from("ask_messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return {
      thread: thread as AskThread,
      messages: (rows ?? []) as unknown as AskStoredMessage[],
    };
  });
