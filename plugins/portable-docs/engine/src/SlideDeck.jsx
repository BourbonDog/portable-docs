/**
 * SlideDeck — Full-viewport presentation deck.
 *
 * Full-screen, keyboard-navigated slide deck. One slide at a time.
 * Theme-aware: ALL backgrounds and text come from COLORS tokens
 * (injected at build time — NO hardcoded light hex, NO runtime env reads).
 *
 * Keyboard nav:
 *   ArrowRight / PageDown / Space  → next slide
 *   ArrowLeft  / PageUp            → previous slide
 *   Home                           → first slide
 *   End                            → last slide
 *
 * Title slide: generated automatically from CONTENT.header (brand, title, subtitle).
 * Content slides: slide title + blocks rendered via the shared block renderer
 *   (Paragraph, BulletList, NumberedList, Table, ArticleBlockquote).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS, TYPE_SCALE, SPACE, EFFECTS } from './design-tokens';
import { Paragraph, BulletList } from './components/Section';
import Table from './components/Table';
import RichText from './components/RichText';
import Chart from './components/Chart';
import FlowDiagram from './components/FlowDiagram';
import QuadrantChart from './components/QuadrantChart';

// =============================================================================
// SLIDE BLOCK RENDERER — reuses ArticleApp's block components
// =============================================================================

const SlideBlockquote = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div
      style={{
        margin: `${SPACE[5]} 0`,
        padding: `${SPACE[4]} ${SPACE[5]}`,
        borderLeft: `4px solid ${COLORS.accent.primary}`,
        background: COLORS.accent.wash,
        borderRadius: `0 ${EFFECTS.radius.lg} ${EFFECTS.radius.lg} 0`,
      }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            lineHeight: 1.5,
            color: COLORS.ink[600],
            fontWeight: 500,
            fontStyle: 'italic',
            margin: 0,
            marginBottom: i < lines.length - 1 ? SPACE[3] : 0,
          }}
        >
          <RichText>{line}</RichText>
        </p>
      ))}
    </div>
  );
};

const SlideNumberedList = ({ items }) => (
  <ol style={{ listStyle: 'none', padding: 0, margin: `${SPACE[4]} 0` }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: SPACE[4], marginBottom: SPACE[3], alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: '1rem',
            fontWeight: 700,
            color: COLORS.accent.primary,
            flexShrink: 0,
            minWidth: '1.5rem',
            textAlign: 'right',
          }}
        >
          {i + 1}.
        </span>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
            lineHeight: 1.5,
            color: COLORS.ink[700],
          }}
        >
          <RichText>{item}</RichText>
        </span>
      </li>
    ))}
  </ol>
);

const SlideBlockRenderer = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(1rem, 1.8vw, 1.375rem)',
            lineHeight: 1.6,
            color: COLORS.ink[700],
            margin: `0 0 ${SPACE[4]}`,
          }}
        >
          <RichText>{block.text}</RichText>
        </p>
      );
    case 'bulletList':
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: `${SPACE[4]} 0` }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: SPACE[3], marginBottom: SPACE[3], alignItems: 'baseline' }}>
              <span style={{ color: COLORS.accent.primary, fontFamily: FONTS.mono, fontWeight: 700, flexShrink: 0 }}>·</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', lineHeight: 1.5, color: COLORS.ink[700] }}>
                <RichText>{item}</RichText>
              </span>
            </li>
          ))}
        </ul>
      );
    case 'numberedList':
      return <SlideNumberedList items={block.items} />;
    case 'table':
      return (
        <div style={{ margin: `${SPACE[5]} 0`, overflowX: 'auto' }}>
          <Table headers={block.headers} rows={block.rows} />
        </div>
      );
    case 'blockquote':
      return <SlideBlockquote text={block.text} />;
    case 'image':
      return (
        <figure style={{ margin: `${SPACE[5]} 0`, textAlign: 'center' }}>
          <img src={block.src} alt={block.caption || ''} style={{ maxWidth: '100%', maxHeight: '45vh', objectFit: 'contain' }} />
          {block.caption && (
            <figcaption style={{ fontFamily: FONTS.ui, fontSize: TYPE_SCALE.ui.sm.size, color: COLORS.ink[400], marginTop: SPACE[2] }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case 'heading':
      return (
        <h4
          style={{
            fontFamily: FONTS.headline,
            fontSize: 'clamp(1rem, 2vw, 1.4rem)',
            fontWeight: 600,
            lineHeight: 1.25,
            color: COLORS.ink[600],
            margin: `${SPACE[4]} 0 ${SPACE[2]}`,
          }}
        >
          {block.text}
        </h4>
      );
    case 'subsection':
      return (
        <div style={{ margin: `${SPACE[5]} 0 ${SPACE[3]}` }}>
          <h3
            style={{
              fontFamily: FONTS.headline,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.75rem)',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: COLORS.accent.primary,
              marginBottom: SPACE[3],
            }}
          >
            {block.title}
          </h3>
          {Array.isArray(block.blocks) && block.blocks.map((child, i) => (
            <SlideBlockRenderer key={i} block={child} />
          ))}
        </div>
      );
    case 'chart': {
      const c = CONTENT.charts && CONTENT.charts[block.index];
      if (!c) return null;
      return (
        <div style={{ maxWidth: '760px', maxHeight: '60vh', overflow: 'hidden', margin: `${SPACE[4]} auto` }}>
          <Chart type={c.type} data={c} />
        </div>
      );
    }
    case 'flow': {
      const f = CONTENT.flows && CONTENT.flows[block.index];
      if (!f) return null;
      return (
        <div style={{ width: '100%', height: '70vh', overflow: 'auto', margin: `${SPACE[4]} 0` }}>
          <FlowDiagram data={f} />
        </div>
      );
    }
    case 'quadrant': {
      const q = CONTENT.quadrants && CONTENT.quadrants[block.index];
      if (!q) return null;
      return (
        <div style={{ width: '100%', height: '70vh', overflow: 'auto', margin: `${SPACE[4]} 0` }}>
          <QuadrantChart data={q} />
        </div>
      );
    }
    default:
      return null;
  }
};

// =============================================================================
// TITLE SLIDE — generated from CONTENT.header; same gradient as Header.jsx
// =============================================================================

const TitleSlide = ({ header }) => {
  // Generic fallbacks — NO school/course branding
  const brand    = header.brand || 'Presentation';
  const title    = header.title || 'Untitled Deck';
  const subtitle = header.subtitle || '';

  // Word-split gradient treatment (same approach as Header.jsx / ArticleApp.jsx)
  const words      = title.trim().split(/\s+/);
  const titleFirst  = words[0];
  const titleMiddle = words.slice(1, -1).join(' ');
  const titleLast   = words.length > 1 ? words[words.length - 1] : '';
  const titleGradient = `linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.light} 100%)`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(150deg, ${COLORS.surface.paper} 0%, ${COLORS.surface.inset} 50%, ${COLORS.surface.paper} 100%)`,
        padding: SPACE[10],
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle decorative accent blobs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '60%',
        background: `radial-gradient(ellipse, ${COLORS.accent.glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%', width: '35%', height: '55%',
        background: `radial-gradient(ellipse, ${COLORS.accent.wash} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Brand */}
      <div style={{ marginBottom: SPACE[6], position: 'relative' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: TYPE_SCALE.mono.sm.size,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: COLORS.accent.primary,
          }}
        >
          {brand}
        </span>
      </div>

      {/* Main title — word-split gradient */}
      <h1
        style={{
          fontFamily: FONTS.display,
          fontWeight: 400,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          marginBottom: SPACE[6],
          position: 'relative',
        }}
      >
        <span style={{ display: 'block', fontSize: 'clamp(3rem, 8vw, 7rem)', color: COLORS.ink[900] }}>
          {titleFirst}
        </span>
        {titleMiddle && (
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(2.5rem, 7vw, 6rem)',
              paddingBottom: '0.15em',
              background: titleGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {titleMiddle}
          </span>
        )}
        {titleLast && (
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontStyle: 'italic',
              color: COLORS.ink[600],
              marginTop: SPACE[2],
            }}
          >
            {titleLast}
          </span>
        )}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(1rem, 2vw, 1.375rem)',
            lineHeight: 1.6,
            color: COLORS.ink[500],
            maxWidth: '40rem',
            position: 'relative',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// CONTENT SLIDE — title + blocks at presentation scale
