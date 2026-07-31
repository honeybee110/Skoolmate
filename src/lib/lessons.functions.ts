import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/** The seven learning areas the planner supports. */
export const LEARNING_AREAS = [
  "Literacy",
  "Numeracy",
  "Geography",
  "History",
  "Science",
  "Personal Care",
  "Sensory Learning",
] as const;
export type LearningArea = (typeof LEARNING_AREAS)[number];

const LessonInput = z.object({
  learningArea: z.string().min(1),
  strand: z.string().optional().default(""),
  topic: z.string().min(1),
  duration: z.string().min(1),
  /** Ability levels present in the group, e.g. ["B","C","D"]. */
  levels: z.array(z.string()).min(1),
  entrySkills: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
});

/**
 * Specialist-school planner shape. Sections are produced in a fixed order:
 * Learning Area → Topic → Learning Intention → Success Criteria →
 * VC / Entry Skills alignment → Resources → Lesson Flow
 * (HOOK, I DO, WE DO, YOU DO, REFLECTION).
 * Every flow step is written as detailed, teacher-ready prose — never a
 * bullet-point summary.
 */
const FlowStep = z.string().describe(
  "Detailed teacher-ready prose (5–8 sentences). Include exact teacher language in quotes, timing, staffing, AAC/visual supports and what learners physically do. Not a bullet summary.",
);

const LessonSchema = z.object({
  learningArea: z.string(),
  topic: z.string(),
  title: z.string(),
  duration: z.string(),
  learningIntention: z.string().describe("Single 'We are learning to…' statement."),
  successCriteria: z.array(z.string()).describe("3–5 'I can…' statements pitched across the selected levels."),
  vcCode: z.string().describe("Victorian Curriculum 2.0 code, e.g. VC2M2N01"),
  alignment: z.string().describe(
    "Prose paragraph naming the VC 2.0 strand/content description and how the lesson maps onto the students' Entry Skills at each selected level.",
  ),
  resources: z.array(z.string()).describe("Concrete, nameable resources including AAC, sensory and staffing needs."),
  flow: z.object({
    hook: FlowStep,
    iDo: FlowStep,
    weDo: FlowStep,
    youDo: FlowStep,
    reflection: FlowStep,
  }),
  differentiation: z.array(
    z.object({
      level: z.string().describe("Ability level, e.g. B"),
      activity: z.string().describe("2–4 sentences describing exactly what a learner at this level does, with prompts and supports."),
    }),
  ),
});

export type GeneratedLesson = z.infer<typeof LessonSchema>;

