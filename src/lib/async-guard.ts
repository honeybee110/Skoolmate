import { toast } from "sonner";

/** Default hard ceiling for any async/AI call (ms). */
export const DEFAULT_TIMEOUT_MS = 15_000;

export class TimeoutError extends Error {
  constructor(message = "This took too long and was cancelled. Please try again.") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Rejects with TimeoutError if `promise` hasn't settled within `ms`.
 * Note: this does not cancel the underlying work, it stops the UI waiting on it.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
  message?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isRetryable(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (/\b(400|401|403|404|409|422)\b/.test(message)) return false;
  if (message.includes("unauthor") || message.includes("forbidden") || message.includes("permission")) {
    return false;
  }
  return true;
}

/**
 * Runs `fn` with a per-attempt timeout and exponential backoff retries.
 * Non-retryable (client/auth) failures fail fast.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; timeoutMs?: number; baseDelayMs?: number; timeoutMessage?: string } = {},
): Promise<T> {
  const { retries = 1, timeoutMs = DEFAULT_TIMEOUT_MS, baseDelayMs = 600, timeoutMessage } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs, timeoutMessage);
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryable(error)) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

/**
 * Wraps an async operation with timeout, retries and user-facing status toasts.
 * Returns `undefined` instead of throwing so callers never hit an unhandled rejection.
 */
export async function runGuarded<T>(
  fn: () => Promise<T>,
  options: {
    loading?: string;
    success?: string | ((value: T) => string);
    error?: string;
    retries?: number;
    timeoutMs?: number;
  } = {},
): Promise<T | undefined> {
  const toastId = options.loading ? toast.loading(options.loading) : undefined;
  try {
    const value = await withRetry(fn, { retries: options.retries, timeoutMs: options.timeoutMs });
    if (options.success) {
      const text = typeof options.success === "function" ? options.success(value) : options.success;
      toast.success(text, toastId ? { id: toastId } : undefined);
    } else if (toastId) {
      toast.dismiss(toastId);
    }
    return value;
  } catch (error) {
    const text = errorMessage(error, options.error ?? "Something went wrong. Please try again.");
    toast.error(text, toastId ? { id: toastId } : undefined);
    return undefined;
  }
}
