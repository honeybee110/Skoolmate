// Local draft autosave for forms.
// Keeps an in-progress form on the device so a refresh, crash or accidental
// navigation never loses typing. Drafts are scoped per user + form key and are
// cleared once the form is successfully saved.
import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "skoolmate.form-draft.v1";
const DEBOUNCE_MS = 800;
/** Drafts older than this are ignored (and dropped) on load. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Stored<T> = { savedAt: string; value: T };

function storageKey(formKey: string, scope: string | undefined) {
  return `${PREFIX}:${scope ?? "anon"}:${formKey}`;
}

export function useFormDraft<T>(
  formKey: string,
  value: T,
  options: { scope?: string; enabled?: boolean; isEmpty?: (value: T) => boolean } = {},
) {
  const { scope, enabled = true, isEmpty } = options;
  const key = storageKey(formKey, scope);

  const [restored, setRestored] = useState<T | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read any existing draft once per key.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Stored<T>;
      if (Date.now() - Date.parse(parsed.savedAt) > MAX_AGE_MS) {
        window.localStorage.removeItem(key);
        return;
      }
      setRestored(parsed.value);
      setSavedAt(parsed.savedAt);
    } catch { /* ignore corrupt draft */ }
  }, [key, enabled]);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    setRestored(null);
    setSavedAt(null);
  }, [key]);

  const discard = useCallback(() => {
    setRestored(null);
    clear();
  }, [clear]);

  // Debounced write on every change.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (isEmpty?.(value)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const at = new Date().toISOString();
        window.localStorage.setItem(key, JSON.stringify({ savedAt: at, value } satisfies Stored<T>));
        setSavedAt(at);
      } catch { /* quota */ }
    }, DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [key, value, enabled, isEmpty]);

  return { restoredDraft: restored, draftSavedAt: savedAt, clearDraft: clear, discardDraft: discard };
}
