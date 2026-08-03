import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side helper for the immutable audit trail.
 *
 * Pass the request-scoped Supabase client (context.supabase) so the entry is
 * attributed to the signed-in user by the database function. Failures are
 * swallowed — auditing must never break the user's action.
 */
export async function auditServer(
  client: SupabaseClient<any, any, any>,
  input: {
    action: string;
    entityType: string;
    entityId?: string | null;
    summary?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const { error } = await client.rpc("record_audit_event", {
      p_action: input.action,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId ?? undefined,
      p_summary: input.summary ?? undefined,
      p_metadata: (input.metadata ?? {}) as never,
    });
    if (error) console.warn("[audit] failed:", input.action, error.message);
  } catch (e) {
    console.warn("[audit] failed:", input.action, e);
  }
}
