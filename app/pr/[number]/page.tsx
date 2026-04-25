import { notFound } from "next/navigation"
import { HeaderBar } from "@/components/header-bar"
import { PRDiffView } from "@/components/pr-diff-view"
import { getPullRequestDetail, getPullRequestFiles } from "@/lib/github"
import { config, githubConfigured } from "@/lib/config"
import type { RiskLevel } from "@/components/risk-badge"

export const dynamic = "force-dynamic"

function scoreRisk(filesChanged: number, additions: number): RiskLevel {
  if (filesChanged > 15 || additions > 250) return "HIGH"
  if (filesChanged > 4 || additions > 50) return "MEDIUM"
  return "LOW"
}

export default async function PRDiffPage({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const { number: numberStr } = await params
  const number = Number(numberStr)
  if (!Number.isInteger(number) || number <= 0) notFound()

  if (!githubConfigured()) {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <HeaderBar owner={config.github.owner} repo={config.github.repo} />
        <PRDiffView pr={null} files={[]} error="GitHub is not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env.local." />
      </div>
    )
  }

  const [detailResult, filesResult] = await Promise.allSettled([
    getPullRequestDetail(number),
    getPullRequestFiles(number),
  ])

  const error =
    detailResult.status === "rejected"
      ? String(detailResult.reason)
      : filesResult.status === "rejected"
        ? String(filesResult.reason)
        : null

  if (detailResult.status === "rejected") {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <HeaderBar owner={config.github.owner} repo={config.github.repo} />
        <PRDiffView pr={null} files={[]} error={error} />
      </div>
    )
  }

  const detail = detailResult.value
  const files = filesResult.status === "fulfilled" ? filesResult.value : []

  // GitHub doesn't return avatar on the detail call we built; reuse list-shape author for fallback
  const pr = {
    number: detail.number,
    title: detail.title,
    body: detail.body,
    url: detail.url,
    author: detail.author,
    additions: detail.additions,
    deletions: detail.deletions,
    changedFiles: detail.changedFiles,
    headBranch: detail.headBranch,
    baseBranch: detail.baseBranch,
    risk: scoreRisk(detail.changedFiles, detail.additions),
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <HeaderBar owner={config.github.owner} repo={config.github.repo} />
      <PRDiffView pr={pr} files={files} error={error} />
    </div>
  )
}
