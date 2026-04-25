import { config, vercelConfigured } from "./config"
import type { DeploymentStatus } from "@/components/status-pill"

export interface VercelDeployment {
  id: string
  status: DeploymentStatus
  target: "Production" | "Preview"
  branch: string
  sha: string
  message: string
  timeAgo: string
  duration: string
  author: { name: string; initials: string; avatar?: string }
  errorSummary?: string
  url?: string
}

interface RawDeployment {
  uid: string
  name: string
  url: string
  state?: string
  readyState?: string
  target?: string | null
  created: number
  ready?: number
  buildingAt?: number
  meta?: {
    githubCommitRef?: string
    githubCommitSha?: string
    githubCommitMessage?: string
    githubCommitAuthorLogin?: string
    githubCommitAuthorName?: string
  }
  creator?: { username?: string; name?: string }
  errorMessage?: string | null
}

const API = "https://api.vercel.com"

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${config.vercel.token}` }
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

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts
  const m = Math.floor(diffMs / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function duration(d: RawDeployment): string {
  if (!d.ready || !d.buildingAt) return "—"
  const ms = d.ready - d.buildingAt
  if (ms < 0) return "—"
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function mapStatus(d: RawDeployment): DeploymentStatus {
  const raw = (d.readyState ?? d.state ?? "").toUpperCase()
  switch (raw) {
    case "READY":
      return "READY"
    case "ERROR":
      return "ERROR"
    case "CANCELED":
    case "CANCELLED":
      return "CANCELLED"
    case "BUILDING":
    case "QUEUED":
    case "INITIALIZING":
      return "BUILDING"
    default:
      return "BUILDING"
  }
}

export async function fetchDeployments(): Promise<VercelDeployment[]> {
  if (!vercelConfigured()) return []

  const { token, projectId, teamId } = config.vercel
  const params = new URLSearchParams({ projectId: projectId!, limit: "10" })
  if (teamId) params.set("teamId", teamId)

  const res = await fetch(`${API}/v6/deployments?${params}`, {
    headers: authHeaders(),
    next: { revalidate: 30 },
  })
  if (!res.ok) {
    throw new Error(`Vercel deployments failed: ${res.status} ${res.statusText}`)
  }
  const json = (await res.json()) as { deployments: RawDeployment[] }

  return json.deployments.map((d) => {
    const status = mapStatus(d)
    const authorName = d.meta?.githubCommitAuthorName ?? d.creator?.name ?? d.creator?.username ?? "unknown"
    const branch = d.meta?.githubCommitRef ?? "—"
    const sha = d.meta?.githubCommitSha?.slice(0, 7) ?? "—"
    const message = d.meta?.githubCommitMessage ?? d.name ?? ""
    return {
      id: d.uid,
      status,
      target: d.target === "production" ? "Production" : "Preview",
      branch,
      sha,
      message: message.split("\n")[0] ?? "",
      timeAgo: timeAgo(d.created),
      duration: duration(d),
      author: { name: authorName, initials: initials(authorName) },
      errorSummary: status === "ERROR" && d.errorMessage ? d.errorMessage : undefined,
      url: d.url ? `https://${d.url}` : undefined,
    }
  })
}

export function deploymentSummary(deps: VercelDeployment[]): {
  successful: number
  failed: number
  building: number
} {
  return deps.reduce(
    (acc, d) => {
      if (d.status === "READY") acc.successful++
      else if (d.status === "ERROR") acc.failed++
      else if (d.status === "BUILDING") acc.building++
      return acc
    },
    { successful: 0, failed: 0, building: 0 },
  )
}
