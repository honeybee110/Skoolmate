import { supabase } from "@/integrations/supabase/client";

/**
 * Immutable audit logging.
 *
 * Every entry is appended through the `record_audit_event` database function,
 * which computes a SHA-256 hash chained to the previous entry. The table has no
 * update/delete policies and a trigger that rejects any mutation, so entries can
 * only ever be added — never edited or removed.
 */

export type AuditEvent = {
  id: string;
  seq: number;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  prev_hash: string | null;
  hash: string;
  created_at: string;
};

export type AuditChainStatus = {
  ok: boolean;
  total: number;
  invalid: number;
  first_invalid_seq: number | null;
  checked_at: string;
};

export type RecordAuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append an entry to the immutable log. Never throws — audit failures must not
 * break the user-facing action, but they are surfaced in the console.
 */
export async function recordAuditEvent(input: RecordAuditInput): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("record_audit_event", {
      p_action: input.action,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId ?? undefined,
      p_summary: input.summary ?? undefined,
      p_metadata: (input.metadata ?? {}) as never,
    });
    if (error) {
      console.warn("[audit] failed to record event", input.action, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[audit] failed to record event", input.action, e);
    return false;
  }
}

export async function listAuditEvents(limit = 200): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .order("seq", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AuditEvent[];
}

export async function verifyAuditChain(): Promise<AuditChainStatus> {
  const { data, error } = await supabase.rpc("verify_audit_chain");
  if (error) throw new Error(error.message);
  return data as unknown as AuditChainStatus;
}
