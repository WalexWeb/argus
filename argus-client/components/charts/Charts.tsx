"use client";

import { cn } from "@/lib/utils";

export function BarChart({
  data,
  labelKey,
  valueKey,
  color = "bg-pistachio-500",
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{String(item[labelKey])}</span>
            <span>{item[valueKey]}</span>
          </div>

          <div
            style={{
              width: "100%",
              height: 10,
              background: "#202020",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: `${(Number(item[valueKey]) / max) * 100}%`,
                height: "100%",
                background: "#78d64b",
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineChart({
  data,
}: {
  data: { hour: string; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  console.table(data);
  return (
    <div
      style={{
        position: "relative",
        height: 320,
        width: "100%",
        padding: "20px 12px 36px",
      }}
    >
      {/* Горизонтальная сетка */}
      {[0, 25, 50, 75, 100].map((v) => (
        <div
          key={v}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${36 + v * 2.5}px`,
            borderTop: "1px solid rgba(255,255,255,.05)",
          }}
        />
      ))}

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        {data.map((point) => {
          const percent =
            point.count === 0 ? 4 : Math.max((point.count / max) * 100, 8);

          return (
            <div
              key={point.hour}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  fontSize: 12,
                  color: "#b4b4b4",
                  fontWeight: 600,
                }}
              >
                {point.count}
              </div>

              <div
                style={{
                  width: "70%",
                  height: `${percent}%`,
                  borderRadius: "12px 12px 4px 4px",
                  background: "linear-gradient(to top,#4b8f2f,#78d64b,#b8ff7a)",
                  boxShadow:
                    "0 0 18px rgba(132,204,22,.35), inset 0 1px rgba(255,255,255,.2)",
                  transition: ".35s",
                }}
              />

              <div
                style={{
                  marginTop: 12,
                  color: "#8a8a8a",
                  fontSize: 12,
                }}
              >
                {new Date(point.hour).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  labelKey,
  valueKey,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  const total = data.reduce((s, d) => s + Number(d[valueKey]), 0);

  const colors = [
    "#84cc16",
    "#a3e635",
    "#65a30d",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 14,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {data.map((item, i) => (
          <div
            key={i}
            style={{
              width: `${(Number(item[valueKey]) / total) * 100}%`,
              background: colors[i % colors.length],
            }}
          />
        ))}
      </div>

      {data.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors[i % colors.length],
              marginRight: 8,
            }}
          />

          <span>{String(item[labelKey])}</span>

          <span style={{ marginLeft: "auto" }}>{item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export function SeverityChart({
  data,
}: {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}) {
  const items = [
    { label: "Критический", value: data.critical, color: "#ef4444" },
    { label: "Высокий", value: data.high, color: "#f97316" },
    { label: "Средний", value: data.medium, color: "#f59e0b" },
    { label: "Низкий", value: data.low, color: "#0ea5e9" },
  ];

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div>{item.label}</div>

          <div style={{ fontSize: 28 }}>{item.value}</div>

          <div
            style={{
              height: 8,
              background: "#222",
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: "100%",
                background: item.color,
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
