/**
 * Timeline Component - "The Scholarly Disruptor"
 *
 * Vertical editorial timeline with dramatic visual presence
 * - Large year markers as visual anchors
 * - Alternating left/right cards for rhythm
 * - Elegant connecting spine
 * - Rich hover interactions
 * - Staggered scroll animations per entry
 */
import React, { useState, useEffect, useRef } from 'react';
import RichText from './RichText';
import { COLORS, FONTS, TYPE_SCALE, EFFECTS, SPACE } from '../design-tokens';

// useInView hook is defined in Section.jsx and shared across all components

// Generic company initial badge — renders the first letter of the company name
// in a styled circle using the accent palette. No org-specific literals or
// external asset paths; works for any company name.
const getCompanyLogo = (company, size = 20) => {
  if (!company) return null;
  const initial = company.trim()[0]?.toUpperCase() || '?';
  const fontSize = Math.round(size * 0.55);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label={company}>
      <rect x="1" y="1" width="22" height="22" rx="5" fill={COLORS.accent.primary} />
      <text
        x="12"
        y="12"
        dominantBaseline="central"
        textAnchor="middle"
        fill={COLORS.ink[50]}
        fontFamily="sans-serif"
        fontSize={fontSize}
        fontWeight="600"
      >
        {initial}
      </text>
    </svg>
  );
};

const TimelineEntry = ({ entry, index, total }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ref, inView] = useInView();
  const isLeft = index % 2 === 0;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      ref={ref}
      className="timeline-entry"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        gap: SPACE[4],
        position: 'relative',
        minHeight: '200px',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {/* Left content area */}
      <div
        className="timeline-left"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          paddingTop: SPACE[2],
        }}
      >
        {isLeft && (
          <TimelineCard
            entry={entry}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            align="right"
          />
        )}
      </div>

      {/* Center spine */}
      <div
        className="timeline-spine"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Vertical line - top segment */}
        {!isFirst && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: SPACE[6],
              background: `linear-gradient(180deg, ${COLORS.ink[200]} 0%, ${entry.highlight ? COLORS.accent.primary : COLORS.ink[300]} 100%)`,
            }}
          />
        )}

        {/* Year circle */}
        <div
          style={{
            marginTop: isFirst ? 0 : SPACE[6],
            width: '72px',
            height: '72px',
            borderRadius: EFFECTS.radius.full,
            background: entry.highlight
              ? `linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.light} 100%)`
              : COLORS.surface.elevated,
            border: entry.highlight
              ? 'none'
              : `2px solid ${isHovered ? COLORS.ink[400] : COLORS.ink[200]}`,
            boxShadow: entry.highlight
              ? `0 4px 20px ${COLORS.accent.primary}40, ${EFFECTS.shadow.lg}`
              : (isHovered ? EFFECTS.shadow.md : EFFECTS.shadow.sm),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            transition: `all ${EFFECTS.transition.base}`,
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {/* Handle date ranges (e.g., "2014-2024") by stacking vertically */}
          {entry.year.includes('-') && /^\d{4}-\d{4}$/.test(entry.year) ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.1,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  color: entry.highlight ? COLORS.ink[50] : COLORS.ink[700],
                  letterSpacing: '-0.02em',
                }}
              >
                {entry.year.split('-')[0]}
              </span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: '0.65rem',
                  fontWeight: 400,
                  color: entry.highlight ? COLORS.ink[200] : COLORS.ink[400],
                }}
              >
                –
              </span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  color: entry.highlight ? COLORS.ink[50] : COLORS.ink[700],
                  letterSpacing: '-0.02em',
                }}
              >
                {entry.year.split('-')[1]}
              </span>
            </div>
          ) : (
            <span
              style={{
                fontFamily: FONTS.display,
                fontSize: entry.year === 'Current' ? '0.875rem' : '1.25rem',
                fontWeight: 500,
                fontStyle: 'italic',
                color: entry.highlight ? COLORS.ink[50] : COLORS.ink[700],
                letterSpacing: '-0.02em',
              }}
            >
              {entry.year}
            </span>
          )}
        </div>

        {/* Vertical line - bottom segment */}
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: '2px',
              background: `linear-gradient(180deg, ${entry.highlight ? COLORS.accent.primary : COLORS.ink[300]} 0%, ${COLORS.ink[200]} 100%)`,
              marginTop: SPACE[1],
            }}
          />
        )}
      </div>

      {/* Right content area - shows all cards on mobile */}
      <div
        className="timeline-right"
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          paddingTop: SPACE[2],
        }}
      >
        {/* Desktop: show only right-aligned cards. Mobile: show ALL cards via CSS */}
        <div className={isLeft ? 'timeline-mobile-only' : ''}>
          <TimelineCard
            entry={entry}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            align="left"
          />
        </div>
      </div>
    </div>
  );
};

