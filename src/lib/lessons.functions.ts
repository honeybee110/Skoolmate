import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const LessonInput = z.object({
  subject: z.string().min(1),
  strand: z.string().min(1),
  topic: z.string().min(1),
  duration: z.string().min(1),
  abilityRange: z.string().min(1),
  notes: z.string().optional().default(""),
});

const LessonSchema = z.object({
  title: z.string(),
  learningIntention: z.string(),
  successCriteria: z.array(z.string()),
  vcCode: z.string().describe("Victorian Curriculum 2.0 code e.g. VC2M2N01"),
  hook: z.string(),
  iDo: z.string(),
  weDo: z.string(),
  youDo: z.string(),
  differentiation: z.object({
    support: z.string(),
    extension: z.string(),
  }),
  aacSupports: z.array(z.string()),
  sensorySupports: z.array(z.string()),
  resources: z.array(z.object({ name: z.string(), source: z.string() })),
  assessment: z.string(),
});

export type GeneratedLesson = z.infer<typeof LessonSchema>;

export const generateLessonPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LessonInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const prompt = `Design a single lesson for an Australian Special Developmental School class.
Subject: ${data.subject}
Strand: ${data.strand}
Topic: ${data.topic}
Duration: ${data.duration}
Ability range: ${data.abilityRange}
Teacher notes: ${data.notes || "—"}

Align outcomes to Victorian Curriculum 2.0 (Towards Foundation Levels A–D where appropriate). Provide concrete, classroom-ready language. Include AAC, sensory and behaviour supports. Resources should be real (Twinkl, Topmarks, Starfall, Boardmaker, Canva, ABC Education).`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        output: Output.object({ schema: LessonSchema }),
      });
      return output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      if (msg.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(msg);
    }
  });
