"use client";

import { useMemo, useState } from "react";
import type { SecurityEvent } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { SeverityBadge, EventTypeBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type SortKey =
  | "timestamp"
  | "source"
  | "event_type"
  | "severity"
  | "ip"
  | "username"
  | "description";

type SortDir = "asc" | "desc";

const TABS = [
  { id: "general", label: "Общая информация" },
  { id: "normalized", label: "Нормализованное представление" },
  { id: "raw", label: "Исходный журнал" },
  { id: "dedup", label: "Дедупликация" },
] as const;

export function EventsExplorer({ events }: { events: SecurityEvent[] }) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [country, setCountry] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sources = useMemo(
    () => [...new Set(events.map((e) => e.source))].sort(),
    [events],
  );
  const types = useMemo(
    () => [...new Set(events.map((e) => e.event_type))].sort(),
    [events],
  );
  const countries = useMemo(
    () =>
      [
        ...new Set(events.map((e) => e.country).filter(Boolean) as string[]),
      ].sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const result = events.filter((e) => {
      if (source !== "all" && e.source !== source) return false;
      if (eventType !== "all" && e.event_type !== eventType) return false;
      if (severity !== "all" && (e.severity ?? "") !== severity) return false;
      if (country !== "all" && e.country !== country) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          e.source,
          e.event_type,
          e.ip,
          e.username,
          e.country,
          e.description,
          JSON.stringify(e.details),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      const cmp = av.localeCompare(bv, "ru", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [events, source, eventType, severity, country, search, sortKey, sortDir]);

  const selected = selectedId
    ? (events.find((e) => e.id === selectedId) ?? null)
    : null;

  const inputClass =
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-base text-zinc-200 placeholder:text-zinc-600 outline-none transition focus:border-pistachio-500/50 focus:ring-2 focus:ring-pistachio-500/20";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Card>
      <CardHeader
        title="Журнал событий"
        subtitle={`${filtered.length} из ${events.length} записей`}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Быстрый поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`min-w-55 flex-1 ${inputClass}`}
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
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все уровни</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="informational">Informational</option>
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все страны</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-zinc-500">
              {(
                [
                  ["timestamp", "Дата и время"],
                  ["source", "Источник"],
                  ["event_type", "Тип"],
                  ["severity", "Критичность"],
                  ["ip", "IP-адрес"],
                  ["username", "Пользователь"],
                  ["description", "Описание"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer pb-3 pr-4 font-medium hover:text-zinc-300"
                >
                  {label}
                  {sortKey === key && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => (
              <tr
                key={event.id}
                onClick={() =>
                  setSelectedId(selectedId === event.id ? null : event.id)
                }
                className={`cursor-pointer border-b border-white/4 transition hover:bg-white/2 ${
                  selectedId === event.id ? "bg-pistachio-500/5" : ""
                }`}
              >
                <td className="py-3 pr-4 text-zinc-400">
                  {formatDate(event.timestamp)}
                </td>
                <td className="py-3 pr-4 text-zinc-300">{event.source}</td>
                <td className="py-3 pr-4">
                  <EventTypeBadge type={event.event_type} />
                </td>
                <td className="py-3 pr-4">
                  {event.severity && isSeverity(event.severity) ? (
                    <SeverityBadge severity={event.severity} />
                  ) : (
                    <span className="text-zinc-500">
                      {event.severity ?? "—"}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 font-mono text-pistachio-400">
                  {event.ip ?? "—"}
                </td>
                <td className="py-3 pr-4 font-mono text-zinc-300">
                  {event.username ?? "—"}
                </td>
                <td className="py-3 max-w-50 truncate text-zinc-400">
                  {event.description ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <EventDetailCard event={selected} />}
    </Card>
  );
}

function isSeverity(s: string): s is "critical" | "high" | "medium" | "low" {
  return ["critical", "high", "medium", "low"].includes(s);
}

function getSortValue(event: SecurityEvent, key: SortKey): string {
  switch (key) {
    case "timestamp":
      return event.timestamp;
    case "source":
      return event.source;
    case "event_type":
      return event.event_type;
    case "severity":
      return event.severity ?? "";
    case "ip":
      return event.ip ?? "";
    case "username":
      return event.username ?? "";
    case "description":
      return event.description ?? "";
  }
}

function EventDetailCard({ event }: { event: SecurityEvent }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");

  return (
    <div className="mt-6 rounded-2xl border border-pistachio-500/20 bg-black/20 p-5">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-white/6 pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t.id
                ? "bg-pistachio-500/20 text-pistachio-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="ID события" value={`#${event.id}`} />
          <Field
            label="Время регистрации"
            value={formatDate(event.timestamp)}
          />
          <Field label="Источник" value={event.source} />
          <Field label="Тип события" value={event.event_type} />
          <Field label="Уровень критичности" value={event.severity ?? "—"} />
        </dl>
      )}

      {tab === "normalized" && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="IP-адрес" value={event.ip ?? "—"} mono />
          <Field label="Пользователь" value={event.username ?? "—"} mono />
          <Field
            label="Hostname"
            value={String(event.details.hostname ?? "—")}
            mono
          />
          <Field label="Страна" value={event.country ?? "—"} />
          <div className="sm:col-span-2">
            <p className="text-xs text-zinc-500">Дополнительные параметры</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
              {JSON.stringify(event.details, null, 2)}
            </pre>
          </div>
        </dl>
      )}

      {tab === "raw" && (
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-zinc-300">
          {JSON.stringify(event.raw_log ?? event.details, null, 2)}
        </pre>
      )}

      {tab === "dedup" && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="SHA-256" value={event.hash} mono />
          <Field
            label="Признак дубликата"
            value={event.is_duplicate ? "Да" : "Нет"}
          />
          <Field
            label="Количество одинаковых записей"
            value={String(event.duplicate_count ?? 1)}
          />
        </dl>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={`mt-1 text-sm text-zinc-200 ${mono ? "font-mono break-all" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
