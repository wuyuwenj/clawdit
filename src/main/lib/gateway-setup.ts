import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { spawn } from 'child_process'

export interface GatewaySetupResult {
  success: boolean
  config?: { url: string; token: string }
  error?: string
  errorType?: 'no_config' | 'no_token' | 'gateway_down' | 'auth_failed' | 'auto_fix_failed'
  autoFixed?: boolean
}

interface OpenClawConfig {
  gateway?: {
    port?: number
    auth?: {
      token?: string
    }
    http?: {
      endpoints?: {
        chatCompletions?: { enabled?: boolean }
        responses?: { enabled?: boolean }
      }
    }
  }
}

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json')
const DEFAULT_PORT = 18789

async function readConfig(): Promise<OpenClawConfig | null> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeConfig(config: OpenClawConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

function runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { shell: true })
    let output = ''

    proc.stdout.on('data', (data) => {
      output += data.toString()
    })
    proc.stderr.on('data', (data) => {
      output += data.toString()
    })

    proc.on('close', (code) => {
      resolve({ success: code === 0, output })
    })

    proc.on('error', (err) => {
      resolve({ success: false, output: err.message })
    })
  })
}

async function testGatewayConnection(
  url: string,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'default',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (res.ok) {
      return { ok: true, status: res.status }
    }
    return { ok: false, status: res.status }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

async function pollHealth(url: string, maxRetries = 10, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`${url}/health`, { signal: controller.signal })
      clearTimeout(timeout)

      if (res.ok) {
        return true
      }
    } catch {
      // Gateway not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return false
}

async function patchConfigAndRestartGateway(
  config: OpenClawConfig,
  url: string
): Promise<{ success: boolean; error?: string }> {
  // Ensure the nested structure exists
  config.gateway = config.gateway || {}
  config.gateway.http = config.gateway.http || {}
  config.gateway.http.endpoints = config.gateway.http.endpoints || {}
  config.gateway.http.endpoints.chatCompletions = { enabled: true }
  config.gateway.http.endpoints.responses = { enabled: true }

  try {
    await writeConfig(config)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Failed to write config: ${message}` }
  }

  // Restart gateway
  console.log('[gateway-setup] Stopping gateway...')
  await runCommand('openclaw', ['gateway', 'stop'])

  console.log('[gateway-setup] Reinstalling gateway...')
  const installResult = await runCommand('openclaw', ['gateway', 'install', '--force'])
  if (!installResult.success) {
    return { success: false, error: `Gateway install failed: ${installResult.output}` }
  }

  console.log('[gateway-setup] Starting gateway...')
  const startResult = await runCommand('openclaw', ['gateway', 'start'])
  if (!startResult.success) {
    return { success: false, error: `Gateway start failed: ${startResult.output}` }
  }

  // Poll for health
  console.log('[gateway-setup] Waiting for gateway to come up...')
  const healthy = await pollHealth(url)
  if (!healthy) {
    return { success: false, error: 'Gateway did not become healthy after restart' }
  }

  return { success: true }
}

export async function setupGateway(): Promise<GatewaySetupResult> {
  console.log('[gateway-setup] Reading OpenClaw config...')

  const config = await readConfig()
  if (!config) {
    console.log('[gateway-setup] No config found')
    return {
      success: false,
      error: 'No OpenClaw config found at ~/.openclaw/openclaw.json',
      errorType: 'no_config'
    }
  }

  const port = config.gateway?.port || DEFAULT_PORT
  const token = config.gateway?.auth?.token

  if (!token) {
    console.log('[gateway-setup] No auth token in config')
    return {
      success: false,
      error: 'No gateway auth token found in config',
      errorType: 'no_token'
    }
  }

  const url = `http://127.0.0.1:${port}`
  console.log(`[gateway-setup] Testing gateway at ${url}...`)

  const testResult = await testGatewayConnection(url, token)

  if (testResult.ok) {
    console.log('[gateway-setup] Gateway connection successful')
    return {
      success: true,
      config: { url, token }
    }
  }

  // Handle 405 - HTTP endpoints disabled
  if (testResult.status === 405) {
    console.log('[gateway-setup] Got 405 - HTTP endpoints disabled, attempting auto-fix...')

    const patchResult = await patchConfigAndRestartGateway(config, url)
    if (!patchResult.success) {
      return {
        success: false,
        config: { url, token },
        error: patchResult.error,
        errorType: 'auto_fix_failed'
      }
    }

    // Retry the connection
    console.log('[gateway-setup] Retrying connection after auto-fix...')
    const retryResult = await testGatewayConnection(url, token)

    if (retryResult.ok) {
      console.log('[gateway-setup] Auto-fix successful!')
      return {
        success: true,
        config: { url, token },
        autoFixed: true
      }
    }

    return {
      success: false,
      config: { url, token },
      error: `Auto-fix completed but connection still failed (status: ${retryResult.status})`,
      errorType: 'auto_fix_failed',
      autoFixed: true
    }
  }

  // Handle 401/403 - auth failed
  if (testResult.status === 401 || testResult.status === 403) {
    console.log('[gateway-setup] Authentication failed')
    return {
      success: false,
      config: { url, token },
      error: 'Gateway authentication failed - check your token',
      errorType: 'auth_failed'
    }
  }

  // Handle connection errors
  if (testResult.error) {
    console.log(`[gateway-setup] Connection error: ${testResult.error}`)
    return {
      success: false,
      config: { url, token },
      error: `Could not connect to gateway: ${testResult.error}`,
      errorType: 'gateway_down'
    }
  }

  // Other HTTP errors
  return {
    success: false,
    config: { url, token },
    error: `Gateway returned HTTP ${testResult.status}`,
    errorType: 'gateway_down'
  }
}
