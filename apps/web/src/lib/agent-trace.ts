/**
 * Client-side trace of every agent call made by `api-client.ts`.
 * `ai` means a model (Gemini) produced the answer; `server` means a backend answered with rules;
 * `local` means the browser used its built-in fallback data; `error` means the call failed outright.
 */

export type AgentName =
  | 'VisionInventoryAgent'
  | 'SafetyGuardianAgent'
  | 'ResourceMatcherAgent'
  | 'CurriculumScaffolderAgent'
  | 'StepVisionAndARAgent'
  | 'LabReportSynthesizerAgent'
  | 'ProgressSync';

export type AgentCallSource = 'ai' | 'server' | 'local' | 'error';

export interface AgentCallRecord {
  id: number;
  agent: AgentName;
  endpoint: string;
  source: AgentCallSource;
  durationMs: number;
  detail: string;
  at: string;
}

type Listener = (records: AgentCallRecord[]) => void;

const MAX_RECORDS = 50;
let records: AgentCallRecord[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

export function recordAgentCall(entry: Omit<AgentCallRecord, 'id' | 'at'>): void {
  records = [{ ...entry, id: nextId++, at: new Date().toISOString() }, ...records].slice(
    0,
    MAX_RECORDS
  );
  listeners.forEach((fn) => fn(records));
}

export function getAgentCalls(): AgentCallRecord[] {
  return records;
}

export function clearAgentCalls(): void {
  records = [];
  listeners.forEach((fn) => fn(records));
}

export function subscribeAgentCalls(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
