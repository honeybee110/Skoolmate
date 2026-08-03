import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { sanitizeText, sanitizeMultiline } from "@/lib/validation";

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
  learningArea: z.preprocess(sanitizeText, z.string().min(1).max(80)),
  strand: z.preprocess(sanitizeText, z.string().max(120)).optional().default(""),
  topic: z.preprocess(sanitizeText, z.string().min(1).max(200)),
  duration: z.preprocess(sanitizeText, z.string().min(1).max(40)),
  /** Ability levels present in the group, e.g. ["B","C","D"]. */
  levels: z.array(z.string()).min(1),
  entrySkills: z.array(z.preprocess(sanitizeText, z.string().max(300))).max(30).optional().default([]),
  notes: z.preprocess(sanitizeMultiline, z.string().max(2000)).optional().default(""),
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
  entrySkillAlignment: z
    .array(
      z.object({
        level: z.string().describe("Ability level, e.g. B"),
        entrySkill: z.string().describe("The entry skill, quoted from the list supplied."),
        activity: z.string().describe("The exact activity in this lesson that works on that entry skill, 1–2 sentences."),
      }),
    )
    .describe("One row per supplied entry skill, tying it to a concrete activity in this lesson."),
  resources: z.array(z.string()).describe("Concrete, nameable resources including AAC, sensory and staffing needs."),
  sensorySupports: z.array(z.string()).describe("Named sensory supports and regulation strategies with when to use them."),
  communicationSupports: z.array(z.string()).describe("AAC devices, core words to model, key signs, scripts and prompts."),
  visuals: z.array(z.string()).describe("Specific visuals to print or set up (now/next, first/then, task strips, symbol cards)."),
  assessmentEvidence: z.array(z.string()).describe("What staff collect as evidence and how it is recorded."),
  extension: z.array(z.string()).describe("Extension activities for learners who master the criteria early."),
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
    entrySkillAlignment: data.entrySkills.slice(0, 6).map((s) => ({
      level: levels[0] ?? "C",
      entrySkill: s,
      activity: "Worked on during WE DO at the small-group table with the least prompt needed.",
    })),
    resources: ["Visual schedule", "Core-word AAC board", "Topic photo cards", "Sensory regulation kit", "1 teacher + 2 ES"],
    sensorySupports: [
      "Wobble cushion and weighted lap pad available at the table from the start of the session.",
      "Movement break after I DO — 2 minutes of heavy work (carry the resource tub, wall pushes).",
      "Ear defenders on the shelf; offer before the group song, not after distress.",
    ],
    communicationSupports: [
      "Model core words 'more', 'stop', 'go', 'my turn' on the classroom board every turn.",
      "Aided language display for the topic on each table.",
      "Key Word Sign for 'finished' and 'help' used by all staff.",
    ],
    visuals: ["Now/Next board", "First–Then card for the YOU DO task", "Task strip with 3 steps and a finished box", "Choice board with 2 options"],
    assessmentEvidence: [
      "Tick sheet against the success criteria — independent / gestural / verbal / physical prompt.",
      "Two photos or a 20-second video of each learner during YOU DO uploaded to Evidence.",
      "Work sample kept for learners at Level D.",
    ],
    extension: [
      "Apply the skill to a second example in a different setting (corridor, kitchen).",
      "Learner models the step to a peer with staff supervision.",
    ],
    flow: {
      hook: `Open with a 3–5 minute high-engagement hook linked to ${data.topic}. Gather the group on the mat with the visual schedule showing "${data.topic}". Introduce a mystery bag or short song and invite each learner to touch, look at or activate the object. Staff narrate what learners do ("Student A is holding the ___"). Finish by showing the learning intention card and reading it aloud with symbol support.`,
      iDo: `Teacher models the target skill explicitly while thinking aloud. Break the skill into no more than three steps, showing each one twice with the same wording. Use the IWB or a large model so all learners can see. ES staff sit beside Level B learners and support attending with hand-under-hand and AAC modelling. End the model by restating the success criteria.`,
      weDo: `Guided practice with the whole group, then in small groups. Staff prompt each learner in turn and fade from full physical to gestural to verbal prompts as confidence grows. Rotate through the three groups so every learner has at least two guided turns. Use the AAC board to model comments and choices throughout.`,
      youDo: `Each learner completes an applied task at their level with a visual checklist. Staff step back and record what learners do independently, offering the least prompt necessary. Learners who finish early apply the skill to a second example or teach a peer.`,
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
7. Lesson Flow: HOOK, I DO, WE DO, YOU DO, REFLECTION (the plan ends with REFLECTION — do NOT include a cool down, review or assessment section)

ALSO produce, as separate fields:
- entrySkillAlignment: one row for EVERY entry skill listed above. Quote the entry skill, give its level, and name the exact activity in THIS lesson that works on it (which part of the flow, what the learner physically does, what staff do). If no entry skills were supplied, write rows for typical Level A–D entry skills for this topic.
- sensorySupports: named regulation supports and WHEN they are used (before the mat session, movement break after I DO, etc.) — wobble cushion, weighted lap pad, ear defenders, heavy work, chew tool, dimmed lights, proprioceptive input.
- communicationSupports: the AAC systems in the room, the exact core words staff model, key word signs, choice-making formats, wait time, and scripts for non-speaking learners.
- visuals: what to actually print or set up — now/next board, first–then card, 3-step task strip with a finished box, symbol choice board, visual timer, labelled work bins.
- assessmentEvidence: what staff collect and how — prompt-level tick sheet against the success criteria, photo/video for the Evidence hub, work samples, anecdotal note format.
- extension: what learners who nail it early do next — same skill in a new setting, generalisation to a second material, peer modelling, one more step of the task analysis.

Style rules — non-negotiable:
- Every Lesson Flow step is 5–8 sentences of running prose. NEVER bullet-point summaries, never generic filler.
- Write like an experienced SDS classroom teacher writing for the ES team who will teach it tomorrow. Practical, concrete, staffroom language.
- BANNED phrases: "engage students in meaningful learning", "foster a love of", "holistic development", "21st century skills", "leverage", "scaffold learning experiences", "diverse learners", "rich learning opportunities", "empower". If a sentence could appear in any lesson on any topic, rewrite it with the actual materials, room set-up and words staff say.
- Name real classroom things: laminated symbols, Velcro, the sink, the mat, the trolley, Boardmaker, Proloquo2Go, the sand tray, the timer on the IWB.
- Include exact teacher scripting in quotes, timing, staffing (teacher / ES), prompt hierarchy (physical → gestural → verbal → independent), AAC and sensory supports, and transitions.
- Differentiate explicitly for each selected ability level; the differentiation array must contain one entry per level, and each must say what the learner does, what support they get and what "done" looks like.
- Use generic learner names ("Student A", "Student B") — never real names.
- For Literacy, use Colourful Semantics colour coding where relevant (WHO orange · doing yellow · WHAT green · WHERE blue · WHEN purple).
- For Personal Care and Sensory Learning, plan around routine, dignity, regulation, task analysis and backward chaining rather than academic outcomes.
- Australian spelling and Victorian Curriculum 2.0 terminology throughout.`;

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5.6-sol"),
        prompt,
        output: Output.object({ schema: LessonSchema }),
        providerOptions: { lovable: { reasoningEffort: "none" } },
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
