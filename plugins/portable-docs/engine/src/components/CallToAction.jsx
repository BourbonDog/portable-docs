import React from 'react';
import { COLORS, FONTS, TYPE_SCALE, EFFECTS, SPACE } from '../design-tokens';

// Accent CTA band. Buttons are real <a> links; they carry pd-no-print so the
// PDF/PNG export does not show a dead button, and a pd-print-only line prints
// the destination URL(s) instead.
const button = (variant) => ({
  display: 'inline-block',
  padding: `${SPACE[2]} ${SPACE[4]}`,
  fontFamily: FONTS.ui,
  fontSize: TYPE_SCALE.ui.md.size,
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: EFFECTS.radius.full,
  boxShadow: variant === 'secondary' ? 'none' : EFFECTS.shadow.md,
  background: variant === 'secondary' ? 'transparent' : COLORS.accent.primary,
  color: variant === 'secondary' ? COLORS.accent.primary : COLORS.ink[50],
  border: variant === 'secondary' ? `1px solid ${COLORS.accent.primary}` : 'none',
});

const CallToAction = ({ label, href, variant = 'primary', headline, subtext, secondaryLabel, secondaryHref }) => {
  const hasHeadline = headline && headline.length > 0;
  const hasSubtext = subtext && subtext.length > 0;
  const hasSecondary = secondaryLabel && secondaryHref;
  return (
    <section style={{
      textAlign: 'center',
      marginTop: SPACE[6],
      marginBottom: SPACE[6],
      padding: `${SPACE[6]} ${SPACE[4]}`,
      background: COLORS.accent.wash,
      borderRadius: EFFECTS.radius.lg,
    }}>
      {hasHeadline && (
        <h3 style={{ fontFamily: FONTS.display, fontSize: TYPE_SCALE.display.md.size, color: COLORS.ink[800], margin: 0, marginBottom: SPACE[2] }}>
          {headline}
        </h3>
      )}
      {hasSubtext && (
        <p style={{ fontFamily: FONTS.ui, fontSize: TYPE_SCALE.ui.md.size, color: COLORS.ink[600], margin: 0, marginBottom: SPACE[4] }}>
          {subtext}
        </p>
      )}
      <div style={{ display: 'flex', gap: SPACE[2], justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="pd-no-print" href={href} style={button(variant)}>{label}</a>
        {hasSecondary && <a className="pd-no-print" href={secondaryHref} style={button('secondary')}>{secondaryLabel}</a>}
      </div>
      <div className="pd-print-only" style={{ marginTop: SPACE[2], fontFamily: FONTS.ui, fontSize: TYPE_SCALE.ui.md.size, color: COLORS.ink[600] }}>
        {label}: {href}{hasSecondary ? `  ·  ${secondaryLabel}: ${secondaryHref}` : ''}
      </div>
    </section>
  );
};

export default CallToAction;
