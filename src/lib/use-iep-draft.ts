// Autosaves the IEP matrix draft to the server and hydrates it on mount.
// Drafts are scoped server-side to the current sign-in session, so a new
// sign-in always shows an empty matrix on every tab and device.
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadIepDraft, saveIepDraft } from "@/lib/iep-drafts.functions";
import {
  useCurriculumStore, hydrateIepCells, type IepCellState,
} from "@/lib/curriculum-store";
import { useAuth } from "@/lib/auth-context";

export type DraftStatus = "idle" | "loading" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 1200;

export function useIepDraftAutosave() {
  const { cells } = useCurriculumStore();
  const { session } = useAuth();
  const load = useServerFn(loadIepDraft);
  const save = useServerFn(saveIepDraft);

  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const hydrated = useRef(false);
  const lastSaved = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once per sign-in session.
  useEffect(() => {
    if (!session || hydrated.current) return;
    let cancelled = false;
    setStatus("loading");
    load({ data: undefined })
      .then((res) => {
        if (cancelled) return;
        hydrated.current = true;
        lastSaved.current = JSON.stringify(res.cells ?? {});
        hydrateIepCells((res.cells ?? {}) as unknown as Record<string, IepCellState>);
        setSavedAt(res.updatedAt);
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        hydrated.current = true;
        setStatus("error");
      });
    return () => { cancelled = true; };
  }, [session, load]);

  // Debounced autosave on every change.
  useEffect(() => {
    if (!session || !hydrated.current) return;
    const serialised = JSON.stringify(cells);
    if (serialised === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("saving");
      save({ data: { cells: JSON.parse(serialised) } })
        .then((res) => {
          lastSaved.current = serialised;
          setSavedAt(res.savedAt);
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, SAVE_DEBOUNCE_MS);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [cells, session, save]);

  return { status, savedAt };
}
