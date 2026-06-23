/**
 * ArticleApp — Generic long-form ARTICLE layout.
 *
 * Vendored and de-branded from northwestern/src/ArticleApp.jsx. Everything is
 * now driven by the parsed CONTENT object (header + sections of blocks):
 *   - Hero title  ← CONTENT.header.title  (word-split gradient, matching Header.jsx)
 *   - Subtitle    ← CONTENT.header.subtitle
 *   - Nav         ← CONTENT.header.{brand,brandSub,logo,eyebrow,date} (generic fallbacks)
 *   - Hero quote  ← CONTENT.header.heroQuote (optional; NONE by default)
 *   - Footer      ← CONTENT.header.footer || ''
 *
 * The vendored original hardcoded a fixed hero title, school/course branding in
 * the nav and footer, a fixed hero quote, and injected rich components
 * (cards/terminals/stats) keyed on section.number. All of that is removed — the
 * generic article renders the parsed long-form blocks only (paragraphs,
 * headings, tables, lists, blockquotes, figures). Rich charts and cards remain
 * the proposal format's job.
 *
 * Reuses shared components: Section, Subsection, Paragraph, BulletList,
 * Table, RichText.
 */
import React, { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS, TYPE_SCALE, LAYOUT, SPACE, EFFECTS } from './design-tokens';
import { Section, SectionDivider, Subsection, Paragraph, BulletList } from './components/Section';
import Table from './components/Table';
import RichText from './components/RichText';
import ReadingProgress from './components/ReadingProgress';

// =============================================================================
// ARTICLE HEADER — full-viewport hero, data-driven title/subtitle/nav
// =============================================================================

