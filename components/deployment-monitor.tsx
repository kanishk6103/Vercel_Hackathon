"use client"

import { useState } from "react"
import { Triangle, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { StatusPill } from "./status-pill"
import type { VercelDeployment } from "@/lib/vercel"

interface Summary {
  successful: number
  failed: number
  building: number
}

export function DeploymentMonitor({
  deployments,
  summary,
  configured,
  error,
}: {
  deployments: VercelDeployment[]
  summary: Summary
  configured: boolean
  error: string | null
}) {
  const [activeTab, setActiveTab] = useState<"deployments" | "activity">("deployments")

  return (
    <section
      aria-labelledby="deployments-heading"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Triangle className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 id="deployments-heading" className="text-sm font-semibold text-foreground">
              Vercel Deployments
            </h2>
            <p className="text-xs text-muted-foreground">
              Last {deployments.length || 10} deployments · production &amp; preview
            </p>
          </div>
        </div>
      </header>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
        <StatChip
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
          label={`${summary.successful} Successful`}
        />
        <StatChip
          icon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
          label={`${summary.failed} Failed`}
        />
        <StatChip
          icon={<Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
          label={`${summary.building} Building`}
        />
      </div>

      {/* Deployments list */}
      <ul className="divide-y divide-border">
        {!configured && (
          <li className="px-5 py-6">
            <EmptyState
              title="Vercel not configured"
              body="Set VERCEL_TOKEN_PROJ and VERCEL_PROJECT_ID_TARGET in .env.local to load deployments."
            />
          </li>
        )}
        {configured && error && (
          <li className="px-5 py-6">
            <EmptyState title="Couldn't load deployments" body={error} />
          </li>
        )}
        {configured && !error && deployments.length === 0 && (
          <li className="px-5 py-6">
            <EmptyState title="No deployments yet" body="Trigger a deploy to see it here." />
          </li>
        )}
        {deployments.map((d) => (
          <li key={d.id} className="px-5 py-3.5">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <StatusPill status={d.status} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-foreground">{d.target}</span>
                  <span className="font-mono text-xs text-muted-foreground">{d.branch}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-mono text-foreground/80">{d.sha}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate text-foreground/70">{d.message}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{d.timeAgo}</span>
                  <span aria-hidden="true">·</span>
                  <span>{d.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={d.author.avatar || "/placeholder.svg"} alt="" />
                  <AvatarFallback className="bg-secondary text-[10px] text-foreground">
                    {d.author.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {d.author.name}
                </span>
              </div>
            </div>

            {d.errorSummary && (
              <div className="mt-3 ml-0 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-red-200">{d.errorSummary}</p>
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-red-300 transition-colors hover:text-red-200"
                      >
                        View Logs →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Tab bar at bottom */}
      <div
        role="tablist"
        aria-label="Left column views"
        className="flex items-center gap-1 border-t border-border bg-card/60 px-3 py-2"
      >
        <TabButton
          label="Deployments"
          active={activeTab === "deployments"}
          onClick={() => setActiveTab("deployments")}
        />
        <TabButton
          label="Activity Feed"
          active={activeTab === "activity"}
          onClick={() => setActiveTab("activity")}
        />
      </div>
    </section>
  )
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground">
      {icon}
      {label}
    </span>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  )
}
