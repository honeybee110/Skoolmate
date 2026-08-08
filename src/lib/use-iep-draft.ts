// Offline-tolerant autosave for the IEP matrix draft.
//
// - Hydrates the server draft on mount (server enforces a fresh matrix per sign-in).
// - Debounced autosave; while offline, edits are queued locally and flushed on reconnect.
// - Optimistic concurrency: every save carries the version the tab last saw. A stale
//   version returns the server copy, which is merged per cell (last write wins on that
//   cell) and re-saved, so simultaneous edits from multiple tabs never clobber each other.
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadIepDraft, saveIepDraft } from "@/lib/iep-drafts.functions";
import { mergeDraftCells, type DraftCells } from "@/lib/iep-draft-merge";
import {
  useCurriculumStore, hydrateIepCells, getIepCells, type IepCellState,
} from "@/lib/curriculum-store";
import { useAuth } from "@/lib/auth-context";

export type DraftStatus = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

const SAVE_DEBOUNCE_MS = 1200;
const RETRY_MS = 15_000;
const PENDING_KEY = "skoolmate.iep-draft.pending.v1";

function readPending(): DraftCells | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as DraftCells) : null;
  } catch { return null; }
}

function writePending(cells: DraftCells | null) {
  if (typeof window === "undefined") return;
  try {
    if (cells) window.localStorage.setItem(PENDING_KEY, JSON.stringify(cells));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch { /* quota */ }
}

export function useIepDraftAutosave() {
  const { cells } = useCurriculumStore();
  const { session } = useAuth();
  const load = useServerFn(loadIepDraft);
  const save = useServerFn(saveIepDraft);

  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pendingOffline, setPendingOffline] = useState(false);
  const [conflictsResolved, setConflictsResolved] = useState(0);

  const hydrated = useRef(false);
  const version = useRef(0);
  const lastSaved = useRef<string>("");
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Pushes the current local cells to the server, merging on conflict. */
  const flush = useCallback(async () => {
    if (!hydrated.current || inFlight.current) return;
    let local = getIepCells() as unknown as DraftCells;
    const serialised = JSON.stringify(local);
    if (serialised === lastSaved.current) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      writePending(local);
      setPendingOffline(true);
      setStatus("offline");
      return;
    }

    inFlight.current = true;
    setStatus("saving");
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await save({ data: { cells: local as never, baseVersion: version.current } });
        if (res.ok) {
          version.current = res.version;
          lastSaved.current = JSON.stringify(local);
          writePending(null);
          setPendingOffline(false);
          setSavedAt(res.savedAt);
          setStatus("saved");
          return;
        }
        // Conflict: another tab wrote first. Merge cell-by-cell and retry.
        const merged = mergeDraftCells((res.serverCells ?? {}) as DraftCells, local);
        const changed = JSON.stringify(merged) !== JSON.stringify(local);
        version.current = res.version;
        local = merged;
        hydrateIepCells(merged as unknown as Record<string, IepCellState>);
        if (changed) setConflictsResolved((n) => n + 1);
      }
      setStatus("error");
    } catch {
      // Network/server failure — keep the work locally and retry later.
      writePending(local);
      setPendingOffline(true);
      setStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
    } finally {
      inFlight.current = false;
    }
  }, [save]);

  // Hydrate once per sign-in session, replaying anything queued while offline.
  useEffect(() => {
    if (!session || hydrated.current) return;
    let cancelled = false;
    setStatus("loading");
    load({ data: undefined })
      .then((res) => {
        if (cancelled) return;
        const server = (res.cells ?? {}) as DraftCells;
        const queued = readPending();
        const localNow = getIepCells() as unknown as DraftCells;
        // Keep whichever copy of each cell was edited most recently.
        let next = mergeDraftCells(server, localNow);
        if (queued) next = mergeDraftCells(next, queued);
        version.current = res.version ?? 0;
        lastSaved.current = JSON.stringify(server);
        hydrated.current = true;
        hydrateIepCells(next as unknown as Record<string, IepCellState>);
        setSavedAt(res.updatedAt);
        setStatus("idle");
        if (JSON.stringify(next) !== lastSaved.current) void flush();
      })

      .catch(() => {
        if (cancelled) return;
        // Offline at sign-in: keep working from whatever is cached locally.
        hydrated.current = true;
        const queued = readPending();
        if (queued) hydrateIepCells(queued as unknown as Record<string, IepCellState>);
        setPendingOffline(Boolean(queued));
        setStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
      });
    return () => { cancelled = true; };
  }, [session, load, flush]);

  // Debounced autosave on every change.
  useEffect(() => {
    if (!session || !hydrated.current) return;
    if (JSON.stringify(cells) === lastSaved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, SAVE_DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [cells, session, flush]);

  // Reconnect + periodic retry while anything is queued.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => { void flush(); };
    const onOffline = () => {
      writePending(getIepCells() as unknown as DraftCells);
      setPendingOffline(true);
      setStatus("offline");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const id = setInterval(() => { if (pendingOffline) void flush(); }, RETRY_MS);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(id);
    };
  }, [flush, pendingOffline]);

  // Last-ditch save when the tab is hidden or closed.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        writePending(getIepCells() as unknown as DraftCells);
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  return { status, savedAt, pendingOffline, conflictsResolved };
}