const ArticleHeader = ({ data }) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Generic fallbacks — NEVER any school/course branding.
  const brand    = data.brand || 'Field Guide';
  const brandSub = data.brandSub || '';
  const logo     = data.logo || (brand ? brand[0].toUpperCase() : 'F');
  const eyebrow  = data.eyebrow || 'Article';

  // Editorial 3-line title treatment, driven by header.title (same split as Header.jsx).
  const titleWords  = (data.title || 'Untitled Article').trim().split(/\s+/);
  const titleFirst  = titleWords[0];
  const titleMiddle = titleWords.slice(1, -1).join(' ');
  const titleLast   = titleWords.length > 1 ? titleWords[titleWords.length - 1] : '';
  const titleGradient = `linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.light} 100%)`;

  // Optional hero quote — only rendered when provided (no default proverb).
  const heroQuote = data.heroQuote && data.heroQuote.quote ? data.heroQuote : null;

  const getInitials = (name) =>
    (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '·';

  // Typewriter effect for subtitle
  useEffect(() => {
    const text = data.subtitle || '';
    let currentIndex = 0;
    const startDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setTypedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 35);
      return () => clearInterval(typeInterval);
    }, 800);
    return () => clearTimeout(startDelay);
  }, [data.subtitle]);

  return (
    <header
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(170deg, ${COLORS.surface.paper} 0%, ${COLORS.surface.inset} 30%, ${COLORS.surface.elevated} 60%, ${COLORS.surface.paper} 100%)`,
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(#94a3b820 1px, transparent 1px),
            linear-gradient(90deg, #94a3b820 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* Gradient accent shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: '55%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, #6366f120 0%, #8b5cf615 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: '45%',
          height: '50%',
          background: 'radial-gradient(ellipse at center, #3b82f615 0%, #06b6d410 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-5%',
          right: '20%',
          width: '40%',
          height: '45%',
          background: 'radial-gradient(ellipse at center, #f59e0b10 0%, #f9731608 50%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top navigation bar */}
      <nav
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '1.5rem 0',
          borderBottom: `1px solid ${COLORS.ink[200]}`,
        }}
      >
        <div
          style={{
            maxWidth: LAYOUT.maxWidth.wide,
            margin: '0 auto',
            padding: `0 ${LAYOUT.margin}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo / brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: COLORS.accent.primary,
                borderRadius: EFFECTS.radius.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: EFFECTS.shadow.md,
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontFamily: FONTS.display,
                  fontSize: '1.25rem',
                  fontWeight: 500,
                }}
              >
                {logo}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: TYPE_SCALE.ui.sm.size,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.ink[700],
                  display: 'block',
                }}
              >
                {brand}
              </span>
              {brandSub && (
                <span
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: TYPE_SCALE.ui.xs.size,
                    letterSpacing: '0.05em',
                    color: COLORS.ink[400],
                    textTransform: 'uppercase',
                  }}
                >
                  {brandSub}
                </span>
              )}
            </div>
          </div>

          {/* Date badge */}
          {data.date && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: COLORS.surface.elevated,
                borderRadius: EFFECTS.radius.full,
                border: `1px solid ${COLORS.ink[200]}`,
                boxShadow: EFFECTS.shadow.sm,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: EFFECTS.radius.full,
                  background: COLORS.accent.primary,
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: TYPE_SCALE.mono.sm.size,
                  color: COLORS.ink[600],
                  letterSpacing: '0.02em',
                }}
              >
                {data.date}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Main hero content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          maxWidth: LAYOUT.maxWidth.wide,
          width: '100%',
          margin: '0 auto',
          padding: `${SPACE[10]} ${LAYOUT.margin}`,
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '2rem',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Left column - main content */}
          <div className="hero-main" style={{ gridColumn: heroQuote ? 'span 8' : 'span 12' }}>
            {/* Eyebrow / category */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem',
              }}
            >
              <div style={{ width: '32px', height: '2px', background: COLORS.accent.primary }} />
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: TYPE_SCALE.ui.sm.size,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: COLORS.accent.primary,
                }}
              >
                {eyebrow}
              </span>
            </div>

            {/* Main title — word-split gradient treatment driven by header.title */}
            <h1
              style={{
                fontFamily: FONTS.display,
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                color: COLORS.ink[900],
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ display: 'block' }}>{titleFirst}</span>
              {titleMiddle && (
                <span
                  style={{
                    display: 'block',
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
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                    color: COLORS.ink[600],
                    marginTop: '0.25rem',
                  }}
                >
                  {titleLast}
                </span>
              )}
            </h1>

            {/* Subtitle — typewriter with terminal prompt */}
            {data.subtitle && (
              <p
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
                  lineHeight: 1.6,
                  color: COLORS.ink[600],
                  maxWidth: '38rem',
                  marginBottom: '3rem',
                  minHeight: '3.5rem',
                }}
              >
                <span style={{ color: COLORS.accent.primary, marginRight: '0.5rem' }}>{'>'}</span>
                {typedText}
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1.2em',
                    background: isTyping ? COLORS.accent.primary : COLORS.ink[400],
                    marginLeft: '2px',
                    verticalAlign: 'text-bottom',
                    animation: 'blink 1s step-end infinite',
                  }}
                />
              </p>
            )}

            {/* Author info card — only when an author is provided */}
            {data.from && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1rem 1.5rem',
                  background: COLORS.surface.elevated,
                  borderRadius: EFFECTS.radius.xl,
                  border: `1px solid ${COLORS.ink[200]}`,
                  boxShadow: EFFECTS.shadow.lg,
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: EFFECTS.radius.full,
                    overflow: 'hidden',
                    border: `3px solid ${COLORS.accent.primary}`,
                    background: imageError
                      ? `linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.light} 100%)`
                      : COLORS.ink[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {!imageError && data.headshot ? (
                    <img
                      src={data.headshot}
                      alt={data.from}
                      onError={() => setImageError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{ fontFamily: FONTS.ui, fontSize: '1.25rem', fontWeight: 600, color: 'white' }}
                    >
                      {getInitials(data.from)}
                    </span>
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: FONTS.ui,
                      fontSize: TYPE_SCALE.ui.lg.size,
                      fontWeight: 600,
                      color: COLORS.ink[800],
                      marginBottom: '0.25rem',
                    }}
                  >
                    {data.from}
                  </p>
                  {data.fromEmail && (
                    <a
                      href={`mailto:${data.fromEmail}`}
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: TYPE_SCALE.mono.sm.size,
                        color: COLORS.ink[500],
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      {data.fromEmail}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column - optional featured quote */}
          {heroQuote && (
            <div
              className="hero-quote"
              style={{
                gridColumn: 'span 4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '1.5rem',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '2rem',
                  background: COLORS.surface.elevated,
                  borderRadius: EFFECTS.radius.xl,
                  border: `1px solid ${COLORS.ink[200]}`,
                  boxShadow: EFFECTS.shadow.lg,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    left: '1.5rem',
                    fontFamily: FONTS.display,
                    fontSize: '5rem',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: COLORS.accent.primary,
                    opacity: 0.2,
                    userSelect: 'none',
                  }}
                >
                  "
                </div>
                <blockquote
                  style={{
                    position: 'relative',
                    fontFamily: FONTS.body,
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: COLORS.ink[700],
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  {heroQuote.quote}
                </blockquote>
                {heroQuote.author && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '1px', background: COLORS.ink[300] }} />
                    <span
                      style={{
                        fontFamily: FONTS.ui,
                        fontSize: TYPE_SCALE.ui.sm.size,
                        fontWeight: 600,
                        color: COLORS.ink[600],
                      }}
                    >
                      {heroQuote.author}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'relative', zIndex: 10, padding: `0 ${LAYOUT.margin} 3rem` }}>
        <div
          style={{
            maxWidth: LAYOUT.maxWidth.wide,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '40px',
              background: `linear-gradient(to bottom, ${COLORS.accent.primary}, transparent)`,
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: EFFECTS.radius.full,
              background: COLORS.accent.primary,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: TYPE_SCALE.mono.sm.size,
              color: COLORS.ink[400],
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Scroll to explore
          </span>
        </div>
      </div>

      {/* CSS animations + responsive styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .hero-main { grid-column: span 1 !important; }
          .hero-quote { grid-column: span 1 !important; }
        }
      `}</style>
    </header>
  );
};

// =============================================================================
// ARTICLE SECTION NAV — data-driven floating nav for orientation
// =============================================================================

const ArticleSectionNav = ({ sections }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const existing = document.getElementById('article-nav-styles');
      if (!existing) {
        const style = document.createElement('style');
        style.id = 'article-nav-styles';
        style.textContent = `
          .article-nav-wrapper { display: none; }
          @media (min-width: 1280px) { .article-nav-wrapper { display: block; } }
        `;
        document.head.appendChild(style);
      }
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
      const sectionEls = document.querySelectorAll('[data-section]');
      const scrollPos = window.scrollY + window.innerHeight / 3;
      let current = 0;
      sectionEls.forEach((el) => {
        if (scrollPos >= el.offsetTop) current = parseInt(el.getAttribute('data-section'), 10);
      });
      setCurrentSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (num) => {
    const el = document.querySelector(`[data-section="${num}"]`);
    if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
  };

  if (!sections || sections.length === 0) return null;

  return (
    <nav
      className="article-nav-wrapper pd-no-print"
      style={{
        position: 'fixed',
        left: SPACE[6],
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: `opacity ${EFFECTS.transition.slow}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: SPACE[1],
          padding: `${SPACE[3]} ${SPACE[2]}`,
          background: `${COLORS.surface.elevated}F8`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: EFFECTS.radius.xl,
          border: `1px solid ${COLORS.ink[100]}`,
          boxShadow: EFFECTS.shadow.lg,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: `${SPACE[1]} ${SPACE[3]}`, marginBottom: SPACE[1] }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.ink[300],
            }}
          >
            Navigate
          </span>
        </div>

        {sections.map((section) => {
          const isActive = currentSection === section.number;
          const isHovered = hoveredSection === section.number;
          return (
            <button
              key={section.number}
              onClick={() => scrollTo(section.number)}
              onMouseEnter={() => setHoveredSection(section.number)}
              onMouseLeave={() => setHoveredSection(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE[3],
                padding: `${SPACE[2]} ${SPACE[3]}`,
                width: '100%',
                background: isActive ? COLORS.accent.wash : isHovered ? COLORS.ink[50] : 'transparent',
                border: 'none',
                borderRadius: EFFECTS.radius.lg,
                cursor: 'pointer',
                transition: `all ${EFFECTS.transition.fast}`,
                textAlign: 'left',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: isActive ? '60%' : '0%',
                  background: COLORS.accent.primary,
                  borderRadius: EFFECTS.radius.full,
                  transition: `height ${EFFECTS.transition.base}`,
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: TYPE_SCALE.mono.sm.size,
                  fontWeight: 600,
                  color: isActive ? COLORS.accent.primary : COLORS.ink[400],
                  minWidth: '1.5rem',
                  transition: `color ${EFFECTS.transition.fast}`,
                }}
              >
                {section.number}
              </span>
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: TYPE_SCALE.ui.sm.size,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? COLORS.ink[800] : COLORS.ink[500],
                  transition: `color ${EFFECTS.transition.fast}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {section.short}
              </span>
            </button>
          );
        })}

        {/* Progress bar */}
        <div style={{ marginTop: SPACE[2], padding: `0 ${SPACE[3]}`, width: '100%' }}>
          <div
            style={{
              height: '2px',
              background: COLORS.ink[100],
              borderRadius: EFFECTS.radius.full,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(currentSection / sections.length) * 100}%`,
                background: `linear-gradient(90deg, ${COLORS.accent.primary}, ${COLORS.accent.light})`,
                borderRadius: EFFECTS.radius.full,
                transition: `width ${EFFECTS.transition.base}`,
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

// =============================================================================
// FIGURE — inline image with caption and scroll animation
// =============================================================================

const ArticleFigure = ({ src, caption }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: '-30px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      style={{
        margin: `${SPACE[8]} 0`,
        padding: 0,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <div
        style={{
          background: COLORS.surface.elevated,
          borderRadius: EFFECTS.radius.xl,
          border: `1px solid ${COLORS.ink[100]}`,
          boxShadow: EFFECTS.shadow.md,
          padding: SPACE[6],
          overflow: 'hidden',
        }}
      >
        {imgError ? (
          <div
            role="img"
            aria-label="Image unavailable"
            style={{
              width: '100%',
              minHeight: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.ink[100],
              borderRadius: EFFECTS.radius.lg,
              fontFamily: FONTS.ui,
              fontSize: TYPE_SCALE.ui.sm.size,
              color: COLORS.ink[400],
            }}
          >
            Image unavailable
          </div>
        ) : (
          <img
            src={src}
            alt={caption || ''}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}
      </div>
      {caption && (
        <figcaption
          style={{
            fontFamily: FONTS.ui,
            fontSize: TYPE_SCALE.ui.sm.size,
            color: COLORS.ink[400],
            marginTop: SPACE[3],
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// =============================================================================
// YOUTUBE — responsive 16:9 embed
// =============================================================================

const ArticleYouTube = ({ videoId, caption }) => (
  <figure style={{ margin: `${SPACE[8]} 0`, padding: 0 }}>
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        borderRadius: EFFECTS.radius.xl,
        overflow: 'hidden',
        border: `1px solid ${COLORS.ink[100]}`,
        boxShadow: EFFECTS.shadow.md,
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={caption || 'Video'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
    {caption && (
      <figcaption
        style={{
          fontFamily: FONTS.ui,
          fontSize: TYPE_SCALE.ui.sm.size,
          color: COLORS.ink[400],
          marginTop: SPACE[3],
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        {caption}
      </figcaption>
    )}
  </figure>
);

// =============================================================================
// NUMBERED LIST — styled ordered list
// =============================================================================

const NumberedList = ({ items }) => (
  <ol style={{ listStyle: 'none', padding: 0, margin: `${SPACE[5]} 0`, maxWidth: LAYOUT.maxWidth.prose }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: SPACE[4], marginBottom: SPACE[4], alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: COLORS.accent.primary,
            flexShrink: 0,
            minWidth: '1.25rem',
            textAlign: 'right',
          }}
        >
          {i + 1}.
        </span>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: TYPE_SCALE.body.sm.size,
            lineHeight: TYPE_SCALE.body.sm.lineHeight,
            color: COLORS.ink[500],
          }}
        >
          <RichText>{item}</RichText>
        </span>
      </li>
    ))}
  </ol>
);

// =============================================================================
// BLOCKQUOTE — formulas and key callouts
// =============================================================================

const ArticleBlockquote = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div
      style={{
        margin: `${SPACE[6]} 0`,
        padding: `${SPACE[5]} ${SPACE[6]}`,
        borderLeft: `3px solid ${COLORS.accent.primary}`,
        background: COLORS.accent.wash,
        borderRadius: `0 ${EFFECTS.radius.lg} ${EFFECTS.radius.lg} 0`,
        maxWidth: LAYOUT.maxWidth.prose,
      }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONTS.body,
            fontSize: TYPE_SCALE.body.md.size,
            lineHeight: TYPE_SCALE.body.md.lineHeight,
            color: COLORS.ink[600],
            fontWeight: 500,
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

// =============================================================================
// HEADING — h4 sub-subsection head (deeper than ### Subsection)
// =============================================================================

const ArticleHeading = ({ text }) => (
  <h4
    style={{
      fontFamily: FONTS.headline,
      fontSize: TYPE_SCALE.headline.sm.size,
      fontWeight: 600,
      lineHeight: 1.3,
      color: COLORS.ink[700],
      margin: `${SPACE[5]} 0 ${SPACE[2]}`,
      maxWidth: LAYOUT.maxWidth.prose,
    }}
  >
    {text}
  </h4>
);

// =============================================================================
// BLOCK RENDERER — maps parsed content blocks to components
// =============================================================================

const BlockRenderer = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return <Paragraph>{block.text}</Paragraph>;
    case 'bulletList':
      return <BulletList items={block.items} />;
    case 'numberedList':
      return <NumberedList items={block.items} />;
    case 'table':
      return <Table headers={block.headers} rows={block.rows} />;
    case 'blockquote':
      return <ArticleBlockquote text={block.text} />;
    case 'image':
      return <ArticleFigure src={block.src} caption={block.caption} />;
    case 'youtube':
      return <ArticleYouTube videoId={block.videoId} caption={block.caption} />;
    case 'heading':
      return <ArticleHeading text={block.text} />;
    case 'subsection':
      return (
        <Subsection title={block.title}>
          {block.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
        </Subsection>
      );
    default:
      return null;
  }
};

// =============================================================================
// FOOTER — data-driven (generic; empty when no footer provided)
// =============================================================================

const ArticleFooter = ({ footer }) => {
  if (!footer) return null;
  return (
    <footer style={{ background: COLORS.ink[900], padding: `${SPACE[10]} 0`, textAlign: 'center' }}>
      <div style={{ maxWidth: LAYOUT.maxWidth.content, margin: '0 auto', padding: `0 ${LAYOUT.margin}` }}>
        <p
          style={{
            fontFamily: FONTS.ui,
            fontSize: TYPE_SCALE.ui.md.size,
            color: COLORS.ink[400],
            margin: 0,
          }}
        >
          {footer}
        </p>
      </div>
    </footer>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================

const App = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('article-keyframes');
    if (existing) return;
    const style = document.createElement('style');
    style.id = 'article-keyframes';
    style.textContent = `
      figure svg { width: 100%; height: auto; display: block; }
      [data-section] {
        padding-top: ${SPACE[7]} !important;
        padding-bottom: ${SPACE[6]} !important;
      }
      html { scroll-behavior: smooth; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; background: ${COLORS.surface.paper}; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.surface.paper }}>
      <ReadingProgress />
      <ArticleSectionNav sections={CONTENT.sections} />
      <ArticleHeader data={CONTENT.header} />

      {CONTENT.sections.map((section) => (
        <Section key={section.number} number={section.number} title={section.title}>
          {section.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
        </Section>
      ))}

      <ArticleFooter footer={CONTENT.header.footer || ''} />
    </div>
  );
};

export default App;
