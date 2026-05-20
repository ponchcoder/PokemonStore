import { cn } from "@/lib/utils";

export type SetCodeBadgeSize = "sm" | "md" | "lg";

const sizeClass: Record<SetCodeBadgeSize, string> = {
  sm: "min-w-[2.75rem] px-2 py-0.5 text-[10px]",
  md: "min-w-[3rem] px-2 py-1 text-xs",
  lg: "min-w-[3.5rem] px-2.5 py-1.5 text-sm",
};

export type SetCodeBadgeProps = {
  code: string;
  size?: SetCodeBadgeSize;
  className?: string;
  title?: string;
};

/** Black rounded chip with a three-letter set code (SVI, PAL, …) */
export function SetCodeBadge({
  code,
  size = "md",
  className,
  title,
}: SetCodeBadgeProps) {
  const label = code.toUpperCase();
  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-950 font-mono font-bold tracking-wider text-white tabular-nums",
        sizeClass[size],
        className
      )}
    >
      {label}
    </span>
  );
}

export type SetCodeChipProps = {
  code: string;
  name: string;
  size?: SetCodeBadgeSize;
  className?: string;
  /** Badge left + name right */
  layout?: "inline" | "stacked";
};

/** Badge plus full set name — for filter rows, tooltips, card details */
export function SetCodeChip({
  code,
  name,
  size = "md",
  className,
  layout = "inline",
}: SetCodeChipProps) {
  if (layout === "stacked") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-1", className)}
      >
        <SetCodeBadge code={code} size={size} title={name} />
        <span className="max-w-[11rem] text-center text-xs text-muted-foreground">
          {name}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <SetCodeBadge code={code} size={size} title={name} />
      <span className="min-w-0 truncate text-sm">{name}</span>
    </span>
  );
}
