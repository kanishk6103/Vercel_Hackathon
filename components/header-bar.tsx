import { Shield, ChevronDown, GitBranch } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function HeaderBar({ owner, repo }: { owner?: string; repo?: string }) {
  const hasRepo = Boolean(owner && repo)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">Engineering Copilot</span>
            <span className="hidden rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-flex">
              beta
            </span>
          </div>
        </div>

        <div className="ml-2 hidden items-center gap-2 md:flex">
          <a
            href={hasRepo ? `https://github.com/${owner}/${repo}` : undefined}
            target={hasRepo ? "_blank" : undefined}
            rel={hasRepo ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            aria-label="Repository"
          >
            {hasRepo ? (
              <>
                <span className="font-mono text-muted-foreground">{owner}/</span>
                <span>{repo}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No repo configured</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </a>
          <span
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-medium text-foreground"
            aria-label="Default branch"
          >
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span>main</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarFallback className="bg-secondary text-xs text-foreground">EC</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
