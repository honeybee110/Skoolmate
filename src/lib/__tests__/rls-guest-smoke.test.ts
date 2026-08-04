// RLS permission smoke tests — GUEST (unauthenticated / anon key) access.
//
// These hit the real Data API with only the publishable key, i.e. exactly what
// a signed-out visitor (or a scraper with the public key) can do. Every
// protected IEP, notification and audit-log surface must refuse both reads and
// writes. A regression in GRANTs or RLS policies fails these tests loudly.
import { describe, it, expect } from "vitest";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
const ANON_KEY =
  process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

const configured = Boolean(SUPABASE_URL && ANON_KEY);
const d = configured ? describe : describe.skip;

/** Anything other than 2xx means the guest was refused, which is what we want. */
function expectDenied(status: number, body: string, label: string) {
  expect(
    status >= 400,
    `${label} must be denied for guests, got HTTP ${status}: ${body.slice(0, 200)}`,
  ).toBe(true);
  // 401/403 = permission denied, 404 = function not exposed to anon at all.
  expect([401, 403, 404]).toContain(status);
}

async function guestFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY!,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return { status: res.status, body: await res.text() };
}

const PROTECTED_TABLES = [
  "iep_goals",
  "specialist_notes",
  "iep_matrix_drafts",
  "iep_override_audit",
  "admin_notifications",
  "audit_events",
  "user_roles",
  "profiles",
] as const;

d("RLS smoke: guest (anon) cannot read protected data", () => {
  for (const table of PROTECTED_TABLES) {
    it(`denies guest SELECT on ${table}`, async () => {
      const { status, body } = await guestFetch(`${table}?select=*&limit=1`);
      expectDenied(status, body, `SELECT ${table}`);
    });
  }
});

d("RLS smoke: guest (anon) cannot write protected data", () => {
  const writes: Array<[string, string, unknown]> = [
    [
      "iep_goals",
      "INSERT iep_goals",
      { id: "smoke-guest-goal", student_id: "s", student_name: "s", domain: "d", learning_area: "l", level: "A", learning_intention: "x", smart: "x", baseline: "x", status: "draft", approval: "pending", semester: "Semester 1 · 2026" },
    ],
    [
      "specialist_notes",
      "INSERT specialist_notes",
      { student_id: "s", goal_id: "g", specialist_role: "ot", specialist_name: "n", comment: "c", semester: "Semester 1 · 2026" },
    ],
    [
      "admin_notifications",
      "INSERT admin_notifications",
      { category: "smoke", title: "guest write", priority: "normal" },
    ],
    [
      "audit_events",
      "INSERT audit_events",
      { action: "smoke", entity_type: "test", hash: "deadbeef" },
    ],
    ["user_roles", "INSERT user_roles", { user_id: crypto.randomUUID(), role: "admin" }],
  ];

  for (const [table, label, payload] of writes) {
    it(`denies guest ${label}`, async () => {
      const { status, body } = await guestFetch(table, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expectDenied(status, body, label);
    });
  }

  it("denies guest UPDATE on iep_goals", async () => {
    const { status, body } = await guestFetch("iep_goals?id=eq.any", {
      method: "PATCH",
      body: JSON.stringify({ status: "achieved" }),
    });
    expectDenied(status, body, "UPDATE iep_goals");
  });

  it("denies guest DELETE on audit_events", async () => {
    const { status, body } = await guestFetch("audit_events?id=eq.00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });
    expectDenied(status, body, "DELETE audit_events");
  });
});

d("RLS smoke: guest cannot call privileged database functions", () => {
  const rpcs: Array<[string, Record<string, unknown>]> = [
    ["verify_audit_chain", {}],
    ["claim_founder_admin", {}],
    [
      "record_audit_event",
      { p_action: "smoke", p_entity_type: "test", p_entity_id: null, p_summary: null, p_metadata: {} },
    ],
    [
      "admin_update_cross_check_status",
      {
        p_goal_id: "g",
        p_criterion_index: 0,
        p_status: "achieved",
        p_active_semester: "all",
        p_reason: "smoke test",
      },
    ],
    [
      "admin_upsert_specialist_note",
      {
        p_note_id: null,
        p_goal_id: "g",
        p_student_id: "s",
        p_specialist_role: "ot",
        p_specialist_name: "n",
        p_semester: "Semester 1 · 2026",
        p_comment: "c",
        p_photo_hue: null,
        p_reason: "smoke test",
      },
    ],
    ["has_role", { _user_id: "00000000-0000-0000-0000-000000000000", _role: "admin" }],
  ];

  for (const [fn, args] of rpcs) {
    it(`denies guest rpc ${fn}`, async () => {
      const { status, body } = await guestFetch(`rpc/${fn}`, {
        method: "POST",
        body: JSON.stringify(args),
      });
      expectDenied(status, body, `rpc ${fn}`);
    });
  }
});
