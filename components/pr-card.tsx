"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, FileDiff, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { RiskBadge } from "./risk-badge"
import type { GitHubPR } from "@/lib/github"

export function PRCard({ pr, defaultExpanded }: { pr: GitHubPR; defaultExpanded?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultExpanded))
  const isHigh = pr.risk === "HIGH"

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-card",
        isHigh && "border-l-2 border-l-primary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground text-pretty">
            {pr.title}{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">{pr.number}</span>
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={pr.author.avatar || "/placeholder.svg"} alt="" />
              <AvatarFallback className="bg-secondary text-[10px] text-foreground">
                {pr.author.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{pr.author.name}</span>
            <span aria-hidden="true">·</span>
            <span>{pr.timeAgo}</span>
          </div>
        </div>
        <RiskBadge level={pr.risk} />
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Summary
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {open && (
          <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {pr.summary}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileDiff className="h-3.5 w-3.5" aria-hidden="true" />
            {pr.filesChanged} {pr.filesChanged === 1 ? "file" : "files"}
          </span>
          <span className="font-mono text-emerald-400">+{pr.linesAdded}</span>
          <span className="font-mono text-red-400">-{pr.linesRemoved}</span>
        </div>
        <Link
          href={`/pr/${pr.number.replace(/^#/, "")}`}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          View Diff →
        </Link>
      </div>
    </article>
  )
}
