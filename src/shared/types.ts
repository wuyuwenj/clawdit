export enum AttackCategory {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  DATA_LEAKAGE = 'DATA_LEAKAGE',
  UNAUTHORIZED_ACTIONS = 'UNAUTHORIZED_ACTIONS',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  INDIRECT_INJECTION = 'INDIRECT_INJECTION',
  CALENDAR_INJECTION = 'CALENDAR_INJECTION'
}

export enum ScanPhase {
  CONNECTING = 'CONNECTING',
  RECON = 'RECON',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  COMPLETE = 'COMPLETE'
}

export enum ScanStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ScanConfig {
  targetUrl: string
  authToken: string
  stepMode?: boolean
}

export interface MultiTurnStep {
  label: string
  prompt: string
  type?: 'chat' | 'cli'  // 'chat' = send to OpenClaw, 'cli' = execute locally
  delayAfterMs?: number
}

export interface TurnLogEntry {
  label: string
  prompt: string
  response: string
  durationMs: number
}

export interface Attack {
  id: string
  category: AttackCategory
  name: string
  prompt: string
  isTemplate: boolean
  multiTurn?: { turns: MultiTurnStep[] }
}

export interface AttackResult {
  id: string
  attackId: string
  category: AttackCategory
  compromised: boolean
  confidence: 'low' | 'medium' | 'high'
  severity: number // 0-5
  findingType: string
  evidence: string
  rationale: string
  remediation: string
  rawResponse: string
  attackPrompt: string
  attackName: string
  timestamp: number
  turnLog?: TurnLogEntry[]
}

export interface CategoryResult {
  category: AttackCategory
  status: 'pending' | 'running' | 'complete' | 'skipped'
  score: number
  attacks: Attack[]
  results: AttackResult[]
  skipReason?: string
}

export interface LogEntry {
  timestamp: number
  message: string
  level: 'info' | 'warn' | 'error' | 'attack' | 'result'
}

export interface ScanState {
  id: string
  status: ScanStatus
  phase: ScanPhase
  targetUrl: string
  startedAt: number
  elapsed: number
  categories: CategoryResult[]
  overallScore: number
  topFindings: AttackResult[]
  reconSummary: string
  log: LogEntry[]
  discoveredEmail?: string
}

export type ScanEvent =
  | { type: 'phase'; phase: ScanPhase }
  | { type: 'log'; entry: LogEntry }
  | { type: 'attack-start'; attack: Attack }
  | { type: 'attack-result'; result: AttackResult }
  | { type: 'category-update'; category: CategoryResult }
  | { type: 'complete'; state: ScanState }
  | { type: 'error'; message: string }
  | { type: 'paused'; nextAttack: Attack }
  | { type: 'paused-toggle'; paused: boolean }
  | { type: 'stopped' }

export const CATEGORY_LABELS: Record<AttackCategory, string> = {
  [AttackCategory.PROMPT_INJECTION]: 'Prompt Injection',
  [AttackCategory.DATA_LEAKAGE]: 'Data Leakage',
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 'Unauthorized Actions',
  [AttackCategory.ACCESS_CONTROL]: 'Access Control',
  [AttackCategory.INDIRECT_INJECTION]: 'Indirect Injection',
  [AttackCategory.CALENDAR_INJECTION]: 'Calendar Injection'
}

export interface CategoryColor {
  dot: string        // bg class for small dot indicators
  text: string       // text class for labels/accents
  icon: string       // text class for icon tint
  border: string     // border class for active/running state
  glow: string       // shadow glow for dot
  bgSubtle: string   // bg for subtle highlights
  borderSubtle: string // border for subtle highlights
}

export const CATEGORY_COLORS: Record<AttackCategory, CategoryColor> = {
  [AttackCategory.PROMPT_INJECTION]: {
    dot: 'bg-violet-500',
    text: 'text-violet-400',
    icon: 'text-violet-400',
    border: 'border-violet-500/50',
    glow: 'shadow-[0_0_5px_rgba(139,92,246,0.5)]',
    bgSubtle: 'bg-violet-500/10',
    borderSubtle: 'border-violet-500/20'
  },
  [AttackCategory.DATA_LEAKAGE]: {
    dot: 'bg-sky-500',
    text: 'text-sky-400',
    icon: 'text-sky-400',
    border: 'border-sky-500/50',
    glow: 'shadow-[0_0_5px_rgba(14,165,233,0.5)]',
    bgSubtle: 'bg-sky-500/10',
    borderSubtle: 'border-sky-500/20'
  },
  [AttackCategory.UNAUTHORIZED_ACTIONS]: {
    dot: 'bg-amber-500',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    border: 'border-amber-500/50',
    glow: 'shadow-[0_0_5px_rgba(245,158,11,0.5)]',
    bgSubtle: 'bg-amber-500/10',
    borderSubtle: 'border-amber-500/20'
  },
  [AttackCategory.ACCESS_CONTROL]: {
    dot: 'bg-rose-500',
    text: 'text-rose-400',
    icon: 'text-rose-400',
    border: 'border-rose-500/50',
    glow: 'shadow-[0_0_5px_rgba(244,63,94,0.5)]',
    bgSubtle: 'bg-rose-500/10',
    borderSubtle: 'border-rose-500/20'
  },
  [AttackCategory.INDIRECT_INJECTION]: {
    dot: 'bg-teal-500',
    text: 'text-teal-400',
    icon: 'text-teal-400',
    border: 'border-teal-500/50',
    glow: 'shadow-[0_0_5px_rgba(20,184,166,0.5)]',
    bgSubtle: 'bg-teal-500/10',
    borderSubtle: 'border-teal-500/20'
  },
  [AttackCategory.CALENDAR_INJECTION]: {
    dot: 'bg-cyan-500',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
    border: 'border-cyan-500/50',
    glow: 'shadow-[0_0_5px_rgba(34,211,238,0.5)]',
    bgSubtle: 'bg-cyan-500/10',
    borderSubtle: 'border-cyan-500/20'
  }
}

export const CATEGORY_WEIGHTS: Record<AttackCategory, number> = {
  [AttackCategory.PROMPT_INJECTION]: 0.25,
  [AttackCategory.DATA_LEAKAGE]: 0.25,
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 0.20,
  [AttackCategory.ACCESS_CONTROL]: 0.10,
  [AttackCategory.INDIRECT_INJECTION]: 0.10,
  [AttackCategory.CALENDAR_INJECTION]: 0.10
}
