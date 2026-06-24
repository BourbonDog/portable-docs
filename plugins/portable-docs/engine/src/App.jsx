/**
 * Main Application Component - "The Scholarly Disruptor"
 *
 * Editorial magazine layout - all content driven by CONTENT.document
 * No hardcoded content - everything comes from the markdown via parser
 */
import React, { useEffect } from 'react';
import CONTENT from './content';
import { COLORS, FONTS, TYPE_SCALE, SPACE, LAYOUT } from './design-tokens';

// Inject global styles for smooth scrolling
const injectGlobalStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      * {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
    injected = true;
  };
})();
import {
  Header,
  StatsGrid,
  Chart,
  Convergence,
  QuoteCarousel,
  PullQuote,
  CallToAction,
  CardGrid,
  Credentials,
  Timeline,
  Testimonials,
  Table,
  Section,
  Subsection,
  Paragraph,
  BulletList,
  Citations,
  RichText,
  TerminalWindow,
  SectionNav,
  WorkList,
  ReadingProgress,
  FlowDiagram,
  QuadrantChart,
  MermaidFigure,
} from './components';


/**
 * BlockRenderer - Renders a single content block
 * Handles: paragraph, bulletList, component, table
 */
const BlockRenderer = ({ block, context }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <Paragraph>
          <RichText>{block.text}</RichText>
        </Paragraph>
      );

    case 'bulletList':
      return <BulletList items={block.items} />;

    case 'table': {
      const table = CONTENT.tables[context.tableIndex.current];
      if (table) {
        context.tableIndex.current++;
        return <Table {...table} variant={table.variant || 'default'} />;
      }
      return null;
    }

    case 'component':
      return renderComponent(block, context);

    default:
      return null;
  }
};

/**
 * Render component markers (stats, charts, quotes, cards, etc.)
 */
const renderComponent = (block, context) => {
  const { getCardsBySection, getQuotesBySection, terminalIndex } = context;

  switch (block.component) {
    case 'stats':
      return CONTENT.stats.length > 0 ? <StatsGrid stats={CONTENT.stats} /> : null;

    case 'chart': {
      // Proposal charts render in document order: the Nth <!--COMPONENT:chart--> placeholder
      // maps to CONTENT.charts[N] because extractCharts collects blocks in the same top-to-bottom
      // document order the placeholders are emitted (sequential index, like terminalIndex/tableIndex).
      const chart = CONTENT.charts[context.chartIndex.current];
      if (!chart) return null;
      context.chartIndex.current++;
      return <Chart type={chart.type} data={chart} />;
    }

    case 'convergence':
      return CONTENT.convergence.roles.length > 0 ? (
        <Convergence roles={CONTENT.convergence.roles} />
      ) : null;

    case 'quotes':
      const quotes = getQuotesBySection(block.param);
      return quotes.length > 0 ? <QuoteCarousel quotes={quotes} /> : null;

    case 'pullquote':
      // Find pullquote by matching the param prefix to the quote text
      const matchingPullquote = CONTENT.pullquotes.find(pq =>
        pq.quote.startsWith(block.param)
      );
      if (matchingPullquote) {
        return (
          <PullQuote
            quote={matchingPullquote.quote}
            author={matchingPullquote.author}
            title={matchingPullquote.title}
          />
        );
      }
      return null;

    case 'cta': {
      // Match by href (the placeholder param); consume in document order so duplicate
      // hrefs (e.g. a hero CTA and a closing CTA to the same URL) render correctly.
      const cta = CONTENT.ctas.find((c) => c.href === block.param && !c._used);
      if (!cta) return null;
      cta._used = true;
      return <CallToAction {...cta} />;
    }

    case 'cards':
      const cardGroup = getCardsBySection(block.param);
      if (cardGroup) {
        return (
          <CardGrid
            type={cardGroup.type}
            columns={cardGroup.columns}
            cards={cardGroup.cards}
            label={cardGroup.label}
          />
        );
      }
      return null;

    case 'credentials':
      return CONTENT.credentials.length > 0 ? (
        <Credentials credentials={CONTENT.credentials} />
      ) : null;

    case 'timeline':
      return CONTENT.timeline.length > 0 ? <Timeline entries={CONTENT.timeline} /> : null;

    case 'terminal':
      const terminal = CONTENT.terminals?.[terminalIndex.current];
      if (terminal) {
        terminalIndex.current++;
        return (
          <TerminalWindow
            title={terminal.title}
            command={terminal.command}
            lines={terminal.lines}
            variant={terminal.variant}
          />
        );
      }
      return null;

    case 'testimonials':
      const testimonialGroup = CONTENT.testimonials.find(g => g.type === block.param);
      if (testimonialGroup) {
        return (
          <Testimonials
            type={testimonialGroup.type}
            testimonials={testimonialGroup.testimonials}
            source={testimonialGroup.source}
          />
        );
      }
      return null;

    case 'worklist':
      const workList = CONTENT.workLists?.find(w => w.section === block.param);
      if (workList && workList.items.length > 0) {
        return <WorkList items={workList.items} />;
      }
      return null;

    case 'flow': {
      const flow = CONTENT.flows?.[context.flowIndex.current];
      if (flow) {
        context.flowIndex.current++;
        return <FlowDiagram data={flow} />;
      }
      return null;
    }

    case 'quadrant': {
      const quadrant = CONTENT.quadrants?.[context.quadrantIndex.current];
      if (quadrant) {
        context.quadrantIndex.current++;
        return <QuadrantChart data={quadrant} />;
      }
      return null;
    }

    case 'mermaid': {
      const mermaidData = CONTENT.mermaids?.[Number(block.param)];
      return mermaidData ? <MermaidFigure data={mermaidData} title={mermaidData.title} /> : null;
    }

    default:
      return null;
  }
};

