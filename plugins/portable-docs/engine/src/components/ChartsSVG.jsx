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
// Shared plotted-area geometry for cartesian charts.
const PLOT = { w: 640, h: 320, padL: 56, padR: 16, padT: 16, padB: 48 };
const plotBox = () => ({
  x0: PLOT.padL, x1: PLOT.w - PLOT.padR, y0: PLOT.h - PLOT.padB, y1: PLOT.padT,
  iw: PLOT.w - PLOT.padL - PLOT.padR, ih: PLOT.h - PLOT.padT - PLOT.padB,
});

// Y axis (grid lines + tick labels) for a 0..max scale.
const YAxis = ({ scale, box, ylabel }) => (
  <g>
    {scale.ticks.map((t, i) => {
      const y = box.y0 - (t / scale.max) * box.ih;
      return (
        <g key={i}>
          <line x1={box.x0} y1={y} x2={box.x1} y2={y} stroke={COLORS.ink[100]} strokeWidth="1" />
          <text x={box.x0 - 8} y={y + 4} textAnchor="end"
                fontFamily={FONTS.mono} fontSize="11" fill={COLORS.ink[400]}>{t}</text>
        </g>
      );
    })}
    {ylabel && (
      <text x={14} y={box.y1 + box.ih / 2} textAnchor="middle"
            transform={`rotate(-90 14 ${box.y1 + box.ih / 2})`}
            fontFamily={FONTS.mono} fontSize="11" fill={COLORS.ink[400]}>{ylabel}</text>
    )}
  </g>
);

const BarChartBase = ({ data, stacked }) => {
  const { title, subtitle, categories = [], series = [], ylabel } = data;
  if (!categories.length || !series.length) return <ChartEmpty title={title} />;
  const box = plotBox();
  const max = stacked
    ? Math.max(...categories.map((_, ci) => series.reduce((s, se) => s + (se.values[ci] || 0), 0)))
    : Math.max(...series.flatMap((se) => se.values));
  const scale = niceScale(0, max);
  const groupW = box.iw / categories.length;
  const colorOf = (i) => CHART_COLORS[i % CHART_COLORS.length];
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} width="100%" role="img" aria-label={title || 'Bar chart'}>
        <YAxis scale={scale} box={box} ylabel={ylabel} />
        {categories.map((cat, ci) => {
          const gx = box.x0 + ci * groupW;
          let stackTop = box.y0;
          return (
            <g key={ci}>
              {series.map((se, si) => {
                const v = se.values[ci] || 0;
                const hgt = (v / scale.max) * box.ih;
                if (stacked) {
                  const y = stackTop - hgt;
                  const barW = groupW * 0.6;
                  const rect = (
                    <rect key={si} x={gx + (groupW - barW) / 2} y={y} width={barW} height={hgt}
                          fill={colorOf(si)} />
                  );
                  stackTop = y;
                  return rect;
                }
                const barW = (groupW * 0.7) / series.length;
                const x = gx + groupW * 0.15 + si * barW;
                return <rect key={si} x={x} y={box.y0 - hgt} width={barW * 0.85} height={hgt} fill={colorOf(si)} />;
              })}
              <text x={gx + groupW / 2} y={box.y0 + 18} textAnchor="middle"
                    fontFamily={FONTS.ui} fontSize="11" fill={COLORS.ink[600]}>{cat}</text>
            </g>
          );
        })}
      </svg>
      <Legend items={series.map((se, i) => ({ label: se.name, color: colorOf(i) }))} />
    </ChartFrame>
  );
};

const GroupedBarChart = ({ data }) => <BarChartBase data={data} stacked={false} />;
const StackedBarChart = ({ data }) => <BarChartBase data={data} stacked={true} />;
// X positions evenly spaced across the plot for N categories (centered).
const xPositions = (box, n) => {
  if (n === 1) return [box.x0 + box.iw / 2];
  return Array.from({ length: n }, (_, i) => box.x0 + (i / (n - 1)) * box.iw);
};

