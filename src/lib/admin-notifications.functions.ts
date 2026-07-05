// Admin notification hub — server functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminNotification {
  id: string;
  category: string;
  title: string;
  body: string | null;
  priority: "low" | "normal" | "high";
  target_group: string | null;
  link_url: string | null;
  created_by: string | null;
  created_at: string;
  read_by: string[];
}

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminNotification[]> => {
    const { data, error } = await (context.supabase as any)
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminNotification[];
  });

const CreateInput = z.object({
  category: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  target_group: z.string().max(60).optional(),
  link_url: z.string().max(300).optional(),
});

export const createAdminNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }): Promise<AdminNotification> => {
    const { data: row, error } = await (context.supabase as any)
      .from("admin_notifications")
      .insert({
        category: data.category,
        title: data.title,
        body: data.body ?? null,
        priority: data.priority,
        target_group: data.target_group ?? null,
        link_url: data.link_url ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AdminNotification;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: current, error: gErr } = await (context.supabase as any)
      .from("admin_notifications")
      .select("read_by")
      .eq("id", data.id)
      .single();
    if (gErr) throw new Error(gErr.message);
    const arr: string[] = current?.read_by ?? [];
    if (!arr.includes(context.userId)) arr.push(context.userId);
    const { error } = await (context.supabase as any)
      .from("admin_notifications")
      .update({ read_by: arr })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error: gErr } = await (context.supabase as any)
      .from("admin_notifications")
      .select("id, read_by");
    if (gErr) throw new Error(gErr.message);
    for (const r of rows ?? []) {
      const arr: string[] = r.read_by ?? [];
      if (arr.includes(context.userId)) continue;
      arr.push(context.userId);
      await (context.supabase as any).from("admin_notifications").update({ read_by: arr }).eq("id", r.id);
    }
    return { ok: true };
  });

export const deleteAdminNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("admin_notifications")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