function fallbackPlan(data: z.infer<typeof LessonInput>): GeneratedLesson {
  const levels = data.levels;
  const step = (label: string, body: string) => `${body}`;
  void step;
  return {
    learningArea: data.learningArea,
    topic: data.topic,
    title: `${data.learningArea} — ${data.topic}`,
    duration: data.duration,
    learningIntention: `We are learning to engage with ${data.topic.toLowerCase()} in ${data.learningArea.toLowerCase()}.`,
    successCriteria: [
      "I can attend to the activity with adult support.",
      "I can attempt the target skill with a visual or AAC prompt.",
      "I can show my response to a peer or staff member.",
    ],
    vcCode: "VC2 — confirm on save",
    alignment: `This lesson sits within the ${data.learningArea} curriculum and targets ${data.topic}. Entry skills for Level ${levels.join(", Level ")} are used as the starting point, so each learner works on the next criterion in their sequence rather than a single shared task.`,
    resources: ["Visual schedule", "Core-word AAC board", "Topic photo cards", "Sensory regulation kit", "1 teacher + 2 ES"],
    flow: {
      hook: `Open with a 3–5 minute high-engagement hook linked to ${data.topic}. Gather the group on the mat with the visual schedule showing "${data.topic}". Introduce a mystery bag or short song and invite each learner to touch, look at or activate the object. Staff narrate what learners do ("Student A is holding the ___"). Finish by showing the learning intention card and reading it aloud with symbol support.`,
      iDo: `Teacher models the target skill explicitly while thinking aloud. Break the skill into no more than three steps, showing each one twice with the same wording. Use the IWB or a large model so all learners can see. ES staff sit beside Level B learners and support attending with hand-under-hand and AAC modelling. End the model by restating the success criteria.`,
      weDo: `Guided practice with the whole group, then in small groups. Staff prompt each learner in turn and fade from full physical to gestural to verbal prompts as confidence grows. Rotate through the three groups so every learner has at least two guided turns. Use the AAC board to model comments and choices throughout.`,
      youDo: `Each learner completes an applied task at their level with a visual checklist. Staff step back and record what learners do independently, offering the least prompt necessary. Learners who finish early apply the skill to a second example or teach a peer.`,
      coolDown: `Bring the group back together for a 5-minute review. Revisit the learning intention card and ask each learner to show or say one thing they did, using AAC, photos or work samples. Preview the next lesson and use a calming sensory routine (breathing, dim lights, quiet music) before transitioning.`,
      assessment: `Collect evidence against the three success criteria using the observation checklist and one work-sample photo per learner. Record the prompt level used (independent / gestural / verbal / physical). Upload evidence to the student's IEP goal in the Evidence Hub the same day.`,
      reflection: `Teacher notes: which learners met the criteria independently, which supports were most effective, and whether the pitch was right for each level. Record any regulation or behaviour patterns and adjust groupings, prompts or resources for the next session.`,
    },
    differentiation: levels.map((level) => ({
      level,
      activity:
        level === "B"
          ? "Works hand-under-hand with an ES to attend to the materials and make a two-option choice using objects or symbols. Success is participation and a consistent response."
          : level === "C"
            ? "Completes the task with a visual scaffold and a one-step verbal prompt, showing the response on an AAC board or work mat."
            : "Completes the task independently, then explains their thinking in one or two sentences and self-checks against the success criteria.",
    })),
  };
}

export const generateLessonPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LessonInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return fallbackPlan(data);

    const gateway = createLovableAiGatewayProvider(key);
    const prompt = `You are an experienced teacher in an Australian Specialist / Special Developmental School (Victoria). Write ONE detailed, teacher-ready lesson planner that a staff member could teach directly from, with no further preparation.

Learning Area: ${data.learningArea}
Strand / focus: ${data.strand || "—"}
Topic: ${data.topic}
Lesson duration: ${data.duration}
Student ability levels in the group: Level ${data.levels.join(", Level ")}
Known entry skills for these learners:
${data.entrySkills.length ? data.entrySkills.map((s) => `- ${s}`).join("\n") : "- (use typical Towards Foundation Level A–D entry skills)"}
Teacher notes: ${data.notes || "—"}

MANDATORY STRUCTURE — produce these sections, in this order:
1. Learning Area
2. Topic
3. Learning Intention ("We are learning to…")
4. Success Criteria ("I can…", 3–5, pitched across the selected levels)
5. Victorian Curriculum 2.0 / Entry Skills alignment (name the code and content description, and explain the entry-skill mapping per level)
6. Resources (specific and nameable, including AAC, sensory and staffing)
7. Lesson Flow: HOOK, I DO, WE DO, YOU DO, COOL DOWN / REVIEW, ASSESSMENT, REFLECTION

Style rules — non-negotiable:
- Every Lesson Flow step is 5–8 sentences of running prose. NEVER bullet-point summaries, never generic filler.
- Include exact teacher scripting in quotes, timing, staffing (teacher / ES), prompt hierarchy (physical → gestural → verbal → independent), AAC and sensory supports, and transitions.
- Differentiate explicitly for each selected ability level; the differentiation array must contain one entry per level.
- Use generic learner names ("Student A", "Student B") — never real names.
- For Literacy, use Colourful Semantics colour coding where relevant (WHO orange · doing yellow · WHAT green · WHERE blue · WHEN purple).
- For Personal Care and Sensory Learning, plan around routine, dignity, regulation, task analysis and backward chaining rather than academic outcomes.
- Australian spelling and Victorian Curriculum 2.0 terminology throughout.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        output: Output.object({ schema: LessonSchema }),
      });
      return output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      if (msg.includes("No object generated") || msg.includes("did not match schema")) return fallbackPlan(data);
      if (msg.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(msg);
    }
  });
