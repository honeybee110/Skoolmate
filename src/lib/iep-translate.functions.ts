// AI translation of an approved IEP goal/text into a family's preferred
// language. Draft = AI generated; leadership/teachers can override before
// the parent downloads a PDF.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const IEP_LANGUAGES = [
  { code: "en",  label: "English" },
  { code: "zh",  label: "Chinese (Mandarin)" },
  { code: "am",  label: "Amharic" },
  { code: "cnh", label: "Hakka Chin" },
  { code: "pa",  label: "Punjabi" },
  { code: "ar",  label: "Arabic" },
  { code: "th",  label: "Thai" },
  { code: "vi",  label: "Vietnamese" },
] as const;
export type IepLanguageCode = typeof IEP_LANGUAGES[number]["code"];

const TranslateInput = z.object({
  language: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })).min(1).max(30),
});

const TranslationSchema = z.object({
  languageLabel: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })),
});

export const translateIepDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }) => {
    const languageLabel = IEP_LANGUAGES.find((l) => l.code === data.language)?.label ?? data.language;
    if (data.language === "en") return { languageLabel, sections: data.sections };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const payload = data.sections.map((s, i) => `#${i + 1} ${s.heading}\n${s.body}`).join("\n\n---\n\n");
    const prompt = `Translate the following Individual Education Plan (IEP) sections from English into ${languageLabel}.
- Preserve section numbering (#1, #2, …) and the "Heading" line first, body on the next lines.
- Use warm, plain, parent-friendly language (school context).
- Keep proper nouns (school, teacher, student names) untranslated.
- Return JSON matching the schema — never add extra commentary.

SECTIONS:
${payload}`;

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
      output: (await import("ai")).Output.object({ schema: TranslationSchema }),
    });
    return output;
  });
