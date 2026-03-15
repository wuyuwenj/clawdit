import { ipcMain, BrowserWindow } from 'electron'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { ScanConfig, ScanState, ScanEvent } from '@shared/types'
import { runScan, ScanControls } from './lib/scanner'
import { GatewaySetupResult } from './lib/gateway-setup'

let currentScanState: ScanState | null = null
let isScanning = false
let abortController: AbortController | null = null
let stepResolver: (() => void) | null = null

// Pause state: when paused, pausePromise is a pending promise that workers await.
// Calling resume resolves it. Calling pause again creates a new pending promise.
let isPaused = false
let pauseResolver: (() => void) | null = null
let pausePromise: Promise<void> | null = null

// Preloaded gateway result from startup validation
let preloadedGatewayResult: GatewaySetupResult | null = null

export function setPreloadedGatewayResult(result: GatewaySetupResult): void {
  preloadedGatewayResult = result
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('scan:start', async (_event, config: ScanConfig) => {
    if (isScanning) {
      return { error: 'Scan already in progress' }
    }

    isScanning = true
    currentScanState = null
    abortController = new AbortController()
    stepResolver = null
    isPaused = false
    pauseResolver = null
    pausePromise = null

    const controls: ScanControls = {
      abort: abortController.signal,
      waitForStep: () =>
        new Promise<void>((resolve) => {
          stepResolver = resolve
        }),
      checkPause: async () => {
        // If paused, block until resume
        if (pausePromise) {
          await pausePromise
        }
      }
    }

    const emit = (event: ScanEvent): void => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan:event', event)
      }

      if (event.type === 'complete') {
        currentScanState = event.state
        isScanning = false
        abortController = null
        stepResolver = null
        isPaused = false
        pauseResolver = null
        pausePromise = null
      }
      if (event.type === 'error') {
        isScanning = false
        abortController = null
        stepResolver = null
        isPaused = false
        pauseResolver = null
        pausePromise = null
      }
    }

    runScan(config, emit, controls)
      .then((state) => {
        currentScanState = state
        isScanning = false
        abortController = null
        stepResolver = null
        isPaused = false
        pauseResolver = null
        pausePromise = null
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        emit({ type: 'error', message })
        isScanning = false
        abortController = null
        stepResolver = null
        isPaused = false
        pauseResolver = null
        pausePromise = null
      })

    return { ok: true }
  })

  ipcMain.handle('scan:pause', async () => {
    if (!isScanning) return { error: 'No scan in progress' }

    if (!isPaused) {
      // Pause: create a pending promise that workers will await
      isPaused = true
      pausePromise = new Promise<void>((resolve) => {
        pauseResolver = resolve
      })
      // Notify renderer
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan:event', { type: 'paused-toggle', paused: true })
      }
      return { ok: true, paused: true }
    } else {
      // Resume: resolve the pending promise so workers continue
      isPaused = false
      if (pauseResolver) {
        pauseResolver()
        pauseResolver = null
      }
      pausePromise = null
      // Notify renderer
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan:event', { type: 'paused-toggle', paused: false })
      }
      return { ok: true, paused: false }
    }
  })

  ipcMain.handle('scan:stop', async () => {
    if (abortController) {
      // If paused, resume first so workers can exit
      if (isPaused && pauseResolver) {
        pauseResolver()
        pauseResolver = null
        pausePromise = null
        isPaused = false
      }
      abortController.abort()
      // Also resolve any pending step wait so the scanner can exit
      if (stepResolver) {
        stepResolver()
        stepResolver = null
      }
      return { ok: true }
    }
    return { error: 'No scan in progress' }
  })

  ipcMain.handle('scan:next', async () => {
    if (stepResolver) {
      stepResolver()
      stepResolver = null
      return { ok: true }
    }
    return { error: 'Not waiting for step' }
  })

  ipcMain.handle('scan:status', async () => {
    return currentScanState
  })

  ipcMain.handle('read-openclaw-config', async () => {
    try {
      const configPath = join(homedir(), '.openclaw', 'openclaw.json')
      const raw = await readFile(configPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  ipcMain.handle('get-preloaded-gateway', async () => {
    return preloadedGatewayResult
  })
}
