/**
 * ChartsSVG — hand-rolled inline-SVG chart components (Phase 4a).
 *
 * Static (no IntersectionObserver) so the server-rendered SVG is always correct.
 * Reuses the editorial card chrome + CHART_COLORS. Each chart component takes a
 * single `data` prop = the resolved chart object from charts.js and reads its
 * normalized payload off it.
 */
import React from 'react';
import { COLORS, FONTS, TYPE_SCALE, EFFECTS, SPACE, CHART_COLORS, LAYOUT } from '../design-tokens';

// ── Pure scale helper ────────────────────────────────────────────────────────
// Round [min,max] outward to "nice" round numbers and return evenly-spaced ticks.
const niceScale = (min, max, ticks = 5) => {
  if (!(max > min)) max = min + 1;
  const rawStep = (max - min) / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const out = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) out.push(Number(v.toFixed(6)));
  return { min: niceMin, max: niceMax, step, ticks: out };
};

// ── Card chrome (matches existing Chart.jsx header treatment) ────────────────
const ChartFrame = ({ title, subtitle, children }) => (
  <div style={{
    marginTop: SPACE[5], marginBottom: SPACE[5], padding: SPACE[5],
    background: COLORS.surface.elevated, borderRadius: EFFECTS.radius.lg,
    border: `1px solid ${COLORS.ink[200]}`, maxWidth: LAYOUT.maxWidth.prose,
  }}>
    {(title || subtitle) && (
      <div style={{ marginBottom: SPACE[5] }}>
        {title && (
          <h4 style={{
            fontFamily: FONTS.headline, fontSize: TYPE_SCALE.headline.sm.size,
            fontWeight: TYPE_SCALE.headline.sm.weight, color: COLORS.ink[800], margin: 0,
          }}>{title}</h4>
        )}
        {subtitle && (
          <p style={{
            fontFamily: FONTS.mono, fontSize: TYPE_SCALE.mono.sm.size,
            color: COLORS.ink[400], margin: 0, marginTop: SPACE[1],
          }}>{subtitle}</p>
        )}
      </div>
    )}
    {children}
  </div>
);

const Legend = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[4] }}>
    {items.map((it, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: it.color, flexShrink: 0 }} />
        <span style={{ fontFamily: FONTS.ui, fontSize: TYPE_SCALE.ui.sm.size, color: COLORS.ink[600] }}>{it.label}</span>
      </div>
    ))}
  </div>
);

const ChartError = ({ title, message }) => (
  <ChartFrame title={title}>
    <div style={{
      padding: `${SPACE[4]} ${SPACE[5]}`, borderRadius: EFFECTS.radius.md,
      background: COLORS.accent.wash, border: `1px solid ${COLORS.semantic.warning}`,
      fontFamily: FONTS.mono, fontSize: TYPE_SCALE.mono.sm.size, color: COLORS.semantic.warning,
    }}>⚠ chart: {message}</div>
  </ChartFrame>
);

const ChartEmpty = ({ title }) => (
  <ChartFrame title={title}>
    <div style={{
      padding: SPACE[6], textAlign: 'center', fontFamily: FONTS.ui,
      fontSize: TYPE_SCALE.ui.sm.size, color: COLORS.ink[400],
    }}>No data</div>
  </ChartFrame>
);

// ── Chart components (added in Tasks 6–9) ────────────────────────────────────

// Shared geometry for pie/donut.
const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const arcPath = (cx, cy, r, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
};

const PieSlices = ({ data, hole }) => {
  const { title, subtitle, slices = [] } = data;
  if (!slices.length) return <ChartEmpty title={title} />;
  const total = slices.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const cx = 130, cy = 130, r = 120;
  let angle = -Math.PI / 2;
  const segs = slices.map((s, i) => {
    const frac = (s.value || 0) / total;
    const seg = { ...s, a0: angle, a1: angle + frac * Math.PI * 2,
      color: s.color || CHART_COLORS[i % CHART_COLORS.length], pct: Math.round(frac * 100) };
    angle = seg.a1;
    return seg;
  });
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <div style={{ display: 'flex', gap: SPACE[6], alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <svg viewBox="0 0 260 260" width="240" height="240" role="img" aria-label={title || 'Pie chart'}>
          {segs.map((s, i) => (
            <path key={i} d={arcPath(cx, cy, r, s.a0, s.a1)} fill={s.color}
                  stroke={COLORS.surface.elevated} strokeWidth="2" />
          ))}
          {hole > 0 && <circle cx={cx} cy={cy} r={r * hole} fill={COLORS.surface.elevated} />}
        </svg>
        <Legend items={segs.map((s) => ({ label: `${s.label} — ${s.pct}%`, color: s.color }))} />
      </div>
    </ChartFrame>
  );
};

const PieChart = ({ data }) => <PieSlices data={data} hole={0} />;
const DonutChart = ({ data }) => <PieSlices data={data} hole={0.58} />;
const GroupedBarChart = ({ data }) => <ChartEmpty title={data.title} />;
const StackedBarChart = ({ data }) => <ChartEmpty title={data.title} />;
const AreaChart = ({ data }) => <ChartEmpty title={data.title} />;
const LineChart = ({ data }) => <ChartEmpty title={data.title} />;
const ScatterChart = ({ data }) => <ChartEmpty title={data.title} />;

export {
  niceScale, ChartFrame, Legend, ChartError, ChartEmpty,
  polar, arcPath, PieSlices,
  PieChart, DonutChart, GroupedBarChart, StackedBarChart, AreaChart, LineChart, ScatterChart,
};