/**
 * SubsectionRenderer - Renders a subsection with its blocks
 */
const SubsectionRenderer = ({ subsection, context }) => {
  return (
    <Subsection title={subsection.title}>
      {subsection.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} context={context} />
      ))}
    </Subsection>
  );
};

/**
 * SectionRenderer - Renders a full section with intro and subsections
 */
const SectionRenderer = ({ section, context }) => {
  return (
    <Section number={section.number} title={section.title}>
      {/* Intro blocks */}
      {section.intro?.map((block, i) => (
        <BlockRenderer key={`intro-${i}`} block={block} context={context} />
      ))}

      {/* Subsections */}
      {section.subsections?.map((subsection, i) => (
        <SubsectionRenderer
          key={`subsection-${i}`}
          subsection={subsection}
          context={context}
        />
      ))}
    </Section>
  );
};

/**
 * Main App component - renders from CONTENT.document
 */
const App = () => {
  // Inject global smooth scrolling styles on mount
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // Index refs for sequential components (tables, terminals, pullquotes, charts, flows, quadrants)
  const tableIndex = { current: 0 };
  const terminalIndex = { current: 0 };
  const pullquoteIndex = { current: 0 };
  const chartIndex = { current: 0 };
  const flowIndex = { current: 0 };
  const quadrantIndex = { current: 0 };

  // Helper to get cards by section
  const getCardsBySection = (sectionNum) => {
    return CONTENT.cards.find(group => group.section === String(sectionNum));
  };

  // Helper to get quotes by section
  const getQuotesBySection = (sectionName) => {
    return CONTENT.quotes.filter(q => q.section === sectionName);
  };

  // Context object passed to renderers
  const context = {
    chartIndex,
    flowIndex,
    quadrantIndex,
    getCardsBySection,
    getQuotesBySection,
    pullquoteIndex,
    tableIndex,
    terminalIndex,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.surface.paper,
        overflowX: 'hidden',
      }}
    >
      {/* Reading progress bar */}
      <ReadingProgress />

      {/* Section Navigation */}
      <SectionNav sections={CONTENT.document.filter((item) => item.type === 'section').map((s) => ({ number: s.number, title: s.title }))} />

      {/* Render document from CONTENT.document */}
      {CONTENT.document.map((item, i) => {
        switch (item.type) {
          case 'header':
            return CONTENT.header ? (
              <Header
                key={`header-${i}`}
                data={CONTENT.header}
                heroQuote={CONTENT.pullquotes[0]}
              />
            ) : null;

          case 'section':
            return (
              <SectionRenderer
                key={`section-${item.number}-${i}`}
                section={item}
                context={context}
              />
            );

          case 'citations':
            return (
              <div
                key={`citations-${i}`}
                style={{
                  maxWidth: LAYOUT.maxWidth.content,
                  margin: '0 auto',
                  padding: `0 ${LAYOUT.margin}`,
                }}
              >
                {CONTENT.citations.length > 0 && <Citations citations={CONTENT.citations} />}
              </div>
            );

          default:
            return null;
        }
      })}

      {/* Footer */}
      <footer
        style={{
          maxWidth: LAYOUT.maxWidth.content,
          margin: '0 auto',
          padding: `${SPACE[10]} ${LAYOUT.margin}`,
          textAlign: 'center',
          borderTop: `1px solid ${COLORS.ink[100]}`,
        }}
      >
        {CONTENT.header?.footer && (
          <p
            style={{
              fontFamily: FONTS.ui,
              fontSize: TYPE_SCALE.ui.sm.size,
              color: COLORS.ink[400],
              marginBottom: SPACE[1],
            }}
          >
            {CONTENT.header.footer}
          </p>
        )}
        {CONTENT.header?.brand && (
          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: TYPE_SCALE.mono.sm.size,
              color: COLORS.ink[400],
            }}
          >
            {CONTENT.header.brand}
          </p>
        )}
        {CONTENT.header?.date && (
          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: TYPE_SCALE.mono.sm.size,
              color: COLORS.accent.muted,
              marginTop: SPACE[3],
            }}
          >
            {CONTENT.header.date}
          </p>
        )}
      </footer>
    </div>
  );
};

export default App;
