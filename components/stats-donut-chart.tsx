"use client";

const COLORS = ["#b69955", "#6b8f71", "#1a1a1a", "#d2b075", "#686868", "#997e3e"];

export function StatsDonutChart({
  items,
  labels,
  center,
}: {
  items: { key: string; count: number }[];
  labels: Record<string, string>;
  center: string;
}) {
  const visible = items.filter((i) => i.count > 0);
  const total = visible.reduce((s, i) => s + i.count, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (visible.length === 0) {
    return <p className="py-6 text-center text-sm text-brand-text-muted">—</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#ededed" strokeWidth="16" />
        {visible.map((item, i) => {
          const len = (item.count / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={item.key}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-brand-text" fontSize="13" fontWeight="700">
          {center}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {visible.map((item, i) => {
          const pct = Math.round((item.count / total) * 100);
          return (
            <li key={item.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate text-brand-text">{labels[item.key] ?? item.key}</span>
              </span>
              <span className="shrink-0 font-semibold text-brand-text">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
