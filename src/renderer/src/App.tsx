import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  ScanState,
  ScanStatus,
  ScanPhase,
  ScanEvent,
  AttackCategory,
  CategoryResult
} from '@shared/types'
import ConnectForm from './components/ConnectForm'
import ScanDashboard from './components/ScanDashboard'
import FindingsPanel from './components/FindingsPanel'

// ── Reducer types ──────────────────────────────────────────────

type Action =
  | { type: 'START_SCAN'; targetUrl: string }
  | { type: 'SCAN_EVENT'; event: ScanEvent }
  | { type: 'TICK' }
  | { type: 'RESET' }

function createInitialState(): ScanState {
  return {
    id: '',
    status: ScanStatus.IDLE,
    phase: ScanPhase.CONNECTING,
    targetUrl: '',
    startedAt: 0,
    elapsed: 0,
    categories: [
      createEmptyCategory(AttackCategory.PROMPT_INJECTION),
      createEmptyCategory(AttackCategory.DATA_LEAKAGE),
      createEmptyCategory(AttackCategory.UNAUTHORIZED_ACTIONS),
      createEmptyCategory(AttackCategory.ACCESS_CONTROL)
    ],
    overallScore: 100,
    topFindings: [],
    reconSummary: '',
    log: []
  }
}

function createEmptyCategory(category: AttackCategory): CategoryResult {
  return {
    category,
    status: 'pending',
    score: 100,
    attacks: [],
    results: []
  }
}

// ── Reducer ────────────────────────────────────────────────────

function scanReducer(state: ScanState, action: Action): ScanState {
  switch (action.type) {
    case 'START_SCAN': {
      return {
        ...createInitialState(),
        status: ScanStatus.RUNNING,
        phase: ScanPhase.CONNECTING,
        targetUrl: action.targetUrl,
        startedAt: Date.now(),
        log: [
          {
            timestamp: Date.now(),
            message: `Initiating scan against ${action.targetUrl}`,
            level: 'info'
          }
        ]
      }
    }

    case 'SCAN_EVENT': {
      const { event } = action
      switch (event.type) {
        case 'phase':
          return {
            ...state,
            phase: event.phase,
            log: [
              ...state.log,
              {
                timestamp: Date.now(),
                message: `Phase transition: ${event.phase}`,
                level: 'info'
              }
            ]
          }

        case 'log':
          return {
            ...state,
            log: [...state.log, event.entry]
          }

        case 'attack-start': {
          const categories = state.categories.map((cat) => {
            if (cat.category === event.attack.category) {
              return {
                ...cat,
                status: 'running' as const,
                attacks: [...cat.attacks, event.attack]
              }
            }
            return cat
          })
          return { ...state, categories }
        }

        case 'attack-result': {
          const { result } = event
          const categories = state.categories.map((cat) => {
            if (cat.category === result.category) {
              return {
                ...cat,
                results: [...cat.results, result]
              }
            }
            return cat
          })
          const allResults = categories.flatMap((c) => c.results)
          const topFindings = allResults
            .filter((r) => r.compromised)
            .sort((a, b) => b.severity - a.severity)
          return { ...state, categories, topFindings }
        }

        case 'category-update': {
          const categories = state.categories.map((cat) =>
            cat.category === event.category.category ? event.category : cat
          )
          return { ...state, categories }
        }

        case 'complete':
          return {
            ...event.state,
            status: ScanStatus.COMPLETE,
            elapsed: Math.floor((Date.now() - state.startedAt) / 1000)
          }

        case 'error':
          return {
            ...state,
            status: ScanStatus.ERROR,
            log: [
              ...state.log,
              {
                timestamp: Date.now(),
                message: event.message,
                level: 'error'
              }
            ]
          }
      }
      return state
    }

    case 'TICK':
      if (state.status !== ScanStatus.RUNNING) return state
      return {
        ...state,
        elapsed: Math.floor((Date.now() - state.startedAt) / 1000)
      }

    case 'RESET':
      return createInitialState()

    default:
      return state
  }
}

// ── App component ──────────────────────────────────────────────

type View = 'auto' | 'dashboard' | 'findings'

export default function App(): JSX.Element {
  const [state, dispatch] = useReducer(scanReducer, undefined, createInitialState)
  const [view, setView] = useState<View>('auto')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time timer
  useEffect(() => {
    if (state.status === ScanStatus.RUNNING) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK' })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.status])

  // Attach IPC scan event listener
  useEffect(() => {
    window.shellclaw.onScanEvent((event: ScanEvent) => {
      dispatch({ type: 'SCAN_EVENT', event })
    })
    return () => {
      window.shellclaw.removeAllScanListeners()
    }
  }, [])

  const handleStartScan = useCallback(
    async (config: { targetUrl: string; authToken: string }) => {
      dispatch({ type: 'START_SCAN', targetUrl: config.targetUrl })
      await window.shellclaw.startScan(config)
    },
    []
  )

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 select-none-ui">
      {state.status === ScanStatus.IDLE && <ConnectForm onStartScan={handleStartScan} />}
      {state.status === ScanStatus.RUNNING && <ScanDashboard state={state} />}
      {(state.status === ScanStatus.COMPLETE || state.status === ScanStatus.ERROR) && (
        <FindingsPanel state={state} onReset={handleReset} />
      )}
    </div>
  )
}

// ── Extend Window type for preload API ─────────────────────────

declare global {
  interface Window {
    shellclaw: {
      startScan: (config: { targetUrl: string; authToken: string }) => Promise<void>
      onScanEvent: (callback: (event: ScanEvent) => void) => void
      removeAllScanListeners: () => void
      getStatus: () => Promise<ScanState | null>
      readOpenClawConfig: () => Promise<{
        gateway?: { port?: number; auth?: { token?: string } }
      } | null>
    }
  }
}
