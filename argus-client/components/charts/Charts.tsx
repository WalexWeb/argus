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
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#ec4899",
    "#14b8a6",
    "#64748b",
  ];

  const sorted = [...data].sort(
    (a, b) => Number(b[valueKey]) - Number(a[valueKey]),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Верхняя цветная шкала */}
      <div
        style={{
          display: "flex",
          overflow: "hidden",
          height: 10,
          borderRadius: 999,
          background: "#1b1b1b",
          marginBottom: 22,
        }}
      >
        {sorted.map((item, i) => (
          <div
            key={i}
            style={{
              width: `${(Number(item[valueKey]) / total) * 100}%`,
              background: colors[i % colors.length],
              transition: ".3s",
            }}
          />
        ))}
      </div>

      {/* Список */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {sorted.slice(0, 6).map((item, i) => {
          const value = Number(item[valueKey]);
          const percent = (value / total) * 100;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: colors[i % colors.length],
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    color: "#f5f5f5",
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {String(item[labelKey])}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    color: "#71717a",
                    fontSize: 12,
                  }}
                >
                  {percent.toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  color: "#fafafa",
                  fontWeight: 700,
                  fontSize: 18,
                  minWidth: 28,
                  textAlign: "right",
                }}
              >
                {value}
              </div>
            </div>
          );
        })}

        {sorted.length > 6 && (
          <div
            style={{
              marginTop: 4,
              color: "#71717a",
              fontSize: 12,
              textAlign: "center",
            }}
          ></div>
        )}
      </div>
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
