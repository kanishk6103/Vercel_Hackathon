import { GitPullRequest } from "lucide-react"
import { PRCard } from "./pr-card"
import type { GitHubPR } from "@/lib/github"

const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const

export function PRIntelligence({
  prs,
  configured,
  error,
}: {
  prs: GitHubPR[]
  configured: boolean
  error: string | null
}) {
  const sorted = [...prs].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])
  const topPr = sorted[0]?.id

  return (
    <section
      aria-labelledby="pr-intel-heading"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <GitPullRequest className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 id="pr-intel-heading" className="text-sm font-semibold text-foreground">
              Pull Request Intelligence
            </h2>
            <p className="text-xs text-muted-foreground">Sorted by merge risk</p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {sorted.length} open
        </span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {!configured && (
          <EmptyState
            title="GitHub not configured"
            body="Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env.local to load pull requests."
          />
        )}
        {configured && error && (
          <EmptyState title="Couldn't load pull requests" body={error} />
        )}
        {configured && !error && sorted.length === 0 && (
          <EmptyState title="No open pull requests" body="You're all caught up." />
        )}
        {sorted.map((pr) => (
          <PRCard key={pr.id} pr={pr} defaultExpanded={pr.id === topPr} />
        ))}
      </div>
    </section>
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