// =============================================================================

const ContentSlide = ({ slide }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.surface.paper,
      padding: `${SPACE[8]} clamp(2rem, 8vw, 6rem)`,
      overflowY: 'auto',
    }}
  >
    {/* Slide title */}
    {slide.title && (
      <div style={{ marginBottom: SPACE[6], borderBottom: `2px solid ${COLORS.accent.primary}`, paddingBottom: SPACE[4] }}>
        <h2
          style={{
            fontFamily: FONTS.headline,
            fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: COLORS.ink[900],
            margin: 0,
          }}
        >
          {slide.title}
        </h2>
      </div>
    )}

    {/* Block content */}
    <div style={{ flex: 1 }}>
      {slide.blocks.map((block, i) => (
        <SlideBlockRenderer key={i} block={block} />
      ))}
    </div>
  </div>
);

// =============================================================================
// PROGRESS BAR + COUNTER
// =============================================================================

const SlideProgress = ({ current, total }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: COLORS.ink[200],
      zIndex: 20,
    }}
  >
    <div
      style={{
        height: '100%',
        width: `${((current + 1) / total) * 100}%`,
        background: `linear-gradient(90deg, ${COLORS.accent.primary}, ${COLORS.accent.light})`,
        transition: 'width 0.3s ease',
      }}
    />
  </div>
);

