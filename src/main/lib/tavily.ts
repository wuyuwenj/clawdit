import { tavily } from '@tavily/core'

export async function runRecon(): Promise<string> {
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY ?? '' })

  const queries = [
    'latest LLM prompt injection techniques 2025',
    'AI agent security vulnerabilities exploits',
    'OpenClaw agent security issues'
  ]

  try {
    const results = await Promise.allSettled(
      queries.map(q => client.search(q, { maxResults: 3 }))
    )

    const summaries: string[] = []

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.results) {
        for (const r of result.value.results) {
          const snippet = r.content?.slice(0, 300) ?? ''
          if (snippet) summaries.push(snippet)
        }
      }
    }

    const combined = summaries.join('\n\n').slice(0, 2000)
    return combined || 'No recon data available. Using base attack templates only.'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return `Recon failed: ${message}. Using base attack templates only.`
  }
}
