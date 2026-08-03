// Server-side role gates for privileged server functions.
// RLS is the last line of defence; these give explicit, early failures
// (and clear messages) before a privileged mutation is attempted.
import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleGroup = "teacher" | "leadership" | "allied_health" | "wellbeing" | "it";

/** True when the signed-in caller belongs to the given role group. */
export async function isInGroup(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  group: RoleGroup,
): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("in_group", {
    _user_id: userId,
    _group: group,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** True when the signed-in caller holds the admin role. */
export async function isAdmin(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** Throws unless the caller is in one of the accepted role groups. */
export async function requireAnyGroup(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  groups: RoleGroup[],
  action = "perform this action",
): Promise<void> {
  for (const g of groups) {
    if (await isInGroup(supabase, userId, g)) return;
  }
  throw new Error(`You do not have permission to ${action}.`);
}

/** Throws unless the caller is leadership, IT or an admin. */
export async function requireLeadership(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  action = "perform this action",
): Promise<void> {
  if (await isInGroup(supabase, userId, "leadership")) return;
  if (await isInGroup(supabase, userId, "it")) return;
  if (await isAdmin(supabase, userId)) return;
  throw new Error(`Only school leadership can ${action}.`);
}
