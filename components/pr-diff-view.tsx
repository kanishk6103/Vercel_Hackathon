"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, ChevronDown, FileDiff, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { RiskBadge, type RiskLevel } from "./risk-badge"
import type { PullRequestFile } from "@/lib/github"

interface PRMeta {
  number: number
  title: string
  body: string
  url: string
  author: string
  authorAvatar?: string
  additions: number
  deletions: number
  changedFiles: number
  headBranch?: string
  baseBranch?: string
  risk: RiskLevel
}

export function PRDiffView({
  pr,
  files,
  error,
}: {
  pr: PRMeta | null
  files: PullRequestFile[]
  error: string | null
}) {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to dashboard
      </Link>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {pr && (
        <>
          <header className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold leading-snug text-foreground text-pretty">
                  {pr.title}{" "}
                  <span className="font-mono text-sm font-normal text-muted-foreground">
                    #{pr.number}
                  </span>
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={pr.authorAvatar} alt="" />
                    <AvatarFallback className="bg-secondary text-[10px] text-foreground">
                      {pr.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground/80">{pr.author}</span>
                  {pr.headBranch && pr.baseBranch && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        {pr.headBranch} → {pr.baseBranch}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={pr.risk} />
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Open on GitHub
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileDiff className="h-3.5 w-3.5" aria-hidden="true" />
                {pr.changedFiles} {pr.changedFiles === 1 ? "file" : "files"}
              </span>
              <span className="font-mono text-emerald-400">+{pr.additions}</span>
              <span className="font-mono text-red-400">-{pr.deletions}</span>
            </div>

            {pr.body && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Description
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-foreground/85">
                  {pr.body}
                </p>
              </div>
            )}
          </header>

          <h2 className="mt-6 mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Files changed ({files.length})
          </h2>

          <div className="flex flex-col gap-3">
            {files.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No file changes returned.
              </div>
            )}
            {files.map((f, i) => (
              <FileDiffCard key={f.filename} file={f} defaultOpen={i < 3} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FileDiffCard({ file, defaultOpen }: { file: PullRequestFile; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="truncate font-mono text-xs text-foreground">{file.filename}</span>
          <StatusBadge status={file.status} />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="font-mono text-emerald-400">+{file.additions}</span>
          <span className="font-mono text-red-400">-{file.deletions}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-background/40">
          {file.patch ? (
            <DiffPatch patch={file.patch} />
          ) : (
            <p className="px-4 py-4 text-xs italic text-muted-foreground">
              No patch available (binary file or too large to display).
            </p>
          )}
        </div>
      )}
    </article>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    added: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    modified: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    removed: "bg-red-500/15 text-red-400 ring-red-500/30",
    renamed: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  }
  const cls = map[status] ?? "bg-secondary text-muted-foreground ring-border"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        cls,
      )}
    >
      {status}
    </span>
  )
}

function DiffPatch({ patch }: { patch: string }) {
  const lines = patch.split("\n")
  return (
    <pre className="overflow-x-auto py-2 font-mono text-[12px] leading-relaxed">
      {lines.map((line, i) => {
        let cls = "text-foreground/80"
        if (line.startsWith("@@")) cls = "text-blue-400 bg-blue-500/5"
        else if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-emerald-300 bg-emerald-500/8"
        else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-red-300 bg-red-500/8"
        else if (line.startsWith("+++") || line.startsWith("---")) cls = "text-muted-foreground"
        return (
          <div key={i} className={cn("px-4", cls)}>
            <span>{line || " "}</span>
          </div>
        )
      })}
    </pre>
  )
}
