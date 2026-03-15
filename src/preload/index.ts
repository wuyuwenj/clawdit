import { contextBridge, ipcRenderer } from 'electron'
import type { ScanConfig, ScanEvent, ScanState } from '@shared/types'

export interface OpenClawConfig {
  gateway?: {
    port?: number
    auth?: {
      token?: string
    }
  }
}

export interface ShellClawAPI {
  startScan: (config: ScanConfig) => Promise<{ ok?: boolean; error?: string }>
  pauseScan: () => Promise<{ ok?: boolean; error?: string; paused?: boolean }>
  stopScan: () => Promise<{ ok?: boolean; error?: string }>
  nextStep: () => Promise<{ ok?: boolean; error?: string }>
  onScanEvent: (callback: (event: ScanEvent) => void) => void
  removeAllScanListeners: () => void
  getStatus: () => Promise<ScanState | null>
  readOpenClawConfig: () => Promise<OpenClawConfig | null>
}

contextBridge.exposeInMainWorld('shellclaw', {
  startScan: (config: ScanConfig) => ipcRenderer.invoke('scan:start', config),
  pauseScan: () => ipcRenderer.invoke('scan:pause'),
  stopScan: () => ipcRenderer.invoke('scan:stop'),
  nextStep: () => ipcRenderer.invoke('scan:next'),
  onScanEvent: (callback: (event: ScanEvent) => void) => {
    ipcRenderer.on('scan:event', (_event, data: ScanEvent) => callback(data))
  },
  removeAllScanListeners: () => {
    ipcRenderer.removeAllListeners('scan:event')
  },
  getStatus: () => ipcRenderer.invoke('scan:status'),
  readOpenClawConfig: () => ipcRenderer.invoke('read-openclaw-config')
} satisfies ShellClawAPI)
