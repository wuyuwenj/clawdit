export enum AttackCategory {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  DATA_LEAKAGE = 'DATA_LEAKAGE',
  UNAUTHORIZED_ACTIONS = 'UNAUTHORIZED_ACTIONS',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  INDIRECT_INJECTION = 'INDIRECT_INJECTION'
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
  [AttackCategory.INDIRECT_INJECTION]: 'Indirect Injection'
}

export const CATEGORY_WEIGHTS: Record<AttackCategory, number> = {
  [AttackCategory.PROMPT_INJECTION]: 0.25,
  [AttackCategory.DATA_LEAKAGE]: 0.25,
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 0.20,
  [AttackCategory.ACCESS_CONTROL]: 0.10,
  [AttackCategory.INDIRECT_INJECTION]: 0.20
}
