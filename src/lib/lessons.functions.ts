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

/**
 * Weekly-planning narrative shape — modelled on the school's Sample Weekly
 * Planning document. Each session includes a narrative body written in the
 * "Learning Intention → Success Criteria → Hook → I do → We do → You do"
 * flow, rendered as running prose instead of dot points. Student names are
 * generic pseudonyms ("Student A", "Student B") for privacy.
 */
const SessionSchema = z.object({
  time: z.string().describe("Session time, e.g. 8:50 AM"),
  title: z.string().describe("Session title, e.g. 'Session 1 — Explore & Unpack' or 'Phonics — Letter /Hh/'"),
  narrative: z.string().describe(
    "A 4–7 sentence narrative describing the session as running prose. Must weave in Learning Intention, Success Criteria, Hook, I do, We do and You do in that order. Use generic learner names like 'Student A', 'Student B' — never real names.",
  ),
  resources: z.array(z.string()),
  groupsAndStaff: z.string(),
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
  narrative: z.string().describe(
    "A cohesive 6–10 sentence narrative version of the full lesson (LI → SC → Hook → I do → We do → You do) written as running prose, safe to paste into a weekly planning doc. Do not use real student names.",
  ),
  sessions: z.array(SessionSchema).describe("Weekly plan broken into daily sessions in narrative form."),
  differentiation: z.object({ support: z.string(), extension: z.string() }),
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
    const prompt = `Design a weekly lesson plan for an Australian Special Developmental School class, written in NARRATIVE form (running prose, not dot points).

Subject: ${data.subject}
Strand: ${data.strand}
Topic: ${data.topic}
Duration per session: ${data.duration}
Ability range: ${data.abilityRange}
Teacher notes: ${data.notes || "—"}

Rules:
- Align outcomes to Victorian Curriculum 2.0 (Towards Foundation Levels A–D where appropriate).
- Every narrative section must be written in flowing prose, weaving Learning Intention → Success Criteria → Hook → I do → We do → You do in that order.
- Populate 4–6 daily sessions (e.g. 8:50 AM Explore, 9:20 AM Start the Day, 9:40 AM Phonics, 10:00 AM Literacy, 12:30 PM Numeracy, 2:00 PM Personal Care) with realistic classroom times.
- Use generic pseudonyms like "Student A", "Student B" — NEVER real names.
- Include AAC, sensory and behaviour supports. Resources should be real (Twinkl, Topmarks, Starfall, Boardmaker, Canva, ABC Education).`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        output: Output.object({ schema: LessonSchema }),
      });
      return output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      if (msg.includes("No object generated") || msg.includes("did not match schema")) {
        return {
          title: data.topic,
          learningIntention: `We are learning about ${data.topic}.`,
          successCriteria: ["I can attempt the task with support.", "I can demonstrate one key skill.", "I can share what I learned."],
          vcCode: "VC2 — set on save",
          hook: "Short warm-up / engagement routine linked to the topic.",
          iDo: "Teacher models the target skill with visuals and AAC.",
          weDo: "Guided small-group practice with adult and peer supports.",
          youDo: "Independent applied task with visual scaffolds.",
          narrative: `This week the class explores ${data.topic}. The learning intention is that students engage with ${data.topic.toLowerCase()} at their own level; success looks like each learner attempting the task with support, demonstrating one key skill and sharing what they learned. The session opens with a short sensory hook linked to the topic, followed by the teacher modelling the target skill using visuals and AAC (I do). The class then practises together in a guided small group with adult and peer prompts (We do), before Student A, Student B and Student C complete an independent applied task with visual scaffolds (You do).`,
          sessions: [
            { time: "8:50 AM", title: "Session 1 — Explore & unpack", narrative: `We are learning to enter the classroom calmly and settle into routines. Success looks like Student A, Student B and Student C engaging with a chosen station and beginning to unpack their bag with support. The teacher sets up three sensory/movement stations as a hook. Staff model unpacking bags and using the visual schedule (I do), then support each learner 1:1 while others explore (We do). Students then transition to the group area independently, using cues and visuals (You do).`, resources: ["Sensory stations", "Visual schedule", "Labelled tubs"], groupsAndStaff: "Whole class · staff rove 1:1" },
            { time: "9:20 AM", title: "Session 2 — Start the day", narrative: `We are learning to join the group and get ready to learn. Success looks like each student joining the circle and participating in the check-in. The teacher invites students in with the 'Start the Day' visual (hook). Staff model expected sitting behaviour and AAC use (I do). The whole class works through 'Who is here?', weather and days of the week together (We do). Students then follow the visual schedule to move to the next activity (You do).`, resources: ["AAC boards", "Days of week cards", "IWB"], groupsAndStaff: "Whole class · ES supports Student A and Student B" },
          ],
          differentiation: { support: "Reduce steps, use hand-over-hand, offer choice board.", extension: "Increase quantity, ask for reasoning, apply in a new context." },
          aacSupports: ["Core-word board", "Symbol schedule"],
          sensorySupports: ["Movement break", "Fidget / weighted lap-pad"],
          resources: [{ name: "Teacher-made visuals", source: "In-house" }, { name: "Twinkl AU", source: "Twinkl" }],
          assessment: "Observation checklist + one work sample per learner.",
        } satisfies GeneratedLesson;
      }
      if (msg.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(msg);
    }
  });
