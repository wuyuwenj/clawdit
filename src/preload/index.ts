import { contextBridge, ipcRenderer } from 'electron'
import type { ScanConfig, ScanEvent, ScanState } from '@shared/types'

export interface ShellClawAPI {
  startScan: (config: ScanConfig) => Promise<{ ok?: boolean; error?: string }>
  onScanEvent: (callback: (event: ScanEvent) => void) => void
  removeAllScanListeners: () => void
  getStatus: () => Promise<ScanState | null>
}

contextBridge.exposeInMainWorld('shellclaw', {
  startScan: (config: ScanConfig) => ipcRenderer.invoke('scan:start', config),
  onScanEvent: (callback: (event: ScanEvent) => void) => {
    ipcRenderer.on('scan:event', (_event, data: ScanEvent) => callback(data))
  },
  removeAllScanListeners: () => {
    ipcRenderer.removeAllListeners('scan:event')
  },
  getStatus: () => ipcRenderer.invoke('scan:status')
} satisfies ShellClawAPI)
