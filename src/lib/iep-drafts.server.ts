// Server-only helpers for IEP matrix draft autosave.
export function sessionIdFrom(claims: Record<string, unknown>, userId: string): string {
  const sid = claims["session_id"];
  return typeof sid === "string" && sid ? sid : `nosession:${userId}`;
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
