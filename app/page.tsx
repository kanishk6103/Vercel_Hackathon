import { HeaderBar } from "@/components/header-bar"
import { PRIntelligence } from "@/components/pr-intelligence"
import { DeploymentMonitor } from "@/components/deployment-monitor"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { fetchPullRequests } from "@/lib/github"
import { fetchDeployments, deploymentSummary } from "@/lib/vercel"
import { config, githubConfigured, vercelConfigured } from "@/lib/config"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [prsResult, depsResult] = await Promise.allSettled([
    fetchPullRequests(),
    fetchDeployments(),
  ])

  const prs = prsResult.status === "fulfilled" ? prsResult.value : []
  const prError = prsResult.status === "rejected" ? String(prsResult.reason) : null

  const deployments = depsResult.status === "fulfilled" ? depsResult.value : []
  const depError = depsResult.status === "rejected" ? String(depsResult.reason) : null

  return (
    <div className="min-h-svh bg-background text-foreground">
      <HeaderBar
        owner={config.github.owner}
        repo={config.github.repo}
      />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-4 md:px-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
          {/* Left column — 60% */}
          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-3">
            <PRIntelligence
              prs={prs}
              configured={githubConfigured()}
              error={prError}
            />
            <DeploymentMonitor
              deployments={deployments}
              summary={deploymentSummary(deployments)}
              configured={vercelConfigured()}
              error={depError}
            />
          </div>

          {/* Right column — 40%, sticky on desktop */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-[4.5rem] lg:h-[calc(100svh-5.5rem)]">
              <AIChatPanel
                contextLabel={`${prs.length} ${prs.length === 1 ? "PR" : "PRs"} · ${deployments.length} ${deployments.length === 1 ? "deployment" : "deployments"}`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
