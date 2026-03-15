export enum AttackCategory {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  DATA_LEAKAGE = 'DATA_LEAKAGE',
  UNAUTHORIZED_ACTIONS = 'UNAUTHORIZED_ACTIONS',
  ACCESS_CONTROL = 'ACCESS_CONTROL'
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
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ScanConfig {
  targetUrl: string
  authToken: string
}

export interface Attack {
  id: string
  category: AttackCategory
  name: string
  prompt: string
  isTemplate: boolean
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
}

export interface CategoryResult {
  category: AttackCategory
  status: 'pending' | 'running' | 'complete'
  score: number
  attacks: Attack[]
  results: AttackResult[]
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
}

export type ScanEvent =
  | { type: 'phase'; phase: ScanPhase }
  | { type: 'log'; entry: LogEntry }
  | { type: 'attack-start'; attack: Attack }
  | { type: 'attack-result'; result: AttackResult }
  | { type: 'category-update'; category: CategoryResult }
  | { type: 'complete'; state: ScanState }
  | { type: 'error'; message: string }

export const CATEGORY_LABELS: Record<AttackCategory, string> = {
  [AttackCategory.PROMPT_INJECTION]: 'Prompt Injection',
  [AttackCategory.DATA_LEAKAGE]: 'Data Leakage',
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 'Unauthorized Actions',
  [AttackCategory.ACCESS_CONTROL]: 'Access Control'
}

export const CATEGORY_WEIGHTS: Record<AttackCategory, number> = {
  [AttackCategory.PROMPT_INJECTION]: 0.3,
  [AttackCategory.DATA_LEAKAGE]: 0.3,
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 0.25,
  [AttackCategory.ACCESS_CONTROL]: 0.15
}
