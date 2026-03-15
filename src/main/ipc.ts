import { ipcMain, BrowserWindow } from 'electron'
import { ScanConfig, ScanState, ScanEvent } from '@shared/types'
import { runScan } from './lib/scanner'

let currentScanState: ScanState | null = null
let isScanning = false

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('scan:start', async (_event, config: ScanConfig) => {
    if (isScanning) {
      return { error: 'Scan already in progress' }
    }

    isScanning = true
    currentScanState = null

    const emit = (event: ScanEvent): void => {
      // Forward every scan event to renderer
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan:event', event)
      }

      // Keep track of final state
      if (event.type === 'complete') {
        currentScanState = event.state
        isScanning = false
      }
      if (event.type === 'error') {
        isScanning = false
      }
    }

    // Run scan in background (don't await in IPC handler — events stream via send)
    runScan(config, emit)
      .then((state) => {
        currentScanState = state
        isScanning = false
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        emit({ type: 'error', message })
        isScanning = false
      })

    return { ok: true }
  })

  ipcMain.handle('scan:status', async () => {
    return currentScanState
  })
}
