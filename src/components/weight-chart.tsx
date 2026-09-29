import { formatDateShort } from "@/lib/dates";
import { formatNumber } from "@/lib/labels";

/** Schlanker SVG-Linienchart fuer den Gewichtsverlauf. */
export function WeightChart({ points }: { points: { date: string; weightKg: number }[] }) {
  const w = 640;
  const h = 180;
  const pad = { top: 16, right: 16, bottom: 28, left: 44 };
  const values = points.map((p) => p.weightKg);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const x = (i: number) => pad.left + (i / Math.max(1, points.length - 1)) * (w - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - min) / Math.max(1, max - min)) * (h - pad.top - pad.bottom);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${h - pad.bottom} L${x(0)},${h - pad.bottom} Z`;
  const ticks = [min, (min + max) / 2, max];
  const last = points[points.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Gewichtsverlauf">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray="4 4" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {formatNumber(t, 1)}
            </text>
          </g>
        ))}
        <path d={area} className="fill-mint-100" />
        <path d={path} className="fill-none stroke-leaf-500" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.weightKg)} r={3.5} className="fill-surface stroke-leaf-600" strokeWidth={2}>
            <title>
              {formatDateShort(p.date)}: {formatNumber(p.weightKg, 1)} kg
            </title>
          </circle>
        ))}
        <text x={pad.left} y={h - 8} className="fill-muted text-[11px]">
          {formatDateShort(points[0].date)}
        </text>
        <text x={w - pad.right} y={h - 8} textAnchor="end" className="fill-muted text-[11px]">
          {formatDateShort(last.date)}
        </text>
      </svg>
    </figure>
  );
}
