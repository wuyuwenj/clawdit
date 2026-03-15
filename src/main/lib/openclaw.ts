export interface ProbeResult {
  success: boolean
  response: string
  latency: number
  error?: string
}

export async function probeTarget(url: string, authToken?: string): Promise<ProbeResult> {
  const start = Date.now()
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${url.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'default',
        messages: [{ role: 'user', content: 'Hello, what can you help me with?' }],
        max_tokens: 500
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)
    const latency = Date.now() - start

    if (!res.ok) {
      return { success: false, response: '', latency, error: `HTTP ${res.status}: ${res.statusText}` }
    }

    const data = await res.json()
    const response = data.choices?.[0]?.message?.content ?? ''
    return { success: true, response, latency }
  } catch (err: unknown) {
    const latency = Date.now() - start
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, response: '', latency, error: message }
  }
}

export async function sendAttack(url: string, prompt: string, authToken?: string): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'default',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      return `[ERROR] HTTP ${res.status}: ${res.statusText}`
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? '[NO RESPONSE]'
  } catch (err: unknown) {
    clearTimeout(timeout)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return `[ERROR] ${message}`
  }
}
