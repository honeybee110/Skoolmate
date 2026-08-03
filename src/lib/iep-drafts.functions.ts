// Server-side IEP matrix draft autosave.
// Drafts are scoped to the user's *current auth session*, so a new sign-in
// always starts from an empty matrix — consistently across tabs and devices.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type IepDraftCells = Record<string, Json>;

function sessionIdFrom(claims: Record<string, unknown>, userId: string): string {
  const sid = claims["session_id"];
  return typeof sid === "string" && sid ? sid : `nosession:${userId}`;
}

/**
 * Loads the draft for the current sign-in session and removes drafts belonging
 * to previous sessions (server-side enforcement of the fresh-matrix rule).
 */
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
      .select("cells, updated_at")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return {
      sessionId,
      cells: (data?.cells ?? {}) as IepDraftCells,
      updatedAt: data?.updated_at ?? null,
    };
  });

/** Upserts the draft matrix for the current sign-in session. */
export const saveIepDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { cells: IepDraftCells }) => {
    if (!input || typeof input !== "object" || typeof input.cells !== "object" || input.cells === null) {
      throw new Error("Invalid draft payload");
    }
    const json = JSON.stringify(input.cells);
    if (json.length > 1_000_000) throw new Error("Draft is too large to autosave.");
    return { cells: input.cells };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const sessionId = sessionIdFrom(claims as Record<string, unknown>, userId);

    const { error } = await supabase
      .from("iep_matrix_drafts")
      .upsert(
        { user_id: userId, session_id: sessionId, cells: data.cells as never, updated_at: new Date().toISOString() },
        { onConflict: "user_id,session_id" },
      );

    if (error) throw new Error(error.message);
    return { ok: true, savedAt: new Date().toISOString() };
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
