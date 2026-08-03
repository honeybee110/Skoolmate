// Server-side IEP matrix draft autosave with optimistic concurrency.
// Drafts are scoped to the user's *current auth session*, so a new sign-in
// always starts from an empty matrix — consistently across tabs and devices.
// Saves carry the version the client last saw; a stale version returns the
// server copy so the client can merge per cell instead of overwriting.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sessionIdFrom, validateDraftInput } from "@/lib/iep-drafts.server";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type IepDraftCells = Record<string, Json>;

export const loadIepDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const sessionId = sessionIdFrom(claims as Record<string, unknown>, userId);

    // Any draft from an older sign-in is discarded.
    await supabase
      .from("iep_matrix_drafts")
      .delete()
      .eq("user_id", userId)
      .neq("session_id", sessionId);

    const { data, error } = await supabase
      .from("iep_matrix_drafts")
      .select("cells, updated_at, version")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return {
      sessionId,
      cells: (data?.cells ?? {}) as IepDraftCells,
      updatedAt: data?.updated_at ?? null,
      version: data?.version ?? 0,
    };
  });

export const saveIepDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { cells: IepDraftCells; baseVersion: number }) => validateDraftInput(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const sessionId = sessionIdFrom(claims as Record<string, unknown>, userId);
    const now = new Date().toISOString();

    const { data: current, error: readError } = await supabase
      .from("iep_matrix_drafts")
      .select("cells, version")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    // No row yet — insert at version 1.
    if (!current) {
      const { data: inserted, error } = await supabase
        .from("iep_matrix_drafts")
        .insert({ user_id: userId, session_id: sessionId, cells: data.cells as never, version: 1, updated_at: now })
        .select("version, updated_at")
        .maybeSingle();
      if (error) {
        // Another tab inserted first — report a conflict so the client merges.
        const { data: raced } = await supabase
          .from("iep_matrix_drafts")
          .select("cells, version")
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .maybeSingle();
        return {
          ok: false as const, conflict: true as const,
          serverCells: (raced?.cells ?? {}) as IepDraftCells,
          version: raced?.version ?? 0, savedAt: null,
        };
      }
      return { ok: true as const, conflict: false as const, version: inserted?.version ?? 1, savedAt: inserted?.updated_at ?? now, serverCells: null };
    }

    // Optimistic concurrency: only write when the version is still what the client saw.
    const { data: updated, error } = await supabase
      .from("iep_matrix_drafts")
      .update({ cells: data.cells as never, version: current.version + 1, updated_at: now })
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("version", data.baseVersion)
      .select("version, updated_at")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!updated) {
      return {
        ok: false as const, conflict: true as const,
        serverCells: (current.cells ?? {}) as IepDraftCells,
        version: current.version, savedAt: null,
      };
    }

    return { ok: true as const, conflict: false as const, version: updated.version, savedAt: updated.updated_at, serverCells: null };
  });

/** Clears the draft for the current session (explicit reset). */
export const clearIepDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("iep_matrix_drafts").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
