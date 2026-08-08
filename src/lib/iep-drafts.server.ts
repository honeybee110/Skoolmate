// Server-only helpers for IEP matrix draft autosave.
//
// Drafts are persistent per user (not per sign-in session), so work survives
// refreshes, navigation and signing out and back in.
export const PERSISTENT_SESSION_ID = "persistent";

export function sessionIdFrom(_claims: Record<string, unknown>, _userId: string): string {
  return PERSISTENT_SESSION_ID;
}

export function validateDraftInput(input: { cells: unknown; baseVersion?: unknown }) {
  if (!input || typeof input !== "object" || typeof input.cells !== "object" || input.cells === null) {
    throw new Error("Invalid draft payload");
  }
  const json = JSON.stringify(input.cells);
  if (json.length > 1_000_000) throw new Error("Draft is too large to autosave.");
  const baseVersion = typeof input.baseVersion === "number" ? input.baseVersion : 0;
  return { cells: input.cells as Record<string, unknown>, baseVersion };
}
