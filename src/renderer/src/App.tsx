import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  ScanState,
  ScanStatus,
  ScanPhase,
  ScanEvent,
  Attack,
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

interface AppState extends ScanState {
  startedAttackIds: Set<string>
}

function createInitialState(): AppState {
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
      createEmptyCategory(AttackCategory.ACCESS_CONTROL),
      createEmptyCategory(AttackCategory.INDIRECT_INJECTION),
      createEmptyCategory(AttackCategory.CALENDAR_INJECTION)
    ],
    overallScore: 100,
    topFindings: [],
    reconSummary: '',
    log: [],
    startedAttackIds: new Set()
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

function scanReducer(state: AppState, action: Action): AppState {
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
          const newStarted = new Set(state.startedAttackIds)
          newStarted.add(event.attack.id)
          const categories = state.categories.map((cat) => {
            if (cat.category === event.attack.category) {
              return { ...cat, status: 'running' as const }
            }
            return cat
          })
          return { ...state, categories, startedAttackIds: newStarted }
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
            startedAttackIds: state.startedAttackIds,
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
  const [paused, setPaused] = useState(false)
  const [nextAttack, setNextAttack] = useState<Attack | null>(null)
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
      if (event.type === 'paused') {
        // Step mode pause (waiting for next click)
        setPaused(true)
        setNextAttack(event.nextAttack)
      } else if (event.type === 'paused-toggle') {
        // Manual pause/resume toggle
        setPaused(event.paused)
        if (!event.paused) setNextAttack(null)
      } else if (event.type === 'attack-start') {
        setNextAttack(null)
      } else if (event.type === 'stopped' || event.type === 'complete') {
        setPaused(false)
        setNextAttack(null)
      }
    })
    return () => {
      window.shellclaw.removeAllScanListeners()
    }
  }, [])

  const handleStartScan = useCallback(
    async (config: { targetUrl: string; authToken: string; stepMode?: boolean }) => {
      dispatch({ type: 'START_SCAN', targetUrl: config.targetUrl })
      setPaused(false)
      setNextAttack(null)
      const result = await window.shellclaw.startScan(config)

      if (result.error) {
        dispatch({ type: 'SCAN_EVENT', event: { type: 'error', message: result.error } })
      }
    },
    []
  )

  const handlePause = useCallback(async () => {
    await window.shellclaw.pauseScan()
  }, [])

  const handleStop = useCallback(async () => {
    await window.shellclaw.stopScan()
  }, [])

  const handleNext = useCallback(async () => {
    await window.shellclaw.nextStep()
  }, [])

  const handleReset = useCallback(() => {
    setView('auto')
    setPaused(false)
    setNextAttack(null)
    dispatch({ type: 'RESET' })
  }, [])

  const isComplete = state.status === ScanStatus.COMPLETE || state.status === ScanStatus.ERROR
  const showDashboard =
    state.status === ScanStatus.RUNNING || (isComplete && view === 'dashboard')
  const showFindings = isComplete && view !== 'dashboard'

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0c] text-gray-100 font-sans select-none-ui">
      {state.status === ScanStatus.IDLE && <ConnectForm onStartScan={handleStartScan} />}
      {showDashboard && (
        <ScanDashboard
          state={state}
          paused={paused}
          nextAttack={nextAttack}
          onPause={handlePause}
          onStop={handleStop}
          onNext={handleNext}
          onViewFindings={isComplete ? () => setView('findings') : undefined}
        />
      )}
      {showFindings && (
        <FindingsPanel
          state={state}
          onReset={handleReset}
          onViewLogs={() => setView('dashboard')}
        />
      )}
    </div>
  )
}

// ── Extend Window type for preload API ─────────────────────────

declare global {
  interface Window {
    shellclaw: {
      startScan: (config: { targetUrl: string; authToken: string; stepMode?: boolean }) => Promise<void>
      pauseScan: () => Promise<void>
      stopScan: () => Promise<void>
      nextStep: () => Promise<void>
      onScanEvent: (callback: (event: ScanEvent) => void) => void
      removeAllScanListeners: () => void
      getStatus: () => Promise<ScanState | null>
      readOpenClawConfig: () => Promise<{
        gateway?: { port?: number; auth?: { token?: string } }
      } | null>
      getPreloadedGateway: () => Promise<{
        success: boolean
        config?: { url: string; token: string }
        error?: string
        errorType?: 'no_config' | 'no_token' | 'gateway_down' | 'auth_failed' | 'auto_fix_failed'
        autoFixed?: boolean
      } | null>
    }
  }
}