const TimelineCard = ({ entry, isHovered, setIsHovered, align }) => {
  return (
    <div
      className="timeline-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        maxWidth: '340px',
        width: '100%',
        background: entry.highlight
          ? COLORS.surface.dark
          : COLORS.surface.elevated,
        borderRadius: EFFECTS.radius.lg,
        border: `1px solid ${entry.highlight ? COLORS.ink[700] : (isHovered ? COLORS.ink[300] : COLORS.ink[200])}`,
        padding: SPACE[5],
        boxShadow: isHovered ? EFFECTS.shadow.lg : EFFECTS.shadow.sm,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: `all ${EFFECTS.transition.base}`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Top accent for highlighted entries */}
      {entry.highlight && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.light} 100%)`,
          }}
        />
      )}

      {/* Pointer arrow */}
      <div
        className="timeline-card-arrow"
        style={{
          position: 'absolute',
          top: '28px',
          [align === 'right' ? 'right' : 'left']: '-8px',
          width: '16px',
          height: '16px',
          background: entry.highlight ? COLORS.surface.dark : COLORS.surface.elevated,
          border: `1px solid ${entry.highlight ? COLORS.ink[700] : (isHovered ? COLORS.ink[300] : COLORS.ink[200])}`,
          borderRight: align === 'right' ? 'none' : undefined,
          borderBottom: align === 'right' ? 'none' : undefined,
          borderLeft: align === 'left' ? 'none' : undefined,
          borderTop: align === 'left' ? 'none' : undefined,
          transform: 'rotate(45deg)',
          transition: `border-color ${EFFECTS.transition.base}`,
        }}
      />

      {/* Company logo & badge row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACE[3],
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACE[2],
          }}
        >
          {/* Company logo (computed once) */}
          {(() => {
            const logo = getCompanyLogo(entry.company, 20);
            return logo && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: EFFECTS.radius.md,
                  background: entry.highlight ? COLORS.ink[800] : COLORS.surface.elevated,
                  border: `1px solid ${entry.highlight ? COLORS.ink[700] : COLORS.ink[200]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {logo}
              </div>
            );
          })()}

          {/* Company name badge */}
          <div
            style={{
              padding: `${SPACE[1]} ${SPACE[3]}`,
              background: entry.highlight ? COLORS.ink[800] : COLORS.surface.inset,
              borderRadius: EFFECTS.radius.sm,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: TYPE_SCALE.mono.sm.size,
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: entry.highlight ? COLORS.accent.light : COLORS.ink[500],
                textTransform: 'uppercase',
              }}
            >
              {entry.company}
            </span>
          </div>
        </div>

      </div>

      {/* Title */}
      <h4
        style={{
          fontFamily: FONTS.headline,
          fontWeight: 500,
          fontSize: TYPE_SCALE.headline.sm.size,
          lineHeight: 1.3,
          color: entry.highlight ? COLORS.ink[50] : COLORS.ink[800],
          marginBottom: SPACE[3],
          position: 'relative',
          zIndex: 1,
        }}
      >
        {entry.title}
      </h4>

      {/* Description */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: TYPE_SCALE.body.sm.size,
          lineHeight: TYPE_SCALE.body.sm.lineHeight,
          color: entry.highlight ? COLORS.ink[300] : COLORS.ink[500],
          margin: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <RichText>{entry.content}</RichText>
      </p>
    </div>
  );
};

const Timeline = ({ entries }) => {
  if (!entries || entries.length === 0) return null;

  return (
    <div
      style={{
        marginTop: SPACE[8],
        marginBottom: SPACE[8],
      }}
    >
      {/* Responsive styles for mobile timeline */}
      <style>{`
        /* Desktop: hide mobile-only cards */
        .timeline-mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .timeline-entry {
            grid-template-columns: 60px 1fr !important;
            min-height: auto !important;
            gap: 12px !important;
          }
          .timeline-left {
            display: none !important;
          }
          .timeline-right {
            display: block !important;
          }
          .timeline-mobile-only {
            display: block !important;
          }
          .timeline-spine {
            order: -1;
          }
          .timeline-card {
            max-width: 100% !important;
          }
          .timeline-card-arrow {
            display: none !important;
          }
        }
      `}</style>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACE[4],
          marginBottom: SPACE[8],
        }}
      >
        <div
          style={{
            width: '32px',
            height: '3px',
            background: COLORS.accent.primary,
            borderRadius: EFFECTS.radius.full,
          }}
        />
        <div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: TYPE_SCALE.mono.sm.size,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.ink[400],
            }}
          >
            Career Timeline
          </span>
          <h3
            style={{
              fontFamily: FONTS.display,
              fontSize: TYPE_SCALE.display.md.size,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: COLORS.ink[800],
              marginTop: SPACE[1],
              lineHeight: 1.1,
            }}
          >
            The Journey
          </h3>
        </div>
      </div>

      {/* Timeline entries */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {entries.map((entry, i) => (
          <TimelineEntry
            key={i}
            entry={entry}
            index={i}
            total={entries.length}
          />
        ))}
      </div>

      {/* Bottom flourish */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: SPACE[6],
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            background: `linear-gradient(90deg, transparent 0%, ${COLORS.ink[300]} 50%, transparent 100%)`,
            borderRadius: EFFECTS.radius.full,
          }}
        />
      </div>
    </div>
  );
};

export default Timeline;
