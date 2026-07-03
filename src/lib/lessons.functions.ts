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
      // Graceful fallback — the model returned something we couldn't shape.
      // Return a draft skeleton so the teacher can still save/edit the lesson.
      if (msg.includes("No object generated") || msg.includes("did not match schema")) {
        return {
          title: data.topic,
          learningIntention: `We are learning about ${data.topic}.`,
          successCriteria: [
            "I can attempt the task with support.",
            "I can demonstrate one key skill.",
            "I can share what I learned.",
          ],
          vcCode: "VC2 — set on approval",
          hook: "Short warm-up / engagement routine linked to the topic.",
          iDo: "Teacher models the target skill with visuals and AAC.",
          weDo: "Guided small-group practice with adult and peer supports.",
          youDo: "Independent applied task with visual scaffolds.",
          differentiation: {
            support: "Reduce steps, use hand-over-hand, offer choice board.",
            extension: "Increase quantity, ask for reasoning, apply in a new context.",
          },
          aacSupports: ["Core-word board", "Symbol schedule"],
          sensorySupports: ["Movement break", "Fidget / weighted lap-pad"],
          resources: [
            { name: "Teacher-made visuals", source: "In-house" },
            { name: "Twinkl AU", source: "Twinkl" },
          ],
          assessment: "Observation checklist + one work sample per learner.",
        } satisfies GeneratedLesson;
      }
      if (msg.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(msg);
    }
  });
