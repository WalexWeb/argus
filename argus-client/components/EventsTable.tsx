'use client';

import type { SecurityEvent } from '@/lib/api';
import { EventTypeBadge } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/utils';
import { useState } from 'react';

export function EventsTable({
  events,
  showDate = false,
}: {
  events: SecurityEvent[];
  showDate?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <p className="text-base">События не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventRow key={event.id} event={event} showDate={showDate} />
      ))}
    </div>
  );
}

function EventRow({
  event,
  showDate,
}: {
  event: SecurityEvent;
  showDate?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timestamp = showDate ? formatDate(event.timestamp) : formatTime(event.timestamp);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] transition hover:border-pistachio-500/20 hover:bg-white/[0.03]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 text-left hover:bg-white/[0.01]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-zinc-600">ID: {event.id}</span>
              <EventTypeBadge type={event.event_type} />
              <span className="text-xs text-zinc-500">{event.source}</span>
              <span className="text-xs text-zinc-600">{timestamp}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-600">IP адрес</p>
                <p className="font-mono text-sm text-pistachio-400">
                  {event.ip ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Пользователь</p>
                <p className="font-mono text-sm text-zinc-300">
                  {event.username ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Хеш события</p>
                <p className="font-mono text-sm text-zinc-400">
                  {event.hash.substring(0, 16)}...
                </p>
              </div>
            </div>
          </div>
          <svg
            className={`h-5 w-5 text-zinc-500 transition ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </button>

      {isExpanded && Object.keys(event.details).length > 0 && (
        <div className="border-t border-white/[0.03] px-5 py-4">
          <h4 className="mb-3 text-sm font-semibold text-zinc-300">Детали события:</h4>
          <EventDetailsDisplay details={event.details} />
        </div>
      )}
    </div>
  );
}

function EventDetailsDisplay({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3 rounded-lg bg-black/40 p-4">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="border-l-2 border-pistachio-500/30 pl-3">
          <p className="text-xs font-mono uppercase text-pistachio-400/70">{key}</p>
          <p className="mt-1 break-words text-sm text-zinc-300">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
