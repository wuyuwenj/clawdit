import { contextBridge, ipcRenderer } from 'electron'
import type { ScanConfig, ScanEvent, ScanState } from '@shared/types'

export interface OpenClawConfig {
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

export interface GatewaySetupResult {
  success: boolean
  config?: { url: string; token: string }
  error?: string
  errorType?: 'no_config' | 'no_token' | 'gateway_down' | 'auth_failed' | 'auto_fix_failed'
  autoFixed?: boolean
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
  getPreloadedGateway: () => Promise<GatewaySetupResult | null>
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
  readOpenClawConfig: () => ipcRenderer.invoke('read-openclaw-config'),
  getPreloadedGateway: () => ipcRenderer.invoke('get-preloaded-gateway')
} satisfies ShellClawAPI)
