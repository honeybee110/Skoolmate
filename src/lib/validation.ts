// Shared input sanitisation + Zod helpers.
// Everything a user types is sanitised before it is validated or persisted.
import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;

/** Strips HTML tags and control characters, collapses whitespace, trims. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL_CHARS, "")
    .replace(HTML_TAGS, "")
    .replace(/[ \t\u00A0]+/g, " ")
    .trim();
}

/** Same as sanitizeText but keeps line breaks (for textareas). */
export function sanitizeMultiline(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL_CHARS, "")
    .replace(HTML_TAGS, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A single-line string field: sanitised, then length-checked. */
export const shortText = (max = 200, label = "This field") =>
  z.preprocess(sanitizeText, z.string().max(max, { message: `${label} must be ${max} characters or fewer.` }));

/** A required single-line string field. */
export const requiredText = (max = 200, label = "This field") =>
  z.preprocess(
    sanitizeText,
    z
      .string()
      .min(1, { message: `${label} is required.` })
      .max(max, { message: `${label} must be ${max} characters or fewer.` }),
  );

/** A multi-line string field (textarea). */
export const longText = (max = 5000, label = "This field") =>
  z.preprocess(sanitizeMultiline, z.string().max(max, { message: `${label} must be ${max} characters or fewer.` }));

/** ISO date (yyyy-mm-dd), empty string allowed. */
export const isoDate = (label = "Date") =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, { message: `${label} must be a valid date.` }),
  );

/** Returns the first human-readable message from a Zod error. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the highlighted fields.";
}

/** Parses with a schema and returns either data or a friendly message. */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; message: string } {
  const result = schema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, message: firstIssue(result.error) };
}

/** Escapes a value before putting it in a URL (external links, mailto, etc.). */
export function safeUrlParam(value: string): string {
  return encodeURIComponent(sanitizeText(value));
}
