// Server functions for the Weekly Lesson Bank uploads (Cloud storage backed).
import { createServerFn } from "@tanstack/react-start";
import { auditServer } from "@/lib/audit-server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeText } from "@/lib/validation";

const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"] as const;
const WEEKS = ["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6","Week 7","Week 8","Week 9","Week 10","Week 11","Week 12"] as const;

export type UploadTerm = typeof TERMS[number];
export type UploadWeek = typeof WEEKS[number];
export type UploadStatus = "pending" | "approved" | "rejected";

export interface WeeklyUpload {
  id: string;
  term: UploadTerm;
  week: UploadWeek;
  title: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  uploader_name: string | null;
  class_name: string | null;
  status: UploadStatus;
  leadership_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const listWeeklyUploads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyUpload[]> => {
    const { data, error } = await context.supabase
      .from("lesson_bank_uploads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as WeeklyUpload[];
  });

const RegisterInput = z.object({
  term: z.enum(TERMS),
  week: z.enum(WEEKS),
  title: z.preprocess(sanitizeText, z.string().min(1).max(200)),
  storage_path: z.string().min(1),
  content_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  uploader_name: z.preprocess(sanitizeText, z.string().max(120)).optional(),
  class_name: z.preprocess(sanitizeText, z.string().max(80)).optional(),
});

export const registerWeeklyUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegisterInput.parse(input))
  .handler(async ({ data, context }): Promise<WeeklyUpload> => {
    const { data: row, error } = await (context.supabase as any)
      .from("lesson_bank_uploads")
      .insert({
        term: data.term,
        week: data.week,
        title: data.title,
        storage_path: data.storage_path,
        content_type: data.content_type ?? null,
        size_bytes: data.size_bytes ?? null,
        uploader_name: data.uploader_name ?? null,
        class_name: data.class_name ?? null,
        uploaded_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await auditServer(context.supabase, {
      action: "lesson_upload.created",
      entityType: "lesson_bank_upload",
      entityId: row.id,
      summary: `Uploaded "${data.title}" to ${data.term} ${data.week}`,
      metadata: { term: data.term, week: data.week, class_name: data.class_name ?? null },
    });
    return row as WeeklyUpload;
  });

const ReviewInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "pending"]),
  leadership_note: z.string().max(600).optional(),
});

export const reviewWeeklyUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    // Verify caller is leadership.
    const { data: allowed, error: roleErr } = await context.supabase
      .rpc("in_group", { _user_id: context.userId, _group: "leadership" });
    if (roleErr) throw new Error(roleErr.message);
    if (!allowed) throw new Error("Only leadership can approve or reject weekly lessons.");

    const { data: row, error } = await context.supabase
      .from("lesson_bank_uploads")
      .update({
        status: data.status,
        leadership_note: data.leadership_note ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await auditServer(context.supabase, {
      action: `lesson_upload.${data.status}`,
      entityType: "lesson_bank_upload",
      entityId: data.id,
      summary: `Weekly lesson marked ${data.status}`,
      metadata: { status: data.status, note: data.leadership_note ?? null },
    });
    return row as WeeklyUpload;
  });

const DeleteInput = z.object({ id: z.string().uuid(), storage_path: z.string() });

export const deleteWeeklyUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error: sErr } = await context.supabase.storage.from("lesson-uploads").remove([data.storage_path]);
    if (sErr && !sErr.message.includes("not found")) throw new Error(sErr.message);
    const { error } = await context.supabase.from("lesson_bank_uploads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditServer(context.supabase, {
      action: "lesson_upload.deleted",
      entityType: "lesson_bank_upload",
      entityId: data.id,
      summary: "Weekly lesson upload deleted",
      metadata: { storage_path: data.storage_path },
    });
    return { ok: true };
  });

export const signWeeklyUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("lesson-uploads")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
