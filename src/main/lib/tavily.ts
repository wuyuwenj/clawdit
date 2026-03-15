import { tavily } from '@tavily/core'

export async function runRecon(onLog?: (message: string) => void): Promise<string> {
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY ?? '' })

  const queries = [
    'latest LLM prompt injection techniques 2025',
    'AI agent security vulnerabilities exploits',
    'OpenClaw agent security issues'
  ]

  try {
    const results = await Promise.all(
      queries.map(async (query) => {
        onLog?.(`[Tavily] Query: ${query}`)

        try {
          const response = await client.search(query, { maxResults: 3 })
          const snippets = (response.results ?? [])
            .map(result => result.content?.slice(0, 300) ?? '')
            .filter(Boolean)

          onLog?.(`[Tavily] Retrieved ${response.results?.length ?? 0} results for: ${query}`)
          return snippets
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          onLog?.(`[Tavily] Query failed: ${query} (${message})`)
          return []
        }
      })
    )

    const summaries: string[] = []

    for (const result of results) {
      summaries.push(...result)
    }

    const combined = summaries.join('\n\n').slice(0, 2000)
    return combined || 'No recon data available. Using base attack templates only.'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return `Recon failed: ${message}. Using base attack templates only.`
  }
}
