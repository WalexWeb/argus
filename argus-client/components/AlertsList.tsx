'use client';

import type { Alert } from '@/lib/api';
import { SeverityBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <p className="text-base">Алерты не обнаружены</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertTableRow key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function AlertTableRow({ alert }: { alert: Alert }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] transition hover:border-pistachio-500/20 hover:bg-white/[0.03]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 text-left hover:bg-white/[0.01]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-pistachio-400 opacity-75">
                #{alert.id}
              </span>
              <h3 className="font-semibold text-zinc-100">{alert.name}</h3>
            </div>
            <p className="mt-1.5 text-sm text-zinc-400">{alert.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-pistachio-500/10 px-2.5 py-1 font-mono text-xs text-pistachio-300">
                {alert.rule}
              </span>
              <span className="text-xs text-zinc-500">
                {alert.related_events.length} связанных событий
              </span>
              <span className="text-xs text-zinc-600">
                {formatDate(alert.triggered_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SeverityBadge severity={alert.severity} />
            <svg
              className={`h-5 w-5 text-zinc-500 transition ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.03] px-5 py-4">
          {Object.keys(alert.evidence).length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-zinc-300">Доказательства:</h4>
              <EvidenceDisplay evidence={alert.evidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceDisplay({ evidence }: { evidence: Record<string, unknown> }) {
  return (
    <div className="space-y-2 rounded-lg bg-black/40 p-4">
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="border-l-2 border-pistachio-500/30 pl-3">
          <p className="text-xs font-mono uppercase text-pistachio-400/70">{key}</p>
          <p className="mt-1 text-sm text-zinc-300">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AlertCards({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p className="text-base text-zinc-500">Алерты не обнаружены</p>;
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-pistachio-500/25 hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-pistachio-400">{alert.rule}</span>
            <SeverityBadge severity={alert.severity} />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">{alert.name}</h3>
          <p className="mt-2 text-sm text-zinc-400">{alert.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">ID</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-200">#{alert.id}</p>
        </div>
        <div className="rounded-lg bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Связанные события</p>
          <p className="mt-1 text-lg font-semibold text-pistachio-400">
            {alert.related_events.length}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Время срабатывания</p>
          <p className="mt-1 text-sm font-mono text-zinc-300">
            {formatDate(alert.triggered_at)}
          </p>
        </div>
      </div>

      {Object.keys(alert.evidence).length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-pistachio-400 hover:text-pistachio-300"
          >
            {isExpanded ? '▼ Скрыть доказательства' : '▶ Показать доказательства'}
          </button>
          {isExpanded && (
            <div className="mt-3">
              <EvidenceDisplay evidence={alert.evidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
