import { config, githubConfigured } from "./config"
import type { RiskLevel } from "@/components/risk-badge"

export interface GitHubPR {
  id: string
  number: string
  title: string
  url: string
  author: { name: string; initials: string; avatar?: string }
  timeAgo: string
  risk: RiskLevel
  filesChanged: number
  linesAdded: number
  linesRemoved: number
  summary: string
}

interface RawPR {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  created_at: string
  updated_at: string
  user: { login: string; avatar_url: string } | null
  additions?: number
  deletions?: number
  changed_files?: number
}

const API = "https://api.github.com"

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${config.github.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

function initials(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || name.slice(0, 2).toUpperCase()
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function scoreRisk(filesChanged: number, additions: number): RiskLevel {
  if (filesChanged > 15 || additions > 250) return "HIGH"
  if (filesChanged > 4 || additions > 50) return "MEDIUM"
  return "LOW"
}

function summarize(body: string | null): string {
  if (!body) return "No description provided."
  const stripped = body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`]/g, "")
    .trim()
  if (!stripped) return "No description provided."
  const firstParagraph = stripped.split(/\n\s*\n/)[0]
  return firstParagraph.length > 320
    ? firstParagraph.slice(0, 320).trimEnd() + "…"
    : firstParagraph
}

export interface PullRequestFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

const MAX_DIFF_BYTES = 60_000
const MAX_FILE_BYTES = 30_000

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + `\n\n[…truncated ${s.length - max} more chars]`
}

export async function getPullRequestDetail(number: number) {
  const { owner, repo } = config.github
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: authHeaders(),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`GitHub PR #${number} fetch failed: ${res.status}`)
  const pr = (await res.json()) as RawPR & { head?: { ref: string; sha: string }; base?: { ref: string } }
  return {
    number: pr.number,
    title: pr.title,
    body: pr.body ?? "",
    url: pr.html_url,
    author: pr.user?.login ?? "unknown",
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    changedFiles: pr.changed_files ?? 0,
    headBranch: pr.head?.ref,
    headSha: pr.head?.sha,
    baseBranch: pr.base?.ref,
  }
}

export async function getPullRequestDiff(number: number): Promise<string> {
  const { owner, repo } = config.github
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: { ...authHeaders(), Accept: "application/vnd.github.diff" },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`GitHub diff #${number} fetch failed: ${res.status}`)
  return truncate(await res.text(), MAX_DIFF_BYTES)
}

export async function getPullRequestFiles(number: number): Promise<PullRequestFile[]> {
  const { owner, repo } = config.github
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`, {
    headers: authHeaders(),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`GitHub PR files #${number} fetch failed: ${res.status}`)
  const files = (await res.json()) as PullRequestFile[]
  return files.map((f) => ({
    ...f,
    patch: f.patch ? truncate(f.patch, 8_000) : undefined,
  }))
}

export async function getFileContents(path: string, ref?: string): Promise<string> {
  const { owner, repo } = config.github
  const url = new URL(`${API}/repos/${owner}/${repo}/contents/${path}`)
  if (ref) url.searchParams.set("ref", ref)
  const res = await fetch(url, {
    headers: { ...authHeaders(), Accept: "application/vnd.github.raw" },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`GitHub file ${path}@${ref ?? "HEAD"} fetch failed: ${res.status}`)
  return truncate(await res.text(), MAX_FILE_BYTES)
}

export async function fetchPullRequests(): Promise<GitHubPR[]> {
  if (!githubConfigured()) return []

  const { owner, repo } = config.github
  const listUrl = `${API}/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=10`

  const listRes = await fetch(listUrl, { headers: authHeaders(), next: { revalidate: 60 } })
  if (!listRes.ok) {
    throw new Error(`GitHub list PRs failed: ${listRes.status} ${listRes.statusText}`)
  }
  const list = (await listRes.json()) as RawPR[]

  const detailed = await Promise.all(
    list.map(async (pr) => {
      const detailRes = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pr.number}`, {
        headers: authHeaders(),
        next: { revalidate: 60 },
      })
      if (!detailRes.ok) return pr
      return (await detailRes.json()) as RawPR
    }),
  )

  return detailed.map((pr) => {
    const additions = pr.additions ?? 0
    const deletions = pr.deletions ?? 0
    const changed = pr.changed_files ?? 0
    const login = pr.user?.login ?? "unknown"
    return {
      id: String(pr.id),
      number: `#${pr.number}`,
      title: pr.title,
      url: pr.html_url,
      author: { name: login, initials: initials(login), avatar: pr.user?.avatar_url },
      timeAgo: timeAgo(pr.updated_at),
      risk: scoreRisk(changed, additions),
      filesChanged: changed,
      linesAdded: additions,
      linesRemoved: deletions,
      summary: summarize(pr.body),
    }
  })
}
