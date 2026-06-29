"use client";

import Link from "next/link";
import type { Alert } from "@/lib/api";
import { SeverityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  closed: "Closed",
  false_positive: "False Positive",
};

export function AlertsExplorer({ alerts }: { alerts: Alert[] }) {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [rule, setRule] = useState("all");
  const [search, setSearch] = useState("");

  const rules = [...new Set(alerts.map((a) => a.rule))].sort();

  const filtered = alerts.filter((a) => {
    if (severity !== "all" && a.severity !== severity) return false;
    if (status !== "all" && (a.status ?? "open") !== status) return false;
    if (rule !== "all" && a.rule !== rule) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.name.toLowerCase().includes(q) &&
        !a.rule.toLowerCase().includes(q) &&
        !a.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const inputClass =
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-base text-zinc-200 placeholder:text-zinc-600 outline-none transition focus:border-pistachio-500/50 focus:ring-2 focus:ring-pistachio-500/20";

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Поиск по названию или правилу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`min-w-55 flex-1 ${inputClass}`}
        />
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
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все статусы</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="closed">Closed</option>
          <option value="false_positive">False Positive</option>
        </select>
        <select
          value={rule}
          onChange={(e) => setRule(e.target.value)}
          className={inputClass}
        >
          <option value="all">Все правила</option>
          {rules.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <AlertsTable alerts={filtered} />
    </div>
  );
}

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <p className="text-base">Алерты не обнаружены</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Название</th>
            <th className="pb-3 pr-4 font-medium">Критичность</th>
            <th className="pb-3 pr-4 font-medium">Правило</th>
            <th className="pb-3 pr-4 font-medium">Создан</th>
            <th className="pb-3 pr-4 font-medium">События</th>
            <th className="pb-3 pr-4 font-medium">Сущности</th>
            <th className="pb-3 pr-4 font-medium">Confidence</th>
            <th className="pb-3 pr-4 font-medium">Risk</th>
            <th className="pb-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <AlertTableRow key={alert.id} alert={alert} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertTableRow({ alert }: { alert: Alert }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer border-b border-white/4 transition hover:bg-white/2"
      >
        <td className="py-3.5 pr-4 font-medium text-zinc-100">{alert.name}</td>
        <td className="py-3 pr-4">
          <SeverityBadge severity={alert.severity} />
        </td>
        <td className="py-3 pr-4 font-mono text-xs text-pistachio-400">
          {alert.rule}
        </td>
        <td className="py-3 pr-4 text-zinc-400">
          {formatDate(alert.triggered_at)}
        </td>
        <td className="py-3 pr-4 font-mono text-zinc-300">
          {alert.related_events.length}
        </td>
        <td className="py-3 pr-4 font-mono text-zinc-300">
          {alert.entity_count ?? "—"}
        </td>
        <td className="py-3 pr-4 font-mono text-zinc-300">
          {alert.confidence_score ?? "—"}%
        </td>
        <td className="py-3 pr-4 font-mono text-zinc-300">
          {alert.risk_score ?? "—"}%
        </td>
        <td className="py-3">
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
            {STATUS_LABELS[alert.status ?? "open"]}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-white/4 bg-white/2">
          <td colSpan={9} className="px-5 py-4">
            <AlertDetailPanel alert={alert} />
          </td>
        </tr>
      )}
    </>
  );
}

function AlertDetailPanel({ alert }: { alert: Alert }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-zinc-400">
          Описание инцидента
        </h4>
        <p className="mt-1 text-zinc-200">{alert.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Событий в корреляции</p>
          <p className="mt-1 text-lg font-semibold text-pistachio-400">
            {alert.related_events.length}
          </p>
        </div>
        <div className="rounded-lg bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Сущностей</p>
          <p className="mt-1 text-lg font-semibold text-zinc-200">
            {alert.entity_count ?? "—"}
          </p>
        </div>
        <div className="rounded-lg bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Confidence Score</p>
          <p className="mt-1 text-lg font-semibold text-zinc-200">
            {alert.confidence_score ?? "—"}%
          </p>
        </div>
        <div className="rounded-lg bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Risk Score</p>
          <p className="mt-1 text-lg font-semibold text-zinc-200">
            {alert.risk_score ?? "—"}%
          </p>
        </div>
      </div>

      {Object.keys(alert.evidence).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-400">
            Причина создания
          </h4>
          <EvidenceDisplay evidence={alert.evidence} />
        </div>
      )}

      <Link
        href={`/correlation?alert=${alert.id}`}
        className="inline-flex items-center rounded-xl bg-pistachio-500/20 px-4 py-2 text-sm font-medium text-pistachio-300 ring-1 ring-pistachio-500/40 transition hover:bg-pistachio-500/30"
      >
        Открыть расследование →
      </Link>
    </div>
  );
}

function EvidenceDisplay({ evidence }: { evidence: Record<string, unknown> }) {
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-black/40 p-4">
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="border-l-2 border-pistachio-500/30 pl-3">
          <p className="text-xs font-mono uppercase text-pistachio-400/70">
            {key}
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            {typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AlertCards({
  alerts,
  linkToInvestigation = false,
}: {
  alerts: Alert[];
  linkToInvestigation?: boolean;
}) {
  if (alerts.length === 0) {
    return <p className="text-base text-zinc-500">Алерты не обнаружены</p>;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          linkToInvestigation={linkToInvestigation}
        />
      ))}
    </div>
  );
}

function AlertCard({
  alert,
  linkToInvestigation,
}: {
  alert: Alert;
  linkToInvestigation?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/2 px-5 py-4 transition hover:border-pistachio-500/20 hover:bg-white/3">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-zinc-100">{alert.name}</h3>
          <SeverityBadge severity={alert.severity} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="font-mono text-pistachio-400">{alert.rule}</span>
          <span>{formatDate(alert.triggered_at)}</span>
        </div>
      </div>
      {linkToInvestigation && (
        <span className="text-sm text-pistachio-400">→</span>
      )}
    </div>
  );

  if (linkToInvestigation) {
    return <Link href={`/correlation?alert=${alert.id}`}>{content}</Link>;
  }

  return content;
}
