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

export interface TurnLogEntry {
  label: string
  prompt: string
  response: string
  durationMs: number
}

export interface MultiTurnResult {
  finalResponse: string
  turnLog: TurnLogEntry[]
  success: boolean
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function execCli(command: string): Promise<{ stdout: string; stderr: string }> {
  const { exec } = require('child_process')
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (err: Error | null, stdout: string, stderr: string) => {
      if (err) reject(err)
      else resolve({ stdout, stderr })
    })
  })
}

export async function sendMultiTurnAttack(
  url: string,
  turns: { label: string; prompt: string; type?: 'chat' | 'cli'; delayAfterMs?: number }[],
  authToken?: string
): Promise<MultiTurnResult> {
  const turnLog: TurnLogEntry[] = []

  for (const turn of turns) {
    const start = Date.now()
    let response: string

    if (turn.type === 'cli') {
      // Execute command locally (e.g. gog gmail send)
      try {
        const result = await execCli(turn.prompt)
        response = result.stdout || result.stderr || '[CLI OK]'
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        response = `[CLI ERROR] ${msg}`
      }
    } else {
      // Send as chat message to OpenClaw
      response = await sendAttack(url, turn.prompt, authToken)
    }

    const durationMs = Date.now() - start

    turnLog.push({
      label: turn.label,
      prompt: turn.prompt,
      response,
      durationMs
    })

    if (response.startsWith('[ERROR]') || response.startsWith('[CLI ERROR]')) {
      return { finalResponse: response, turnLog, success: false }
    }

    if (turn.delayAfterMs && turn.delayAfterMs > 0) {
      await wait(turn.delayAfterMs)
    }
  }

  const finalResponse = turnLog[turnLog.length - 1]?.response ?? '[NO RESPONSE]'
  return { finalResponse, turnLog, success: true }
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
