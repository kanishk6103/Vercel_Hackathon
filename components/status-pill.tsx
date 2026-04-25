import { cn } from "@/lib/utils"

export type DeploymentStatus = "READY" | "ERROR" | "BUILDING" | "CANCELLED"

const styles: Record<DeploymentStatus, string> = {
  READY: "bg-emerald-500 text-white",
  ERROR: "bg-red-500 text-white",
  BUILDING: "bg-amber-500 text-zinc-950 animate-pulse",
  CANCELLED: "bg-zinc-600 text-white",
}

export function StatusPill({
  status,
  className,
}: {
  status: DeploymentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[status],
        className,
      )}
      aria-label={`Status: ${status.toLowerCase()}`}
    >
      {status}
    </span>
  )
}
