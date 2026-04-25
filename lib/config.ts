export const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
  },
  vercel: {
    token: process.env.VERCEL_TOKEN_PROJ,
    projectId: process.env.VERCEL_PROJECT_ID_TARGET,
    teamId: process.env.VERCEL_TEAM_ID,
  },
} as const

export function githubConfigured(): boolean {
  return Boolean(config.github.token && config.github.owner && config.github.repo)
}

export function vercelConfigured(): boolean {
  return Boolean(config.vercel.token && config.vercel.projectId)
}
