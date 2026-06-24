/**
 * DiagramError — visible inline error card for @flow / @quadrant, styled to
 * match Chart's ChartError. Build-time resolver errors surface here instead of
 * crashing the render. `kind` labels the marker ("flow" | "quadrant").
 */
import React from 'react';
import { COLORS, FONTS, TYPE_SCALE, EFFECTS, SPACE, LAYOUT } from '../design-tokens';

const DiagramError = ({ kind, title, message }) => (
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
    <div style={{
      padding: `${SPACE[4]} ${SPACE[5]}`, borderRadius: EFFECTS.radius.md,
      background: COLORS.accent.wash, border: `1px solid ${COLORS.semantic.warning}`,
      fontFamily: FONTS.mono, fontSize: TYPE_SCALE.mono.sm.size, color: COLORS.semantic.warning,
    }}>⚠ {kind}: {message}</div>
  </div>
);

export default DiagramError;
