import logoAsset from "@/assets/schoolmate-logo.png.asset.json";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const logoSize: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

const textSize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function BrandMark({
  size = "md",
  showText = true,
  tagline,
  className,
  textClassName,
}: {
  size?: Size;
  showText?: boolean;
  tagline?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={logoAsset.url}
        alt="SchoolMate AU logo"
        className={cn(logoSize[size], "object-contain")}
      />
      {showText && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-brand font-bold tracking-tight",
              textSize[size],
              textClassName,
            )}
          >
            SchoolMate AU
          </span>
          {tagline && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
