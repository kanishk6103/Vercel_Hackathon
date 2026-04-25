import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import {
  fetchPullRequests,
  getPullRequestDetail,
  getPullRequestDiff,
  getPullRequestFiles,
  getFileContents,
  type GitHubPR,
} from "@/lib/github"
import { fetchDeployments, type VercelDeployment } from "@/lib/vercel"
import { config } from "@/lib/config"

export const maxDuration = 60

function overview(prs: GitHubPR[], deps: VercelDeployment[]): string {
  const prSummary =
    prs.length === 0
      ? "(no open pull requests)"
      : prs
          .map(
            (p) =>
              `  ${p.number} "${p.title}" by ${p.author.name} · risk=${p.risk} · +${p.linesAdded}/-${p.linesRemoved} across ${p.filesChanged} files · ${p.timeAgo}`,
          )
          .join("\n")

  const depSummary =
    deps.length === 0
      ? "(no deployments)"
      : deps
          .slice(0, 5)
          .map(
            (d) =>
              `  ${d.target} · ${d.branch}@${d.sha} · ${d.status} · "${d.message}" · ${d.timeAgo}${d.errorSummary ? ` · error: ${d.errorSummary.slice(0, 200)}` : ""}`,
          )
          .join("\n")

  return `Repository: ${config.github.owner}/${config.github.repo}

Open pull requests:
${prSummary}

Recent deployments:
${depSummary}`
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const [prsResult, depsResult] = await Promise.allSettled([
    fetchPullRequests(),
    fetchDeployments(),
  ])
  const prs = prsResult.status === "fulfilled" ? prsResult.value : []
  const deps = depsResult.status === "fulfilled" ? depsResult.value : []

  const system = `You are an engineering copilot reviewing pull requests and deployments for ${config.github.owner}/${config.github.repo}. You can call tools to fetch PR diffs, file contents, and full PR details whenever the user asks for a review or wants to dig into a specific change.

When the user asks to review a PR:
1. Call \`getPullRequestFiles\` (preferred — returns per-file patches) or \`getPullRequestDiff\` for the raw unified diff.
2. Read each file's patch carefully and call out concrete issues: bugs, security holes, missing error handling, breaking changes, perf regressions, unhandled edge cases. Reference specific files and line ranges when you can.
3. Group findings by severity (Blocker / Major / Minor / Nit). Be terse and skim-friendly.
4. If something is unclear without reading a file's full context, call \`getFileContents\` for that file at the PR's head SHA.

When the user asks follow-ups, reuse what you already fetched in this conversation rather than re-calling tools. Only call a tool again if the data you need wasn't fetched yet.

Cite PR numbers like #2 and use fenced code blocks for any code snippets you reference.

Initial overview (use this to know what exists; call tools for details):
${overview(prs, deps)}`

  const result = streamText({
    model: openai("gpt-4.1"),
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    tools: {
      listOpenPullRequests: tool({
        description: "List the open pull requests in the configured repository.",
        inputSchema: z.object({}),
        execute: async () => fetchPullRequests(),
      }),
      getPullRequest: tool({
        description: "Fetch metadata, title, body, head/base branches, and stats for one PR by number.",
        inputSchema: z.object({ number: z.number().int().positive() }),
        execute: async ({ number }) => getPullRequestDetail(number),
      }),
      getPullRequestFiles: tool({
        description:
          "List files changed in a PR with each file's patch hunks. Use this for code review.",
        inputSchema: z.object({ number: z.number().int().positive() }),
        execute: async ({ number }) => getPullRequestFiles(number),
      }),
      getPullRequestDiff: tool({
        description:
          "Fetch the raw unified diff for a PR. Prefer getPullRequestFiles unless you specifically need the unified format.",
        inputSchema: z.object({ number: z.number().int().positive() }),
        execute: async ({ number }) => getPullRequestDiff(number),
      }),
      getFileContents: tool({
        description:
          "Read the full contents of a file from the repo. Pass `ref` (a branch name or SHA) to read at a specific revision; defaults to the default branch.",
        inputSchema: z.object({
          path: z.string().min(1),
          ref: z.string().optional(),
        }),
        execute: async ({ path, ref }) => getFileContents(path, ref),
      }),
      getDeployments: tool({
        description: "List the most recent Vercel deployments (production and preview).",
        inputSchema: z.object({}),
        execute: async () => fetchDeployments(),
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
