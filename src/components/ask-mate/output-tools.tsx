import { useState } from "react";
import {
  ArrowLeftRight,
  BadgeCheck,
  Baseline,
  Check,
  Copy,
  Languages,
  Maximize2,
  Minimize2,
  PencilLine,
  RefreshCw,
  Shuffle,
  Smile,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type OutputAction = {
  key: string;
  label: string;
  icon: typeof PencilLine;
  prompt: string;
};

const ACTIONS: OutputAction[] = [
  {
    key: "rewrite",
    label: "Rewrite",
    icon: PencilLine,
    prompt: "Rewrite your previous response. Keep all the facts and citations exactly the same, but improve the clarity and flow. Return the full rewritten version.",
  },
  {
    key: "shorter",
    label: "Make shorter",
    icon: Minimize2,
    prompt: "Make your previous response noticeably shorter. Keep every essential detail and citation, cut repetition and filler. Return the full shortened version.",
  },
  {
    key: "longer",
    label: "Make longer",
    icon: Maximize2,
    prompt: "Expand your previous response with more practical classroom detail, examples and supports. Do not invent workspace data — use your tools if you need more facts. Return the full expanded version.",
  },
  {
    key: "simplify",
    label: "Simplify language",
    icon: Baseline,
    prompt: "Rewrite your previous response in plain, simple English (around a Year 6 reading level). Short sentences, no jargon, explain any specialist terms. Return the full simplified version.",
  },
  {
    key: "professional",
    label: "Professional tone",
    icon: Briefcase,
    prompt: "Rewrite your previous response in a formal, professional tone suitable for school leadership and official documentation. Australian spelling. Return the full rewritten version.",
  },
  {
    key: "parent",
    label: "Parent-friendly",
    icon: Smile,
    prompt: "Rewrite your previous response as parent-facing text: warm, strengths-based, jargon-free, honest and easy to read for families. Return the full rewritten version.",
  },
  {
    key: "evidence",
    label: "Add evidence",
    icon: BadgeCheck,
    prompt: "Add supporting evidence to your previous response. Use your tools to pull real evidence from the workspace (documents, IEP goals, Entry Skills, SSG minutes, observations) and cite each source inline. Return the full version with the evidence included.",
  },
  {
    key: "another",
    label: "Another version",
    icon: Shuffle,
    prompt: "Produce a genuinely different alternative version of your previous response — a different structure, angle or set of activities — while meeting the same original request.",
  },
  {
    key: "regenerate",
    label: "Regenerate",
    icon: RefreshCw,
    prompt: "Regenerate your previous response from scratch. Re-check the workspace with your tools and give a fresh, improved answer to the same request.",
  },
];

const LANGUAGES = [
  "Vietnamese",
  "Arabic",
  "Simplified Chinese",
  "Punjabi",
  "Hindi",
  "Dari",
  "Somali",
  "Greek",
  "Turkish",
  "Auslan gloss (written)",
];

export function OutputTools({
  text,
  onAction,
  disabled,
  className,
}: {
  text: string;
  onAction: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy that output.");
    }
  };

  return (
    <div className={cn("mt-3 flex flex-wrap items-center gap-1.5", className)}>
      <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <ArrowLeftRight className="h-3 w-3" />
        Edit this output
      </span>

      {ACTIONS.map((a) => (
        <Button
          key={a.key}
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onAction(a.prompt)}
          className="h-7 rounded-full border-primary/20 bg-background/70 px-2.5 text-[11px] font-medium hover:border-primary/50 hover:bg-primary/5"
        >
          <a.icon className="h-3 w-3" />
          {a.label}
        </Button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            className="h-7 rounded-full border-primary/20 bg-background/70 px-2.5 text-[11px] font-medium hover:border-primary/50 hover:bg-primary/5"
          >
            <Languages className="h-3 w-3" />
            Translate
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang}
              onSelect={() =>
                onAction(
                  `Translate your previous response into ${lang}. Keep the meaning exact, keep formatting and headings, and keep names and dates unchanged. Return only the translation.`,
                )
              }
            >
              {lang}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onSelect={() =>
              onAction(
                "Translate your previous response into another language — ask me which language first if it is not clear from the conversation.",
              )
            }
          >
            Other language…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={copy}
        className="h-7 rounded-full px-2.5 text-[11px] font-medium text-muted-foreground"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
