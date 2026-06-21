'use client';

import { useMemo, useState } from 'react';
import type { SecurityEvent } from '@/lib/api';
import { EventsTable } from '@/components/EventsTable';
import { Card, CardHeader } from '@/components/ui/Card';

export function EventsExplorer({ events }: { events: SecurityEvent[] }) {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [eventType, setEventType] = useState('all');

  const sources = useMemo(
    () => [...new Set(events.map((e) => e.source))].sort(),
    [events],
  );

  const types = useMemo(
    () => [...new Set(events.map((e) => e.event_type))].sort(),
    [events],
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (source !== 'all' && e.source !== source) return false;
      if (eventType !== 'all' && e.event_type !== eventType) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          e.source,
          e.event_type,
          e.ip,
          e.username,
          JSON.stringify(e.details),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [events, source, eventType, search]);

  const inputClass =
    'rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-base text-zinc-200 placeholder:text-zinc-600 outline-none transition focus:border-pistachio-500/50 focus:ring-2 focus:ring-pistachio-500/20';

  return (
    <Card>
      <CardHeader
        title="Журнал событий"
        subtitle={`${filtered.length} из ${events.length} записей`}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Поиск по IP, пользователю, типу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`min-w-[220px] flex-1 ${inputClass}`}
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все источники</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все типы</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <EventsTable events={filtered} showDate />
    </Card>
  );
}
