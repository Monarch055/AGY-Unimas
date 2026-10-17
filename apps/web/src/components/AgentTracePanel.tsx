'use client';

import React, { useEffect, useState } from 'react';
import {
  clearAgentCalls,
  getAgentCalls,
  subscribeAgentCalls,
  type AgentCallRecord,
  type AgentName,
} from '../lib/agent-trace';
import { Button, Pill } from './ui';

export function useAgentCalls(): AgentCallRecord[] {
  const [calls, setCalls] = useState<AgentCallRecord[]>(getAgentCalls);
  useEffect(() => subscribeAgentCalls(setCalls), []);
  return calls;
}

const PIPELINE: { agent: AgentName; role: string }[] = [
  { agent: 'VisionInventoryAgent', role: 'Foto → daftar bahan' },
  { agent: 'SafetyGuardianAgent', role: 'Cek kombinasi berbahaya' },
  { agent: 'ResourceMatcherAgent', role: 'Cocokkan eksperimen' },
  { agent: 'CurriculumScaffolderAgent', role: 'Susun modul per jenjang' },
  { agent: 'StepVisionAndARAgent', role: 'Cek foto per langkah' },
  { agent: 'LabReportSynthesizerAgent', role: 'Susun laporan' },
];

function SourcePill({ source }: { source: AgentCallRecord['source'] }) {
  switch (source) {
    case 'ai':
      return <Pill tone="info">Gemini</Pill>;
    case 'server':
      return <Pill tone="ok">aturan</Pill>;
    case 'local':
      return <Pill tone="warn">lokal</Pill>;
    case 'error':
      return <Pill tone="danger">gagal</Pill>;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AgentTracePanel() {
  const calls = useAgentCalls();
  const lastByAgent = new Map<AgentName, AgentCallRecord>();
  for (const c of calls) {
    if (!lastByAgent.has(c.agent)) lastByAgent.set(c.agent, c);
  }

  return (
    <aside className="rounded-lg border border-stone-200 bg-white text-sm">
      <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="font-semibold text-stone-900">Agent</h2>
        {calls.length > 0 && (
          <Button variant="ghost" className="!px-2 !py-0.5 text-xs" onClick={clearAgentCalls}>
            Bersihkan
          </Button>
        )}
      </header>

      <ol className="divide-y divide-stone-100">
        {PIPELINE.map(({ agent, role }, i) => {
          const last = lastByAgent.get(agent);
          return (
            <li key={agent} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-xs text-stone-400">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-stone-900">{agent}</p>
                <p className="text-xs text-stone-500">{role}</p>
              </div>
              {last ? (
                <div className="text-right">
                  <SourcePill source={last.source} />
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-stone-400">{last.durationMs} ms</p>
                </div>
              ) : (
                <span className="text-xs text-stone-300">belum dipanggil</span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t border-stone-200 px-4 py-3">
        <h3 className="text-xs font-medium text-stone-500">Log panggilan</h3>
        {calls.length === 0 ? (
          <p className="mt-2 text-xs text-stone-400">Belum ada panggilan.</p>
        ) : (
          <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
            {calls.map((c) => (
              <li key={c.id} className="rounded border border-stone-100 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[11px] text-stone-700">{c.endpoint}</span>
                  <SourcePill source={c.source} />
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                  {formatTime(c.at)} · {c.durationMs} ms · {c.detail}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
          <span className="font-medium text-stone-500">Gemini</span>: dianalisis model AI.{' '}
          <span className="font-medium text-stone-500">aturan</span>: dijawab server dengan logika/data tetap.{' '}
          <span className="font-medium text-stone-500">lokal</span>: server tidak terjangkau, browser memakai data
          bawaan.
        </p>
      </div>
    </aside>
  );
}
