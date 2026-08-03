// Client-safe conflict resolution for IEP matrix drafts.
// Merging is per cell, last-write-wins on the cell's own `updatedAt`, so two
// tabs editing different cells never overwrite each other's work.

export type DraftCell = { updatedAt?: string | null } & Record<string, unknown>;
export type DraftCells = Record<string, DraftCell>;

function time(cell: DraftCell | undefined): number {
  const t = cell?.updatedAt ? Date.parse(String(cell.updatedAt)) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Merges the server's copy with the local copy.
 * - A cell present in only one side is kept.
 * - A cell present in both resolves to the most recently edited version.
 */
export function mergeDraftCells(server: DraftCells, local: DraftCells): DraftCells {
  const out: DraftCells = { ...server };
  for (const [key, localCell] of Object.entries(local)) {
    const serverCell = server[key];
    if (!serverCell || time(localCell) >= time(serverCell)) out[key] = localCell;
  }
  return out;
}

/** Number of cells where the server copy won over a differing local copy. */
export function countConflicts(server: DraftCells, local: DraftCells, merged: DraftCells): number {
  let n = 0;
  for (const key of Object.keys(local)) {
    if (merged[key] !== local[key] && JSON.stringify(merged[key]) !== JSON.stringify(local[key])) n++;
  }
  return n;
}