const LineAreaBase = ({ data, filled }) => {
  const { title, subtitle, categories = [], series = [], ylabel } = data;
  if (!categories.length || !series.length) return <ChartEmpty title={title} />;
  const box = plotBox();
  const max = Math.max(...series.flatMap((se) => se.values), 0);
  const scale = niceScale(0, max);
  const xs = xPositions(box, categories.length);
  const yOf = (v) => box.y0 - (v / scale.max) * box.ih;
  const colorOf = (i) => CHART_COLORS[i % CHART_COLORS.length];
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} width="100%" role="img" aria-label={title || 'Line chart'}>
        <YAxis scale={scale} box={box} ylabel={ylabel} />
        {series.map((se, si) => {
          const pts = se.values.map((v, i) => `${xs[i].toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
          const color = colorOf(si);
          return (
            <g key={si}>
              {filled && (
                <polygon
                  points={`${xs[0].toFixed(1)},${box.y0} ${pts} ${xs[xs.length - 1].toFixed(1)},${box.y0}`}
                  fill={color} fillOpacity="0.15" stroke="none" />
              )}
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
                        strokeLinejoin="round" strokeLinecap="round" />
              {se.values.map((v, i) => (
                <circle key={i} cx={xs[i]} cy={yOf(v)} r="3" fill={color} />
              ))}
            </g>
          );
        })}
        {categories.map((cat, i) => (
          <text key={i} x={xs[i]} y={box.y0 + 18} textAnchor="middle"
                fontFamily={FONTS.ui} fontSize="11" fill={COLORS.ink[600]}>{cat}</text>
        ))}
      </svg>
      <Legend items={series.map((se, i) => ({ label: se.name, color: colorOf(i) }))} />
    </ChartFrame>
  );
};

const AreaChart = ({ data }) => <LineAreaBase data={data} filled={true} />;
const LineChart = ({ data }) => <LineAreaBase data={data} filled={false} />;
const ScatterChart = ({ data }) => {
  const { title, subtitle, points = [], xlabel, ylabel } = data;
  if (!points.length) return <ChartEmpty title={title} />;
  const box = plotBox();
  const xs = niceScale(Math.min(...points.map((p) => p.x), 0), Math.max(...points.map((p) => p.x)));
  const ys = niceScale(Math.min(...points.map((p) => p.y), 0), Math.max(...points.map((p) => p.y)));
  const px = (x) => box.x0 + ((x - xs.min) / (xs.max - xs.min)) * box.iw;
  const py = (y) => box.y0 - ((y - ys.min) / (ys.max - ys.min)) * box.ih;
  const seriesNames = [...new Set(points.map((p) => p.series).filter(Boolean))];
  const colorOf = (p) => {
    const i = seriesNames.indexOf(p.series);
    return CHART_COLORS[(i >= 0 ? i : 0) % CHART_COLORS.length];
  };
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} width="100%" role="img" aria-label={title || 'Scatter chart'}>
        <YAxis scale={ys} box={box} ylabel={ylabel} />
        {xs.ticks.map((t, i) => (
          <text key={i} x={px(t)} y={box.y0 + 18} textAnchor="middle"
                fontFamily={FONTS.mono} fontSize="11" fill={COLORS.ink[400]}>{t}</text>
        ))}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={px(p.x)} cy={py(p.y)} r="6" fill={colorOf(p)} fillOpacity="0.85"
                    stroke={COLORS.surface.elevated} strokeWidth="1.5" />
            {p.label && (
              <text x={px(p.x)} y={py(p.y) - 10} textAnchor="middle"
                    fontFamily={FONTS.ui} fontSize="10" fill={COLORS.ink[600]}>{p.label}</text>
            )}
          </g>
        ))}
        {xlabel && (
          <text x={box.x0 + box.iw / 2} y={PLOT.h - 6} textAnchor="middle"
                fontFamily={FONTS.mono} fontSize="11" fill={COLORS.ink[400]}>{xlabel}</text>
        )}
      </svg>
      {seriesNames.length > 0 && (
        <Legend items={seriesNames.map((n, i) => ({ label: n, color: CHART_COLORS[i % CHART_COLORS.length] }))} />
      )}
    </ChartFrame>
  );
};

export {
  niceScale, ChartFrame, Legend, ChartError, ChartEmpty,
  PLOT, plotBox, YAxis,
  polar, arcPath, PieSlices,
  PieChart, DonutChart, GroupedBarChart, StackedBarChart, AreaChart, LineChart, ScatterChart,
};
