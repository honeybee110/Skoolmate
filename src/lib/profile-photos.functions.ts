// Profile photo management (students & staff). IT & leadership only.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubjectType = "student" | "staff";
export interface ProfilePhoto {
  id: string;
  subject_type: SubjectType;
  subject_id: string;
  display_name: string | null;
  role_or_year: string | null;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export const listProfilePhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfilePhoto[]> => {
    const { data, error } = await (context.supabase as any)
      .from("profile_photos")
      .select("*")
      .order("subject_type", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProfilePhoto[];
  });

const UpsertInput = z.object({
  subject_type: z.enum(["student", "staff"]),
  subject_id: z.string().min(1).max(120),
  display_name: z.string().min(1).max(200),
  role_or_year: z.string().max(120).optional(),
  storage_path: z.string().min(1),
  content_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
});

export const upsertProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertInput.parse(input))
  .handler(async ({ data, context }): Promise<ProfilePhoto> => {
    const { data: allowed, error: rErr } = await context.supabase.rpc("in_group", {
      _user_id: context.userId,
      _group: "it",
    });
    const { data: allowed2 } = await context.supabase.rpc("in_group", {
      _user_id: context.userId,
      _group: "leadership",
    });
    if (rErr) throw new Error(rErr.message);
    if (!allowed && !allowed2) throw new Error("Only IT or leadership may manage photos.");

    const { data: row, error } = await (context.supabase as any)
      .from("profile_photos")
      .upsert(
        {
          subject_type: data.subject_type,
          subject_id: data.subject_id,
          display_name: data.display_name,
          role_or_year: data.role_or_year ?? null,
          storage_path: data.storage_path,
          content_type: data.content_type ?? null,
          size_bytes: data.size_bytes ?? null,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "subject_type,subject_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ProfilePhoto;
  });

export const signProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("profile-photos")
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const deleteProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.storage.from("profile-photos").remove([data.path]);
    const { error } = await (context.supabase as any).from("profile_photos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
