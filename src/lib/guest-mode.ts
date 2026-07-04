// Guest mode: anyone with the URL can enter the app in view-only mode.
// State lives in localStorage so it survives navigation without a Supabase session.
import { useSyncExternalStore, useEffect } from "react";
import { toast } from "sonner";

const KEY = "skoolmate.guest";
const EVT = "skoolmate:guest-changed";

export function isGuestActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function enterGuestMode(portal: "teacher" | "admin") {
  window.localStorage.setItem(KEY, "1");
  window.localStorage.setItem(`${KEY}.portal`, portal);
  window.dispatchEvent(new Event(EVT));
}

export function exitGuestMode() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(`${KEY}.portal`);
  window.dispatchEvent(new Event(EVT));
}

export function guestPortal(): "teacher" | "admin" | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(`${KEY}.portal`) as "teacher" | "admin" | null) ?? null;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useIsGuest(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isGuestActive(),
    () => false,
  );
}

// Words that indicate a mutating action. Buttons whose accessible text starts
// with one of these are blocked in guest mode.
const BLOCK_WORDS = [
  "save","create","add","delete","remove","approve","reject","update","upload",
  "submit","publish","generate","send","mark","attach","link","invite","assign",
  "promote","demote","archive","restore","import","export","sync","confirm",
  "enable","disable","apply","record","start","stop","end","clock","review",
];

function looksMutating(el: Element): boolean {
  if (el.getAttribute("data-guest-safe") === "true") return false;
  if (el.getAttribute("data-guest-block") === "true") return true;
  const txt = (el.textContent || "").trim().toLowerCase();
  if (!txt) return false;
  const first = txt.split(/\s+/)[0].replace(/[^a-z]/g, "");
  return BLOCK_WORDS.includes(first);
}

/**
 * Installs a capturing click / submit handler that blocks mutation actions when
 * guest mode is active. Read-only interactions (nav links, tabs, dialogs open,
 * expanders, search inputs) all pass through.
 */
export function useGuestReadOnlyGuard() {
  const guest = useIsGuest();
  useEffect(() => {
    if (!guest) return;
    let lastToast = 0;
    const notify = () => {
      const now = Date.now();
      if (now - lastToast < 1500) return;
      lastToast = now;
      toast.info("Guest view-only mode — changes are disabled. Sign in to make changes.");
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const btn = target.closest<HTMLElement>("button, [role='button'], a[data-guest-block='true']");
      if (!btn) return;
      // Ignore obvious safe controls
      const type = (btn.getAttribute("type") || "").toLowerCase();
      const role = (btn.getAttribute("role") || "").toLowerCase();
      if (["tab","menuitem","combobox","option","switch","checkbox"].includes(role)) return;
      if (btn.closest("[data-sidebar]") || btn.closest("nav") || btn.closest("[data-guest-safe='true']")) return;
      if (type === "submit" || looksMutating(btn)) {
        e.preventDefault();
        e.stopPropagation();
        notify();
      }
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (form?.getAttribute("data-guest-safe") === "true") return;
      e.preventDefault();
      e.stopPropagation();
      notify();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [guest]);
}
