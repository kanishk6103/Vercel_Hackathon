import { cn } from "@/lib/utils"

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW"

const styles: Record<RiskLevel, string> = {
  HIGH: "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30",
  LOW: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[level],
        className,
      )}
      aria-label={`Merge risk: ${level.toLowerCase()}`}
    >
      {level}
    </span>
  )
}