const SlideCounter = ({ current, total }) => (
  <div
    style={{
      position: 'absolute',
      bottom: SPACE[5],
      right: SPACE[6],
      fontFamily: FONTS.mono,
      fontSize: TYPE_SCALE.mono.sm.size,
      color: COLORS.ink[400],
      letterSpacing: '0.08em',
      zIndex: 20,
      userSelect: 'none',
    }}
  >
    {current + 1} / {total}
  </div>
);

// =============================================================================
// DOT NAVIGATION
// =============================================================================

const DotNav = ({ current, total, onGoTo }) => (
  <div
    style={{
      position: 'absolute',
      bottom: SPACE[5],
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: SPACE[2],
      alignItems: 'center',
      zIndex: 20,
    }}
  >
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onGoTo(i)}
        aria-label={`Go to slide ${i + 1}`}
        style={{
          width: i === current ? '20px' : '8px',
          height: '8px',
          borderRadius: EFFECTS.radius.full,
          background: i === current ? COLORS.accent.primary : COLORS.ink[300],
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: `all ${EFFECTS.transition.base}`,
        }}
      />
    ))}
  </div>
);

// =============================================================================
// MAIN APP
// =============================================================================

const App = () => {
  // Build all slides: title slide (index 0) + content slides from CONTENT.slides
  const allSlides = [
    { _isTitleSlide: true },
    ...CONTENT.slides,
  ];

  const [current, setCurrent] = useState(0);
  const [printing, setPrinting] = useState(false);
  const total = allSlides.length;

  useEffect(() => {
    const on  = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
    };
  }, []);

  const goTo = useCallback((idx) => {
    setCurrent(Math.max(0, Math.min(total - 1, idx)));
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard navigation — ArrowRight / PageDown / Space → next; ArrowLeft / PageUp → prev
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(total - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev, goTo, total]);

  // Inject global override: no page scroll (full-viewport deck)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('sd-global-styles');
    if (existing) return;
    const style = document.createElement('style');
    style.id = 'sd-global-styles';
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; overflow: hidden; background: ${COLORS.surface.paper}; }
      body { font-family: system-ui, -apple-system, sans-serif; }
    `;
    document.head.appendChild(style);
  }, []);

  // Render a single slide — shared by screen and print paths.
  const renderSlide = (slide, index) => (
    slide._isTitleSlide ? (
      <TitleSlide key={index} header={CONTENT.header} />
    ) : (
      <ContentSlide key={index} slide={slide} />
    )
  );

  // Print path: all slides stacked, one per landscape page via SLIDES_PRINT_CSS.
  if (printing) {
    return (
      <div>
        {allSlides.map((s, i) => (
          <div key={i} className="pd-slide-page" style={{ position: 'relative', width: '100vw', minHeight: '100vh' }}>
            {renderSlide(s, i)}
          </div>
        ))}
      </div>
    );
  }

  const slide = allSlides[current];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: COLORS.surface.paper,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Slide viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {renderSlide(slide, current)}
      </div>

      {/* Chrome: progress bar, counter, dot nav */}
      <SlideProgress current={current} total={total} />
      <SlideCounter current={current} total={total} />
      <DotNav current={current} total={total} onGoTo={goTo} />
    </div>
  );
};

export default App;
