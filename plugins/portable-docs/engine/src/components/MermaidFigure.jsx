// engine/src/components/MermaidFigure.jsx
/**
 * MermaidFigure — renders a @mermaid diagram resolved at BUILD TIME.
 *
 * `data` is { svg } on success or { source, error } on fallback. The SVG is
 * produced at build time by the vendored Mermaid with securityLevel:'strict'
 * from author-controlled source, and is static — so injecting it via
 * dangerouslySetInnerHTML is safe and intentional (the codebase's only such
 * use). The fallback path renders the raw source as ESCAPED JSX text in a
 * <pre>, never injected.
 */
import React from 'react';
import { COLORS, FONTS, TYPE_SCALE, EFFECTS, SPACE, LAYOUT } from '../design-tokens';

const Frame = ({ title, children }) => (
  <div style={{
    marginTop: SPACE[5], marginBottom: SPACE[5], padding: SPACE[5],
    background: COLORS.surface.elevated, borderRadius: EFFECTS.radius.lg,
    border: `1px solid ${COLORS.ink[200]}`, maxWidth: LAYOUT.maxWidth.prose,
  }}>
    {title && (
      <h4 style={{
        fontFamily: FONTS.headline, fontSize: TYPE_SCALE.headline.sm.size,
        fontWeight: TYPE_SCALE.headline.sm.weight, color: COLORS.ink[800],
        margin: 0, marginBottom: SPACE[4],
      }}>{title}</h4>
    )}
    {children}
  </div>
);

const MermaidFigure = ({ data, title }) => {
  if (!data) return null;
  if (data.error) {
    return (
      <Frame title={title}>
        <div style={{
          fontFamily: FONTS.mono, fontSize: TYPE_SCALE.mono.sm.size,
          color: COLORS.semantic.warning, marginBottom: SPACE[2],
        }}>⚠ mermaid: {data.error}</div>
        <pre style={{
          fontFamily: FONTS.mono, fontSize: TYPE_SCALE.mono.sm.size,
          color: COLORS.ink[600], background: COLORS.surface.paper,
          border: `1px solid ${COLORS.ink[100]}`, borderRadius: EFFECTS.radius.md,
          padding: SPACE[4], overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0,
        }}>{data.source}</pre>
      </Frame>
    );
  }
  return (
    <Frame title={title}>
      <div style={{ textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: data.svg }} />
    </Frame>
  );
};

export default MermaidFigure;
