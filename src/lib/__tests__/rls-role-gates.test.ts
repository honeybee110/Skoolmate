// RLS permission smoke tests — NON-LEADERSHIP authenticated roles.
//
// Guests are covered by rls-guest-smoke.test.ts. Here we verify the
// server-side role gates that sit in front of privileged IEP / notification /
// audit operations: a signed-in teacher (or allied health / wellbeing staff)
// must be refused, and leadership must be allowed.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isAdmin,
  isInGroup,
  requireAnyGroup,
  requireLeadership,
  type RoleGroup,
} from "../require-role";

const USER = "11111111-1111-1111-1111-111111111111";

/**
 * Minimal stand-in for the request-scoped Supabase client. `in_group` /
 * `has_role` are security-definer functions in the database; here we simulate
 * their answers for a user holding exactly the given roles.
 */
function clientForGroups(groups: RoleGroup[], admin = false) {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "in_group") return { data: groups.includes(args["_group"] as RoleGroup), error: null };
      if (fn === "has_role") return { data: admin && args["_role"] === "admin", error: null };
      throw new Error(`unexpected rpc ${fn}`);
    },
  } as never;
}

const TEACHER = clientForGroups(["teacher"]);
const ALLIED = clientForGroups(["allied_health"]);
const WELLBEING = clientForGroups(["wellbeing"]);
const LEADERSHIP = clientForGroups(["leadership"]);
const IT = clientForGroups(["it"]);
const ADMIN = clientForGroups([], true);

describe("role gates: non-leadership staff are refused privileged actions", () => {
  const denied: Array<[string, ReturnType<typeof clientForGroups>]> = [
    ["teacher", TEACHER],
    ["allied health", ALLIED],
    ["wellbeing", WELLBEING],
  ];

  for (const [label, client] of denied) {
    it(`refuses ${label} publishing notifications`, async () => {
      await expect(
        requireLeadership(client, USER, "publish notifications"),
      ).rejects.toThrow(/Only school leadership/);
    });

    it(`refuses ${label} deleting notifications`, async () => {
      await expect(
        requireLeadership(client, USER, "delete notifications"),
      ).rejects.toThrow(/Only school leadership/);
    });

    it(`refuses ${label} leadership-only audit + alert operations`, async () => {
      await expect(requireLeadership(client, USER, "view the audit trail")).rejects.toThrow();
      await expect(requireLeadership(client, USER, "change alert settings")).rejects.toThrow();
    });
  }

  it("refuses a teacher an allied-health / leadership only IEP action", async () => {
    await expect(
      requireAnyGroup(TEACHER, USER, ["leadership", "allied_health"], "override an IEP goal"),
    ).rejects.toThrow(/do not have permission/);
  });

  it("does not treat a teacher as an admin", async () => {
    expect(await isAdmin(TEACHER, USER)).toBe(false);
    expect(await isInGroup(TEACHER, USER, "leadership")).toBe(false);
  });
});

describe("role gates: leadership, IT and admins retain access", () => {
  it("allows leadership", async () => {
    await expect(requireLeadership(LEADERSHIP, USER)).resolves.toBeUndefined();
  });
  it("allows IT", async () => {
    await expect(requireLeadership(IT, USER)).resolves.toBeUndefined();
  });
  it("allows admins", async () => {
    await expect(requireLeadership(ADMIN, USER)).resolves.toBeUndefined();
    expect(await isAdmin(ADMIN, USER)).toBe(true);
  });
  it("allows allied health through a group gate that includes them", async () => {
    await expect(
      requireAnyGroup(ALLIED, USER, ["leadership", "allied_health"], "add a specialist note"),
    ).resolves.toBeUndefined();
  });
});

describe("role gates: fails closed when the database check errors", () => {
  const broken = {
    rpc: async () => ({ data: null, error: { message: "boom" } }),
  } as never;

  it("propagates the error instead of granting access", async () => {
    await expect(requireLeadership(broken, USER)).rejects.toThrow("boom");
  });
});

describe("privileged server functions keep their auth + role gates wired", () => {
  const read = (p: string) => readFileSync(resolve(process.cwd(), "src/lib", p), "utf8");

  const guarded = [
    "admin-notifications.functions.ts",
    "leadership-alerts.functions.ts",
    "ieps-admin.functions.ts",
    "ieps.functions.ts",
    "iep-drafts.functions.ts",
  ];

  for (const file of guarded) {
    it(`${file} requires an authenticated session`, () => {
      const src = read(file);
      const serverFns = src.match(/createServerFn\(/g)?.length ?? 0;
      expect(serverFns).toBeGreaterThan(0);
      const guards = src.match(/requireSupabaseAuth/g)?.length ?? 0;
      // one import + one middleware call per server function
      expect(guards).toBeGreaterThanOrEqual(serverFns);
    });
  }

  it("notification publish/delete are leadership gated", () => {
    const src = read("admin-notifications.functions.ts");
    expect(src).toMatch(/requireLeadership\([^)]*publish notifications/s);
    expect(src).toMatch(/requireLeadership\([^)]*delete notifications/s);
  });

  it("audit events are only ever appended through the hash-chained function", () => {
    const src = read("audit-server.ts") + read("audit-log.ts");
    expect(src).toMatch(/record_audit_event/);
    expect(src).not.toMatch(/from\(["']audit_events["']\)\s*\.\s*(insert|update|delete)/);
  });
});
