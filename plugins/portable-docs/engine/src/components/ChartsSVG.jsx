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
const PieChart = ({ data }) => <ChartEmpty title={data.title} />;
const DonutChart = ({ data }) => <ChartEmpty title={data.title} />;
const GroupedBarChart = ({ data }) => <ChartEmpty title={data.title} />;
const StackedBarChart = ({ data }) => <ChartEmpty title={data.title} />;
const AreaChart = ({ data }) => <ChartEmpty title={data.title} />;
const LineChart = ({ data }) => <ChartEmpty title={data.title} />;
const ScatterChart = ({ data }) => <ChartEmpty title={data.title} />;

export {
  niceScale, ChartFrame, Legend, ChartError, ChartEmpty,
  PieChart, DonutChart, GroupedBarChart, StackedBarChart, AreaChart, LineChart, ScatterChart,
};
